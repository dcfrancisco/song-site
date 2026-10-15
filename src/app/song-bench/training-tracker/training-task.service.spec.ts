import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SessionService } from '../../auth/session.service';
import { API_BASE_URL } from '../../api.config';
import { TrainingTaskService } from './training-task.service';

describe('TrainingTaskService', () => {
  let service: TrainingTaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrainingTaskService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: { csrf: 'test-csrf-token' } },
      ],
    });
    service = TestBed.inject(TrainingTaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends credentials and the development CSRF token for status changes', () => {
    service.updateTaskStatus(3, 'complete').subscribe();

    const request = http.expectOne(`${API_BASE_URL}/training-tasks/3/status`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.get('X-CSRF-Token')).toBe('test-csrf-token');
    expect(request.request.body).toEqual({ action: 'complete' });
    request.flush({});
  });
});
