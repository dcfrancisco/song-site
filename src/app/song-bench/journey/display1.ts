import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../api.config';

interface Item {
  label: string;
  text?: string;
  image?: string;  
  points?: string[];
  sections?: { text: string; points?: string[] }[];
  isExpanded: boolean;

  route?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  lastUpdated?: string;

  highlightCurrentClick?: boolean;
  highlightTopDuePrevClick?: boolean;
  highlightCurrentHover?: boolean;
  highlightTopDuePrevHover?: boolean;
}

@Component({
  selector: 'app-display1',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './display1.html',
  styleUrls: ['./display1.css'],
})
export class Display1Component implements OnInit {

  private readonly journeyItemsUrl = `${API_BASE_URL}/journey/items`;

  constructor(private http: HttpClient, private router: Router)  {}

  // statusOptions = ['Not Started', 'In Progress', 'Blocked', 'Completed'];

  items: Item[] = [
    { label: 'Create CV', 
      text: 'CV Reminder', 
      image: 'assets/images/coe.png',
      isExpanded: false,
      route: '/cv' },
    { label: 'ATCP Song Skills Matrix', 
      text: 'Track 2',
      image: 'assets/images/sustainability.png',
      isExpanded: false,
      route: '/skills-matrix' },
    { label: 'myCompetency', 
      text: 'Add aspiration, experience, and skills', 
      image: 'assets/images/diversity.png',
      isExpanded: false, 
      route: '/mycompetency'},
    { label: 'Update Contact', 
      text: 'Update Contact Details', 
      image: 'assets/images/ai.png',
      isExpanded: false, 
      route: '/update-contact'},
    { label: 'Workday', 
      text: 'Update your Priorities.', 
      image: 'assets/images/ai.png',
      isExpanded: false
    }
  ];

ngOnInit() {
 this.http.get<Item[]>(this.journeyItemsUrl).subscribe({
   next: data => {
     this.items = this.normalizeRoutes(data.map(item => ({
       ...item,
       isExpanded: false,
       highlightCurrentClick: false,
       highlightTopDuePrevClick: false,
       highlightCurrentHover: false,
       highlightTopDuePrevHover: false
     })));
     this.syncWorkdayStatus();
     localStorage.setItem('items', JSON.stringify(this.items));
   },
   error: () => {
     const saved = localStorage.getItem('items');
     if (saved) this.items = this.normalizeRoutes(JSON.parse(saved));
   }
 });
}

private syncWorkdayStatus(): void {
  const workdayRaw = localStorage.getItem('workdayTask');
  if (!workdayRaw) return;

  try {
    const workdayData = JSON.parse(workdayRaw);
    const workdayItem = this.items.find(item => item.label === 'Workday');
    if (workdayItem) {
      workdayItem.status = workdayData.status;
      workdayItem.startDate = workdayData.startDate;
      workdayItem.endDate = workdayData.endDate;
      workdayItem.lastUpdated = workdayData.lastUpdated;
    }
  } catch {
    // silently fail
  }
}

private normalizeRoutes(items: Item[]): Item[] {
  return items.map(item => ({
    ...item,
    route: item.route || this.getDefaultRoute(item.label)
  }));
}

private getDefaultRoute(label: string): string | undefined {
  switch (label) {
    case 'Create CV':
      return '/cv';
    case 'ATCP Song Skills Matrix':
      return '/skills-matrix';
    case 'Workday':
      return '/workday';
    default:
      return undefined;
  }
}

goToPageOnly(item: Item) {
  setTimeout(() => {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }, 5000);
}
goToPage(item: Item) {
 // only set In Progress once
 if (!item.status || item.status === 'Not Started') {
   item.status = 'In Progress';
   // persist immediately
   item.startDate = new Date().toISOString();

   localStorage.setItem('items', JSON.stringify(this.items));
 }
 // delay before redirect
 setTimeout(() => {
   if (item.route) {
     this.router.navigate([item.route]);
   }
 }, 5000);
}

startItem(item: Item) {
  if (!item.status || item.status === 'Not Started') {
    const now = new Date().toISOString();

    item.status = 'In Progress';
    item.startDate = now;
    item.lastUpdated = now;

    localStorage.setItem('items', JSON.stringify(this.items));
    }

  setTimeout(() => {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }, 5000);
}
  // Toggle click highlight and expansion
    toggle(index: number) {
    if (!this.items || !this.items[index]) return;
    this.items.forEach(item => {
      item.highlightCurrentClick = false;
      item.highlightTopDuePrevClick = false;
    });
    this.items[index].highlightCurrentClick = true;
    if (index + 1 < this.items.length) {
    this.items[index + 1].highlightTopDuePrevClick = true;
    }
    this.items.forEach((item, i) => {
    item.isExpanded = i === index ? !item.isExpanded : false;
    });
  }

    hover(index: number) {
      if (!this.items || !this.items[index]) return;
      this.items.forEach(item => {
        item.highlightCurrentHover = false;
        item.highlightTopDuePrevHover = false;
      });
      this.items[index].highlightCurrentHover = true;
      if (index + 1 < this.items.length) {
      this.items[index + 1].highlightTopDuePrevHover = true;
    }
  }

  leaveHover() {
    this.items.forEach(item => {
      item.highlightCurrentHover = false;
      item.highlightTopDuePrevHover = false;
    });
  }

  openWorkdayGuidelines(): void {
    const workdayItem = this.items.find(item => item.label === 'Workday');
    if (workdayItem) {
      if (!workdayItem.status || workdayItem.status === 'Not Started') {
        workdayItem.status = 'In Progress';
        workdayItem.startDate = new Date().toISOString();
        localStorage.setItem('items', JSON.stringify(this.items));
      }
    }
    const url = `${window.location.origin}/workday`;
    window.open(url, '_blank');
  }

  hasActiveOrHover(): boolean {
  return this.items.some(item =>
    item.highlightCurrentClick || item.highlightCurrentHover
  );
}

formatDateSmart(dateStr?: string): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString();
}

getDuration(start?: string, end?: string): string {
  if (!start || !end) return '';

  const diff = new Date(end).getTime() - new Date(start).getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
}
