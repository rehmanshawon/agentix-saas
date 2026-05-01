import { Module } from "@nestjs/common";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { AiModule } from "./ai/ai.module";
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { ChatModule } from "./chat/chat.module";
import { DatabaseModule } from "./database/database.module";
import { BillingModule } from "./billing/billing.module";
import { WorkspaceModule } from "./workspace/workspace.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // time-to-live: 60 seconds
        limit: 100, // max 100 requests per ttl globally
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    DatabaseModule,
    AiModule,
    KnowledgeModule,
    ChatModule,
    BillingModule,
    WorkspaceModule,
    AuthModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
