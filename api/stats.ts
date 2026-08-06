import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchGitHubStats } from '../lib/github';
import { getCachedStats, setCachedStats } from '../lib/cache';
import { getTheme } from '../lib/themes';
import { generateStatsCard, generateErrorCard } from '../lib/svg-generator';
import { validateAndSanitizeParams } from '../lib/validators';

const CACHE_TTL_SECONDS = 24 * 60 * 60 * 1000;

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimits: RateLimitStore = {};

function checkRateLimit(ip: string, limit: number = 30, window: number = 60000): boolean {
  const now = Date.now();
  const key = ip;

  if (!rateLimits[key]) {
    rateLimits[key] = { count: 0, resetTime: now + window };
  }

  const entry = rateLimits[key];

  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + window;
  }

  entry.count++;

  return entry.count <= limit;
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientIp = getClientIp(req);

  if (!checkRateLimit(clientIp, 30, 60000)) {
    const svg = generateErrorCard('Rate limit exceeded. Try again in 1 minute.', {
      name: 'dark',
      backgroundColor: '#0d1117',
      textColor: '#c9d1d9',
      accentColor: '#ff6b6b',
      borderColor: '#30363d',
      successColor: '#3fb950',
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.send(svg);
  }

  try {
    const params = validateAndSanitizeParams(req.query);
    const theme = getTheme(params.theme, params.bg_color, params.text_color);

    let stats = null;

    if (!params.refresh) {
      stats = getCachedStats(params.username);
    }

    if (!stats) {
      stats = await fetchGitHubStats(params.username);
      setCachedStats(stats, CACHE_TTL_SECONDS);
    }

    const svg = generateStatsCard(stats, theme);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Cache', stats ? 'HIT' : 'MISS');

    return res.send(svg);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    const theme = {
      name: 'dark',
      backgroundColor: '#0d1117',
      textColor: '#c9d1d9',
      accentColor: '#ff6b6b',
      borderColor: '#30363d',
      successColor: '#3fb950',
    };

    const svg = generateErrorCard(message, theme);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=300');

    return res.send(svg);
  }
}
