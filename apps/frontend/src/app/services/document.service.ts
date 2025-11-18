import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DocumentDTO, ResponseDTO } from '@basic-angular-nestjs-rag/sharedDTO';
import { Observable, pipe } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly apiUrl = 'http://localhost:3000/api'; // This should be your actual API base URL

  constructor(private http: HttpClient) {
  }

  uploadByPage(documentsData: Partial<DocumentDTO>[]):Observable<string> {
   return this.http.post<ResponseDTO<string>>(this.apiUrl+'/documents/uploadbypage', documentsData).pipe(
      map(response => response.data)
    );
  }

  analyseDocuments(question: string):Observable<string> {
    return this.http.post<ResponseDTO<string>>(this.apiUrl + '/documents/analyseDocuments', { question }).pipe(
      map(response => response.data)
    );
  }
}
