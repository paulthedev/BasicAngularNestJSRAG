import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from '../entities/document.entity';
import { Repository } from 'typeorm';
import { EmbeddingsService } from '../llm-services/embeddings.service';
import { RerankService } from '../llm-services/rerank.service';
import { PaginationOptionsDTO, PaginatedResultDTO, DocumentDTO } from '@basic-angular-nest-jsrag/sharedDTO';
import { DocumentMapper } from '../mappers/document.mapper';

@Injectable()
export class DocumentsService {
    constructor(
        @InjectRepository(Document)
        private readonly documentepository: Repository<Document>,
        private readonly embeddingsService: EmbeddingsService,
        private readonly rerankService: RerankService
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
}