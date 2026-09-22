import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from './models/task';   // <-- only import, no local redeclare
import { API_BASE_URL } from '../../api.config';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = API_BASE_URL;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API_BASE_URL}/tasks`);
  }

  getProgress(): Observable<{ progress: number }> {
    return this.http.get<{ progress: number }>(`${API_BASE_URL}/progress-status`);
  }

  updateTaskStatus(id: number, action: 'start' | 'complete') {
    return this.http.put<Task>(`${API_BASE_URL}/tasks/${id}/status`, { action });
  }

  updateTask(id: number, data: any) {
    return this.http.put(
    `${this.apiUrl}/tasks/${id}`,
    data
    );
  }

  getTrainingTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/training-tasks`);
  }
}
