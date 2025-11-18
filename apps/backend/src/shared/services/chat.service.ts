import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Llama, LlamaContext, LlamaModel } from "node-llama-cpp";
import * as path from "path";

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
        gpuLayers: 5
    });

    this.context = await this.model.createContext({
        flashAttention: true,
        threads: 15
    });
  }

  async prompt(query: string): Promise<string>{
    const { LlamaChatSession } = await (eval(`import("node-llama-cpp")`) as Promise<any>);
    const session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
        autoDisposeSequence: true
    });

    let reply: any = null;
    const promptOptions = {
      temperature: 0.7,
      topK: 20, 
      topP: 0.95,
      minP: 0,
      repeatPenalty: { penalty : 1.05 },
    };

    reply = await session.prompt(query, promptOptions);
    session.dispose();
    return reply;
  }

  async onModuleDestroy() {
    this.context.dispose();
    this.model.dispose();
  }
}
