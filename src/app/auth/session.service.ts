import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type SessionInfo = { mode: string; authenticated: boolean; mustChangePassword?: boolean; identity: { provider?: string; subject?: string; displayName: string; email?: string; role: string | null; roles?: string[]; permissions: string[] } | null; csrfToken?: string };

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly sessionSignal = signal<SessionInfo>({ mode: 'guest', authenticated: false, identity: null });
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

  async login(email: string, password: string): Promise<void> {
    const value = await firstValueFrom(this.http.post<SessionInfo>(this.api('/v1/auth/login'), { email, password }, { withCredentials: true }));
    if (value.csrfToken) this.csrfToken = value.csrfToken;
    this.sessionSignal.set(value);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await firstValueFrom(this.http.post(this.api('/v1/auth/change-password'), { currentPassword, newPassword }, { withCredentials: true, headers: { 'X-CSRF-Token': this.csrfToken } }));
    this.sessionSignal.update(value => ({ ...value, mustChangePassword: false }));
  }

  async endDevelopmentSession(): Promise<void> {
    await firstValueFrom(this.http.delete(this.api('/v1/dev/session'), { withCredentials: true }));
    this.csrfToken = '';
    this.sessionSignal.set({ mode: 'guest', authenticated: false, identity: null });
  }

  get csrf(): string { return this.csrfToken; }
}
