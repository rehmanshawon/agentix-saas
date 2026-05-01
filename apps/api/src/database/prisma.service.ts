import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import type { PrismaClient } from "@agentix/database/client";
import { prisma } from "@agentix/database";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  readonly client: PrismaClient = prisma;

  async onModuleInit() {
    await this.client.$connect();
    this.logger.log("Connected to MySQL via Prisma.");
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  get user(): PrismaClient["user"] {
    return this.client.user;
  }

  get workspace(): PrismaClient["workspace"] {
    return this.client.workspace;
  }

  get workspaceMember(): PrismaClient["workspaceMember"] {
    return this.client.workspaceMember;
  }

  get agent(): PrismaClient["agent"] {
    return this.client.agent;
  }

  get document(): PrismaClient["document"] {
    return this.client.document;
  }

  get passwordResetToken(): PrismaClient["passwordResetToken"] {
    return this.client.passwordResetToken;
  }
}
