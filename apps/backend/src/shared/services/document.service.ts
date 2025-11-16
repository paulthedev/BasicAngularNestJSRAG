import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from '../entities/document.entity';
import { Repository } from 'typeorm';
import { EmbeddingsService } from '../llm-services/embeddings.service';
import { RerankService } from '../llm-services/rerank.service';
import { PaginationOptionsDTO, PaginatedResultDTO, DocumentDTO } from '@basic-angular-nestjs-rag/sharedDTO';
import { DocumentMapper } from '../mappers/document.mapper';
import { ChatService } from '../llm-services/chat.service';

@Injectable()
export class DocumentsService {

    private functions: any;

    constructor(
        @InjectRepository(Document)
        private readonly documentepository: Repository<Document>,
        private readonly embeddingsService: EmbeddingsService,
        private readonly rerankService: RerankService,
        private readonly chatService: ChatService
    ) {}

    async search(query: string, options?: PaginationOptionsDTO): Promise<PaginatedResultDTO<DocumentDTO>> {
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const skip = (page - 1) * limit;

        const queryBuilder = this.documentepository.createQueryBuilder('documents');

        // Apply text search if provided
        if (query) {
            const queryEmbedding = (await this.embeddingsService.generateEmbedding(query)).vector;
            queryBuilder.orderBy(
                `documents.embedding <=> :queryEmbedding`,
                'ASC'
            ).setParameters({ queryEmbedding: `[${queryEmbedding.join(',')}]` });
        }

        let [documents, total] = await queryBuilder
        .skip(skip)
        .limit(limit)
        .getManyAndCount();
        
        //ReRank Products
        if(query) {
            documents = await this.rerankService.reRankDocuments(query, documents);
            total = documents.length;
        }

        // Convert Product entities to ProductDTOs using mapper
        const items = DocumentMapper.toDTOs(documents);

        return {
            items,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async analyseDocuments(question: string){
        const queryBuilder = this.documentepository.createQueryBuilder('documents');

        // Apply text search if provided
        if (question) {
            const queryEmbedding = (await this.embeddingsService.generateEmbedding(question)).vector;
            queryBuilder.orderBy(
                `documents.embedding <=> :queryEmbedding`,
                'ASC'
            ).setParameters({ queryEmbedding: `[${queryEmbedding.join(',')}]` });

            let documents = await queryBuilder.limit(5).getMany();
            documents = await this.rerankService.reRankDocuments(question, documents);
            if(documents.length > 0){
                const concatAllDocuments = documents.map(i => i.content).join('\n');
                
                // Create a prompt template that incorporates the document context
                const promptTemplate = `Based on the following document content, please answer the question: "${prompt}"
                
                Document content:
                ${concatAllDocuments}

                Please provide a detailed and well-structured answer based specifically on the information in the documents above.`;
                
                const response = await this.chatService.prompt(promptTemplate);

                return response;
            }
            
        }
    }

    async save(document: DocumentDTO){
        const entity = DocumentMapper.toEntity(document);
        this.documentepository.save(entity);
    }
}