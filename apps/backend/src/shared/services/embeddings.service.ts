import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private model!: GoogleGenerativeAIEmbeddings;


  async onModuleInit() {
      this.model = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY || '',
        modelName: 'gemini-embedding-001'
      });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const sanitizedText = text.trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFKC')
    console.log('Now Embedding: ');
    console.log(sanitizedText);
    const embeddings = this.model.embedQuery(sanitizedText);
    return embeddings;
  }
}
