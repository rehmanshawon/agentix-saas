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
    this.logger.log(`Generating answer for workspace ${workspaceId}.`);

    const hasDeepSeek =
      process.env.DEEPSEEK_API_KEY &&
      !process.env.DEEPSEEK_API_KEY.startsWith("your-");
    const hasOpenAI =
      process.env.OPENAI_API_KEY &&
      !process.env.OPENAI_API_KEY.startsWith("your-");

    if (!hasDeepSeek && !hasOpenAI) {
      this.logger.log(
        `Using mock response for agent ${agentId} (AI keys not yet configured).`,
      );
      return `Hello! I am your Agentix chatbot assistant. The local application, MySQL database, and website widget are running and fully connected! To enable real-time AI answers from your business documents, please configure your DEEPSEEK_API_KEY in .env.`;
    }

    let retrievedContext = "";
    if (
      hasOpenAI &&
      process.env.PINECONE_API_KEY &&
      !process.env.PINECONE_API_KEY.startsWith("your-")
    ) {
      try {
        const questionVector = await this.embeddingService.embedQuery(question);
        const pineconeIndex = this.pinecone.Index(
          process.env.PINECONE_INDEX_NAME || "agentix-index",
        );
        const searchResults = await pineconeIndex.query({
          vector: questionVector,
          topK: 4,
          includeMetadata: true,
          filter: {
            workspaceId: { $eq: workspaceId },
          },
        });
        retrievedContext = searchResults.matches
          .map((match) => match.metadata?.text)
          .join("\n\n---\n\n");
      } catch (err: any) {
        this.logger.warn(
          `Pinecone retrieval failed or skipped: ${err.message}`,
        );
      }
    }

    try {
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

      this.logger.log(`Successfully generated response for agent ${agentId}.`);
      return finalAnswer;
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        this.logger.warn(
          `AI completion failed (${err.message}). Returning local development fallback response.`,
        );
        return `Hello! I am your Agentix chatbot assistant. The local application, MySQL database, and website widget are running and fully connected! To enable live AI answers from your business documents, please configure your DEEPSEEK_API_KEY in .env.`;
      }
      throw err;
    }
  }
}
