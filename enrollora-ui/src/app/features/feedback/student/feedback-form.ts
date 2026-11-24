import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EnrollmentService } from '../../enrollments/enrollment.service';
import { EnrollmentResponse } from '../../enrollments/enrollment.models';
import { FeedbackService } from '../feedback.service';

@Component({ selector: 'app-feedback-form', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './feedback-form.html', styleUrl: './feedback-form.css' })
export class FeedbackForm implements OnInit {
  private readonly enrollmentsApi = inject(EnrollmentService);
  private readonly feedbackApi = inject(FeedbackService);
  enrollments = signal<EnrollmentResponse[]>([]);
  loading = signal(true); submitting = signal(false); error = signal(''); success = signal('');
  courseId: number | null = null; rating = 5; comment = '';
  ngOnInit(): void {
    this.enrollmentsApi.getMyEnrollments(1, 100).subscribe({ next: r => { this.enrollments.set(r.items.filter(x => x.status === 0)); this.loading.set(false); }, error: e => { this.error.set(this.message(e, 'Unable to load your enrolled courses.')); this.loading.set(false); } });
  }
  submit(): void {
    const comment = this.comment.trim();
    if (!this.courseId || this.rating < 1 || this.rating > 5 || !comment) { this.error.set('Choose a course, select a rating, and enter your feedback.'); return; }
    this.error.set(''); this.success.set(''); this.submitting.set(true);
    this.feedbackApi.submit({ courseId: this.courseId, rating: this.rating, comment }).subscribe({ next: () => { this.success.set('Thanks! Your feedback was sent to the administrator.'); this.comment = ''; this.rating = 5; this.submitting.set(false); }, error: e => { this.error.set(this.message(e, 'Could not submit feedback.')); this.submitting.set(false); } });
  }
  private message(error: HttpErrorResponse, fallback: string): string { return error.error?.detail || error.error?.message || error.error?.title || fallback; }
}
