export interface CreateCourseFeedbackRequest { courseId: number; rating: number; comment: string; }
export interface CourseFeedbackResponse {
  feedbackId: number; courseId: number; courseName: string; studentId: number;
  studentName: string; rating: number; comment: string; submittedAt: string;
}
