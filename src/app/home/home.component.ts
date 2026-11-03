import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { AuthService } from '../auth/auth.service';
import { HomeService, SpotlightData, Announcement } from './home.service';

const CAROUSEL_INTERVAL_MS = 5000;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, Navbar, Footer],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  spotlight = signal<SpotlightData | null>(null);
  announcements = signal<Announcement[]>([]);
  selectedIndex = signal(0);

  private carouselTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private homeService: HomeService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    void this.authService.initialize();

    this.homeService.getSpotlight().subscribe((data) => {
      this.spotlight.set(data);
      if (data && data.persons.length > 1) {
        this.startCarousel();
      }
    });
    this.homeService.getAnnouncements().subscribe((data) => this.announcements.set(data));
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  selectPerson(index: number): void {
    this.selectedIndex.set(index);
    this.restartCarousel();
  }

  private startCarousel(): void {
    this.carouselTimer = setInterval(() => {
      const persons = this.spotlight()?.persons;
      if (!persons) return;
      this.selectedIndex.update((i) => (i + 1) % persons.length);
    }, CAROUSEL_INTERVAL_MS);
  }

  private stopCarousel(): void {
    if (this.carouselTimer !== null) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  }

  private restartCarousel(): void {
    this.stopCarousel();
    const persons = this.spotlight()?.persons;
    if (persons && persons.length > 1) {
      this.startCarousel();
    }
  }
}
