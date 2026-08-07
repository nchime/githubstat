# GitHub Stats Extended

<div align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT" />
</div>

<div align="center">
  <img src="https://img.shields.io/github/languages/count/nchime/githubstat?style=flat-square" alt="Languages" />
  <img src="https://img.shields.io/github/languages/top/nchime/githubstat?style=flat-square" alt="Top Language" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node >= 18" />
  <img src="https://img.shields.io/badge/vercel-%23000000?style=flat-square&logo=vercel&logoColor=white" alt="Deployed on Vercel" />
</div>

<div align="center">
  <img src="https://img.shields.io/github/repo-size/nchime/githubstat?style=flat-square" alt="Repo Size" />
  <img src="https://img.shields.io/github/stars/nchime/githubstat?style=flat-square" alt="Stars" />
  <img src="https://img.shields.io/github/forks/nchime/githubstat?style=flat-square" alt="Forks" />
  <img src="https://img.shields.io/github/watchers/nchime/githubstat?style=flat-square" alt="Watchers" />
  <img src="https://img.shields.io/github/contributors/nchime/githubstat?style=flat-square" alt="Contributors" />
  <img src="https://img.shields.io/github/issues/nchime/githubstat?style=flat-square" alt="Issues" />
  <img src="https://img.shields.io/github/issues-closed/nchime/githubstat?style=flat-square" alt="Closed Issues" />
  <img src="https://img.shields.io/github/issues-pr/nchime/githubstat?style=flat-square" alt="Pull Requests" />
  <img src="https://img.shields.io/github/issues-pr-closed/nchime/githubstat?style=flat-square" alt="Merged PRs" />
  <img src="https://img.shields.io/github/last-commit/nchime/githubstat?style=flat-square" alt="Last Commit" />
</div>


## 기능

- **11가지 통계 항목**: Total Contributions, Current Streak, Commits, Pull Requests, Issues, PR Reviews, Repositories, Stars, Last Year, Top Languages, Top Repository
- **5개 기본 테마**: Dark, Light, Blue, Purple, GitHub
- **세부 커스터마이징**: 배경/텍스트/강조/값/테두리 색상 개별 지정
- **조회 항목 선택**: `show`/`hide` 로 표시할 통계 필터링
- **스타일 옵션**: 너비, 모서리 라운드, 제목, 아이콘/헤더/푸터 표시 제어
- **아이콘**: Lucide SVG 아이콘 내장
- **빠른 응답**: SVG 직접 생성 초고속 로딩
- **캐싱**: 24시간 자동 캐싱
- **Rate Limiting**: IP 기반 요청 제한

## 설치 및 배포

### 사전 요구사항

- Node.js 18+
- GitHub Personal Access Token (PAT)

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일에 GitHub PAT 토큰을 입력합니다:

```bash
# .env.local
GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

GitHub PAT는 https://github.com/settings/tokens 에서 발급하며 `public_repo` 스코프만 필요합니다.

### 3. 로컬 서버 실행

#### 방법 A: 커스텀 로컬 서버 (권장)

```bash
npm run dev:local
# 또는
bash run-local.sh
```

#### 방법 B: Vercel 개발 서버

```bash
npm run dev
# Vercel CLI 필요: npm install -g vercel
```

서버가 뜨면 브라우저에서 확인합니다:

```
http://localhost:3000/api/stats?username=torvalds
http://localhost:3000/test.html
```

### Vercel 배포

```bash
npm install -g vercel
vercel login

# GitHub Token 환경변수 설정
vercel env add GITHUB_TOKEN

vercel deploy
```
## 사용법

### 기본 사용

```html
<img src="http://localhost:3000/api/stats?username=USERNAME" alt="GitHub Stats" />
```

### 테마 선택

```html
<!-- Dark (기본값) -->
<img src="...&theme=dark" />
<!-- Light -->
<img src="...&theme=light" />
<!-- Blue -->
<img src="...&theme=blue" />
<!-- Purple -->
<img src="...&theme=purple" />
<!-- GitHub -->
<img src="...&theme=github" />
```

### 조회 항목 선택

`show`로 표시할 항목만 지정하고, `hide`로 제외할 항목을 쉼표로 구분해 지정합니다.

```html
<!-- 원하는 항목만 표시 -->
<img src="...&username=USERNAME&show=streak,commits,stars" />

<!-- 특정 항목 제외 -->
<img src="...&username=USERNAME&hide=issues,last_year" />
```

### 색상 커스터마이징

16진수 6자리(`#` 제외)로 각 영역의 색상을 개별 지정할 수 있습니다.

```html
<img src="...&username=USERNAME&bg_color=1e1b4b&text_color=e0e7ff&accent_color=6366f1&success_color=34d399&border_color=1e293b" />
```

| 파라미터 | 설명 |
|---------|------|
| `bg_color` | 카드 배경색 |
| `text_color` | 라벨 텍스트색 |
| `accent_color` | 아이콘/제목 강조색 |
| `success_color` | 값 텍스트색 |
| `border_color` | 카드 테두리색 |

### 스타일 옵션

```html
<!-- 커스텀 제목 -->
<img src="...&username=USERNAME&title=My%20Profile" />
<!-- 너비 + 모서리 라운드 -->
<img src="...&username=USERNAME&width=520&border_radius=16" />
<!-- 아이콘/헤더/푸터 숨기기 -->
<img src="...&username=USERNAME&hide_icons=1&hide_title=1&hide_footer=1" />
```

### 캐시 새로고침

```html
<!-- 캐시 무시하고 최신 데이터 가져오기 (관리자용) -->
<img src="...&username=USERNAME&refresh=1" />
```

## API 파라미터

| 파라미터 | 기본값 | 설명 |
|---------|-------|------|
| `username` | 필수 | GitHub 사용자명 |
| `theme` | `dark` | 테마 (dark, light, blue, purple, github) |
| `bg_color` | - | 배경색 (16진수 6자리, `#` 제외) |
| `text_color` | - | 텍스트색 |
| `accent_color` | - | 아이콘/제목 강조색 |
| `success_color` | - | 값 텍스트색 |
| `border_color` | - | 테두리색 |
| `show` | 전체 | 표시할 항목 (쉼표 구분) |
| `hide` | - | 제외할 항목 (쉼표 구분) |
| `width` | `440` | 카드 너비 (200~1000) |
| `border_radius` | `10` | 모서리 라운드 (0~50) |
| `title` | 사용자명 | 커스텀 제목 |
| `hide_icons` | - | 아이콘 숨기기 (1) |
| `hide_title` | - | 제목 숨기기 (1) |
| `hide_footer` | - | 업데이트 날짜 숨기기 (1) |
| `refresh` | - | 캐시 무시 (1 또는 true) |

### 조회 항목 키 (show / hide)

| 키 | 항목 |
|----|------|
| `total_contributions` | Total Contributions |
| `streak` | Current Streak |
| `commits` | Commits |
| `pull_requests` | Pull Requests |
| `issues` | Issues |
| `pr_reviews` | PR Reviews |
| `repositories` | Repositories |
| `stars` | Stars Earned |
| `last_year` | Last Year |
| `languages` | Top Languages |
| `top_repo` | Top Repository |

## 보안

- **Rate Limiting**: IP당 분당 30 요청 제한
- **입력 검증**: 사용자명 형식 검증
- **XSS 방지**: SVG 콘텐츠 이스케이프 처리
- **Token 보안**: GitHub PAT는 환경변수로만 관리

## 성능

- **응답 시간**: < 500ms (캐시 히트 시 < 100ms)
- **캐시 TTL**: 24시간
- **SVG 크기**: ~2-3KB

## 기술 스택

- **Runtime**: Node.js (Vercel Functions)
- **언어**: TypeScript
- **GitHub API**: GraphQL (@octokit/graphql)
- **이미지**: SVG (직접 생성)

## 라이선스

MIT

## 기여

이슈와 PR을 환영합니다!

## 지원

문제 발생 시:
1. GitHub Issues에 문의하세요
2. `username` 파라미터 확인
3. GitHub API 상태 확인 (github.com/status)

## Roadmap

- [x] Top Languages 카드
- [x] Top Repository 카드
- [ ] 커스텀 테마 저장
- [ ] 통계 비교 기능
- [ ] 캘린더 시각화 (기여도 그래프)
