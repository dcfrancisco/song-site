import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SessionService } from '../auth/session.service';

@Component({ selector: 'app-settings', standalone: true, imports: [CommonModule, RouterModule], templateUrl: './settings.component.html', styleUrl: './admin-users.component.css' })
export class SettingsComponent {
  private readonly sessionService = inject(SessionService);
  readonly session = this.sessionService.session;
  readonly message = signal('');
  readonly failed = signal(false);
  readonly busy = signal(false);

  async changePassword(current: string, next: string, confirm: string): Promise<void> {
    this.failed.set(true);
    if (next !== confirm) { this.message.set('New passwords do not match.'); return; }
    this.busy.set(true);
    try {
      await this.sessionService.changePassword(current, next);
      this.failed.set(false);
      this.message.set('Password changed.');
    } catch (error) {
      this.message.set((error as { error?: { error?: string } })?.error?.error || 'Password could not be changed.');
    } finally {
      this.busy.set(false);
    }
  }
}
