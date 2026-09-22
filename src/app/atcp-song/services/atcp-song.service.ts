import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeadershipData } from '../models/atcp-song.model';
import { API_BASE_URL } from '../../api.config';

@Injectable({ providedIn: 'root' })
export class AtcpSongService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_BASE_URL + '/leadership';

  getData(): Observable<LeadershipData> {
    return this.http.get<LeadershipData>(`${API_BASE_URL}/leadership`);
  }
}
