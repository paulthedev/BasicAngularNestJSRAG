import { Document } from '../entities/document.entity';
import { DocumentDTO } from '@basic-angular-nestjs-rag/sharedDTO';

export class DocumentMapper {
  static toDTO(document: Document): DocumentDTO {
    // Create a new object with the required properties from Product entity
    const dto: DocumentDTO = {
      id: document.id,
      name: document.name,
      content: document.content,
      embedding: document.embedding,
    };
    return dto;
  }

  static toDTOs(documents: Document[]): DocumentDTO[] {
    return documents.map(document => this.toDTO(document));
  }

  static toEntity(documentDTO: Partial<DocumentDTO>): Document {
    const entity: Document = {
      id: documentDTO.id,
      name: documentDTO.name,
      content: documentDTO.content,
      embedding: documentDTO.embedding,
    } as Document;

    return entity;
  }
}
