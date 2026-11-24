import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../shared/models/paged-result.model';
import { CourseFeedbackResponse, CreateCourseFeedbackRequest } from './feedback.models';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/courses/feedback`;
  submit(request: CreateCourseFeedbackRequest): Observable<CourseFeedbackResponse> {
    return this.http.post<CourseFeedbackResponse>(this.url, request);
  }
  getAll(pageNumber = 1, pageSize = 10, courseId?: number): Observable<PagedResult<CourseFeedbackResponse>> {
    let params = new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
    if (courseId != null) params = params.set('courseId', courseId);
    return this.http.get<PagedResult<CourseFeedbackResponse>>(this.url, { params });
  }
}
