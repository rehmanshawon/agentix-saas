// File: apps/api/src/ai/chat.service.ts

import { Injectable, Logger } from "@nestjs/common";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatCompletionService } from "./chat-completion.service";
import { EmbeddingService } from "./embedding.service";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private pinecone: Pinecone;

  constructor(
    private readonly chatCompletionService: ChatCompletionService,
    private readonly embeddingService: EmbeddingService,
  ) {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });
  }

  /**
   * The core conversational RAG engine.
   * @param workspaceId The SaaS tenant ID (for security filtering)
   * @param systemPrompt The persona defined by the buyer in the UI Builder
   * @param question The user's actual question
   */
  async generateAnswer(
    workspaceId: string,
    agentId: string,
    systemPrompt: string,
    question: string,
  ): Promise<string> {
    try {
      this.logger.log(`Generating answer for workspace ${workspaceId}.`);

      // 1. EMBED THE QUESTION
      // We must turn the user's text question into the exact same vector format we used for the PDFs
      const questionVector = await this.embeddingService.embedQuery(question);

      // 2. RETRIEVE RELEVANT CONTEXT (The "R" in RAG)
      const pineconeIndex = this.pinecone.Index(
        process.env.PINECONE_INDEX_NAME || "agentix-index",
      );

      const searchResults = await pineconeIndex.query({
        vector: questionVector,
        topK: 4, // Get the 4 most relevant chunks of text
        includeMetadata: true,
        filter: {
          // ULTIMATE SECURITY: Restrict retrieval to this workspace.
          workspaceId: { $eq: workspaceId },
        },
      });

      // Combine the found chunks into one big string of text
      const retrievedContext = searchResults.matches
        .map((match) => match.metadata?.text)
        .join("\n\n---\n\n");

      const finalAnswer = await this.chatCompletionService.complete(
        [
          {
            role: "system",
            content: `${systemPrompt}

INSTRUCTIONS:
- If the user is greeting you or making casual conversation, respond naturally and warmly.
- If the user asks a factual question about the company, its policies, products, or services, answer based on the context.
- If the context contains the answer, provide it clearly and concisely.
- If the context does not contain the answer to a factual question, say: "I don't have that specific information in my knowledge base. Is there anything else I can help with?"
- Never make up information that is not in the context.`,
          },
          {
            role: "user",
            content: `CONTEXT FROM COMPANY DOCUMENTS:
${retrievedContext || "No relevant documents found."}

USER QUESTION:
${question}`,
          },
        ],
        0.1,
      );

      this.logger.log(`Successfully generated response.`);
      return finalAnswer;
    } catch (error) {
      this.logger.error(`Chat generation failed: ${error.message}`);
      return "I'm sorry, I am experiencing technical difficulties connecting to my knowledge base right now.";
    }
  }
}
