// File: apps/api/src/ai/ai.module.ts
import { Module } from "@nestjs/common";
import { RagService } from "./rag.service";
import { ChatService } from "./chat.service";

@Module({
  providers: [RagService, ChatService],
  exports: [RagService, ChatService], // We export them so Knowledge and Chat controllers can use them
})
export class AiModule {}
