import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from '../modules/database/database.module';
import { DocumentsService } from '../shared/services/document.service';
import { RerankService } from '../shared/llm-services/rerank.service';
import { EmbeddingsService } from '../shared/llm-services/embeddings.service';
import { ChatService } from '../shared/llm-services/chat.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppController],
  providers: [
    DocumentsService,
    RerankService,
    EmbeddingsService,
    ChatService
  ],
})
export class AppModule {}
