import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../auth/session.service';

export interface AnnouncementPageContent { schemaVersion: number; hero: { title: string; body: string }; carousel: Array<{ id: string; name: string; image: string; body: string; order: number }>; trainings: Array<{ id: string; title: string; description: string; link: string; linkLabel: string; order: number }>; notices: Array<{ id: string; title: string; body: string; order: number }>; reminder: { title: string; body: string }; }
@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private get apiRoot(): string {
    const configured = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.['VITE_API_BASE_URL'] ?? '/api';
    const localBrowser = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return localBrowser && configured.startsWith('http://localhost:5001') ? '/api' : configured;
  }
  async getPublished(): Promise<AnnouncementPageContent> {
    return (await firstValueFrom(this.http.get<{ payload: AnnouncementPageContent }>(`${this.apiRoot}/v1/content/pages/announcement-page`, { withCredentials: true }))).payload;
  }

  getDraft() { return firstValueFrom(this.http.get<ContentVersion | null>(`${this.apiRoot}/v1/authoring/pages/announcement-page/draft`, { withCredentials: true })); }
  getVersions() { return firstValueFrom(this.http.get<ContentVersion[]>(`${this.apiRoot}/v1/authoring/pages/announcement-page/versions`, { withCredentials: true })); }
  saveDraft(payload: AnnouncementPageContent, expectedVersion: number) { return firstValueFrom(this.http.put<ContentVersion>(`${this.apiRoot}/v1/authoring/pages/announcement-page/draft`, { payload, expectedVersion }, this.mutationOptions())); }
  preview(payload: AnnouncementPageContent) { return firstValueFrom(this.http.post<{ valid: boolean; payload: AnnouncementPageContent }>(`${this.apiRoot}/v1/authoring/pages/announcement-page/preview`, { payload }, this.mutationOptions())); }
  publish(expectedVersion: number) { return firstValueFrom(this.http.post<ContentVersion>(`${this.apiRoot}/v1/authoring/pages/announcement-page/publish`, { expectedVersion }, this.mutationOptions())); }
  discard(expectedVersion: number) { return firstValueFrom(this.http.delete<ContentVersion>(`${this.apiRoot}/v1/authoring/pages/announcement-page/draft?expectedVersion=${expectedVersion}`, this.mutationOptions())); }
  restore(versionId: number, expectedVersion: number) { return firstValueFrom(this.http.post<ContentVersion>(`${this.apiRoot}/v1/authoring/pages/announcement-page/versions/${versionId}/restore`, { expectedVersion }, this.mutationOptions())); }

  private mutationOptions() { return { withCredentials: true, headers: { 'X-CSRF-Token': this.session.csrf } }; }
}

export interface ContentVersion { id: number; version: number; state: 'draft' | 'published' | 'superseded' | 'discarded'; payload: AnnouncementPageContent; authoredBy: string; createdAt: string; publishedAt?: string; }
