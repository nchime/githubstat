import type { GitHubUserStats, Theme } from './types';

const CARD_WIDTH = 400;
const CARD_HEIGHT = 270;
const PADDING = 20;
const ROW_HEIGHT = 30;

export function generateStatsCard(stats: GitHubUserStats, theme: Theme): string {
  const rows = [
    { label: '📊 Total Contributions', value: formatNumber(stats.totalContributions) },
    { label: '🔄 Commits', value: formatNumber(stats.totalCommitContributions) },
    { label: '📝 Pull Requests', value: formatNumber(stats.totalPullRequestContributions) },
    { label: '🐛 Issues', value: formatNumber(stats.totalIssueContributions) },
    { label: '💬 PR Reviews', value: formatNumber(stats.totalPullRequestReviewContributions) },
    { label: '📦 Repositories', value: formatNumber(stats.totalRepositories) },
    { label: '⭐ Stars Earned', value: formatNumber(stats.repositoryStars) },
    { label: '📈 Last Year', value: formatNumber(stats.lastYearContributions) },
  ];

  const cardHeight = CARD_HEIGHT + rows.length * ROW_HEIGHT;

  return `
<svg width="${CARD_WIDTH}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      .card-bg { fill: ${theme.backgroundColor}; }
      .card-border { stroke: ${theme.borderColor}; stroke-width: 2; }
      .title-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 18px; font-weight: 600; fill: ${theme.accentColor}; }
      .label-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; fill: ${theme.textColor}; }
      .value-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; font-weight: 500; fill: ${theme.successColor}; text-anchor: end; }
    </style>
  </defs>

  <rect class="card-bg" x="0" y="0" width="${CARD_WIDTH}" height="${cardHeight}" rx="8" ry="8" class="card-border" />
  <rect class="card-border" x="0" y="0" width="${CARD_WIDTH}" height="${cardHeight}" rx="8" ry="8" fill="none" />

  <text class="title-text" x="${PADDING}" y="40">
    📈 GitHub Stats - ${escapeXml(stats.username)}
  </text>

  <line x1="${PADDING}" y1="50" x2="${CARD_WIDTH - PADDING}" y2="50" stroke="${theme.borderColor}" stroke-width="1" opacity="0.3" />

  ${rows
    .map((row, index) => {
      const y = 70 + index * ROW_HEIGHT;
      return `
    <text class="label-text" x="${PADDING}" y="${y}">
      ${row.label}
    </text>
    <text class="value-text" x="${CARD_WIDTH - PADDING}" y="${y}">
      ${row.value}
    </text>
      `.trim();
    })
    .join('\n  ')}

  <line x1="${PADDING}" y1="${70 + rows.length * ROW_HEIGHT + 5}" x2="${CARD_WIDTH - PADDING}" y2="${70 + rows.length * ROW_HEIGHT + 5}" stroke="${theme.borderColor}" stroke-width="1" opacity="0.3" />

  <text style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.textColor}; opacity: 0.6;" x="${PADDING}" y="${cardHeight - 10}">
    Updated: ${formatDate(stats.fetchedAt)}
  </text>
</svg>
  `.trim();
}

export function generateErrorCard(message: string, theme: Theme): string {
  return `
<svg width="${CARD_WIDTH}" height="150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .error-bg { fill: ${theme.backgroundColor}; }
      .error-border { stroke: ${theme.borderColor}; stroke-width: 2; }
      .error-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; fill: ${theme.textColor}; text-anchor: middle; }
    </style>
  </defs>

  <rect class="error-bg" x="0" y="0" width="${CARD_WIDTH}" height="150" rx="8" ry="8" class="error-border" />
  <rect class="error-border" x="0" y="0" width="${CARD_WIDTH}" height="150" rx="8" ry="8" fill="none" />

  <text class="error-text" x="${CARD_WIDTH / 2}" y="50">
    ⚠️ GitHub Stats
  </text>

  <text class="error-text" x="${CARD_WIDTH / 2}" y="85" style="font-size: 13px;">
    ${escapeXml(message)}
  </text>

  <text class="error-text" x="${CARD_WIDTH / 2}" y="110" style="font-size: 11px; opacity: 0.6;">
    Please check your username
  </text>
</svg>
  `.trim();
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
