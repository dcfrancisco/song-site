import { routes } from './app.routes';

describe('application routes', () => {
  const dashboard = routes.find(route => route.path === 'dashboard');
  const dashboardChildren = dashboard?.children?.map(route => route.path);

  it('renders portal pages as children of the authenticated dashboard shell', () => {
    expect(dashboardChildren).toEqual(expect.arrayContaining([
      '',
      'home',
      'song-bench',
      'my-journey',
      'training-tracker',
      'my-cv',
      'my-skills-matrix',
      'my-mycompetency',
      'my-myriro',
      'my-workday',
      'resources',
      'announcement',
      'users',
      'roles',
      'settings',
    ]));
    expect(dashboard?.canActivate).toBeDefined();
  });

  it('redirects legacy page URLs into the dashboard shell', () => {
    const redirects: Array<[string, string]> = [
      ['home', 'dashboard/home'],
      ['song-bench', 'dashboard/song-bench'],
      ['journey', 'dashboard/my-journey'],
      ['my-journey', 'dashboard/my-journey'],
      ['training-tracker', 'dashboard/training-tracker'],
      ['cv', 'dashboard/my-cv'],
      ['my-cv', 'dashboard/my-cv'],
      ['other-links', 'dashboard/resources'],
      ['announcement', 'dashboard/announcement'],
    ];

    for (const [legacyPath, dashboardPath] of redirects) {
      expect(routes.find(route => route.path === legacyPath)?.redirectTo).toBe(dashboardPath);
    }
  });

  it('keeps only sign-in and the dashboard shell as directly rendered root routes', () => {
    expect(routes.filter(route => route.loadComponent).map(route => route.path)).toEqual([
      'signin',
      'dashboard',
    ]);
  });
});
