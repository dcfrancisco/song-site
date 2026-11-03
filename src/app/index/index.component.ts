import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent implements OnInit {
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly displayName = computed(() => this.authService.displayName());
  readonly isBusy = computed(() => this.authService.isBusy());
  private readonly sessionError = signal<string | null>(null);
  readonly error = computed(() => this.sessionError() ?? this.authService.error());
  private readonly sessionService = inject(SessionService);
  readonly session = this.sessionService.session;

  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.has('sessionUnavailable')) {
      this.sessionError.set('Unable to verify your portal session. Please try again.');
    }
    void this.initializeAccess();
  }

  readonly emailError = signal<string | null>(null);
  readonly emailBusy = signal(false);

  async signInWithPassword(email: string, password: string): Promise<void> {
    this.emailError.set(null);
    this.sessionError.set(null);
    this.emailBusy.set(true);
    try {
      await this.sessionService.login(email.trim(), password);
      this.goToDashboard();
    } catch (error) {
      const status = (error as { status?: number })?.status;
      this.emailError.set(status === 429 ? 'Too many failed attempts. Try again later.' : status === 401 ? 'Invalid email or password.' : 'Sign-in failed. Please try again.');
    } finally {
      this.emailBusy.set(false);
    }
  }

  signIn(): void {
    this.sessionError.set(null);
    void this.authService.login();
  }

  private async initializeAccess(): Promise<void> {
    try {
      await this.sessionService.refresh();
    } catch {
      this.sessionError.set('Unable to verify your portal session. Please try again.');
      return;
    }

    await this.authService.initialize();
    if (this.session().authenticated && this.session().mode !== 'development') {
      void this.goToDashboard();
    } else if (this.authService.isAuthenticated()) {
      this.sessionError.set('Microsoft sign-in succeeded, but portal access is not available until backend identity verification is configured.');
    }
  }

  goToDashboard(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const destination =
      returnUrl?.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/signin')
        ? returnUrl
        : '/home';
    void this.router.navigateByUrl(destination);
  }
}
