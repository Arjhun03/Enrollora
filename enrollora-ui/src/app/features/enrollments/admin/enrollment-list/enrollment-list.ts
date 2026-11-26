import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EnrollmentService } from '../../enrollment.service';
import { EnrollmentResponse } from '../../enrollment.models';

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enrollment-list.html',
  styleUrl: './enrollment-list.css',
})
export class EnrollmentListComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);

  enrollments = signal<EnrollmentResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  studentIdFilter = '';
  courseIdFilter = '';
  activeStudentId = signal<number | null>(null);
  activeCourseId = signal<number | null>(null);
  filterError = signal('');

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const studentId = this.activeStudentId();
    const courseId = this.activeCourseId();
    const request = studentId !== null
      ? this.enrollmentService.getEnrollmentsByStudent(studentId, this.pageNumber(), this.pageSize())
      : courseId !== null
        ? this.enrollmentService.getEnrollmentsByCourse(courseId, this.pageNumber(), this.pageSize())
        : this.enrollmentService.getEnrollments(this.pageNumber(), this.pageSize());

    request.subscribe({
      next: (response) => {
        this.enrollments.set(response.items);
        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading enrollments:', error);
        this.errorMessage.set('Unable to load enrollments.');
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    const studentId = this.studentIdFilter.trim();
    const courseId = this.courseIdFilter.trim();
    this.filterError.set('');

    if (studentId && courseId) {
      this.filterError.set('Enter either a student ID or a course ID, not both.');
      return;
    }
    if ((studentId && (!/^\d+$/.test(studentId) || Number(studentId) < 1)) ||
        (courseId && (!/^\d+$/.test(courseId) || Number(courseId) < 1))) {
      this.filterError.set('IDs must be positive whole numbers.');
      return;
    }

    this.activeStudentId.set(studentId ? Number(studentId) : null);
    this.activeCourseId.set(courseId ? Number(courseId) : null);
    this.pageNumber.set(1);
    this.loadEnrollments();
  }

  clearFilters(): void {
    this.studentIdFilter = '';
    this.courseIdFilter = '';
    this.activeStudentId.set(null);
    this.activeCourseId.set(null);
    this.filterError.set('');
    this.pageNumber.set(1);
    this.loadEnrollments();
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }
}
