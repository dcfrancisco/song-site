import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SessionService } from '../auth/session.service';

type NavItem = { label: string; glyph: string; route: string; exact?: boolean; adminOnly?: boolean };

const SIDEBAR_KEY = 'song-site.dashboard.sidebar';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.css',
})
export class DashboardShellComponent implements OnInit {
  private readonly sessionService = inject(SessionService);
  readonly session = this.sessionService.session;
  readonly collapsed = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', glyph: '⌂', route: '/dashboard', exact: true },
    { label: 'User Management', glyph: '♙', route: '/dashboard/users', adminOnly: true },
    { label: 'Roles', glyph: '◇', route: '/dashboard/roles', adminOnly: true },
    { label: 'Resources', glyph: '▤', route: '/dashboard/resources' },
    { label: 'Settings', glyph: '⚙', route: '/dashboard/settings' },
    { label: 'Back to site', glyph: '↩', route: '/home' },
  ];

  ngOnInit(): void {
    this.collapsed.set(localStorage.getItem(SIDEBAR_KEY) === 'collapsed');
    void this.sessionService.refresh().catch(() => undefined);
  }

  toggleSidebar(): void {
    this.collapsed.update(value => !value);
    localStorage.setItem(SIDEBAR_KEY, this.collapsed() ? 'collapsed' : 'expanded');
  }

  isVisible(item: NavItem): boolean {
    return !item.adminOnly || this.session().identity?.permissions.includes('rbac:users:read') === true;
  }
}
