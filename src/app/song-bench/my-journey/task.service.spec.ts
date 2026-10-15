import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SessionService } from '../../auth/session.service';
import { API_BASE_URL } from '../../api.config';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: { csrf: 'test-csrf-token' } },
      ],
    });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends credentials and the development CSRF token for status changes', () => {
    service.updateTaskStatus(12, 'start').subscribe();

    const request = http.expectOne(`${API_BASE_URL}/tasks/12/status`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.get('X-CSRF-Token')).toBe('test-csrf-token');
    expect(request.request.body).toEqual({ action: 'start' });
    request.flush({});
  });
});
