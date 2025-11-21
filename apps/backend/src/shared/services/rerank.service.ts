import { Injectable } from '@nestjs/common';
import { Document } from '../entities/document.entity';
import { EmbeddingsService } from './embeddings.service';
@Injectable()
export class RerankService {
  similarity = require( 'compute-cosine-similarity' );

  constructor(private readonly embeddingsService: EmbeddingsService,){

  }

  async reRankDocuments(query: string, documents: Document[]): Promise<Document[]> {
    const vectorizedQuery = await this.embeddingsService.generateEmbedding(query);
    const rankedDocuments = await Promise.all(documents.map(async (p) => {
      const score = await this.calculateSimilarityScore(vectorizedQuery, p.embedding);
      return ({content: p.content, score: score});
    }));
    rankedDocuments.sort((a, b) => b.score - a.score); //sort by highest score first
    const highRankDocuments = rankedDocuments.filter(rp => rp.score > 0.51); //are the documents relevant to the quey?
    return documents.filter(p => (highRankDocuments.map(hrp => hrp.content)).some(d => d == p.content));
  }

  async calculateSimilarityScore(q1:number[], q2: number[]){
    return this.similarity(q1, q2);
  }
}
