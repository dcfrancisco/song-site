import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./index/index.component').then(m => m.IndexComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'atcp-song',
    loadComponent: () =>
      import('./atcp-song/atcp-song').then(m => m.AtcpSong)
  },
  {
    path: 'atcp-song2',
    loadComponent: () =>
      import('./atcp-song2/atcp-song2').then(m => m.AtcpSong2)
  },
  {
    path: 'song3',
    loadComponent: () =>
      import('./song3/song3').then(m => m.Song3)
  },
  {
    path: 'contactus',
    loadComponent: () =>
      import('./contactus/contactus').then(m => m.Contactus)
  },
  {
    path: 'aboutus',
    loadComponent: () =>
      import('./aboutus/aboutus').then(m => m.AboutusComponent)
  },
  {
    path: 'announcement',
    loadComponent: () =>
      import('./announcement/announcement').then(m => m.Announcement)
  },
  {
    path: 'song-bench',
    loadComponent: () =>
      import('./song-bench/song-bench').then(m => m.SongBench)
  },
  {
    path: 'other-links',
    loadComponent: () =>
      import('./other-links/other-links').then(m => m.OtherLinks)
  },
  {
    path: 'journey',
    redirectTo: 'my-journey',
    pathMatch: 'full'
  },
  {
    path: 'my-journey',
    loadComponent: () =>
      import('./song-bench/my-journey/my-journey.component').then(m => m.MyJourneyComponent)
  },
  {
    path: 'training-tracker',
    loadComponent: () =>
      import('./song-bench/training-tracker/training-tracker').then(m => m.TrainingTracker)
  },
  {
    path: 'cv',
    redirectTo: 'my-cv',
    pathMatch: 'full'
  },
  {
    path: 'my-cv',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-cv/my-cv').then(m => m.MyCv)
  },
  {
    path: 'skills-matrix',
    redirectTo: 'my-skills-matrix',
    pathMatch: 'full'
  },
  {
    path: 'my-skills-matrix',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-skills-matrix/my-skills-matrix').then(m => m.MySkillsMatrix)
  },
  {
    path: 'mycompetency',
    redirectTo: 'my-mycompetency',
    pathMatch: 'full'
  },
  {
    path: 'my-mycompetency',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-mycompetency/my-mycompetency').then(m => m.MyMyCompetency)
  },
  {
    path: 'my-myriro',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-riro/my-myriro').then(m => m.MyMyRiro)
  },
  {
    path: 'my-workday',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-workday/my-workday').then(m => m.MyWorkday)
  },
  {
    path: 'workday',
    redirectTo: 'my-workday',
    pathMatch: 'full'
  },
  {
    path: 'navbar',
    loadComponent: () =>
      import('./navbar/navbar').then(m => m.Navbar)
  },
  {
    path: 'footer',
    loadComponent: () =>
      import('./footer/footer').then(m => m.Footer)
  },
  {
    path: 'my-asset-tracker',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-asset-tracker/my-asset-tracker').then(m => m.MyAssetTracker)
  },
  {
    path: 'my-update-contact',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-update-contact/my-update-contact').then(m => m.MyUpdateContact)
  },
  {
    path: 'people-lead',
    loadComponent: () =>
      import('./song-bench/my-journey/task/people-lead/people-lead').then(m => m.PeopleLead)
  },
  {
    path: 'my-compliance',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-compliance/my-compliance').then(m => m.MyCompliance)
  },
  {
    path: 'wd-update-contact',
    loadComponent: () =>
      import('./song-bench/my-journey/task/wd-update-contact/wd-update-contact').then(m => m.WDUpdateContact)
  },
  {
    path: 'my-learning-platform',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-learning-platform/my-learning-platform').then(m => m.MyLearningPlatform)
  },
  {
    path: 'atcp-song-links',
    loadComponent: () =>
      import('./atcp-song-links/atcp-song-links').then(m => m.AtcpSongLinks)
  }
];
