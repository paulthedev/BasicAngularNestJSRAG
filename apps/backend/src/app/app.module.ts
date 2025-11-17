import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from '../modules/database/database.module';
import { DocumentsService } from '../shared/services/document.service';
import { RerankService } from '../shared/services/rerank.service';
import { EmbeddingsService } from '../shared/services/embeddings.service';
import { ChatService } from '../shared/services/chat.service';

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
