import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from '../entities/document.entity';
import { Repository } from 'typeorm';
import { EmbeddingsService } from './embeddings.service';
import { RerankService } from './rerank.service';
import { PaginationOptionsDTO, PaginatedResultDTO, DocumentDTO, ResponseDTO, ResponseStatusCode } from '@basic-angular-nestjs-rag/sharedDTO';
import { DocumentMapper } from '../mappers/document.mapper';
import { ChatService } from './chat.service';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

@Injectable()
export class DocumentsService {

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
            const queryEmbedding = (await this.embeddingsService.generateEmbedding(query));
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

    async analyseDocuments(question: string): Promise<ResponseDTO<string>>{
        // Validate input
        if (!question) {
            return {
                statusCode: ResponseStatusCode.success,
                data: 'Please ask a question to get started!'
            };
        }

        try {
            const queryEmbedding = await this.embeddingsService.generateEmbedding(question);
            
            // Create query builder and apply similarity search
            const queryBuilder = this.documentepository.createQueryBuilder('document');
            queryBuilder.orderBy(
                `document.embedding <=> :queryEmbedding`,
                'ASC'
            ).setParameters({ 
                queryEmbedding: `[${queryEmbedding.join(',')}]` 
            });

            // Get top 5 similar documents
            const documents = await queryBuilder.limit(5).getMany();

            if (documents.length === 0) {
                return {
                    statusCode: ResponseStatusCode.success,
                    data: 'There are no documents which I can refer to answer this question.'
                };
            }

            // Rerank documents based on relevance to the question
            const rerankedDocuments = await this.rerankService.reRankDocuments(question, documents);
            
            if (rerankedDocuments.length === 0) {
                return {
                    statusCode: ResponseStatusCode.success,
                    data: 'I did not find any relevant documents to answer this question.'
                };
            }

            // Create a prompt template that incorporates the document context
            const systemMessage: SystemMessage = new SystemMessage({
                content: [
                    {
                        type: "text",
                        text: `You are a helpful, respectful and honest assistant. Always answer as helpfully as possible.`
                    },
                    {
                        type: "text",
                        text: `If a question does not make any sense, or is not factually coherent, explain why instead of answering something incorrectly.`
                    },
                    {
                        type: "text",
                        text: `If you don't know the answer to a question, don't share false information.`
                    }
                ]
            });

                     // Create a prompt template that incorporates the document context
            const humanMessage: HumanMessage = new HumanMessage({
                content: [
                    {
                        type: "text",
                        text:`Based on the following document(s) content, please answer the question: "${question}"`
                    }
                ]
            });
            const documentsAsBlock = rerankedDocuments.map<any>(rd => ({type: "text", text: rd.content, }));
            humanMessage.content = [...humanMessage.content, ...documentsAsBlock];
            
            const response = await this.chatService.prompt([systemMessage, humanMessage]);

            return {
                    statusCode: ResponseStatusCode.success,
                    data: response
                };
        } catch (error) {
            console.error('Error in analyseDocuments:', error);
            throw new InternalServerErrorException('Failed to analyze documents');
        }
    }

    async save(documents: Partial<DocumentDTO>[]){
        let entities = documents.map(d => DocumentMapper.toEntity(d));
        try{
            entities = await Promise.all(entities.map(async (e) => {
                e.embedding = [...(await this.embeddingsService.generateEmbedding(
                `Document name: ${e.name} Page number: ${e.page} Document content: ${e.content}`))];
                return e;
            }));

            const createdEntities = this.documentepository.create(entities);
            await this.documentepository.save(createdEntities);
            return {
                statusCode: ResponseStatusCode.success,
                data: 'Successfully saved data'
            };
        }
        catch(ex){
            console.log(ex)
            throw new InternalServerErrorException('Embedding Failed.', ex);
        }
    }
}
