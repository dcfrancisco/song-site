import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface LinkCard {
  title: string;
  description: string;
  linkText: string;
  url: string;
  external?: boolean;
}

export interface LinkSection {
  title: string;
  cards: LinkCard[];
}

@Injectable({ providedIn: 'root' })
export class AtcpSongLinksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_BASE_URL + '/song-links';

  getSections(): Observable<LinkSection[]> {
    return this.http.get<LinkSection[]>(`${API_BASE_URL}/song-links`);
  }
}
