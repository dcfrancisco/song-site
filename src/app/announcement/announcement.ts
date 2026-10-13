import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from "../navbar/navbar";
import { Footer } from "../footer/footer";
import { AnnouncementPageContent, AnnouncementService } from './announcement.service';
import { SessionService } from '../auth/session.service';
import { AnnouncementEditorComponent } from './announcement-editor.component';

@Component({
  selector: 'app-announcement',
  standalone: true,
  imports: [RouterModule, CommonModule, Navbar, Footer, AnnouncementEditorComponent],
  templateUrl: './announcement.html',
  styleUrls: ['./announcement.css']
})
export class Announcement implements OnInit, OnDestroy {

  activeIndex = 0;
  autoSlideInterval: any;
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly content = signal<AnnouncementPageContent | null>(null);
  readonly editing = signal(false);
  private readonly sessionService = inject(SessionService);
  readonly session = this.sessionService.session;
  readonly canEdit = () => this.session().identity?.permissions.includes('content:announcement-page:edit') ?? false;

  constructor(private readonly announcementService: AnnouncementService) {}

  get certificates() { return this.content()?.carousel ?? []; }
  get trainings() { return this.content()?.trainings ?? []; }

  ngOnInit(): void {
    void this.sessionService.refresh().catch(() => undefined);
    void this.announcementService.getPublished().then(value => { this.content.set(value); this.loading.set(false); this.startAutoSlide(); }).catch(() => { this.loadError.set('Announcements are temporarily unavailable.'); this.loading.set(false); });
    this.startAutoSlide();
  }

  openEditor(): void { this.editing.set(true); }
  closeEditor(): void { this.editing.set(false); void this.announcementService.getPublished().then(value => this.content.set(value)); }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => {
      this.next();
    }, 3000);
  }

  stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  next(): void {
    if (!this.certificates.length) return;
    this.activeIndex = (this.activeIndex + 1) % this.certificates.length;
  }

  prev(): void {
    if (!this.certificates.length) return;
    this.activeIndex =
      (this.activeIndex - 1 + this.certificates.length) % this.certificates.length;
  }

  setIndex(index: number): void {
    if (!this.certificates.length) return;
    this.activeIndex = index;
  }

  getCardClass(index: number): string {
    if (index === this.activeIndex) return 'center';

    const prevIndex =
      (this.activeIndex - 1 + this.certificates.length) % this.certificates.length;
    const nextIndex =
      (this.activeIndex + 1) % this.certificates.length;

    if (index === prevIndex) return 'left';
    if (index === nextIndex) return 'right';

    return 'hidden';
  }
}
