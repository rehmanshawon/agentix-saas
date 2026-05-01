// File: apps/api/src/ai/chat.service.ts

import { Injectable, Logger } from "@nestjs/common";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Pinecone } from "@pinecone-database/pinecone";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private pinecone: Pinecone;

  constructor() {
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
      this.logger.log(
        `Generating answer for workspace ${workspaceId}. Question: "${question}"`,
      );

      // 1. EMBED THE QUESTION
      // We must turn the user's text question into the exact same vector format we used for the PDFs
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "text-embedding-3-small",
      });
      const questionVector = await embeddings.embedQuery(question);

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

      // 3. CONSTRUCT THE PROMPT
      // We use LangChain's PromptTemplate to dynamically inject our variables
      const promptTemplate = PromptTemplate.fromTemplate(`
        {systemPrompt}

        CONTEXT FROM COMPANY DOCUMENTS:
        {context}

        USER QUESTION: 
        {question}

        INSTRUCTIONS:
        - If the user is greeting you or making casual conversation (hello, how are you, thanks, etc.), respond naturally and warmly. You do NOT need context for basic conversation.
        - If the user asks a factual question about the company, its policies, products, or services, answer based on the context above.
        - If the context contains the answer, provide it clearly and concisely.
        - If the context does NOT contain the answer to a factual question, say: "I don't have that specific information in my knowledge base. Is there anything else I can help with?"
        - Never make up information that is not in the context.

        ANSWER:
      `);

      // 4. INITIALIZE THE LLM (The "G" in RAG)
      // We use a low temperature (0.1) so the AI is factual and analytical, not highly creative
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o-mini",
        temperature: 0.1,
      });

      // 5. EXECUTE THE LANGCHAIN PIPELINE (LCEL)
      // This is modern LangChain Expression Language: Prompt -> Model -> String Output
      const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());

      const finalAnswer = await chain.invoke({
        systemPrompt: systemPrompt,
        context: retrievedContext || "No relevant documents found.",
        question: question,
      });

      this.logger.log(`Successfully generated response.`);
      return finalAnswer;
    } catch (error) {
      this.logger.error(`Chat generation failed: ${error.message}`);
      return "I'm sorry, I am experiencing technical difficulties connecting to my knowledge base right now.";
    }
  }
}
