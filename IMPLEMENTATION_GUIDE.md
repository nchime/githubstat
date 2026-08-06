# 구현 가이드

## ✅ 완료된 항목

### Phase 1: MVP 완료 ✓

- [x] GitHub GraphQL API 통합
  - `lib/github.ts` - GitHub API 클라이언트
  - 사용자 통계 조회 GraphQL 쿼리
  - 지난 1년 활동 데이터 포함

- [x] 메모리 캐싱
  - `lib/cache.ts` - 24시간 TTL 캐시
  - 동시 요청 처리

- [x] SVG 생성
  - `lib/svg-generator.ts` - 8가지 통계 항목 표시
  - 에러 카드 생성

- [x] 테마 지원
  - `lib/themes.ts` - 5개 기본 테마
  - 색상 커스터마이징 가능

- [x] Rate Limiting
  - `api/stats.ts` - IP 기반 분당 30 요청 제한
  - DDoS 방지

- [x] 입력 검증
  - `lib/validators.ts` - 사용자명 형식 검증
  - 색상 검증

- [x] Vercel 배포 준비
  - TypeScript 설정
  - 환경변수 관리

## 🚀 배포하기

### Step 1: GitHub 저장소 생성

```bash
cd /Users/emart/develop/hermes/githubstat
git add .
git commit -m "Initial commit: GitHub stats MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/github-stats-extended.git
git push -u origin main
```

### Step 2: Vercel에서 프로젝트 생성

```bash
npm install -g vercel
vercel login
vercel link
```

### Step 3: 환경변수 설정

Vercel 대시보드에서:
1. Settings → Environment Variables
2. `GITHUB_TOKEN` 추가
   - GitHub에서 Personal Access Token 생성
   - https://github.com/settings/tokens
   - Scopes: `public_repo` 만 필요

```bash
vercel env add GITHUB_TOKEN
```

### Step 4: 배포

```bash
vercel deploy --prod
```

## 📋 배포 후 확인 체크리스트

- [ ] Vercel URL에서 API 동작 확인
  ```
  https://YOUR_PROJECT.vercel.app/api/stats?username=torvalds
  ```

- [ ] SVG 이미지가 정상 렌더링되는지 확인

- [ ] 다양한 사용자명으로 테스트
  ```
  ?username=torvalds
  ?username=gvanrossum
  ?username=invalid-user-123
  ```

- [ ] 테마 변경 테스트
  ```
  ?username=torvalds&theme=dark
  ?username=torvalds&theme=light
  ?username=torvalds&theme=blue
  ```

- [ ] 색상 커스터마이징 테스트
  ```
  ?username=torvalds&bg_color=1e1b4b&text_color=e0e7ff
  ```

- [ ] Rate Limiting 테스트
  ```
  // 빠르게 여러 번 요청 → 30개 이상에서 제한 메시지 표시
  ```

## 🔧 로컬 개발

### 로컬 서버 시작

```bash
npm run dev
```

접속: http://localhost:3000/api/stats?username=torvalds

### 타입 체크

```bash
npm run type-check
```

### 린트

```bash
npm run lint
```

## 📝 다음 단계 (Phase 2+)

### 추가 기능

1. **Vercel KV 캐싱** (선택사항)
   - 현재 메모리 캐싱만 사용
   - 대규모 트래픽 시 Vercel KV 추가

2. **Top Languages 카드**
   ```
   GET /api/langs?username=username
   ```

3. **Repository Stats 카드**
   ```
   GET /api/repos?username=username
   ```

4. **언어 지원**
   - 한국어 (ko)
   - 일본어 (ja)
   - 중국어 (zh)

5. **고급 테마**
   - 사용자 정의 테마 저장
   - 그라디언트 배경

## 🐛 트러블슈팅

### "User not found" 에러
- 사용자명 확인 (대소문자 구분 안 함)
- GitHub에서 공개 프로필인지 확인

### "Rate limit exceeded" 에러
- 1분 대기 후 재시도
- IP 주소 변경 시 리셋

### "GITHUB_TOKEN is not set" 에러
- Vercel 환경변수 확인
- `vercel env list` 확인

## 📊 성능 모니터링

Vercel 대시보드에서:
1. Deployments → Function Execution
2. Response time 확인
3. Error rate 모니터링

목표:
- 평균 응답 시간: < 500ms
- 캐시 히트율: > 80%
- 에러율: < 1%

## 📚 API 문서

### 엔드포인트

```
GET /api/stats
```

**파라미터:**
- `username` (필수): GitHub 사용자명
- `theme` (선택): dark, light, blue, purple, github
- `bg_color` (선택): 16진수 색상 (# 제외)
- `text_color` (선택): 16진수 색상 (# 제외)
- `refresh` (선택): 1 또는 true (캐시 무시)

**응답:**
- Content-Type: `image/svg+xml`
- Cache-Control: `public, max-age=3600` (캐시 미스 시)

**예제:**
```html
<img src="https://PROJECT.vercel.app/api/stats?username=torvalds&theme=dark" />
```

## 🎓 코드 구조

```
api/
  └── stats.ts           # 메인 API 핸들러

lib/
  ├── types.ts           # TypeScript 타입 정의
  ├── github.ts          # GitHub API 클라이언트
  ├── cache.ts           # 메모리 캐싱
  ├── themes.ts          # 테마 정의
  ├── svg-generator.ts   # SVG 렌더러
  └── validators.ts      # 입력 검증
```

각 파일의 책임:
- **types.ts**: 데이터 구조 정의
- **github.ts**: GitHub API 통신 (호출 최소화)
- **cache.ts**: 데이터 캐싱 (24시간 TTL)
- **themes.ts**: UI 테마 관리
- **svg-generator.ts**: SVG 마크업 생성
- **validators.ts**: 입력 검증 및 sanitization
- **stats.ts**: 요청 처리 및 조율

## 💡 설계 결정

### GraphQL 선택 이유
- REST API보다 효율적 (1번의 쿼리로 모든 데이터)
- 더 빠른 응답 시간
- 낮은 API 비용

### SVG 직접 생성 이유
- 의존성 최소 (0개)
- 빠른 생성 속도
- 브라우저 호환성

### 메모리 캐싱 이유 (현재)
- 초간단 구현
- 대부분 사용 사례에 충분
- Vercel 함수 인스턴스 당 24시간 TTL

### IP 기반 Rate Limiting 이유
- 사용자 인증 불필요
- DDoS 방지 효과적
- 구현 간단

---

**배포 완료 후 URL을 README에 추가하세요!** 🎉
