import { describe, expect, it } from 'vitest';
import { resolvePostLoginPath, resolveRootPathForRole } from './resolvePostLoginPath';

describe('resolvePostLoginPath', () => {
  it('sends CLIENT to cabinet workouts', () => {
    expect(resolvePostLoginPath('CLIENT')).toBe('/cabinet/workouts');
  });

  it('sends TRAINER and ADMIN to pool', () => {
    expect(resolvePostLoginPath('TRAINER')).toBe('/pool');
    expect(resolvePostLoginPath('ADMIN')).toBe('/pool');
  });

  it('resolveRootPathForRole matches post-login paths', () => {
    expect(resolveRootPathForRole('CLIENT')).toBe('/cabinet/workouts');
    expect(resolveRootPathForRole('ADMIN')).toBe('/pool');
  });
});
