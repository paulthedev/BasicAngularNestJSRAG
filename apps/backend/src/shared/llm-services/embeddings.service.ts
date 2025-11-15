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
        modelPath: path.join(__dirname, "assets/modelzoo/Qwen3-Embedding-0.6B-iq4_nl.gguf"),
        gpuLayers: 0
    });
    this.context = await this.model.createEmbeddingContext();
  }

  async generateEmbedding(text: string): Promise<LlamaEmbedding> {
    return await this.context.getEmbeddingFor(text);
  }

  async generateEmbeddings(texts: string[]): Promise<Map<string, LlamaEmbedding>> {
    const embeddings = new Map<string, LlamaEmbedding>();
    
    await Promise.all(
      texts.map(async (text) => {
        const embedding = await this.context.getEmbeddingFor(text);
        embeddings.set(text, embedding);
      })
    );

    return embeddings;
  }

  calculateSimilarity(embedding1: LlamaEmbedding, embedding2: LlamaEmbedding): number {
    return embedding1.calculateCosineSimilarity(embedding2);
  }

  async onModuleDestroy() {
    this.model.dispose();
  }
}
