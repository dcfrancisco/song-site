import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardService, DashboardSummary, DashboardTask } from './dashboard.service';
import { SessionService } from '../auth/session.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly sessionService = inject(SessionService);
  readonly session = this.sessionService.session;
  readonly summary = signal<DashboardSummary | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    this.loadSummary();
  }

  isVisible(item: { adminOnly?: boolean }): boolean {
    return !item.adminOnly || this.session().identity?.permissions.includes('rbac:users:read') === true;
  }

  segmentWidth(value: number, segments: Array<{ value: number }>): string {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    return `${total ? Math.round((value / total) * 100) : 0}%`;
  }

  // Progress ring: percentage of the named card ("journey-progress" / "training-progress")
  percent(key: string): number {
    const card = this.summary()?.cards.find(item => item.key === key);
    return card ? parseInt(String(card.value), 10) || 0 : 0;
  }

  ringStyle(key: string): string {
    return `conic-gradient(var(--purple) ${this.percent(key) * 3.6}deg, #e8e0f0 0)`;
  }

  roleShare(users: number): string {
    const max = Math.max(1, ...(this.summary()?.roleBreakdown || []).map(item => item.users));
    return `${Math.round((users / max) * 100)}%`;
  }

  actionLabel(action: string): string {
    return action.replace(/_/g, ' ').replace(/^\w/, char => char.toUpperCase());
  }

  tracks(data: DashboardSummary): Array<{ key: string; title: string; tasks: DashboardTask[] }> {
    return [
      { key: 'journey-progress', title: 'Journey', tasks: data.upNext?.journey || [] },
      { key: 'training-progress', title: 'Training', tasks: data.upNext?.training || [] },
    ];
  }

  detail(key: string): string {
    return this.summary()?.cards.find(item => item.key === key)?.detail || '';
  }

  private loadSummary(): void {
    this.dashboard.getSummary().then(value => this.summary.set(value)).catch(error => {
      this.error.set('Dashboard data is currently unavailable.');
    });
  }
}
