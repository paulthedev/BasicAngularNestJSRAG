import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { DocumentsService } from '../shared/services/document.service';
import { DocumentDTO, PaginatedResultDTO } from '@basic-angular-nestjs-rag/sharedDTO';

@Controller()
export class AppController {
  constructor(private readonly documentService: DocumentsService) {}

  @Get('documents/search')
  searchforRelevantDocuments(@Query('query') query: string): Promise<PaginatedResultDTO<DocumentDTO>>{
    return this.documentService.search(query);
  }

  @Post('documents/uploadbypage')
  async uploadDocument(@Body() documents: Partial<DocumentDTO>[]){
    const resp = await this.documentService.save(documents);
    return resp;
  }

  @Post('documents/analyseDocuments')
  async analyseDocuments(@Body() body: any){
    const resp = await this.documentService.analyseDocuments(body.question);
    return  resp;
  }

}

