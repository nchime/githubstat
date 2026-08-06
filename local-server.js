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

const GITHUB_GRAPHQL_QUERY = `
  query GetUserStats($login: String!) {
    user(login: $login) {
      login
      contributionsCollection {
        totalContributions
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
      }
      repositories(first: 100) {
        totalCount
        edges {
          node {
            stargazers {
              totalCount
            }
          }
        }
      }
      pullRequests(first: 1) {
        totalCount
      }
      issues(first: 1) {
        totalCount
      }
    }
  }
`;

const LAST_YEAR_QUERY = `
  query GetLastYearStats($login: String!) {
    user(login: $login) {
      contributionsCollection(
        from: "2024-01-01T00:00:00Z"
        to: "2025-01-01T00:00:00Z"
      ) {
        totalContributions
      }
    }
  }
`;

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

    const repositoryStars = user.repositories.edges.reduce(
      (total, edge) => total + (edge.node.stargazers.totalCount || 0),
      0
    );

    return {
      username: user.login,
      totalContributions: user.contributionsCollection.totalContributions,
      totalCommitContributions: user.contributionsCollection.totalCommitContributions,
      totalIssueContributions: user.contributionsCollection.totalIssueContributions,
      totalPullRequestContributions: user.contributionsCollection.totalPullRequestContributions,
      totalPullRequestReviewContributions: user.contributionsCollection.totalPullRequestReviewContributions,
      totalRepositories: user.repositories.totalCount,
      repositoryStars,
      lastYearContributions: lastYearResponse.user.contributionsCollection.totalContributions,
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

function getTheme(themeName, customBg, customText) {
  let theme = themeName && themeName in THEMES ? THEMES[themeName] : THEMES.dark;

  if (customBg || customText) {
    return {
      ...theme,
      ...(customBg && { backgroundColor: `#${customBg}` }),
      ...(customText && { textColor: `#${customText}` }),
    };
  }

  return theme;
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

function generateStatsCard(stats, theme) {
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

  const CARD_WIDTH = 400;
  const CARD_HEIGHT = 270;
  const PADDING = 20;
  const ROW_HEIGHT = 30;
  const cardHeight = CARD_HEIGHT + rows.length * ROW_HEIGHT;

  return `<svg width="${CARD_WIDTH}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
      return `<text class="label-text" x="${PADDING}" y="${y}">${row.label}</text><text class="value-text" x="${CARD_WIDTH - PADDING}" y="${y}">${row.value}</text>`;
    })
    .join('\n  ')}

  <line x1="${PADDING}" y1="${70 + rows.length * ROW_HEIGHT + 5}" x2="${CARD_WIDTH - PADDING}" y2="${70 + rows.length * ROW_HEIGHT + 5}" stroke="${theme.borderColor}" stroke-width="1" opacity="0.3" />

  <text style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: ${theme.textColor}; opacity: 0.6;" x="${PADDING}" y="${cardHeight - 10}">
    Updated: ${formatDate(stats.fetchedAt)}
  </text>
</svg>`;
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

  <rect class="error-bg" x="0" y="0" width="400" height="150" rx="8" ry="8" class="error-border" />
  <rect class="error-border" x="0" y="0" width="400" height="150" rx="8" ry="8" fill="none" />

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
      const bgColor = sanitizeHexColor(query.bg_color);
      const textColor = sanitizeHexColor(query.text_color);
      const theme = getTheme(themeName, bgColor, textColor);

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

      const svg = generateStatsCard(stats, theme);

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
