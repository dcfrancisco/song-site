import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from './models/task';   // <-- only import, no local redeclare
import { API_BASE_URL } from '../../api.config';
import { SessionService } from '../../auth/session.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = API_BASE_URL;

  constructor(private http: HttpClient, private session: SessionService) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API_BASE_URL}/tasks`);
  }

  getProgress(): Observable<{ progress: number }> {
    return this.http.get<{ progress: number }>(`${API_BASE_URL}/progress-status`);
  }

  updateTaskStatus(id: number, action: 'start' | 'complete') {
    return this.http.put<Task>(`${API_BASE_URL}/tasks/${id}/status`, { action }, {
      withCredentials: true,
      headers: { 'X-CSRF-Token': this.session.csrf },
    });
  }

  updateTask(id: number, data: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(
    `${this.apiUrl}/tasks/${id}`,
    data,
    this.mutationOptions()
    );
  }

  getTrainingTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API_BASE_URL}/training-tasks`);
  }

  private mutationOptions() {
    return {
      withCredentials: true,
      headers: { 'X-CSRF-Token': this.session.csrf },
    };
  }
}
