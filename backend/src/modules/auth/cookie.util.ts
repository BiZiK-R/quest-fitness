import { CookieOptions, Response } from 'express';
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from './auth.constants';

/** Secure вне local/dev (AD-5). */
export function isCookieSecure(): boolean {
  const appEnv = process.env.APP_ENV?.toLowerCase();
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  if (appEnv === 'local' || nodeEnv === 'development') {
    return false;
  }
  return true;
}

function baseSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isCookieSecure(),
  };
}

export function setSessionCookie(res: Response, sessionId: string): void {
  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    ...baseSessionCookieOptions(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, baseSessionCookieOptions());
}

export function setCsrfCookie(res: Response, csrfToken: string): void {
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: isCookieSecure(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearCsrfCookie(res: Response): void {
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: isCookieSecure(),
  });
}
