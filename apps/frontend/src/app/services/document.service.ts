import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DocumentDTO } from '@basic-angular-nestjs-rag/sharedDTO';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly apiUrl = 'http://localhost:3000/api'; // This should be your actual API base URL

  constructor(private http: HttpClient) {
  }

  uploadDocument(documentData: Partial<DocumentDTO>) {
   return this.http.post(this.apiUrl+'/documents/upload', documentData);
  }

  analyseDocuments(question: string) {
    return this.http.post(this.apiUrl + '/documents/analyseDocuments', { question });
  }
}
