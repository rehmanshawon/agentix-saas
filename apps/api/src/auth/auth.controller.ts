import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import * as crypto from "crypto";
import * as bcrypt from "bcryptjs";

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post("forgot-password")
  async forgotPassword(@Body("email") email: string) {
    if (!email) {
      throw new HttpException("Email is required.", HttpStatus.BAD_REQUEST);
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        message:
          "If an account with that email exists, we have sent a password reset link.",
      };
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Delete any existing tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Store hashed token in database
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Build reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // In production, send email via Resend/SendGrid/NodeMailer
    // For now, log to console (buyer integrates their own email provider)
    this.logger.log(`\n📧 PASSWORD RESET REQUEST`);
    this.logger.log(`   Email: ${email}`);
    this.logger.log(`   Reset URL: ${resetUrl}`);
    this.logger.log(`   Token expires: ${expiresAt.toISOString()}\n`);

    // TODO: Uncomment when email provider is configured
    // await this.emailService.sendPasswordReset(email, resetUrl);

    return {
      message:
        "If an account with that email exists, we have sent a password reset link.",
      // Include URL in dev mode for testing
      ...(process.env.NODE_ENV === "development" && { devResetUrl: resetUrl }),
    };
  }

  @Post("reset-password")
  async resetPassword(
    @Body("token") token: string,
    @Body("email") email: string,
    @Body("newPassword") newPassword: string,
  ) {
    if (!token || !email || !newPassword) {
      throw new HttpException(
        "Token, email, and new password are required.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (newPassword.length < 8) {
      throw new HttpException(
        "Password must be at least 8 characters.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new HttpException(
        "Invalid or expired reset token.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Find valid token
    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      throw new HttpException(
        "Invalid or expired reset token. Please request a new one.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    this.logger.log(`Password reset successful for user: ${email}`);

    return { message: "Password reset successful. You may now log in." };
  }
}
