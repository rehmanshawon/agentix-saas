// File: apps/api/src/ai/ai.module.ts
import { Module } from "@nestjs/common";
import { RagService } from "./rag.service";
import { ChatService } from "./chat.service";
import { ChatCompletionService } from "./chat-completion.service";
import { EmbeddingService } from "./embedding.service";
import { ModelRouter } from "./model-router.service";

@Module({
  providers: [
    RagService,
    ChatService,
    ChatCompletionService,
    EmbeddingService,
    ModelRouter,
  ],
  exports: [RagService, ChatService],
})
export class AiModule {}
