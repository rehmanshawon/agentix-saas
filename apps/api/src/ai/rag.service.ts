// File: apps/api/src/ai/rag.service.ts

import { Injectable, Logger } from "@nestjs/common";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone } from "@pinecone-database/pinecone";
import { EmbeddingService } from "./embedding.service";

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private pinecone: Pinecone;

  constructor(private readonly embeddingService: EmbeddingService) {
    // Initialize the Vector Database connection
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });
  }

  /**
   * Takes an uploaded file, extracts text, chunks it, and saves it to the Vector DB.
   * @param fileBuffer The raw binary data of the uploaded file
   * @param documentId The ID of the document in our MongoDB database
   * @param workspaceId The ID of the SaaS tenant (Crucial for security)
   */
  async processAndVectorizeDocument(
    fileBuffer: Buffer,
    documentId: string,
    workspaceId: string,
    options: {
      agentId?: string;
      fileName: string;
      mimeType: string;
    },
  ): Promise<boolean> {
    try {
      this.logger.log(`Starting vectorization for document ${documentId}...`);

      let rawDocs: Document[];

      if (options.mimeType === "application/pdf") {
        // Use dynamic import for pdf-parse
        const pdfParse = await import("pdf-parse");
        const parsedPdf = await pdfParse.default(fileBuffer);
        rawDocs = [
          new Document({
            pageContent: parsedPdf.text,
            metadata: { source: options.fileName },
          }),
        ];
      } else {
        rawDocs = [
          new Document({
            pageContent: fileBuffer.toString("utf-8"),
            metadata: {
              source: options.fileName,
            },
          }),
        ];
      }

      // 2. CHUNKING: Split the text into manageable pieces
      // Why 1000? LLMs have context limits. We feed it small, highly relevant chunks.
      // Why 200 overlap? So we don't accidentally cut a sentence in half and lose context.
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunkedDocs = await textSplitter.splitDocuments(rawDocs);

      this.logger.log(`Split document into ${chunkedDocs.length} chunks.`);

      // 4. STORAGE: Prepare data for Pinecone Vector DB
      const pineconeIndex = this.pinecone.Index(
        process.env.PINECONE_INDEX_NAME || "agentix-index",
      );

      // We process vectors in batches to avoid rate limits
      const vectorsToUpsert = [];

      for (let i = 0; i < chunkedDocs.length; i++) {
        const chunk = chunkedDocs[i];

        // Generate the vector array [0.012, -0.045, ...] for this specific text chunk
        const vector = await this.embeddingService.embedQuery(
          chunk.pageContent,
        );

        vectorsToUpsert.push({
          id: `${documentId}-chunk-${i}`, // Unique ID for this chunk
          values: vector,
          metadata: {
            // SECURITY LAYER: We inject the workspaceId here.
            // When we search later, we filter by this ID so data never leaks!
            workspaceId: workspaceId,
            ...(options.agentId && { agentId: options.agentId }),
            documentId: documentId,
            fileName: options.fileName,
            text: chunk.pageContent, // We save the raw text so the AI can read it later
            loc_pageNumber: chunk.metadata.loc?.pageNumber || 1,
          },
        });
      }

      // Upsert (Insert or Update) the vectors into Pinecone
      await pineconeIndex.upsert(vectorsToUpsert);

      this.logger.log(
        `Successfully vectorized and stored document ${documentId}.`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process document ${documentId}: ${error.message}`,
      );
      throw new Error("Vectorization failed.");
    }
  }
}
