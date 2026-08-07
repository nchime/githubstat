const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const PORT = 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌ 에러: GITHUB_TOKEN이 설정되지 않았습니다.');
  console.error('   .env.local 파일을 생성하고 토큰을 추가하세요:');
  console.error('   echo "GITHUB_TOKEN=your_token_here" > .env.local');
  process.exit(1);
}

console.log('✅ GITHUB_TOKEN 확인됨');

const graphql = require('@octokit/graphql').graphql.defaults({
  headers: {
    authorization: `token ${GITHUB_TOKEN}`,
  },
});

const { icon } = require('./lib/lucide-icons');

const GITHUB_GRAPHQL_QUERY = `
  query GetUserStats($login: String!) {
    user(login: $login) {
      login
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
      repositories(first: 100) {
        totalCount
        nodes {
          name
          stargazers {
            totalCount
          }
          primaryLanguage {
            name
          }
        }
      }
    }
  }`;

const LAST_YEAR_QUERY = `
  query GetLastYearStats($login: String!) {
    user(login: $login) {
      contributionsCollection(
        from: "2024-01-01T00:00:00Z"
        to: "2025-01-01T00:00:00Z"
      ) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
      }
    }
  }`;

const THEMES = {
  dark: {
    backgroundColor: '#0d1117',
    textColor: '#c9d1d9',
    accentColor: '#58a6ff',
    borderColor: '#30363d',
    successColor: '#3fb950',
  },
  light: {
    backgroundColor: '#ffffff',
    textColor: '#24292f',
    accentColor: '#0969da',
    borderColor: '#d0d7de',
    successColor: '#1a7f0e',
  },
  blue: {
    backgroundColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#3b82f6',
    borderColor: '#1e293b',
    successColor: '#10b981',
  },
  purple: {
    backgroundColor: '#1a0033',
    textColor: '#e9d5ff',
    accentColor: '#c084fc',
    borderColor: '#6b21a8',
    successColor: '#34d399',
  },
  github: {
    backgroundColor: '#1f6feb',
    textColor: '#ffffff',
    accentColor: '#79c0ff',
    borderColor: '#3b8bda',
    successColor: '#3fb950',
  },
};

const MEMORY_CACHE = new Map();
const RATE_LIMITS = {};

function getCachedStats(username) {
  const entry = MEMORY_CACHE.get(username.toLowerCase());
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    MEMORY_CACHE.delete(username.toLowerCase());
    return null;
  }
  return entry.data;
}

function setCachedStats(stats) {
  const entry = {
    data: stats,
    timestamp: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  MEMORY_CACHE.set(stats.username.toLowerCase(), entry);
}

function checkRateLimit(ip) {
  const now = Date.now();
  if (!RATE_LIMITS[ip]) {
    RATE_LIMITS[ip] = { count: 0, resetTime: now + 60000 };
  }

  const entry = RATE_LIMITS[ip];
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + 60000;
  }

  entry.count++;
  return entry.count <= 30;
}

async function fetchGitHubStats(username) {
  try {
    const userDataResponse = await graphql(GITHUB_GRAPHQL_QUERY, {
      login: username,
    });

    const user = userDataResponse.user;
    if (!user) {
      throw new Error(`User ${username} not found`);
    }

    const lastYearResponse = await graphql(LAST_YEAR_QUERY, {
      login: username,
    });

    const repoNodes = user.repositories.nodes || [];
    const repositoryStars = repoNodes.reduce(
      (total, node) => total + (node.stargazers.totalCount || 0),
      0
    );

    const languageCounts = {};
    repoNodes.forEach((node) => {
      const lang = node.primaryLanguage && node.primaryLanguage.name;
      if (lang) languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });
    const topLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const topRepo = repoNodes
      .slice()
      .sort((a, b) => (b.stargazers.totalCount || 0) - (a.stargazers.totalCount || 0))[0] || null;

    const calendarDays = (user.contributionsCollection.contributionCalendar.weeks || [])
      .flatMap((week) => week.contributionDays || []);
    let streak = 0;
    let cursor = calendarDays.length - 1;
    while (cursor >= 0 && calendarDays[cursor].contributionCount === 0) cursor--;
    while (cursor >= 0 && calendarDays[cursor].contributionCount > 0) {
      streak++;
      cursor--;
    }

    return {
      totalContributions:
        (user.contributionsCollection.totalCommitContributions || 0) +
        (user.contributionsCollection.totalIssueContributions || 0) +
        (user.contributionsCollection.totalPullRequestContributions || 0) +
        (user.contributionsCollection.totalPullRequestReviewContributions || 0) +
        (user.contributionsCollection.totalRepositoryContributions || 0),
      username: user.login,
      totalCommitContributions: user.contributionsCollection.totalCommitContributions,
      totalIssueContributions: user.contributionsCollection.totalIssueContributions,
      totalPullRequestContributions: user.contributionsCollection.totalPullRequestContributions,
      totalPullRequestReviewContributions: user.contributionsCollection.totalPullRequestReviewContributions,
      totalRepositories: user.repositories.totalCount,
      repositoryStars,
      topLanguages,
      topRepoName: topRepo ? topRepo.name : null,
      topRepoStars: topRepo ? topRepo.stargazers.totalCount : 0,
      streak,
      lastYearContributions:
        (lastYearResponse.user.contributionsCollection.totalCommitContributions || 0) +
        (lastYearResponse.user.contributionsCollection.totalIssueContributions || 0) +
        (lastYearResponse.user.contributionsCollection.totalPullRequestContributions || 0) +
        (lastYearResponse.user.contributionsCollection.totalPullRequestReviewContributions || 0) +
        (lastYearResponse.user.contributionsCollection.totalRepositoryContributions || 0),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to fetch GitHub stats: ${error.message}`);
  }
}

function isValidHexColor(color) {
  return /^[0-9a-fA-F]{6}$/.test(color);
}

function sanitizeHexColor(color) {
  if (!color) return undefined;
  const cleaned = color.replace(/^#/, '').slice(0, 6).toLowerCase();
  return isValidHexColor(cleaned) ? cleaned : undefined;
}

function getTheme(themeName, overrides) {
  const base = themeName && themeName in THEMES ? THEMES[themeName] : THEMES.dark;
  if (!overrides) return base;
  return {
    ...base,
    ...(overrides.bg_color !== undefined && { backgroundColor: '#' + overrides.bg_color }),
    ...(overrides.text_color !== undefined && { textColor: '#' + overrides.text_color }),
    ...(overrides.accent_color !== undefined && { accentColor: '#' + overrides.accent_color }),
    ...(overrides.success_color !== undefined && { successColor: '#' + overrides.success_color }),
    ...(overrides.border_color !== undefined && { borderColor: '#' + overrides.border_color }),
  };
}

function formatNumber(num) {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatDate(isoString) {
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

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const STAT_DEFS = {
  total_contributions: { icon: 'activity', label: 'Total Contributions', key: 'totalContributions', format: (s) => formatNumber(s.totalContributions) },
  streak: { icon: 'flame', label: 'Current Streak', key: 'streak', format: (s) => s.streak + ' days' },
  commits: { icon: 'gitCommit', label: 'Commits', key: 'totalCommitContributions', format: (s) => formatNumber(s.totalCommitContributions) },
  pull_requests: { icon: 'gitPullRequest', label: 'Pull Requests', key: 'totalPullRequestContributions', format: (s) => formatNumber(s.totalPullRequestContributions) },
  issues: { icon: 'bug', label: 'Issues', key: 'totalIssueContributions', format: (s) => formatNumber(s.totalIssueContributions) },
  pr_reviews: { icon: 'messageCircle', label: 'PR Reviews', key: 'totalPullRequestReviewContributions', format: (s) => formatNumber(s.totalPullRequestReviewContributions) },
  repositories: { icon: 'folderGit', label: 'Repositories', key: 'totalRepositories', format: (s) => formatNumber(s.totalRepositories) },
  stars: { icon: 'star', label: 'Stars Earned', key: 'repositoryStars', format: (s) => formatNumber(s.repositoryStars) },
  last_year: { icon: 'calendar', label: 'Last Year', key: 'lastYearContributions', format: (s) => formatNumber(s.lastYearContributions) },
  languages: { icon: 'code', label: 'Top Languages', key: 'topLanguages', wrap: true, format: (s) => s.topLanguages.length ? s.topLanguages.join(', ') : 'N/A' },
  top_repo: { icon: 'trophy', label: 'Top Repository', key: 'topRepoName', wrap: true, format: (s) => s.topRepoName ? s.topRepoName + ' (' + formatNumber(s.topRepoStars) + ')' : 'N/A' },
};

const DEFAULT_ORDER = [
  'total_contributions', 'streak', 'commits', 'pull_requests', 'issues',
  'pr_reviews', 'repositories', 'stars', 'last_year', 'languages', 'top_repo',
];

function generateStatsCard(stats, theme, options) {
  options = options || {};
  const showList = (options.show || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => STAT_DEFS[s]);
  const hideSet = new Set(
    (options.hide || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s)
  );
  const order = showList.length ? showList : DEFAULT_ORDER;
  const rows = order
    .map((k) => STAT_DEFS[k])
    .filter((row) => row && !hideSet.has(row.key));

  const CARD_WIDTH = options.width && options.width >= 200 && options.width <= 1000 ? options.width : 440;
  const PADDING = 22;
  const COL_GAP = 16;
  const ROW_HEIGHT = 33;
  const WRAP_EXTRA = 14;
  const HEADER_H = !options.hide_title ? 56 : 20;
  const FOOTER_H = !options.hide_footer ? 26 : 0;
  const showIcons = String(options.hide_icons || '') !== '1';
  const ICON_SIZE = 16;

  const singleCol = rows.length <= 1;
  const colW = singleCol ? CARD_WIDTH : (CARD_WIDTH - PADDING * 2 - COL_GAP) / 2;
  const half = Math.ceil(rows.length / 2);

  const render = (list, col) => {
    let y = HEADER_H + 16;
    let html = '';
    list.forEach((row) => {
      const xIcon = PADDING + col * (colW + COL_GAP);
      const xLabel = xIcon + (showIcons ? 26 : 0);
      const xValue = xIcon + colW - 14;
      if (showIcons) {
        html += icon(xIcon, y - 13, ICON_SIZE, theme.accentColor, row.icon);
      }
      html += '<text class="label-text" x="' + xLabel + '" y="' + y + '">' + escapeXml(row.label) + '</text>';
      if (row.wrap) {
        html += '<text class="wrap-text" x="' + xLabel + '" y="' + (y + 15) + '">' + escapeXml(row.format(stats)) + '</text>';
      } else {
        html += '<text class="value-text" x="' + xValue + '" y="' + y + '">' + escapeXml(row.format(stats)) + '</text>';
      }
      y += row.wrap ? ROW_HEIGHT + WRAP_EXTRA : ROW_HEIGHT;
    });
    return { html, height: y - 16 };
  };

  const left = singleCol ? rows : rows.slice(0, half);
  const right = singleCol ? [] : rows.slice(half);
  const layoutLeft = render(left, 0);
  const layoutRight = singleCol ? { html: '', height: 0 } : render(right, 1);
  const contentH = Math.max(layoutLeft.height, layoutRight.height);
  const cardHeight = HEADER_H + contentH + FOOTER_H;
  const radius = options.border_radius !== undefined && options.border_radius >= 0 && options.border_radius <= 50 ? options.border_radius : 10;
  const title = options.title || 'GitHub Stats - ' + stats.username;

  return [
    '<svg width="' + CARD_WIDTH + '" height="' + cardHeight + '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
    '<defs><style>',
      '.card-bg { fill: ' + theme.backgroundColor + '; }',
      '.card-border { stroke: ' + theme.borderColor + '; stroke-width: 2; }',
      '.title-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 17px; font-weight: 600; fill: ' + theme.accentColor + '; }',
      '.label-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; fill: ' + theme.textColor + '; }',
      '.value-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; font-weight: 600; fill: ' + theme.successColor + '; text-anchor: end; }',
      '.wrap-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; font-weight: 600; fill: ' + theme.successColor + '; }',
    '</style></defs>',
    '<rect class="card-bg card-border" x="0" y="0" width="' + CARD_WIDTH + '" height="' + cardHeight + '" rx="' + radius + '" ry="' + radius + '" />',
    !options.hide_title ? '<text class="title-text" x="' + PADDING + '" y="36">' + escapeXml(title) + '</text>' : '',
    !options.hide_title ? '<line x1="' + PADDING + '" y1="46" x2="' + (CARD_WIDTH - PADDING) + '" y2="46" stroke="' + theme.borderColor + '" stroke-width="1" opacity="0.3" />' : '',
    layoutLeft.html,
    layoutRight.html,
    FOOTER_H ? '<text style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-size: 11px; fill: ' + theme.textColor + '; opacity: 0.6;" x="' + PADDING + '" y="' + (cardHeight - 10) + '">Updated: ' + formatDate(stats.fetchedAt) + '</text>' : '',
    '</svg>',
  ].join('');
}

function generateErrorCard(message, theme) {
  return `<svg width="400" height="150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .error-bg { fill: ${theme.backgroundColor}; }
      .error-border { stroke: ${theme.borderColor}; stroke-width: 2; }
      .error-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; fill: ${theme.textColor}; text-anchor: middle; }
    </style>
  </defs>

  <rect class="error-bg error-border" x="0" y="0" width="400" height="150" rx="8" ry="8" />

  <text class="error-text" x="200" y="50">
    ⚠️ GitHub Stats
  </text>

  <text class="error-text" x="200" y="85" style="font-size: 13px;">
    ${escapeXml(message)}
  </text>

  <text class="error-text" x="200" y="110" style="font-size: 11px; opacity: 0.6;">
    Please check your username
  </text>
</svg>`;
}

const server = http.createServer(async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (!checkRateLimit(clientIp)) {
    const theme = THEMES.dark;
    const svg = generateErrorCard('Rate limit exceeded. Try again in 1 minute.', theme);
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' });
    res.end(svg);
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  if (pathname === '/api/stats') {
    const username = (query.username || '').trim();

    if (!username) {
      const theme = THEMES.dark;
      const svg = generateErrorCard('Username is required', theme);
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      res.end(svg);
      return;
    }

    try {
      const themeName = (query.theme || 'dark').toLowerCase();
      const colorOverrides = {
        bg_color: sanitizeHexColor(query.bg_color),
        text_color: sanitizeHexColor(query.text_color),
        accent_color: sanitizeHexColor(query.accent_color),
        success_color: sanitizeHexColor(query.success_color),
        border_color: sanitizeHexColor(query.border_color),
      };
      const theme = getTheme(themeName, colorOverrides);

      let stats = null;
      let cacheHit = false;

      if (!query.refresh) {
        stats = getCachedStats(username);
        if (stats) cacheHit = true;
      }

      if (!stats) {
        stats = await fetchGitHubStats(username);
        setCachedStats(stats);
      }

      const cardOptions = {
        show: String(query.show || ''),
        hide: String(query.hide || ''),
        width: parseInt(query.width, 10),
        title: String(query.title || ''),
        border_radius: parseInt(query.border_radius, 10),
        hide_icons: String(query.hide_icons || ''),
        hide_title: String(query.hide_title || ''),
        hide_footer: String(query.hide_footer || ''),
      };
      const svg = generateStatsCard(stats, theme, cardOptions);

      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': cacheHit ? 'HIT' : 'MISS',
      });
      res.end(svg);
    } catch (error) {
      const theme = THEMES.dark;
      const svg = generateErrorCard(error.message, theme);
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      res.end(svg);
    }
  } else if (pathname === '/test.html') {
    fs.readFile('test.html', 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('test.html not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found\n\nAvailable endpoints:\n/api/stats?username=<username>\n/test.html');
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log(`║  ✅ GitHub Stats Server는 포트 ${PORT}에서 실행 중입니다       ║`);
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 테스트 URL:');
  console.log('');
  console.log(`  기본: http://localhost:${PORT}/api/stats?username=torvalds`);
  console.log(`  테마: http://localhost:${PORT}/api/stats?username=torvalds&theme=dark`);
  console.log(`  색상: http://localhost:${PORT}/api/stats?username=torvalds&bg_color=1e1b4b&text_color=e0e7ff`);
  console.log('');
  console.log('🧪 대화형 테스트 페이지:');
  console.log(`  http://localhost:${PORT}/test.html`);
  console.log('');
  console.log('⏹️  중지하려면: Ctrl+C');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n\n👋 서버를 종료합니다...');
  server.close(() => {
    console.log('✅ 종료됨');
    process.exit(0);
  });
});
