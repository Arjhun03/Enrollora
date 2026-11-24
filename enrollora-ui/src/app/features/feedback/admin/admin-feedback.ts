import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FeedbackService } from '../feedback.service';
import { CourseFeedbackResponse } from '../feedback.models';
@Component({ selector: 'app-admin-feedback', standalone: true, imports: [CommonModule, DatePipe], templateUrl: './admin-feedback.html', styleUrl: './admin-feedback.css' })
export class AdminFeedback implements OnInit {
  private readonly api = inject(FeedbackService);
  items = signal<CourseFeedbackResponse[]>([]); loading = signal(false); error = signal(''); page = signal(1); pageSize = 10; totalPages = signal(0); total = signal(0);
  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.error.set(''); this.api.getAll(this.page(), this.pageSize).subscribe({ next: r => { this.items.set(r.items); this.total.set(r.totalRecords); this.totalPages.set(r.totalPages); this.loading.set(false); }, error: (e: HttpErrorResponse) => { this.error.set(e.error?.detail || e.error?.message || e.error?.title || 'Unable to load feedback.'); this.loading.set(false); } }); }
  previous(): void { if (this.page() > 1) { this.page.update(x => x - 1); this.load(); } }
  next(): void { if (this.page() < this.totalPages()) { this.page.update(x => x + 1); this.load(); } }
}
