# Production-Ready Code Snippets for GitHub Stats Visualization

## 1. GraphQL Stats Fetcher

```javascript
// fetchers/stats.js
import axios from 'axios';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const GRAPHQL_QUERY = `
  query userInfo($login: String!, $includeMergedPullRequests: Boolean!) {
    user(login: $login) {
      login
      name
      followers {
        totalCount
      }
      commits: contributionsCollection {
        totalCommitContributions
      }
      pullRequests(first: 1) {
        totalCount
      }
      mergedPullRequests: pullRequests(states: MERGED) @include(if: $includeMergedPullRequests) {
        totalCount
      }
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      repositories(
        first: 100
        ownerAffiliations: OWNER
        orderBy: { direction: DESC, field: STARGAZERS }
      ) {
        totalCount
        nodes {
          name
          stargazers {
            totalCount
          }
          forkCount
        }
      }
    }
  }
`;

async function fetchGitHubStats(username) {
  try {
    const response = await axios.post(
      'https://api.github.com/graphql',
      {
        query: GRAPHQL_QUERY,
        variables: {
          login: username,
          includeMergedPullRequests: true
        }
      },
      {
        headers: {
          'Authorization': `bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    const user = response.data.data.user;
    
    // Calculate total stars
    const totalStars = user.repositories.nodes.reduce(
      (sum, repo) => sum + repo.stargazers.totalCount,
      0
    );

    return {
      login: user.login,
      name: user.name,
      followers: user.followers.totalCount,
      totalContributions: user.commits.totalCommitContributions,
      totalPullRequests: user.pullRequests.totalCount,
      mergedPullRequests: user.mergedPullRequests.totalCount,
      openIssues: user.openIssues.totalCount,
      closedIssues: user.closedIssues.totalCount,
      totalRepositories: user.repositories.totalCount,
      totalStars: totalStars
    };
  } catch (error) {
    console.error('GitHub API error:', error.message);
    throw error;
  }
}

export { fetchGitHubStats };
```

## 2. SVG Renderer

```javascript
// renderers/svgRenderer.js

function renderStatsCard(stats, options = {}) {
  const {
    theme = 'default',
    hideTitle = false,
    borderRadius = 4.5,
    width = 400,
    height = 200
  } = options;

  const colors = getThemeColors(theme);

  // Prepare stats display
  const statsData = [
    { label: 'Contributions', value: formatNumber(stats.totalContributions), icon: '🤝' },
    { label: 'Pull Requests', value: formatNumber(stats.totalPullRequests), icon: '📝' },
    { label: 'Issues', value: formatNumber(stats.openIssues + stats.closedIssues), icon: '🔧' },
    { label: 'Repositories', value: formatNumber(stats.totalRepositories), icon: '📦' },
    { label: 'Followers', value: formatNumber(stats.followers), icon: '👥' },
    { label: 'Stars', value: formatNumber(stats.totalStars), icon: '⭐' }
  ];

  // Calculate layout
  const paddingX = 25;
  const paddingY = 35;
  const statHeight = 40;
  const itemsPerRow = 3;

  let svg = `
    <svg
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="${stats.login}'s GitHub Stats"
    >
      <defs>
        <style>
          .title {
            font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
            fill: ${colors.titleColor};
          }
          .stat-label {
            font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif;
            fill: ${colors.textColor};
          }
          .stat-value {
            font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif;
            fill: ${colors.textColor};
          }
          .bg {
            fill: ${colors.bgColor};
            stroke: ${colors.borderColor};
            stroke-width: 1;
          }
        </style>
      </defs>

      <!-- Background -->
      <rect
        class="bg"
        x="0"
        y="0"
        width="${width}"
        height="${height}"
        rx="${borderRadius}"
      />

      <!-- Title -->
      ${!hideTitle ? `
        <text class="title" x="${paddingX}" y="40">
          ${stats.name || stats.login}'s GitHub Stats
        </text>
      ` : ''}

      <!-- Stats Grid -->
      ${statsData.map((stat, i) => {
        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;
        const itemWidth = (width - 2 * paddingX) / itemsPerRow;
        const itemHeight = statHeight;
        const x = paddingX + col * itemWidth;
        const y = paddingY + 30 + row * itemHeight;

        return `
          <g>
            <text class="stat-label" x="${x + 10}" y="${y + 15}">${stat.label}</text>
            <text class="stat-value" x="${x + 10}" y="${y + 35}">${stat.value}</text>
          </g>
        `;
      }).join('')}
    </svg>
  `;

  return svg;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getThemeColors(theme) {
  const themes = {
    default: {
      bgColor: '#ffffff',
      titleColor: '#333333',
      textColor: '#666666',
      borderColor: '#e1e4e8'
    },
    dark: {
      bgColor: '#1f2937',
      titleColor: '#ffffff',
      textColor: '#d1d5db',
      borderColor: '#374151'
    },
    github: {
      bgColor: '#0d1117',
      titleColor: '#58a6ff',
      textColor: '#8b949e',
      borderColor: '#30363d'
    }
  };

  return themes[theme] || themes.default;
}

export { renderStatsCard, formatNumber, getThemeColors };
```

## 3. Express API Handler

```javascript
// api/stats.js
import express from 'express';
import NodeCache from 'node-cache';
import { fetchGitHubStats } from '../fetchers/stats.js';
import { renderStatsCard } from '../renderers/svgRenderer.js';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 86400 }); // 24 hour TTL

router.get('/stats', async (req, res) => {
  try {
    const { username, theme = 'default', hide_title } = req.query;

    // Validate input
    if (!username) {
      return res.status(400).json({ error: 'username parameter required' });
    }

    // Check cache
    const cacheKey = `stats:${username}:${theme}`;
    let stats = cache.get(cacheKey);

    if (!stats) {
      // Fetch from GitHub API
      stats = await fetchGitHubStats(username);
      
      // Store in cache
      cache.set(cacheKey, stats);
    }

    // Render SVG
    const svg = renderStatsCard(stats, {
      theme,
      hideTitle: hide_title === 'true'
    });

    // Set response headers
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.setHeader('ETag', `"${hashSvg(svg)}"`);

    // Send SVG
    res.send(svg);
  } catch (error) {
    console.error('Stats API error:', error);

    // Return error as SVG
    const errorSvg = renderErrorCard(error.message);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes for errors
    res.status(500).send(errorSvg);
  }
});

function hashSvg(svg) {
  // Simple hash for ETag
  return svg.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0).toString(16);
}

function renderErrorCard(message) {
  return `
    <svg width="400" height="200" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="200" fill="#fee" stroke="#fcc" stroke-width="1" rx="5"/>
      <text x="20" y="40" font="600 16px Arial" fill="#c00">Error</text>
      <text x="20" y="70" font="400 12px Arial" fill="#666">${message}</text>
    </svg>
  `;
}

export default router;
```

## 4. Vercel Deployment (api/index.js)

```javascript
// api/index.js - For Vercel deployment
import { fetchGitHubStats } from '../src/fetchers/stats.js';
import { renderStatsCard } from '../src/renderers/svgRenderer.js';

let cache = {}; // Simple in-memory cache for Vercel

export default async (req, res) => {
  const { username, theme = 'default', cache_seconds = 86400 } = req.query;

  if (!username) {
    res.status(400).json({ error: 'username required' });
    return;
  }

  try {
    // Check cache
    const cacheKey = `${username}:${theme}`;
    if (cache[cacheKey]) {
      const { svg, timestamp } = cache[cacheKey];
      if (Date.now() - timestamp < parseInt(cache_seconds) * 1000) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', `public, max-age=${cache_seconds}`);
        return res.send(svg);
      }
    }

    // Fetch stats
    const stats = await fetchGitHubStats(username);

    // Render SVG
    const svg = renderStatsCard(stats, { theme });

    // Cache result
    cache[cacheKey] = { svg, timestamp: Date.now() };

    // Set headers
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', `public, max-age=${cache_seconds}`);
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.send(svg);
  } catch (error) {
    console.error(error);
    res.status(500).setHeader('Content-Type', 'image/svg+xml');
    return res.send(`
      <svg width="400" height="200" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#fee" stroke="#fcc" rx="5"/>
        <text x="20" y="50" font="600 16px Arial" fill="#c00">Error fetching stats</text>
      </svg>
    `);
  }
};
```

## 5. Environment Setup

```bash
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Get token from: https://github.com/settings/tokens
# Permissions needed: public_repo (for public repos only)
```

```javascript
// .env.example
GITHUB_TOKEN=your_token_here
NODE_ENV=development
```

## 6. Package.json

```json
{
  "name": "github-stats-visualizer",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch api/index.js",
    "start": "node api/index.js",
    "test": "jest"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.0",
    "node-cache": "^5.1.2"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  },
  "engines": {
    "node": ">=22"
  }
}
```

## 7. Usage Examples

```bash
# Local development
curl "http://localhost:3000/api/stats?username=torvalds&theme=dark"

# Deployed on Vercel
https://your-project.vercel.app/api/stats?username=octocat&theme=github

# Markdown usage
![GitHub Stats](https://your-project.vercel.app/api/stats?username=torvalds&theme=dark)

# With options
https://your-project.vercel.app/api/stats?username=gvanrossum&theme=dark&hide_title=true&cache_seconds=172800
```

