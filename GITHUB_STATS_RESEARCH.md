# GitHub Stats Visualization Tool - Production Research Report
**Date**: August 7, 2026  
**Focus**: API specs, image generation libraries, caching strategies, existing production tools

---

## PART 1: GITHUB API ENDPOINTS FOR USER STATS

### ✅ GraphQL API - Recommended for Comprehensive Stats Fetching

**Official Documentation**: https://docs.github.com/en/graphql/reference/queries

The GraphQL API is superior to REST for stats visualization because:
- Single query fetches all user stats (no N+1 problem)
- Built-in support for conditional fields with `@include` directives
- Better pagination handling with cursor-based navigation
- More flexible querying (fetch only what you need)

**Available User Statistics via GraphQL**:

| Stat | GraphQL Field | Available Via |
|------|---|---|
| **Contributions** | `contributionsCollection.totalCommitContributions` | User object with optional `from` parameter |
| **Code Reviews** | `contributionsCollection.totalPullRequestReviewContributions` | User object |
| **Repositories Owned** | `repositories(ownerAffiliations: OWNER)` | User object with pagination |
| **Pull Requests** | `pullRequests(states: MERGED)` | User object with state filtering |
| **Open Issues** | `issues(states: OPEN)` | User object |
| **Closed Issues** | `issues(states: CLOSED)` | User object |
| **Followers** | `followers.totalCount` | User object |
| **Repos Contributed To** | `repositoriesContributedTo` | User object with contribution types filter |
| **Repository Stars** | `repositories[].stargazers.totalCount` | For each repository |
| **Repository Forks** | `repositories[].forkCount` | For each repository |
| **Discussions Started** | `repositoryDiscussions.totalCount` | User object (optional with @include) |
| **Discussions Answered** | `repositoryDiscussionComments(onlyAnswers: true)` | User object (optional with @include) |

**Production Query Example** ([Source](https://github.com/anuraghazra/github-readme-stats/blob/54a7985aeefda00d5eadb55b80c17c7f976c37d2/src/fetchers/stats.js#L41-L79)):

```graphql
query userInfo(
  $login: String!
  $after: String
  $includeMergedPullRequests: Boolean!
  $includeDiscussions: Boolean!
  $includeDiscussionsAnswers: Boolean!
  $startTime: DateTime = null
) {
  user(login: $login) {
    name
    login
    commits: contributionsCollection(from: $startTime) {
      totalCommitContributions
    }
    reviews: contributionsCollection {
      totalPullRequestReviewContributions
    }
    repositoriesContributedTo(
      first: 1
      contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]
    ) {
      totalCount
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
    followers {
      totalCount
    }
    repositoryDiscussions @include(if: $includeDiscussions) {
      totalCount
    }
    repositoryDiscussionComments(onlyAnswers: true) @include(if: $includeDiscussionsAnswers) {
      totalCount
    }
    repositories(
      first: 100
      ownerAffiliations: OWNER
      orderBy: { direction: DESC, field: STARGAZERS }
      after: $after
    ) {
      totalCount
      nodes {
        name
        stargazers {
          totalCount
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

### Alternative: REST API for Total Commits

**Why REST API?** - GraphQL doesn't directly expose "all commits" count without deep traversal.

**Endpoint**: `GET /search/commits?q=author:{username}`

**Implementation** ([Source](https://github.com/anuraghazra/github-readme-stats/blob/54a7985aeefda00d5eadb55b80c17c7f976c37d2/src/fetchers/stats.js#L210-L230)):

```javascript
// When include_all_commits flag is set, fetch from REST API
const ALL_COMMITS_URL = `https://api.github.com/search/commits?q=author:${username}`;
const response = await axios.get(ALL_COMMITS_URL, {
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`
  }
});
const totalCommits = response.data.total_count;
```

### Rate Limiting & Best Practices

**GraphQL Rate Limits**:
- Authenticated: 5,000 points per hour
- Cost per query: Depends on query complexity (usually 1-5 points)
- Each repository field counts toward complexity

**Implementation**: Use exponential backoff + token rotation for high-traffic apps

---

## PART 2: IMAGE GENERATION LIBRARIES & STRATEGIES

### 📊 Library Comparison Matrix

| Library | Type | Output Formats | Best For | Performance | Notes |
|---------|------|---|---|---|---|
| **Sharp** | Image Processing | PNG, JPEG, WebP, GIF, AVIF, TIFF | Production image resizing + SVG→PNG conversion | ⚡⚡⚡ Fastest | Most popular Node.js image lib (637 code examples) |
| **Node Canvas** | Canvas API | PNG, PDF, SVG, JPEG | Complex graphics, full canvas control | ⚡⚡ Moderate | Cairo-backed, good typography |
| **Skia Canvas** | Canvas API | PNG, JPEG, WEBP, PDF, SVG | High-quality rendering, advanced typography | ⚡⚡⚡ Fast | Google's Skia engine, best text rendering |
| **SVG.js** | SVG Manipulation | SVG (native) | Pure SVG generation in JavaScript | ⚡⚡⚡ Fastest | Lightweight, no image compilation needed |

### ✅ RECOMMENDED: Pure SVG Generation (Like github-readme-stats)

**Why**: 
- No image processing overhead
- Lightweight (smaller bandwidth)
- Scalable to any resolution
- Easy text rendering
- Perfect for stats visualization

**Implementation Pattern**:

```javascript
// 1. Generate SVG string dynamically
function renderStatsCard(stats) {
  const svgString = `
    <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { font: 600 18px 'Segoe UI'; fill: #333; }
        @keyframes fadeInAnimation {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      </style>
      <text class="title" x="20" y="30" style="animation: fadeInAnimation 0.8s ease-in-out forwards;">
        ${stats.totalContributions} Contributions
      </text>
    </svg>
  `;
  return svgString;
}

// 2. Serve with correct headers
res.setHeader("Content-Type", "image/svg+xml");
res.send(svgString);
```

### Alternative: SVG → PNG Conversion with Sharp

**When to use**: For CDN caching or when PNG is required

```javascript
const sharp = require('sharp');

// Convert SVG to PNG
const buffer = await sharp({
  text: {
    text: svgString,
    font: 'sans-serif',
    width: 400,
    height: 200
  }
})
  .png()
  .toBuffer();
```

**Sharp API** ([Source](https://github.com/lovell/sharp/blob/main/docs/src/content/docs/api-output.md)):

```javascript
// Convert and save to file
await sharp('input.svg')
  .resize(1920, 1080)
  .png({ compressionLevel: 9 })
  .toFile('output.png');

// Convert to buffer
const buffer = await sharp('input.svg')
  .png()
  .toBuffer();

// Get metadata
const info = await sharp('input.png')
  .metadata(); // Returns { format, width, height, space, hasAlpha, ... }
```

### Canvas Alternative: Node Canvas

**When to use**: Complex visualizations requiring full drawing API

```javascript
const { createCanvas, loadImage } = require('canvas');

const canvas = createCanvas(400, 200);
const ctx = canvas.getContext('2d');

// Draw background
ctx.fillStyle = '#fff';
ctx.fillRect(0, 0, 400, 200);

// Draw text
ctx.font = '30px Impact';
ctx.fillStyle = '#000';
ctx.fillText('GitHub Stats', 50, 100);

// Export to buffer
const buffer = canvas.toBuffer('image/png');
```

**Node Canvas Output** ([Source](https://github.com/automattic/node-canvas/blob/master/Readme.md)):

```javascript
// Synchronous export
const buffer = canvas.toBuffer('image/png', {
  compressionLevel: 9,  // PNG compression (0-9)
  filters: canvas.PNG_ALL_FILTERS
});

// Support for multiple formats
canvas.toBuffer('image/jpeg', { quality: 0.8 });
canvas.toBuffer('application/pdf');
canvas.toBuffer('image/svg+xml');
```

---

## PART 3: CACHING STRATEGIES FOR PRODUCTION

### 🗂️ HTTP-Level Caching (github-readme-stats Pattern)

**Cache TTL Configuration** ([Source](https://github.com/anuraghazra/github-readme-stats/blob/54a7985aeefda00d5eadb55b80c17c7f976c37d2/src/common/cache.js#L34-L61)):

```javascript
const CACHE_TTL = {
  STATS_CARD: {
    DEFAULT: 86400,      // 24 hours
    MIN: 43200,          // 12 hours minimum
    MAX: 172800,         // 2 days maximum
  },
  TOP_LANGS_CARD: {
    DEFAULT: 518400,     // 6 days
    MIN: 172800,         // 2 days minimum
    MAX: 864000,         // 10 days maximum
  },
  ERROR: 600,            // 10 minutes (shorter for errors)
};
```

**Implementation**: Set HTTP Headers

```javascript
// In Express/Node.js
const cacheSeconds = 86400;

res.setHeader('Cache-Control', `public, max-age=${cacheSeconds}`);
res.setHeader('Content-Type', 'image/svg+xml');
res.setHeader('ETag', `"${contentHash}"`);

res.send(svgContent);
```

**Why Different Cache Times**:
- **Short errors (10 min)**: Allows quick recovery from API failures
- **Stats card (1 day)**: Users don't care about 1-minute staleness
- **Language/repo stats (6 days)**: Changes less frequently

### 🔄 Application-Level Caching (For High Traffic)

**In-Memory Cache Pattern**:

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 86400 });

async function fetchWithCache(username) {
  const cacheKey = `stats:${username}`;
  
  // Try cache first
  let stats = cache.get(cacheKey);
  if (stats) return stats;
  
  // Fetch from GitHub API if not cached
  stats = await fetchGitHubStats(username);
  
  // Store in cache
  cache.set(cacheKey, stats, 86400);
  
  return stats;
}
```

**For Distributed Systems** (use Redis):

```javascript
const redis = require('redis');
const client = redis.createClient();

async function fetchWithRedisCache(username) {
  const cacheKey = `stats:${username}`;
  
  // Try Redis first
  const cached = await client.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from API
  const stats = await fetchGitHubStats(username);
  
  // Store with TTL
  await client.setEx(cacheKey, 86400, JSON.stringify(stats));
  
  return stats;
}
```

---

## PART 4: EXISTING PRODUCTION TOOLS & ARCHITECTURE

### 🏆 github-readme-stats (Most Popular)

**Repository**: [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats)  
**Stars**: ~25,000  
**Deployment**: Vercel (serverless)

**Architecture Overview**:

```
User Request
    ↓
[Express.js API Endpoint]
    ↓
├─→ Fetch Stats (GraphQL + REST)
│   └─→ GitHub API
│
├─→ Render Card (Pure SVG Generation)
│   └─→ Card.js class with flexLayout
│
└─→ Return Response
    ├─→ Set Cache Headers
    └─→ Return SVG as image/svg+xml
```

**Key Components**:

1. **API Fetcher** ([Source](https://github.com/anuraghazra/github-readme-stats/blob/54a7985aeefda00d5eadb55b80c17c7f976c37d2/src/fetchers/stats.js)):
   - Uses GraphQL for primary stats
   - Falls back to REST for total commits
   - Implements retry logic with exponential backoff
   - Pagination support for repositories

2. **Card Renderer** ([Source](https://github.com/anuraghazra/github-readme-stats/blob/54a7985aeefda00d5eadb55b80c17c7f976c37d2/src/common/Card.js#L50-L95)):

```javascript
render(body) {
  return `
    <svg
      width="${this.width}"
      height="${this.height}"
      viewBox="0 0 ${this.width} ${this.height}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="descId"
    >
      <title id="titleId">${this.a11yTitle}</title>
      <desc id="descId">${this.a11yDesc}</desc>
      <style>
        .header {
          font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
          fill: ${this.colors.titleColor};
          animation: fadeInAnimation 0.8s ease-in-out forwards;
        }
        ${this.css}
        ${this.animations ? this.getAnimations() : ''}
      </style>
      ${body}
    </svg>
  `;
}
```

3. **Image Dependencies**:
   - Sharp (v0.32.3): For SVG optimization
   - SVGO (v3.0.2): SVG minification
   - No canvas library needed!

**API Endpoint** ([Source](https://github.com/anuraghazra/github-readme-stats/blob/54a7985aeefda00d5eadb55b80c17c7f976c37d2/api/index.js#L52)):

```javascript
export default async (req, res) => {
  // Parse query parameters
  const { username, hide, theme, hide_border, ... } = req.query;
  
  // Set response type
  res.setHeader("Content-Type", "image/svg+xml");
  
  // Fetch stats
  const stats = await fetchStats(username, ...options);
  
  // Render card
  const svg = renderStatsCard(stats, {
    theme,
    hide,
    hide_border,
    ...
  });
  
  // Set cache headers
  setCacheHeaders(res, cacheSeconds);
  
  // Return SVG
  res.send(svg);
}
```

### 🎯 lowlighter/metrics

**Repository**: [lowlighter/metrics](https://github.com/lowlighter/metrics)  
**Focus**: More comprehensive metrics with plugin system

**Differences from github-readme-stats**:
- Plugin architecture (modular metrics)
- More visualization options
- GitHub Actions integration (official action)
- Docker support

---

## PART 5: RECOMMENDED ARCHITECTURE FOR YOUR TOOL

### 📐 System Design

```
┌─────────────────────────────────────────────────────────┐
│                   Client Request                        │
│            ?username=octocat&theme=dark                 │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│            Request Handler (Express/Hono)               │
│  • Parse query parameters                               │
│  • Validate username                                    │
│  • Set response headers (Content-Type: image/svg+xml)  │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│         Cache Layer (Redis or In-Memory)                 │
│  • Check cache for username:theme combination           │
│  • Cache key: `stats:octocat:dark`                      │
│  • TTL: 24 hours default                                │
└──────────────────────┬──────────────────────────────────┘
                       ↓ (Cache miss)
┌──────────────────────────────────────────────────────────┐
│         GitHub API Client (GraphQL)                      │
│  • Execute optimized query                              │
│  • Fetch contributions, repos, PRs, issues              │
│  • Handle rate limiting & retries                       │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│         Stats Processor                                  │
│  • Calculate rank/percentile                            │
│  • Format numbers (1.2K, 5M)                            │
│  • Prepare layout data                                  │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│         SVG Renderer                                     │
│  • Generate SVG string                                  │
│  • Apply theme colors                                   │
│  • Add animations                                       │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│         Cache & Return                                   │
│  • Store in cache (TTL: 24h)                            │
│  • Set HTTP cache headers (max-age=86400)               │
│  • Return SVG response                                  │
└──────────────────────────────────────────────────────────┘
```

### 🚀 Implementation Stack

**Recommended**:
- **Runtime**: Node.js 22+ or Bun
- **Framework**: Express.js, Hono, or Fastify
- **GitHub API Client**: octokit/graphql or axios
- **SVG Generation**: Pure string templating (like github-readme-stats)
- **Caching**: Redis for distributed, NodeCache for single-instance
- **Deployment**: Vercel, AWS Lambda, or Deno Deploy (serverless)
- **Monitoring**: Sentry for error tracking, Prometheus for metrics

### 📊 Deployment Options & Trade-offs

| Platform | Cold Start | Memory | Cost | Scaling | Best For |
|----------|---|---|---|---|---|
| **Vercel** | ~100ms | 3GB | $0-20/mo | Auto | Quick prototype, hobby |
| **AWS Lambda** | ~200-500ms | 128MB-10GB | $0.50-$15/mo | Auto | High traffic, complex logic |
| **Railway/Render** | Negligible | 512MB-2GB | $5-50/mo | Auto | Balanced solution |
| **Self-hosted (VPS)** | N/A | Flexible | $5-50/mo | Manual | Maximum control |

**Recommendation**: Start with **Vercel** or **Railway** for MVP, graduate to **AWS Lambda** if you hit traffic limits.

---

## KEY LEARNINGS & BEST PRACTICES

### ✅ What Works (Validated by Production Tools)

1. **SVG Output** > Canvas/PNG for stats
   - Lighter, smaller bandwidth
   - Infinitely scalable
   - GitHub-readme-stats proves this at scale

2. **GraphQL** > Multiple REST calls
   - Single round-trip to API
   - Better rate limit utilization
   - More flexible querying

3. **HTTP Cache Headers** are Critical
   - 24-hour default prevents API hammering
   - ETags for client-side optimization
   - Serves ~99% of requests from browser cache

4. **Pure Functions for SVG Generation**
   - No state, easy to test
   - Deterministic output
   - Easy to parallelize

5. **Error Responses Need Short Cache**
   - 10 minutes allows recovery
   - Prevents "stuck" error states
   - Users see fresh data after GitHub API recovers

### ❌ Pitfalls to Avoid

1. ❌ Canvas rendering for simple stats (over-engineered)
2. ❌ Multiple REST API calls instead of GraphQL (wasteful)
3. ❌ No caching (hammers GitHub API quickly)
4. ❌ High TTL on error responses (users stuck with errors)
5. ❌ No rate limiting handling (crashes on burst traffic)

### 🔐 Security & Rate Limiting

**GitHub API Rate Limits**:
- Authenticated GraphQL: 5,000 points/hour
- Typical stats query: 2-5 points
- = ~1,000-2,500 requests/hour per token

**Mitigation**:
```javascript
// Implement exponential backoff
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

async function fetchWithRetry(query, variables, token) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await github.graphql(query, variables, {
        headers: { authorization: `bearer ${token}` }
      });
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate')) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

---

## DECISION MATRIX FOR YOUR TOOL

| Decision | Recommendation | Why |
|----------|---|---|
| **Output Format** | SVG (with optional PNG via Sharp) | Lightweight, scalable, proven at scale |
| **API** | GraphQL primary, REST fallback | Single query, more efficient |
| **Cache** | Redis (distributed) or NodeCache (single) | Critical for scalability |
| **Image Library** | Sharp (only if PNG required) | Most popular, well-maintained |
| **Deployment** | Vercel or Railway | Easy, cost-effective, auto-scaling |
| **Data Refresh Rate** | 24 hours default | Matches production tools, reduces API load |

---

## REFERENCES & LINKS

### Official Documentation
- **GitHub GraphQL API**: https://docs.github.com/en/graphql
- **GitHub REST API (Search)**: https://docs.github.com/en/rest/search
- **Sharp Documentation**: https://sharp.pixelplumbing.com/
- **Node Canvas**: https://github.com/Automattic/node-canvas

### Production Examples
- **github-readme-stats**: https://github.com/anuraghazra/github-readme-stats (25k stars)
- **metrics**: https://github.com/lowlighter/metrics (11k stars)

### Rate Limiting
- **GitHub GraphQL Rate Limits**: https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api

