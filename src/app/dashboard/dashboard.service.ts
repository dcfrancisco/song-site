import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../auth/session.service';

export type RbacUser = {
  id: string;
  email: string;
  displayName: string;
  provider: string;
  subject: string;
  isActive: boolean;
  roles: string[];
};

export type DashboardSummary = {
  identity: { displayName: string; email: string; role: string | null; mode: string } | null;
  cards: Array<{ key: string; label: string; value: number | string; detail: string }>;
  charts: Array<{ key: string; title: string; segments: Array<{ label: string; value: number }> }>;
  upNext?: { journey: DashboardTask[]; training: DashboardTask[] };
  recentCompletions?: Array<{ kind: string; title: string; completedAt: string }>;
  roleBreakdown?: Array<{ role: string; users: number }>;
  accountStatus?: { active: number; inactive: number };
  recentActivity?: Array<{ action: string; actor: string; target: string | null; at: string }>;
};

export type DashboardTask = { id: number; title: string; status: string; endDate: string };

export type NewUser = { email: string; displayName: string; password: string; roles: string[] };

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  private api(path: string): string {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    const configured = env?.['VITE_API_BASE_URL'] ?? '/api';
    const localBrowser = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
    return `${localBrowser && configured.startsWith('http://localhost:5001') ? '/api' : configured}${path}`;
  }

  getSummary(): Promise<DashboardSummary> {
    return firstValueFrom(this.http.get<DashboardSummary>(this.api('/v1/dashboard/summary'), { withCredentials: true }));
  }

  getUsers(): Promise<RbacUser[]> {
    return firstValueFrom(this.http.get<RbacUser[]>(this.api('/v1/rbac/users'), { withCredentials: true }));
  }

  replaceRoles(userId: string, roles: string[]): Promise<unknown> {
    return firstValueFrom(this.http.put(this.api(`/v1/rbac/users/${encodeURIComponent(userId)}/roles`), { roles }, {
      withCredentials: true,
      headers: { 'X-CSRF-Token': this.session.csrf },
    }));
  }

  createUser(user: NewUser): Promise<RbacUser> {
    return firstValueFrom(this.http.post<RbacUser>(this.api('/v1/rbac/users'), user, {
      withCredentials: true,
      headers: { 'X-CSRF-Token': this.session.csrf },
    }));
  }

  updateUser(userId: string, updates: { displayName: string; email: string; isActive: boolean }): Promise<RbacUser> {
    return firstValueFrom(this.http.put<RbacUser>(this.api(`/v1/users/${encodeURIComponent(userId)}`), updates, {
      withCredentials: true,
      headers: { 'X-CSRF-Token': this.session.csrf },
    }));
  }
}
