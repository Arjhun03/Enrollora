import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { CourseService } from '../course.service';
import { CourseResponse, SaveCourseRequest } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);

  // Signals
  courses = signal<CourseResponse[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);

  totalRecords = signal(0);
  totalPages = signal(0);

  isCreateFormOpen = signal(false);
  isSaving = signal(false);
  createError = signal('');
  isDeactivating = signal<number | null>(null);
  deactivateError = signal('');
  newCourse: SaveCourseRequest = { courseName: '', duration: '', fees: 0, capacity: 1, isActive: true };

  ngOnInit(): void {
    this.loadCourses();
  }

  // Load courses from backend
  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses(this.pageNumber(), this.pageSize()).subscribe({
      next: (response) => {
        this.courses.set(response.items);

        this.totalRecords.set(response.totalRecords);
        this.totalPages.set(response.totalPages);

        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading courses:', error);

        this.errorMessage.set('Unable to load courses.');

        this.isLoading.set(false);
      },
    });
  }

  openCreateForm(): void {
    this.newCourse = { courseName: '', duration: '', fees: 0, capacity: 1, isActive: true };
    this.createError.set('');
    this.isCreateFormOpen.set(true);
  }

  closeCreateForm(): void {
    if (!this.isSaving()) this.isCreateFormOpen.set(false);
  }

  createCourse(): void {
    const request = { ...this.newCourse, courseName: this.newCourse.courseName.trim(), duration: this.newCourse.duration.trim() };
    if (!request.courseName || !request.duration || request.fees < 0 || request.capacity < 1) {
      this.createError.set('Enter a course name, duration, non-negative fee, and capacity of at least 1.');
      return;
    }

    this.isSaving.set(true);
    this.createError.set('');
    this.courseService.createCourse(request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isCreateFormOpen.set(false);
        this.pageNumber.set(1);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error creating course:', error);
        this.createError.set(error?.error?.message ?? 'Unable to create course. Please try again.');
        this.isSaving.set(false);
      },
    });
  }

  deactivateCourse(course: CourseResponse): void {
    if (!course.isActive || this.isDeactivating() !== null) return;
    if (!window.confirm(`Deactivate "${course.courseName}"? Existing enrollment history will be preserved.`)) return;

    this.isDeactivating.set(course.courseId);
    this.deactivateError.set('');
    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: () => {
        this.isDeactivating.set(null);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error deactivating course:', error);
        this.deactivateError.set(error?.error?.message ?? 'Unable to deactivate course. Please try again.');
        this.isDeactivating.set(null);
      },
    });
  }

  // Navigate to next page
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);

      this.loadCourses();
    }
  }

  // Navigate to previous page
  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);

      this.loadCourses();
    }
  }
}
