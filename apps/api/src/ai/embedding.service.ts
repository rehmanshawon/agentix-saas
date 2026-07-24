import { Injectable } from "@nestjs/common";
import { OpenAIEmbeddings } from "@langchain/openai";

@Injectable()
export class EmbeddingService {
  private readonly embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    configuration: process.env.OPENAI_BASE_URL
      ? { baseURL: process.env.OPENAI_BASE_URL }
      : undefined,
    modelName: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  });

  embedQuery(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }
}
