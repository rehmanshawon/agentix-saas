// File: apps/api/src/chat/chat.module.ts
import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [AiModule], // Import the AI tools
  controllers: [ChatController],
})
export class ChatModule {}
