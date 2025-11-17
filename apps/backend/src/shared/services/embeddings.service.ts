import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import path from "path";
import { Llama, LlamaEmbedding, LlamaEmbeddingContext, LlamaModel } from "node-llama-cpp";

@Injectable()
export class EmbeddingsService implements OnModuleInit, OnModuleDestroy {
  private llama!: Llama;
  private model!: LlamaModel;
  private context!: LlamaEmbeddingContext;


  async onModuleInit() {
    const {getLlama} = await (eval(`import("node-llama-cpp")`) as Promise<any>);
    this.llama = await getLlama({
    gpu: {
        type: "auto",
        exclude: ["cuda"]
    }});

    this.model = await this.llama.loadModel({
        modelPath: path.join(__dirname, "assets/modelzoo/Qwen3-Embedding-0.6B-Q8_0.gguf"),
        gpuLayers: 10
    });
    this.context = await this.model.createEmbeddingContext({
      threads: 15
    });
  }

  async generateEmbedding(text: string): Promise<LlamaEmbedding> {
    const sanitizedText = text.trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFKC')
    const tokens = this.model.tokenize(sanitizedText, false);
    console.log('Now Embedding: ');
    console.log(sanitizedText);
    const embeddings = await this.context.getEmbeddingFor(tokens);
    return embeddings;
  }

  async generateEmbeddings(texts: string[]): Promise<Map<string, LlamaEmbedding>> {
    const embeddings = new Map<string, LlamaEmbedding>();
    
    await Promise.all(
      texts.map(async (text) => {
        const tokens = this.model.tokenize(text, false);
        const embedding = await this.context.getEmbeddingFor(tokens);
        embeddings.set(text, embedding);
      })
    );

    return embeddings;
  }

  calculateSimilarity(embedding1: LlamaEmbedding, embedding2: LlamaEmbedding): number {
    return embedding1.calculateCosineSimilarity(embedding2);
  }

  async onModuleDestroy() {
    this.context.dispose();
    this.model.dispose();
  }
}
