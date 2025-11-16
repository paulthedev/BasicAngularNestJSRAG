import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { DocumentDTO } from '@basic-angular-nestjs-rag/sharedDTO';
import Tesseract from 'tesseract.js';

@Component({
  selector: 'app-documents-page',
  imports: [FormsModule],
  templateUrl: 'documents-page.html',
  styleUrls: ['documents-page.scss']
})
export class DocumentsPageComponent implements OnInit,OnDestroy {
  selectedFiles = signal<File[]>([]);
  isProcessing = signal(false);
  processingStatus = signal<string | null>(null);
  uploadStatus = signal<string | null>(null);
  searchQuery = signal('');
  private documentService = inject(DocumentService);

  // Define the number of workers you want to use
  Tesseract_num_workers = 4;
  scheduler: Tesseract.Scheduler | null = null;

  ngOnInit(): void {
    this.initializeTesseractScheduler();
  }

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
      // Filter only PDF files
      const pdfFiles = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
      
      if (pdfFiles.length > 0) {
        this.selectedFiles.set(pdfFiles);
        this.processingStatus.set(null);
        this.uploadStatus.set(null);
      }
    }
  }

  // Function to initialize the scheduler and workers
  private async initializeTesseractScheduler() {
    if (this.scheduler) return; // Initialize only once

    this.scheduler = Tesseract.createScheduler();
    const workers = [];
    
    // Create and add 4 workers to the scheduler
    for (let i = 0; i < this.Tesseract_num_workers; i++) {
      const worker = await Tesseract.createWorker('eng'); // Create a worker with the English language pack
      workers.push(worker);
      this.scheduler.addWorker(worker);
    }
    
    console.log(`Tesseract.js scheduler initialized with ${this.Tesseract_num_workers} workers.`);
  }

  // Function to terminate the scheduler and all workers when done (e.g., on app teardown)
  private async terminateTesseractScheduler() {
    if (this.scheduler) {
      await this.scheduler.terminate();
      this.scheduler = null;
      console.log('Tesseract.js scheduler terminated.');
    }
  }

  async processDocuments(): Promise<void> {
    const files = this.selectedFiles();
    if (!files.length || !this.scheduler) {
      return;
    }

    this.isProcessing.set(true);
    this.processingStatus.set(`Processing ${files.length} documents...`);
    
    try {
      // Process all documents in batch
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.processingStatus.set(`Processing document ${i+1} of ${files.length}: ${file.name}`);
        
        // Send the job to the scheduler. It will pick the next available worker.
        const { data: { text: extractedText } } = await this.scheduler.addJob('recognize', file);
        
        const documentData: Partial<DocumentDTO> = {
          name: file.name,
          content: extractedText
        };

        // Upload each processed document
        this.documentService.uploadDocument(documentData).subscribe({
          next: () => {
            console.log(`Document ${file.name} uploaded successfully`);
            this.processingStatus.set(`Document ${i+1} of ${files.length} (${file.name}) uploaded successfully`);
          },
          error: (error) => {
            console.error(`Error uploading document ${file.name}:`, error);
            this.processingStatus.set(`Error uploading document ${file.name}`);
          }
        });
      }

      // Set status after processing all files
      this.processingStatus.set('All documents processed and uploaded successfully!');
      this.uploadStatus.set('success');

    } catch (error) {
      console.error('Error processing documents with Tesseract:', error);
      this.processingStatus.set('Error processing documents');
      this.isProcessing.set(false);
    }
  }

  onSearch(): void {
    if (this.searchQuery().trim()) {
      // In a real implementation, this would call the search API
      console.log('Searching for:', this.searchQuery());
    }
  }

  ngOnDestroy(): void {
    this.terminateTesseractScheduler();
  }
}
