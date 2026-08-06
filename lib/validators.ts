import type { StatsQueryParams } from './types';

export function validateAndSanitizeParams(params: any): StatsQueryParams {
  const username = (params.username || '').trim();

  if (!username || username.length === 0) {
    throw new Error('Username is required');
  }

  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
    throw new Error('Invalid username format');
  }

  if (username.length > 39) {
    throw new Error('Username too long');
  }

  return {
    username,
    theme: (params.theme || 'dark').toLowerCase().slice(0, 20),
    bg_color: sanitizeHexColor(params.bg_color),
    text_color: sanitizeHexColor(params.text_color),
    accent_color: sanitizeHexColor(params.accent_color),
    hide: (params.hide || '').toLowerCase().slice(0, 50),
    lang: (params.lang || 'en').toLowerCase().slice(0, 5),
    refresh: params.refresh === '1' || params.refresh === 'true' ? '1' : undefined,
  };
}

function sanitizeHexColor(color?: string): string | undefined {
  if (!color) return undefined;

  const cleaned = color.replace(/^#/, '').slice(0, 6).toLowerCase();

  if (/^[0-9a-f]{6}$/.test(cleaned)) {
    return cleaned;
  }

  return undefined;
}
