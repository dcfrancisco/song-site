import { Routes } from '@angular/router';
import { requireSignIn } from './auth/require-sign-in.guard';

const dashboardPages: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./dashboard/admin-users.component').then(m => m.AdminUsersComponent)
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./dashboard/admin-roles.component').then(m => m.AdminRolesComponent)
  },
  {
    path: 'resources',
    loadComponent: () =>
      import('./other-links/other-links').then(m => m.OtherLinks)
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./dashboard/settings.component').then(m => m.SettingsComponent)
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
    path: 'my-cv',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-cv/my-cv').then(m => m.MyCv)
  },
  {
    path: 'my-skills-matrix',
    loadComponent: () =>
      import('./song-bench/my-journey/task/my-skills-matrix/my-skills-matrix').then(m => m.MySkillsMatrix)
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

const legacyRedirects: Routes = [
  { path: 'admin/users', redirectTo: 'dashboard/users', pathMatch: 'full' },
  { path: 'admin/roles', redirectTo: 'dashboard/roles', pathMatch: 'full' },
  { path: 'settings', redirectTo: 'dashboard/settings', pathMatch: 'full' },
  { path: 'home', redirectTo: 'dashboard/home', pathMatch: 'full' },
  { path: 'atcp-song', redirectTo: 'dashboard/atcp-song', pathMatch: 'full' },
  { path: 'atcp-song2', redirectTo: 'dashboard/atcp-song2', pathMatch: 'full' },
  { path: 'song3', redirectTo: 'dashboard/song3', pathMatch: 'full' },
  { path: 'contactus', redirectTo: 'dashboard/contactus', pathMatch: 'full' },
  { path: 'aboutus', redirectTo: 'dashboard/aboutus', pathMatch: 'full' },
  { path: 'announcement', redirectTo: 'dashboard/announcement', pathMatch: 'full' },
  { path: 'song-bench', redirectTo: 'dashboard/song-bench', pathMatch: 'full' },
  { path: 'other-links', redirectTo: 'dashboard/resources', pathMatch: 'full' },
  { path: 'journey', redirectTo: 'dashboard/my-journey', pathMatch: 'full' },
  { path: 'my-journey', redirectTo: 'dashboard/my-journey', pathMatch: 'full' },
  { path: 'training-tracker', redirectTo: 'dashboard/training-tracker', pathMatch: 'full' },
  { path: 'cv', redirectTo: 'dashboard/my-cv', pathMatch: 'full' },
  { path: 'my-cv', redirectTo: 'dashboard/my-cv', pathMatch: 'full' },
  { path: 'skills-matrix', redirectTo: 'dashboard/my-skills-matrix', pathMatch: 'full' },
  { path: 'my-skills-matrix', redirectTo: 'dashboard/my-skills-matrix', pathMatch: 'full' },
  { path: 'mycompetency', redirectTo: 'dashboard/my-mycompetency', pathMatch: 'full' },
  { path: 'my-mycompetency', redirectTo: 'dashboard/my-mycompetency', pathMatch: 'full' },
  { path: 'my-myriro', redirectTo: 'dashboard/my-myriro', pathMatch: 'full' },
  { path: 'my-workday', redirectTo: 'dashboard/my-workday', pathMatch: 'full' },
  { path: 'workday', redirectTo: 'dashboard/my-workday', pathMatch: 'full' },
  { path: 'my-asset-tracker', redirectTo: 'dashboard/my-asset-tracker', pathMatch: 'full' },
  { path: 'my-update-contact', redirectTo: 'dashboard/my-update-contact', pathMatch: 'full' },
  { path: 'people-lead', redirectTo: 'dashboard/people-lead', pathMatch: 'full' },
  { path: 'my-compliance', redirectTo: 'dashboard/my-compliance', pathMatch: 'full' },
  { path: 'wd-update-contact', redirectTo: 'dashboard/wd-update-contact', pathMatch: 'full' },
  { path: 'my-learning-platform', redirectTo: 'dashboard/my-learning-platform', pathMatch: 'full' },
  { path: 'atcp-song-links', redirectTo: 'dashboard/atcp-song-links', pathMatch: 'full' },
  { path: 'navbar', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'footer', redirectTo: 'dashboard', pathMatch: 'full' }
];

const protectedRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard-shell.component').then(m => m.DashboardShellComponent),
    children: dashboardPages
  },
  ...legacyRedirects
];

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'signin'
  },
  {
    path: 'signin',
    loadComponent: () =>
      import('./index/index.component').then(m => m.IndexComponent)
  },
  ...protectedRoutes.map(route =>
    route.redirectTo ? route : { ...route, canActivate: [requireSignIn] }
  ),
  { path: '**', redirectTo: 'signin' },
];
