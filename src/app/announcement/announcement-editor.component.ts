import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AnnouncementPageContent, AnnouncementService, ContentVersion } from './announcement.service';
import { SessionService } from '../auth/session.service';

function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }

@Component({
  selector: 'app-announcement-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './announcement-editor.component.html',
  styleUrls: ['./announcement-editor.component.css'],
})
export class AnnouncementEditorComponent implements OnInit {
  private readonly service = inject(AnnouncementService);
  private readonly sessionService = inject(SessionService);
  readonly session = this.sessionService.session;
  readonly canPublish = computed(() => this.session().identity?.permissions.includes('content:announcement-page:publish') ?? false);
  readonly draft = signal<AnnouncementPageContent | null>(null);
  readonly versions = signal<ContentVersion[]>([]);
  readonly version = signal(0);
  readonly loading = signal(false);
  readonly dirty = signal(false);
  readonly previewing = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  @Output() readonly cancel = new EventEmitter<void>();

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try {
      const [draft, versions] = await Promise.all([this.service.getDraft(), this.service.getVersions()]);
      this.versions.set(versions);
      const source = draft ?? versions.find(item => item.state === 'published');
      if (source) { this.draft.set(copy(source.payload)); this.version.set(source.version); }
      this.message.set(draft ? `Editing draft v${draft.version}` : 'Editing a new draft from the published content');
    } catch (error) { this.setError(error); } finally { this.loading.set(false); }
  }

  markDirty(): void { this.dirty.set(true); this.message.set('Unsaved changes'); }
  addCarousel(): void { this.draft()!.carousel.push({ id: crypto.randomUUID(), name: '', image: '', body: 'Certified Full Stack Developer', order: this.draft()!.carousel.length }); this.markDirty(); }
  addTraining(): void { this.draft()!.trainings.push({ id: crypto.randomUUID(), title: '', description: '', link: '', linkLabel: '', order: this.draft()!.trainings.length }); this.markDirty(); }
  addNotice(): void { this.draft()!.notices.push({ id: crypto.randomUUID(), title: '', body: '', order: this.draft()!.notices.length }); this.markDirty(); }
  remove(list: 'carousel' | 'trainings' | 'notices', index: number): void { this.draft()![list].splice(index, 1); this.renumber(list); this.markDirty(); }
  move(list: 'carousel' | 'trainings' | 'notices', index: number, direction: -1 | 1): void { const items = this.draft()![list]; const next = index + direction; if (next < 0 || next >= items.length) return; [items[index], items[next]] = [items[next], items[index]]; this.renumber(list); this.markDirty(); }
  private renumber(list: 'carousel' | 'trainings' | 'notices'): void { this.draft()![list].forEach((item, index) => item.order = index); }

  async save(): Promise<void> { if (!this.draft()) return; await this.run(async () => { const result = await this.service.saveDraft(this.draft()!, this.version()); this.draft.set(copy(result.payload)); this.version.set(result.version); this.dirty.set(false); this.message.set(`Draft saved as v${result.version}`); await this.refreshVersions(); }); }
  async preview(): Promise<void> { if (!this.draft()) return; await this.run(async () => { await this.service.preview(this.draft()!); this.previewing.set(true); this.message.set('Preview validated. This content is not published.'); }); }
  async publish(): Promise<void> { if (!this.draft() || this.dirty() || !this.canPublish()) return; await this.run(async () => { const result = await this.service.publish(this.version()); this.version.set(result.version); this.draft.set(copy(result.payload)); this.message.set(`Published v${result.version}`); await this.refreshVersions(); }); }
  async discard(): Promise<void> { if (!confirm('Discard the saved draft? Published history will remain available.')) return; await this.run(async () => { await this.service.discard(this.version()); this.previewing.set(false); this.dirty.set(false); this.message.set('Draft discarded.'); await this.load(); }); }
  async restore(item: ContentVersion): Promise<void> { if (!confirm(`Restore version ${item.version} as a new draft?`)) return; await this.run(async () => { const result = await this.service.restore(item.id, this.version()); this.draft.set(copy(result.payload)); this.version.set(result.version); this.dirty.set(false); this.message.set(`Restored v${item.version} as draft v${result.version}`); await this.refreshVersions(); }); }
  close(): void { if (this.dirty() && !confirm('Discard unsaved browser changes?')) return; this.cancel.emit(); }

  private async refreshVersions(): Promise<void> { this.versions.set(await this.service.getVersions()); }
  private async run(action: () => Promise<void>): Promise<void> { this.error.set(''); this.loading.set(true); try { await action(); } catch (error) { this.setError(error); } finally { this.loading.set(false); } }
  private setError(error: unknown): void { const response = error as HttpErrorResponse; const details = response?.error?.errors; this.error.set(Array.isArray(details) ? details.join(' ') : response?.status === 409 ? 'This draft changed elsewhere. Reload the current version before saving.' : response?.status === 403 ? 'Your current identity is not allowed to perform that action.' : 'The authoring operation failed.'); }
}
