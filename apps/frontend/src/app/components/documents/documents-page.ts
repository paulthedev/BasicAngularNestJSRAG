import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { DocumentDTO } from '@basic-angular-nestjs-rag/sharedDTO';
import Tesseract from 'tesseract.js';
// Import pdfjs-dist library
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';

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
export class DocumentsPageComponent implements OnInit, OnDestroy {
  selectedFiles = signal<File[]>([]);
  isProcessing = signal(false);
  processingStatus = signal<string | null>(null);
  uploadStatus = signal<string | null>(null);
  searchQuery = signal('');
  searchResults = signal<any[]>([]);
  isLoading = signal(false);
  private documentService = inject(DocumentService);

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

  private async initializeTesseractScheduler() {
    if (this.scheduler) return;

    this.scheduler = Tesseract.createScheduler();
    
    // Create and add workers with 'eng' language pack
    for (let i = 0; i < this.Tesseract_num_workers; i++) {
      const worker = await Tesseract.createWorker('eng'); 
      this.scheduler.addWorker(worker);
    }
    
    console.log(`Tesseract.js scheduler initialized with ${this.Tesseract_num_workers} workers.`);
  }

  private async terminateTesseractScheduler() {
    if (this.scheduler) {
      await this.scheduler.terminate();
      this.scheduler = null;
      console.log('Tesseract.js scheduler terminated.');
    }
  }

  async processDocuments(): Promise<void> {
    const files = this.selectedFiles();
    if (!files || !this.scheduler) {
      return;
    }

    this.isProcessing.set(true);
    this.processingStatus.set(`Processing ${files.length} documents...`);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.processingStatus.set(`Extracting images from document ${i+1} of ${files.length}: ${file.name}`);
        
        // Use pdfjs-dist to get images from the PDF
        const images = await this.extractImagesFromPdf(file);
        
        let fullText = '';
        for (let j = 0; j < images.length; j++) {
          this.processingStatus.set(`OCR'ing page ${j+1} of ${images.length} for ${file.name}`);
          // Send each image (canvas) to the scheduler for OCR
          const { data: { text: extractedText } } = await this.scheduler.addJob('recognize', images[j]);
          fullText += extractedText + '\n\n';
        }

        const documentData: Partial<DocumentDTO> = {
          name: file.name,
          content: fullText.trim()
        };

        // Upload the combined text content for the document via a Promise wrapper
        await new Promise<void>((resolve, reject) => {
          this.documentService.uploadDocument(documentData).subscribe({
            next: () => {
              console.log(`Document ${file.name} uploaded successfully`);
              resolve();
            },
            error: (error) => {
              console.error(`Error uploading document ${file.name}:`, error);
              reject(error);
            }
          });
        });
      }

      this.processingStatus.set('All documents processed and uploaded successfully!');
      this.uploadStatus.set('success');
      this.isProcessing.set(false);

    } catch (error) {
      console.error('Error processing documents:', error);
      this.processingStatus.set('Error processing documents');
      this.isProcessing.set(false);
    }
  }

  // Helper function to convert File to a usable URL for pdf.js
  private fileToURL(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  // Function to extract images (as canvas elements) from a PDF file using pdfjs-dist
  private async extractImagesFromPdf(file: File): Promise<HTMLCanvasElement[]> {
    const fileUrl = await this.fileToURL(file);
    const loadingTask = pdfjsLib.getDocument(fileUrl);
    const pdf = await loadingTask.promise;
    const canvasElements: HTMLCanvasElement[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      // Scale determines the quality/resolution of the rendered image
      const scale = 2; 
      const viewport = page.getViewport({ scale: scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error("Could not get canvas context");
      }
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Type inferred by TS to avoid explicit 'RenderParameters' import error
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas 
      };

      await page.render(renderContext).promise;
      canvasElements.push(canvas);
    }
    
    return canvasElements;
  }


  onSearch(): void {
    if (this.searchQuery().trim()) {
      this.isLoading.set(true);
      this.documentService.analyseDocuments(this.searchQuery()).subscribe({
        next: (results: any) => {
          this.searchResults.set(results);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error searching documents:', error);
          this.isLoading.set(false);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.terminateTesseractScheduler();
  }
}
