import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CancellationService } from '../../../cancellation-requests/cancellation.service';
import { EnrollmentResponse } from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly cancellationService = inject(CancellationService);

  enrollments = signal<EnrollmentResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Modal State for Requesting Cancellation
  isModalOpen = signal(false);
  selectedEnrollment = signal<EnrollmentResponse | null>(null);
  cancellationReason = '';
  isSubmitting = signal(false);
  modalError = signal('');

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          this.errorMessage.set(
            body?.detail || body?.message || body?.title ||
            'Unable to load your enrollments.',
          );
          this.isLoading.set(false);
        },
      });
  }

  // Active status in backend is 0 (EnrollmentStatus.Active)
  isActive(status: number): boolean {
    return status === 0;
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  openCancelModal(enrollment: EnrollmentResponse): void {
    this.selectedEnrollment.set(enrollment);
    this.cancellationReason = '';
    this.modalError.set('');
    this.isModalOpen.set(true);
  }

  closeCancelModal(): void {
    if (this.isSubmitting()) return;
    this.isModalOpen.set(false);
    this.selectedEnrollment.set(null);
  }

  submitCancellation(): void {
    const enrollment = this.selectedEnrollment();
    if (!enrollment) return;

    const trimmedReason = this.cancellationReason.trim();
    if (!trimmedReason) {
      this.modalError.set('Please provide a reason for cancelling this enrollment.');
      return;
    }

    this.isSubmitting.set(true);
    this.modalError.set('');

    this.cancellationService
      .createRequest(enrollment.enrollmentId, { reason: trimmedReason })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeCancelModal();
          this.successMessage.set(
            `Cancellation request submitted for "${enrollment.courseName}". You will be notified once reviewed.`,
          );
          setTimeout(() => this.successMessage.set(''), 5000);
          this.loadEnrollments();
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          this.modalError.set(
            body?.detail || body?.message || body?.title || 'Failed to submit cancellation request.',
          );
          this.isSubmitting.set(false);
        },
      });
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }
}
