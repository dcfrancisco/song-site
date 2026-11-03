import { Component, ViewChild, ElementRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  isSearchOpen = false;
  isProfileOpen = false;
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  readonly session = this.sessionService.session;
  readonly isAuthenticated = computed(() => this.session().authenticated);
  readonly displayName = computed(() => this.session().identity?.displayName ?? 'Guest');
  readonly userEmail = computed(() => this.session().identity?.email ?? '');
  readonly userInitials = computed(() => this.getInitials(this.displayName()));
  readonly logoutError = signal<string | null>(null);

  @ViewChild('searchInput') searchInput!: ElementRef;

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      setTimeout(() => this.searchInput.nativeElement.focus(), 150);
    }
  }

  toggleProfile(): void {
    this.isProfileOpen = !this.isProfileOpen;
  }

  async logout(): Promise<void> {
    this.isProfileOpen = false;
    this.logoutError.set(null);

    try {
      if (this.session().mode === 'development' || this.session().mode === 'local') {
        await this.sessionService.endDevelopmentSession();
        await this.router.navigateByUrl('/signin');
        return;
      }

      await this.authService.logout();
    } catch (error) {
      this.logoutError.set(error instanceof Error ? error.message : 'Unable to sign out. Please try again.');
    }
  }

  private getInitials(fullName: string): string {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() ?? 'G';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
