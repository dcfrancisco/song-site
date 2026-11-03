import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardService, RbacUser } from './dashboard.service';

@Component({ selector: 'app-admin-users', standalone: true, imports: [CommonModule, RouterModule], templateUrl: './admin-users.component.html', styleUrls: ['./admin-users.component.css', './admin-users-overrides.css'] })
export class AdminUsersComponent implements OnInit {
  private readonly service = inject(DashboardService);
  readonly users = signal<RbacUser[]>([]);
  readonly error = signal('');
  readonly query = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly editingId = signal<string | null>(null);
  readonly savingId = signal<string | null>(null);
  readonly showAdd = signal(false);
  readonly creating = signal(false);
  readonly draft = signal({ displayName: '', email: '', isActive: true });
  readonly filteredUsers = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.users().filter(user => {
      const matchesQuery = !query || `${user.displayName} ${user.email} ${user.roles.join(' ')}`.toLowerCase().includes(query);
      const matchesStatus = this.statusFilter() === 'all' || (this.statusFilter() === 'active' ? user.isActive : !user.isActive);
      return matchesQuery && matchesStatus;
    });
  });

  ngOnInit(): void { this.loadUsers(); }
  beginEdit(user: RbacUser): void { this.editingId.set(user.id); this.draft.set({ displayName: user.displayName, email: user.email, isActive: user.isActive }); this.error.set(''); }
  cancelEdit(): void { this.editingId.set(null); }
  saveUser(user: RbacUser): void { this.savingId.set(user.id); this.service.updateUser(user.id, this.draft()).then(updated => { this.users.update(users => users.map(item => item.id === updated.id ? updated : item)); this.editingId.set(null); }).catch(error => this.error.set(error?.status === 409 ? 'That email address is already in use.' : error?.status === 403 ? 'You are not authorized to update users.' : 'User update failed.')).finally(() => this.savingId.set(null)); }
  setDraft(field: 'displayName' | 'email' | 'isActive', value: string | boolean): void { this.draft.update(current => ({ ...current, [field]: value })); }
  createUser(email: string, displayName: string, password: string, role: string): void {
    this.error.set('');
    this.creating.set(true);
    this.service.createUser({ email: email.trim(), displayName: displayName.trim(), password, roles: role ? [role] : [] })
      .then(created => { this.users.update(users => [...users, created]); this.showAdd.set(false); })
      .catch(error => this.error.set(error?.status === 409 ? 'That email address is already in use.' : error?.status === 400 ? (error.error?.error || 'Invalid user details.') : error?.status === 403 ? 'You are not authorized to add users.' : 'User could not be created.'))
      .finally(() => this.creating.set(false));
  }
  private loadUsers(): void { this.service.getUsers().then(users => this.users.set(users)).catch(error => this.error.set(error?.status === 401 ? 'Authentication is required.' : error?.status === 403 ? 'You are not authorized to view user management.' : 'Users could not be loaded.')); }
}
