import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AtcpSongService } from './atcp-song.service';
import { LeadershipData } from '../models/atcp-song.model';
import { API_BASE_URL } from '../../api.config';

describe('AtcpSongService', () => {
  let service: AtcpSongService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AtcpSongService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AtcpSongService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the existing leadership API contract', () => {
    const response: LeadershipData = {
      marketLeads: [{ id: 1, name: 'Leader', role: 'Lead', initials: 'L' }],
      practiceLeads: [],
      capabilityLeads: [],
      enablementChampions: [],
    };

    service.getData().subscribe((data) => expect(data).toEqual(response));

    const request = http.expectOne(`${API_BASE_URL}/leadership`);
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });
});
