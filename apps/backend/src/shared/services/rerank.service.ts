import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import path from "path";
import { Llama, LlamaModel, LlamaRankingContext } from "node-llama-cpp";
import { Document } from '../entities/document.entity';

@Injectable()
export class RerankService implements OnModuleInit, OnModuleDestroy {
  private llama!: Llama;
  private model!: LlamaModel;
  private context!: LlamaRankingContext;

  async onModuleInit() {
    const {getLlama} = await (eval(`import("node-llama-cpp")`) as Promise<any>);
    this.llama = await getLlama({
    gpu: {
        type: "auto",
        exclude: ["cuda"]
    }});

    this.model = await this.llama.loadModel({
        modelPath: path.join(__dirname, "assets/modelzoo/Qwen3-Reranker-0.6B.Q4_K_M.gguf"),
        gpuLayers: 5
    });
    this.context = await this.model.createRankingContext({
        threads: 15, 
        contextSize: 10000});
  }

  async reRankDocuments(query: string, documents: Document[]): Promise<Document[]> {
    const contents = documents.map(p => p.content);
    const rankedDocuments = await this.context.rankAndSort(query, contents);
    const highRankDocuments = await rankedDocuments.filter(rp => rp.score > 0.51);
    return documents.filter(p => (highRankDocuments.map(hrp => hrp.document)).some(d => d == p.content));
  }

  async onModuleDestroy() {
    this.context.dispose();
    this.model.dispose();
  }
}
