import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type DevFixture = { name: string; displayName: string; role: string; permissions: string[] };
export type SessionInfo = { mode: string; authenticated: boolean; identity: { displayName: string; role: string; permissions: string[] } | null; developmentFixtures: DevFixture[]; csrfToken?: string };

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly sessionSignal = signal<SessionInfo>({ mode: 'guest', authenticated: false, identity: null, developmentFixtures: [] });
  private csrfToken = '';
  readonly session = this.sessionSignal.asReadonly();

  private api(path: string): string {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    const configured = env?.['VITE_API_BASE_URL'] ?? '/api';
    const localBrowser = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return `${localBrowser && configured.startsWith('http://localhost:5001') ? '/api' : configured}${path}`;
  }

  async refresh(): Promise<void> {
    const value = await firstValueFrom(this.http.get<SessionInfo>(this.api('/v1/session'), { withCredentials: true }));
    if (value.csrfToken) this.csrfToken = value.csrfToken;
    this.sessionSignal.set(value);
  }

  async useDevelopmentFixture(fixture: string): Promise<void> {
    const result = await firstValueFrom(this.http.post<SessionInfo & { csrfToken: string }>(this.api('/v1/dev/session'), { fixture }, { withCredentials: true }));
    this.csrfToken = result.csrfToken;
    this.sessionSignal.set(result);
  }

  async endDevelopmentSession(): Promise<void> {
    await firstValueFrom(this.http.delete(this.api('/v1/dev/session'), { withCredentials: true }));
    this.csrfToken = '';
    await this.refresh();
  }

  get csrf(): string { return this.csrfToken; }
}
