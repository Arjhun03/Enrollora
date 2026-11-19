import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import {
  CancellationResponse,
  CancellationStatus,
} from '../../cancellation-requests/cancellation.models';
import { CancellationService } from '../../cancellation-requests/cancellation.service';

@Component({
  selector: 'app-student-cancellation-requests',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class StudentCancellationRequestsComponent implements OnInit {
  private readonly cancellationService = inject(CancellationService);

  requests = signal<CancellationResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.cancellationService
      .getMy(this.pageNumber(), this.pageSize(), { sortOrder: 'desc' })
      .subscribe({
        next: (response) => {
          this.requests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.detail || error.error?.message || 'Unable to load cancellation requests.',
          );
          this.isLoading.set(false);
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
        return 'Pending Review';
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
