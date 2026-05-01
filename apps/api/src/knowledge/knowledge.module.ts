// File: apps/api/src/knowledge/knowledge.module.ts
import { Module } from "@nestjs/common";
import { KnowledgeController } from "./knowledge.controller";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [AiModule], // Import the AI tools
  controllers: [KnowledgeController],
})
export class KnowledgeModule {}
