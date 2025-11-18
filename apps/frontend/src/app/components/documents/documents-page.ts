import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { DocumentDTO } from '@basic-angular-nestjs-rag/sharedDTO';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { firstValueFrom } from 'rxjs';

// IMPORTANT: Configure the worker source for pdfjs-dist
// Ensure you have copied 'pdf.worker.mjs' or 'pdf.worker.js' to your assets folder
// via your angular.json configuration.
GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs';


@Component({
  selector: 'app-documents-page',
  imports: [FormsModule],
  templateUrl: 'documents-page.html',
  styleUrls: ['documents-page.scss']
})
export class DocumentsPageComponent {
  selectedFiles = signal<File[]>([]);
  isProcessing = signal(false);
  processingStatus = signal<string | null>(null);
  uploadStatus = signal<string | null>(null);
  prompt = signal('');
  promptResult = signal<string>('');
  isLoading = signal(false);
  private documentService = inject(DocumentService);

  onFileSelected(event: any): void {
    const files: File[] = Array.from(event.target.files);
    if (files.length > 0) {
      this.selectedFiles.set(files);
      this.processingStatus.set(null);
      this.uploadStatus.set(null);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(event.dataTransfer.files);
      const pdfFiles = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
      
      if (pdfFiles.length > 0) {
        this.selectedFiles.set(pdfFiles);
        this.processingStatus.set(null);
        this.uploadStatus.set(null);
      }
    }
  }

    async processDocuments(): Promise<void> {
    const files = this.selectedFiles();
    if (!files || files.length === 0) {
      return;
    }

    this.isProcessing.set(true);
    this.processingStatus.set(`Processing ${files.length} documents for batch upload...`);
    
    try {
      const allDocumentsData: Partial<DocumentDTO>[] = [];
      
      // Extract data from all files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.processingStatus.set(`Extracting text from ${file.name} (${i + 1}/${files.length})...`);
        const documentsData: Partial<DocumentDTO>[] = await this.extractDataFromPdf(file);
        allDocumentsData.push(...documentsData);
      }

      const BATCH_SIZE = 1;
      // Upload documents in batches
      for (let i = 0; i < allDocumentsData.length; i += BATCH_SIZE) {
        const batch = allDocumentsData.slice(i, i + BATCH_SIZE);
        this.processingStatus.set(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(allDocumentsData.length / BATCH_SIZE)} (${batch.length} documents)...`);
        
        // Use firstValueFrom to handle the Observable as a Promise and wait for completion
        await firstValueFrom(this.documentService.uploadByPage(batch));
        console.log(`Batch starting at index ${i} uploaded successfully.`);
      }

      this.uploadStatus.set('success');
      this.isProcessing.set(false);
      this.selectedFiles.set([]); // Clear selected files after successful upload

    } catch (error) {
      console.error('Error processing documents:', error);
      this.processingStatus.set('Error processing documents');
      this.uploadStatus.set('error');
      this.isProcessing.set(false);
    }
  }

  private fileToURL(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  private async extractDataFromPdf(file: File): Promise<Partial<DocumentDTO>[]> {
      const fileUrl = await this.fileToURL(file);
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      const pages: Partial<DocumentDTO>[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Extract text content from the items array and join with a space
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');

        const sanitizedPageText = pageText.toLowerCase().normalize('NFKC').replace(/\0/g, '');

        pages.push({
          name: file.name,
          content: sanitizedPageText || '', // Filled TODO
          page: i // Page numbers are 1-based, not 0-based
        });
      }
      
      // Note: The original function signature returns a single DocumentDTO, 
      // but the implementation collects an array. Assuming you want to return the array.
      return pages;
  }

  onSearch(): void {
    if (this.prompt().trim()) {
      this.isLoading.set(true);
      this.documentService.analyseDocuments(this.prompt()).subscribe({
        next: (result: string) => {
          this.promptResult.set(result || '');
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error searching documents:', error);
          this.isLoading.set(false);
        }
      });
    }
  }
}
