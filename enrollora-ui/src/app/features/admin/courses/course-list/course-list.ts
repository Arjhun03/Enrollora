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
  searchTerm = signal('');

  totalRecords = signal(0);
  totalPages = signal(0);

  isCreateFormOpen = signal(false);
  isSaving = signal(false);
  createError = signal('');
  isDeactivating = signal<number | null>(null);
  deactivateError = signal('');
  newCourse: SaveCourseRequest = { courseName: '', duration: '', fees: 0, capacity: 1, isActive: true };

  selectedCourse = signal<CourseResponse | null>(null);
  isDetailsOpen = signal(false);
  isDetailsLoading = signal(false);
  detailsError = signal('');
  isEditFormOpen = signal(false);
  editingCourseId = signal<number | null>(null);
  editCourse: SaveCourseRequest = { courseName: '', duration: '', fees: 0, capacity: 1, isActive: true };
  isUpdating = signal(false);
  isEditLoading = signal(false);
  editError = signal('');
  editLoadError = signal('');

  ngOnInit(): void {
    this.loadCourses();
  }

  // Load courses from backend
  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses(this.pageNumber(), this.pageSize(), { search: this.searchTerm().trim() || undefined }).subscribe({
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

  searchCourses(value: string): void {
    this.searchTerm.set(value);
    this.pageNumber.set(1);
    this.loadCourses();
  }

  viewCourse(id: number): void {
    this.selectedCourse.set(null);
    this.detailsError.set('');
    this.isDetailsLoading.set(true);
    this.isDetailsOpen.set(true);
    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        this.selectedCourse.set(course);
        this.isDetailsLoading.set(false);
      },
      error: (error) => {
        this.detailsError.set(error?.error?.detail || error?.error?.message || 'Unable to load course details.');
        this.isDetailsLoading.set(false);
      },
    });
  }

  closeDetails(): void {
    this.isDetailsOpen.set(false);
    this.selectedCourse.set(null);
    this.detailsError.set('');
  }

  editCourseById(id: number): void {
    this.editingCourseId.set(id);
    this.editError.set('');
    this.editLoadError.set('');
    this.isEditLoading.set(true);
    this.isEditFormOpen.set(true);
    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        this.editCourse = {
          courseName: course.courseName,
          duration: course.duration,
          fees: course.fees,
          capacity: course.capacity,
          isActive: course.isActive,
        };
        this.isEditLoading.set(false);
      },
      error: (error) => {
        this.editLoadError.set(error?.error?.detail || error?.error?.message || 'Unable to load course for editing.');
        this.isEditLoading.set(false);
      },
    });
  }

  closeEditForm(): void {
    if (this.isUpdating()) return;
    this.isEditFormOpen.set(false);
    this.editingCourseId.set(null);
    this.editError.set('');
  }

  updateCourse(): void {
    const id = this.editingCourseId();
    const request = { ...this.editCourse, courseName: this.editCourse.courseName.trim(), duration: this.editCourse.duration.trim() };
    if (id === null || !request.courseName || !request.duration || request.fees < 0 || request.capacity < 1) {
      this.editError.set('Enter a course name, duration, non-negative fee, and capacity of at least 1.');
      return;
    }

    this.isUpdating.set(true);
    this.editError.set('');
    this.courseService.updateCourse(id, request).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.isEditFormOpen.set(false);
        this.editingCourseId.set(null);
        this.loadCourses();
      },
      error: (error) => {
        this.editError.set(error?.error?.detail || error?.error?.message || 'Unable to update course. Please try again.');
        this.isUpdating.set(false);
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
