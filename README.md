# GitHub Stats Extended

GitHub 프로필을 위한 커스터마이저블한 GitHub 통계 SVG 카드 생성기입니다.

## 🎯 기능

- **8가지 통계 항목**: Contributions, Commits, PRs, Issues, PR Reviews, Repositories, Stars, Last Year Activity
- **5개 기본 테마**: Dark, Light, Blue, Purple, GitHub
- **커스터마이징**: 테마, 배경색, 텍스트색 사용자 정의 가능
- **빠른 응답**: SVG 직접 생성으로 초고속 로딩
- **캐싱**: 24시간 자동 캐싱으로 GitHub API 효율적 사용
- **Rate Limiting**: DDoS 방지를 위한 IP 기반 요청 제한

## 📦 설치 및 배포

### 사전 요구사항

- Node.js 18+
- Vercel 계정
- GitHub Personal Access Token (PAT)

### 로컬 개발

```bash
npm install
cp .env.example .env.local

# GitHub PAT 설정
# https://github.com/settings/tokens 에서 Personal Access Token 생성
# public_repo 스코프만 필요

npm run dev
```

### Vercel 배포

```bash
npm install -g vercel
vercel login

# GitHub Token 환경변수 설정
vercel env add GITHUB_TOKEN

vercel deploy
```

## 🚀 사용법

### 기본 사용

```html
<img src="https://github-stats-extended.vercel.app/api/stats?username=nchime" alt="GitHub Stats" />
```

### 테마 선택

```html
<!-- Dark theme (기본값) -->
<img src="https://github-stats-extended.vercel.app/api/stats?username=nchime&theme=dark" />

<!-- Light theme -->
<img src="https://github-stats-extended.vercel.app/api/stats?username=nchime&theme=light" />

<!-- Blue theme -->
<img src="https://github-stats-extended.vercel.app/api/stats?username=nchime&theme=blue" />

<!-- Purple theme -->
<img src="https://github-stats-extended.vercel.app/api/stats?username=nchime&theme=purple" />

<!-- GitHub theme -->
<img src="https://github-stats-extended.vercel.app/api/stats?username=nchime&theme=github" />
```

### 색상 커스터마이징

```html
<!-- 배경색 및 텍스트색 지정 (16진수, # 제외) -->
<img src="https://github-stats-extended.vercel.app/api/stats?username=nchime&bg_color=1e1b4b&text_color=e0e7ff" />
```

### 캐시 새로고침

```html
<!-- 캐시 무시하고 최신 데이터 가져오기 (관리자용) -->
<img src="https://github-stats-extended.vercel.app/api/stats?username=nchime&refresh=1" />
```

## 📊 API 파라미터

| 파라미터 | 기본값 | 설명 |
|---------|-------|------|
| `username` | 필수 | GitHub 사용자명 |
| `theme` | `dark` | 테마 선택 (dark, light, blue, purple, github) |
| `bg_color` | - | 배경색 (16진수 6자리, # 제외) |
| `text_color` | - | 텍스트색 (16진수 6자리, # 제외) |
| `accent_color` | - | 강조색 (16진수 6자리, # 제외) |
| `lang` | `en` | 언어 선택 |
| `refresh` | - | 캐시 무시 (값: 1 또는 true) |

## 🔒 보안

- **Rate Limiting**: IP당 분당 30 요청 제한
- **입력 검증**: 사용자명 형식 검증
- **XSS 방지**: SVG 콘텐츠 이스케이프 처리
- **Token 보안**: GitHub PAT는 환경변수로만 관리

## 📈 성능

- **응답 시간**: < 500ms (캐시 히트 시 < 100ms)
- **캐시 TTL**: 24시간
- **SVG 크기**: ~2-3KB

## 🛠️ 기술 스택

- **Runtime**: Node.js (Vercel Functions)
- **언어**: TypeScript
- **GitHub API**: GraphQL (@octokit/graphql)
- **이미지**: SVG (직접 생성)

## 📝 라이선스

MIT

## 🤝 기여

이슈와 PR을 환영합니다!

## 📞 지원

문제 발생 시:
1. GitHub Issues에 문의하세요
2. `username` 파라미터 확인
3. GitHub API 상태 확인 (github.com/status)

## 🗺️ Roadmap

- [ ] Top Languages 카드
- [ ] Repository Stats 카드
- [ ] 한국어/일본어 지원
- [ ] 커스텀 테마 저장
- [ ] 통계 비교 기능
