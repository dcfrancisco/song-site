import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AtcpSongService } from './services/atcp-song.service';
import { LeadershipData } from './models/atcp-song.model';
import { Header } from './header/header';
import { OfferingsTable } from './offerings-table/offerings-table';
import { EnablementChampions } from './enablement-champions/enablement-champions';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-atcp-song',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, Header, OfferingsTable, EnablementChampions],
  templateUrl: './atcp-song.html',
  styleUrl: './atcp-song.css'
})
export class AtcpSong implements OnInit {
  private readonly atcpSongService = inject(AtcpSongService);

  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);
  readonly data    = signal<LeadershipData | null>(null);

  ngOnInit(): void {
    this.atcpSongService.getData().subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load leadership data:', err);
        this.error.set('Could not load data. Please ensure the backend is configured and running.');
        this.loading.set(false);
      }
    });
  }
}
