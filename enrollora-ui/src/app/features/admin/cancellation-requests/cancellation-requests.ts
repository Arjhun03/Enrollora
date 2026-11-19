import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CancellationQuery,
  CancellationResponse,
  CancellationStatus,
  ReviewCancellationRequest,
} from '../../cancellation-requests/cancellation.models';
import { CancellationService } from '../../cancellation-requests/cancellation.service';

@Component({
  selector: 'app-admin-cancellation-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class AdminCancellationRequestsComponent implements OnInit {
  private readonly cancellationService = inject(CancellationService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Pagination
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Filters
  searchTerm = '';
  selectedStatus: number | null = null;

  // Review Modal state
  isModalOpen = signal(false);
  modalAction = signal<'approve' | 'reject'>('approve');
  selectedRequest = signal<CancellationResponse | null>(null);
  adminRemarks = '';
  isReviewing = signal(false);
  modalError = signal('');

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const query: CancellationQuery = {
      search: this.searchTerm || undefined,
      status: this.selectedStatus !== null ? this.selectedStatus : undefined,
      sortOrder: 'desc',
    };

    this.cancellationService
      .getAll(this.pageNumber(), this.pageSize(), query)
      .subscribe({
        next: (response) => {
          this.requests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.detail || error.error?.message || 'Failed to load cancellation requests.',
          );
          this.isLoading.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.pageNumber.set(1);
    this.loadRequests();
  }

  openReviewModal(request: CancellationResponse, action: 'approve' | 'reject'): void {
    this.selectedRequest.set(request);
    this.modalAction.set(action);
    this.adminRemarks = '';
    this.modalError.set('');
    this.isModalOpen.set(true);
  }

  closeReviewModal(): void {
    if (this.isReviewing()) return;
    this.isModalOpen.set(false);
    this.selectedRequest.set(null);
  }

  submitReview(): void {
    const req = this.selectedRequest();
    if (!req) return;

    this.isReviewing.set(true);
    this.modalError.set('');

    const payload: ReviewCancellationRequest = {
      adminRemarks: this.adminRemarks.trim() || undefined,
    };

    const action$ =
      this.modalAction() === 'approve'
        ? this.cancellationService.approve(req.cancellationRequestId, payload)
        : this.cancellationService.reject(req.cancellationRequestId, payload);

    action$.subscribe({
      next: () => {
        this.isReviewing.set(false);
        this.closeReviewModal();
        this.successMessage.set(
          `Cancellation request #${req.cancellationRequestId} was successfully ${
            this.modalAction() === 'approve' ? 'approved' : 'rejected'
          }.`,
        );
        setTimeout(() => this.successMessage.set(''), 4000);
        this.loadRequests();
      },
      error: (error: HttpErrorResponse) => {
        this.modalError.set(
          error.error?.detail || error.error?.message || 'Failed to submit review.',
        );
        this.isReviewing.set(false);
      },
    });
  }

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case CancellationStatus.Pending:
        return 'badge-pending';
      case CancellationStatus.Approved:
        return 'badge-approved';
      case CancellationStatus.Rejected:
        return 'badge-rejected';
      default:
        return '';
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case CancellationStatus.Pending:
        return 'Pending';
      case CancellationStatus.Approved:
        return 'Approved';
      case CancellationStatus.Rejected:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((p) => p - 1);
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((p) => p + 1);
      this.loadRequests();
    }
  }
}
