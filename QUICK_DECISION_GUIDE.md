# GitHub Stats Visualization - Quick Decision Guide

## TL;DR: Build & Deploy Path

### Image Format: **SVG (Text-based, not binary)**
- ✅ Proven by github-readme-stats (25k stars)
- ✅ Smaller bandwidth, infinitely scalable
- ✅ Easy text rendering for stats
- ❌ Don't use Canvas/PNG for simple stats (over-engineered)

### GitHub API: **GraphQL with REST fallback**
```graphql
# Single query gets everything
query userInfo($login: String!) {
  user(login: $login) {
    contributionsCollection { totalCommitContributions }
    pullRequests(first: 1) { totalCount }
    issues(states: OPEN) { totalCount }
    issues(states: CLOSED) { totalCount }
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER) {
      totalCount
      nodes { name stargazers { totalCount } }
    }
  }
}
```

**Fallback to REST** only for:
```
GET /search/commits?q=author:{username}
# → Needed because GraphQL doesn't expose raw commit count
```

### Caching: **HTTP Headers + Redis**
```javascript
// HTTP Headers
res.setHeader('Cache-Control', 'public, max-age=86400');  // 24 hours
res.setHeader('Content-Type', 'image/svg+xml');
res.setHeader('ETag', contentHash);

// Optional Redis for high traffic
await redis.setEx(`stats:${username}`, 86400, JSON.stringify(data));
```

### Image Library Stack: **Only if PNG needed**
- Default: Pure SVG string (no library)
- If PNG required: **Sharp** (`npm install sharp@^0.32.3`)

```javascript
// This is all you need for SVG
const svg = `
  <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
    <text x="20" y="30">${stats.contributions} Contributions</text>
  </svg>
`;

// If PNG needed, use Sharp
const png = await sharp(Buffer.from(svg))
  .png()
  .toBuffer();
```

### Deployment: **Vercel or AWS Lambda**
- **Fast, No Config**: Vercel (free tier)
- **Cost Effective**: Railway ($5/mo)
- **Scale Ready**: AWS Lambda
- **DIY**: Docker + VPS

### Libraries to Install
```bash
npm install axios dotenv               # API client
npm install node-cache                  # In-memory cache (optional)
# Sharp only if PNG: npm install sharp
```

### Checklist for Implementation

- [ ] Create GraphQL query (see GITHUB_STATS_RESEARCH.md section 1)
- [ ] Create stats fetcher with retry logic
- [ ] Create SVG renderer function
- [ ] Add cache layer (NodeCache or Redis)
- [ ] Set response headers (Content-Type, Cache-Control)
- [ ] Handle rate limiting (exponential backoff)
- [ ] Deploy to Vercel/Railway
- [ ] Test with GitHub token

### Key Files to Study
- github-readme-stats stats fetcher: https://github.com/anuraghazra/github-readme-stats/blob/54a7985aeefda00d5eadb55b80c17c7f976c37d2/src/fetchers/stats.js
- github-readme-stats Card renderer: https://github.com/anuraghazra/github-readme-stats/blob/54a7985aeefda00d5eadb55b80c17c7f976c37d2/src/common/Card.js
- github-readme-stats API endpoint: https://github.com/anuraghazra/github-readme-stats/blob/54a7985aeefda00d5eadb55b80c17c7f976c37d2/api/index.js

---

## Performance Expectations

| Metric | Value |
|--------|-------|
| **Request Time (Cached)** | <50ms |
| **Request Time (Fresh)** | 500-2000ms |
| **File Size (SVG)** | 3-8KB |
| **GitHub API Calls/Hour** | ~2000 (at scale) |
| **Recommended Cache TTL** | 24 hours |

## Answers to Your 3 Questions

### 1. Image Format Decision
**Recommendation**: SVG (text-based generation)
- **Why**: github-readme-stats proves it works at 25k stars, lightweight, scalable
- **Alternative**: Sharp for PNG if you need CDN distribution

### 2. Reliable GitHub API Endpoints
**Primary**: GraphQL `user` query with `contributionsCollection`, `pullRequests`, `issues`, `repositories`
**Fallback**: REST `/search/commits` for total commits

**Most Reliable Stats** (tested in production):
- Total contributions ✅
- Total commits ✅ (via REST)
- PR count ✅
- Issue count ✅
- Repo count & stars ✅
- Followers ✅

### 3. Build vs. Buy Decision
**Build Custom** if:
- You need unique visualizations
- Custom themes/branding important
- Want full control
- Timeline: 2-3 weeks

**Use Existing** if:
- Want something working immediately
- github-readme-stats meets 90% of needs
- Integration with existing system

**Hybrid Approach** (Best):
1. Start with github-readme-stats structure (proven, tested)
2. Fork anuraghazra/github-readme-stats
3. Customize SVG rendering for your needs
4. Deploy to your own serverless

---

## Cost Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| **Vercel (Free)** | $0 | 100K invocations/month included |
| **Railway** | $5-20/mo | Good balance of cost & features |
| **AWS Lambda** | $0-15/mo | Only pay for what you use |
| **Redis** (optional) | $0-30/mo | Only needed at scale (>1M req/mo) |
| **Domain** | $10/yr | Optional |
| **GitHub Token** | $0 | Free personal token included |

**Total minimum cost**: $0 (Vercel free tier) to $5-20/mo (small instance)

