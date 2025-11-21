import { Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AIMessage, BaseMessage } from '@langchain/core/messages';

@Injectable()
export class ChatService {
  private llm!: ChatGoogleGenerativeAI;

  async prompt(input: BaseMessage[]): Promise<string>{
    this.llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash-lite",
      temperature: 0.7,
      maxRetries: 2,
      apiKey: process.env.GEMINI_API_KEY || ''
    });

    const reply: AIMessage = await this.llm.invoke(input);

    return typeof reply.content === 'string' ? reply.content : reply.content.map(block => 
    'text' in block ? block.text : JSON.stringify(block)
    ).join('');
  }
}
