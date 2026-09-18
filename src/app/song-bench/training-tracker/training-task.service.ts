import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrainingTask } from './models/training-task';
import { API_BASE_URL } from '../../api.config';

@Injectable({ providedIn: 'root' })
export class TrainingTaskService {
  private apiUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<TrainingTask[]> {
    return this.http.get<TrainingTask[]>(`${API_BASE_URL}/training-tasks`);
  }

  getProgress(): Observable<{ progress: number }> {
    return this.http.get<{ progress: number }>(`${API_BASE_URL}/training-progress-status`);
  }

  updateTaskStatus(id: number, action: 'start' | 'complete') {
    return this.http.put<TrainingTask>(`${API_BASE_URL}/training-tasks/${id}/status`, { action });
  }
}
