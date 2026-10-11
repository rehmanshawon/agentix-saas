import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "crypto";
import { Request } from "express";

@Injectable()
export class InternalApiGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path.replace(/\/$/, "") || "/";

    if (
      path === "/api/docs" ||
      path.startsWith("/api/docs/") ||
      path.startsWith("/api/docs-") ||
      path === "/auth/forgot-password" ||
      path === "/auth/reset-password" ||
      (request.method === "POST" && path === "/api/chat/message") ||
      (request.method === "GET" &&
        path.startsWith("/api/chat/") &&
        path !== "/api/chat/config")
    ) {
      return true;
    }

    const secret = process.env.API_INTERNAL_SECRET;
    if (!secret) {
      throw new InternalServerErrorException(
        "Internal API authentication is not configured.",
      );
    }

    const suppliedToken = request.header("x-agentix-internal-token");
    if (!suppliedToken) {
      throw new UnauthorizedException();
    }

    const expected = Buffer.from(secret);
    const supplied = Buffer.from(suppliedToken);
    if (
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
