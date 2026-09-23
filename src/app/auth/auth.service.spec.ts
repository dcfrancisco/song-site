import { resolveRedirectUri } from './auth.service';

describe('resolveRedirectUri', () => {
  it('prefers the configured env redirect URI when one is set', () => {
    const result = resolveRedirectUri({
      VITE_AZURE_REDIRECT_URI: 'https://example.com/song-site/',
    } as ImportMetaEnv);

    expect(result).toBe('https://example.com/song-site/');
  });

  it('uses the current origin and pathname when no env override exists', () => {
    const result = resolveRedirectUri({} as ImportMetaEnv, 'https://example.com/song-site/index.html');

    expect(result).toBe('https://example.com/song-site/');
  });

  it('ignores localhost env override when hosted on a non-localhost origin', () => {
    const result = resolveRedirectUri(
      {
        VITE_AZURE_REDIRECT_URI: 'http://localhost:4200/',
      } as ImportMetaEnv,
      'https://jestoni-baguio.github.io/song-site/index.html',
    );

    expect(result).toBe('https://jestoni-baguio.github.io/song-site/');
  });

  it('falls back to localhost when nothing is available', () => {
    const result = resolveRedirectUri({} as ImportMetaEnv, 'not a valid url');

    expect(result).toBe('http://localhost:4200/');
  });
});
