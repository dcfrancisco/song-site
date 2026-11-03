import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { SessionInfo, SessionService } from '../auth/session.service';
import { provideTestRouter } from '../../testing/test-providers';
import { IndexComponent } from './index.component';

describe('IndexComponent', () => {
  let fixture: ComponentFixture<IndexComponent>;
  let authService: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    displayName: ReturnType<typeof vi.fn>;
    isBusy: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    initialize: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
  };
  const sessionState = signal<SessionInfo>({ mode: 'guest', authenticated: false, identity: null });
  const sessionLogin = vi.fn();

  beforeEach(async () => {
    sessionLogin.mockReset();
    sessionLogin.mockResolvedValue(undefined);
    sessionState.set({ mode: 'guest', authenticated: false, identity: null });
    authService = {
      isAuthenticated: vi.fn(() => false),
      displayName: vi.fn(() => 'Guest'),
      isBusy: vi.fn(() => false),
      error: vi.fn(() => null),
      initialize: vi.fn(() => Promise.resolve()),
      login: vi.fn(() => Promise.resolve()),
    };

    await TestBed.configureTestingModule({
      imports: [IndexComponent],
      providers: [
        provideTestRouter(),
        { provide: AuthService, useValue: authService },
        {
          provide: SessionService,
          useValue: { session: sessionState.asReadonly(), refresh: () => Promise.resolve(), login: sessionLogin },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IndexComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('offers SSO and an email/password form without exposing role selectors', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Sign in with Microsoft SSO');
    expect(text).toContain('Sign in with email');
    expect(text).not.toContain('Local Administrator');
    expect(text).not.toContain('Local Author');
    expect(fixture.nativeElement.querySelector('#email-address')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#password').type).toBe('password');
    expect(fixture.nativeElement.querySelector('.email-sign-in .secondary-action').disabled).toBe(false);
  });

  it('signs in with email and password and shows a generic error on failure', async () => {
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await component.signInWithPassword(' user@example.com ', 'secret');
    expect(sessionLogin).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(navigate).toHaveBeenCalledWith('/home');

    sessionLogin.mockRejectedValueOnce({ status: 401 });
    await component.signInWithPassword('user@example.com', 'wrong');
    expect(component.emailError()).toBe('Invalid email or password.');
  });

  it('starts the Microsoft SSO flow from its sign-in button', () => {
    const button = fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement;
    button.click();
    expect(authService.login).toHaveBeenCalledOnce();
  });

  it('keeps an already authenticated local development identity on sign-in until it continues', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl');
    sessionState.set({
      mode: 'development',
      authenticated: true,
      identity: { displayName: 'Local Administrator', role: 'administrator', permissions: [] },
    });

    fixture = TestBed.createComponent(IndexComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(navigate).not.toHaveBeenCalled();

    (fixture.nativeElement.querySelector('.continue-action') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith('/home');
  });
});
