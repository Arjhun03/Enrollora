import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentResponse, UpdateStudentRequest } from '../../admin/students/student.models';
import { StudentService } from '../../admin/students/student.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css',
})
export class StudentProfileComponent implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly cdr = inject(ChangeDetectorRef);

  student: StudentResponse | null = null;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  readonly profileForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    department: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    age: new FormControl(18, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(17), Validators.max(60)],
    }),
    cgpa: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(10)],
    }),
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.studentService.getMe().subscribe({
      next: (student) => {
        this.student = student;
        this.profileForm.patchValue({
          name: student.name,
          department: student.department,
          age: student.age,
          cgpa: student.cgpa,
        });
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to load your profile.');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.isSaving) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const request: UpdateStudentRequest = this.profileForm.getRawValue();
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.studentService.updateMe(request).subscribe({
      next: (student) => {
        this.student = student;
        this.profileForm.patchValue({
          name: student.name,
          department: student.department,
          age: student.age,
          cgpa: student.cgpa,
        });
        this.successMessage = 'Your profile was updated.';
        this.isSaving = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.getErrorMessage(error, 'Unable to save your profile.');
        this.isSaving = false;
        this.cdr.markForCheck();
      },
    });
  }

  private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
    return error.error?.detail || error.error?.message || error.error?.title || fallback;
  }
}
