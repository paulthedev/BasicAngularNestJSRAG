import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import path from "path";
import { Llama, LlamaChatSession, LlamaContext, LlamaContextOptions, LlamaModel } from "node-llama-cpp";

@Injectable()
export class ChatService implements OnModuleInit, OnModuleDestroy {
  private llama!: Llama;
  private model!: LlamaModel;
  private context!: LlamaContext;


  async onModuleInit() {
    const {getLlama} = await (eval(`import("node-llama-cpp")`) as Promise<any>);
    this.llama = await getLlama({
    gpu: {
        type: "auto",
        exclude: ["cuda"]
    }});

    this.model = await this.llama.loadModel({
        modelPath: path.join(__dirname, "assets/modelzoo/LFM2-1.2B-Q4_K_M.gguf"),
        gpuLayers: 0
    });

    const contextOprions: LlamaContextOptions = {
        flashAttention: true,
        contextSize: 40000,
        threads: 15,
        batchSize: 128,
        sequences: 1
    }

    this.context = await this.model.createContext(contextOprions);
    
  }

  async prompt(query: string): Promise<string>{
    const session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
        autoDisposeSequence: true
    });
    const reply = await session.prompt(query, {
      temperature: 0.7,
      topK: 20, 
      topP: 0.95,
      minP: 0,
      repeatPenalty: { penalty : 1.05 }
    });
    session.dispose();
    return reply;
  }

  async onModuleDestroy() {
    this.context.dispose();
    this.model.dispose();
  }
}
