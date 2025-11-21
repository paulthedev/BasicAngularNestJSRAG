import { Injectable } from '@nestjs/common';
import { Document } from '../entities/document.entity';
import { EmbeddingsService } from './embeddings.service';
@Injectable()
export class RerankService {
  similarity = require( 'compute-cosine-similarity' );

  constructor(private readonly embeddingsService: EmbeddingsService,){

  }

  async reRankDocuments(query: string, documents: Document[]): Promise<Document[]> {
    const rankedDocuments = await Promise.all(documents.map(async (p) => {
      const score = await this.calculateSimilarityScore(query, p.content);
      return ({content: p.content, score: score});
    }));
    rankedDocuments.sort((a, b) => b.score - a.score); //sort by highest score first
    const highRankDocuments = rankedDocuments.filter(rp => rp.score > 0.51); //are the documents relevant to the quey?
    return documents.filter(p => (highRankDocuments.map(hrp => hrp.content)).some(d => d == p.content));
  }

  async calculateSimilarityScore(q1:string, q2: string){
    const vectorizedq1 = await this.embeddingsService.generateEmbedding(q1);
    const vectorizedq2 = await this.embeddingsService.generateEmbedding(q2);
    return this.similarity(vectorizedq1, vectorizedq2);
  }
}
