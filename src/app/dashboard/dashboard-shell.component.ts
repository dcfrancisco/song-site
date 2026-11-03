import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SessionService } from '../auth/session.service';

type NavItem = { label: string; glyph: string; route: string; exact?: boolean; adminOnly?: boolean };
type NavSection = { label: string; items: NavItem[] };

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

  readonly navSections: NavSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', glyph: '⌂', route: '/dashboard', exact: true },
        { label: 'Home', glyph: '⌂', route: '/dashboard/home' },
      ],
    },
    {
      label: 'Tools',
      items: [
        { label: 'Song Bench', glyph: '♫', route: '/dashboard/song-bench' },
        { label: 'Journey', glyph: '➜', route: '/dashboard/my-journey' },
        { label: 'Training Tracker', glyph: '▦', route: '/dashboard/training-tracker' },
        { label: 'My CV', glyph: '▤', route: '/dashboard/my-cv' },
        { label: 'Skills Matrix', glyph: '◇', route: '/dashboard/my-skills-matrix' },
        { label: 'My Competency', glyph: '◎', route: '/dashboard/my-mycompetency' },
        { label: 'My RIRO', glyph: '◉', route: '/dashboard/my-myriro' },
        { label: 'My Workday', glyph: '◷', route: '/dashboard/my-workday' },
        { label: 'Asset Tracker', glyph: '▣', route: '/dashboard/my-asset-tracker' },
        { label: 'Update Contact', glyph: '♙', route: '/dashboard/my-update-contact' },
        { label: 'People Lead', glyph: '♧', route: '/dashboard/people-lead' },
        { label: 'Compliance', glyph: '✓', route: '/dashboard/my-compliance' },
        { label: 'Learning Platform', glyph: '▥', route: '/dashboard/my-learning-platform' },
        { label: 'Resources', glyph: '▧', route: '/dashboard/resources' },
      ],
    },
    {
      label: 'Site',
      items: [
        { label: 'Announcements', glyph: '◉', route: '/dashboard/announcement' },
        { label: 'About', glyph: 'ⓘ', route: '/dashboard/aboutus' },
        { label: 'Contact', glyph: '✉', route: '/dashboard/contactus' },
        { label: 'ATCP Song Links', glyph: '↗', route: '/dashboard/atcp-song-links' },
        { label: 'ATCP Song', glyph: '♫', route: '/dashboard/atcp-song' },
        { label: 'ATCP Song 2', glyph: '♫', route: '/dashboard/atcp-song2' },
        { label: 'Song 3', glyph: '♫', route: '/dashboard/song3' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'User Management', glyph: '♙', route: '/dashboard/users', adminOnly: true },
        { label: 'Roles', glyph: '◇', route: '/dashboard/roles', adminOnly: true },
      ],
    },
    {
      label: 'Preferences',
      items: [
        { label: 'Settings', glyph: '⚙', route: '/dashboard/settings' },
      ],
    },
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
