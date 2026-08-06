# 🧪 로컬 테스트 가이드

## 1️⃣ GitHub Personal Access Token 생성

### Step 1: GitHub 설정 페이지 접속
https://github.com/settings/tokens/new 로 이동

### Step 2: 토큰 생성 설정

```
Token name: github-stats-local-test
Expiration: 90 days (또는 No expiration)

Scopes 선택:
✅ public_repo (읽기 전용으로 충분)
```

> **⚠️ 주의**: 다른 스코프는 체크하지 마세요. `public_repo`만 필요합니다.

### Step 3: 토큰 복사
- "Generate token" 클릭
- 나타난 토큰 복사 (다시 보이지 않으니 안전한 곳에 저장)

---

## 2️⃣ 로컬 환경변수 설정

### `.env.local` 파일 생성

```bash
cd /Users/emart/develop/hermes/githubstat

# .env.local 파일에 토큰 추가
echo "GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXX" > .env.local
```

또는 텍스트 에디터로 직접 생성:

```bash
# .env.local 파일 내용
GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**✅ 확인:**
```bash
cat .env.local
# GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXX 출력됨
```

---

## 3️⃣ 로컬 개발 서버 시작

### 방법 A: npm run dev (권장)

```bash
npm run dev
```

**예상 출력:**
```
> github-stats-extended@1.0.0 dev
> vercel dev

Connecting to Vercel...
✓ Connected
Ready on http://localhost:3000
```

서버가 시작되면 `http://localhost:3000`에서 접근 가능합니다.

### 방법 B: 직접 실행 (npm이 없을 경우)

```bash
# 먼저 Vercel CLI 설치
npm install -g vercel

# 로컬 서버 시작
vercel dev
```

---

## 4️⃣ API 테스트

### 📱 브라우저에서 테스트 (가장 쉬움)

#### 기본 테스트
```
http://localhost:3000/api/stats?username=torvalds
```

> **결과:** SVG 이미지가 표시됩니다 (Linus Torvalds의 GitHub 통계)

#### 테마 테스트
```
http://localhost:3000/api/stats?username=torvalds&theme=dark
http://localhost:3000/api/stats?username=torvalds&theme=light
http://localhost:3000/api/stats?username=torvalds&theme=blue
http://localhost:3000/api/stats?username=torvalds&theme=purple
http://localhost:3000/api/stats?username=torvalds&theme=github
```

#### 색상 커스터마이징
```
http://localhost:3000/api/stats?username=torvalds&bg_color=1e1b4b&text_color=e0e7ff
http://localhost:3000/api/stats?username=gvanrossum&bg_color=0d1117&text_color=ffffff
```

#### 에러 처리 테스트
```
http://localhost:3000/api/stats?username=invalid-user-name-that-doesnt-exist-xyz123
```

> **결과:** "User not found" 메시지가 SVG로 표시됩니다

#### 캐시 새로고침
```
http://localhost:3000/api/stats?username=torvalds&refresh=1
```

> **결과:** 캐시를 무시하고 새로운 데이터 조회

---

### 🖥️ 커맨드 라인에서 테스트 (curl)

#### 기본 요청
```bash
curl "http://localhost:3000/api/stats?username=torvalds" \
  -H "Accept: image/svg+xml"
```

#### 응답 헤더 확인
```bash
curl -i "http://localhost:3000/api/stats?username=torvalds"
```

**예상 응답 헤더:**
```
HTTP/1.1 200 OK
Content-Type: image/svg+xml
Cache-Control: public, max-age=3600
X-Cache: HIT (또는 MISS)
```

#### SVG 파일로 저장
```bash
curl "http://localhost:3000/api/stats?username=torvalds" \
  -o stats.svg

# SVG 파일 확인
open stats.svg  # macOS
# 또는
firefox stats.svg  # Linux
```

#### 여러 사용자 테스트
```bash
curl "http://localhost:3000/api/stats?username=torvalds" > torvalds.svg
curl "http://localhost:3000/api/stats?username=gvanrossum" > gvanrossum.svg
curl "http://localhost:3000/api/stats?username=octocat" > octocat.svg
```

---

### 🔧 고급 테스트 (Node.js)

#### `test.js` 파일 생성

```javascript
// test.js
const http = require('http');

async function testAPI(username, theme = 'dark') {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:3000/api/stats?username=${username}&theme=${theme}`;
    
    http.get(url, (res) => {
      console.log(`✅ ${username} (${theme}): ${res.statusCode}`);
      console.log(`   Content-Type: ${res.headers['content-type']}`);
      console.log(`   Cache: ${res.headers['x-cache']}`);
      resolve();
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 GitHub Stats API Test\n');
  
  // 기본 테스트
  await testAPI('torvalds', 'dark');
  await testAPI('torvalds', 'light');
  await testAPI('gvanrossum', 'blue');
  
  console.log('\n✨ All tests completed!');
}

runTests().catch(console.error);
```

#### 실행
```bash
node test.js
```

**예상 출력:**
```
🧪 GitHub Stats API Test

✅ torvalds (dark): 200
   Content-Type: image/svg+xml
   Cache: MISS
✅ torvalds (light): 200
   Content-Type: image/svg+xml
   Cache: HIT
✅ gvanrossum (blue): 200
   Content-Type: image/svg+xml
   Cache: MISS

✨ All tests completed!
```

---

## 5️⃣ Rate Limiting 테스트

### 분당 30 요청 제한 확인

```bash
# 빠르게 40개 요청 실행
for i in {1..40}; do
  echo -n "Request $i: "
  curl -s "http://localhost:3000/api/stats?username=torvalds" \
    | grep -o "Rate limit exceeded\|GitHub Stats" | head -1
done
```

**예상 결과:**
```
Request 1: GitHub Stats
Request 2: GitHub Stats
...
Request 30: GitHub Stats
Request 31: Rate limit exceeded
Request 32: Rate limit exceeded
...
```

---

## 6️⃣ 캐싱 테스트

### 캐시 동작 확인

```bash
# 첫 요청 (캐시 미스)
curl -i "http://localhost:3000/api/stats?username=torvalds" | grep -i cache

# 두 번째 요청 (캐시 히트)
curl -i "http://localhost:3000/api/stats?username=torvalds" | grep -i cache

# 캐시 새로고침
curl -i "http://localhost:3000/api/stats?username=torvalds&refresh=1" | grep -i cache
```

**예상 결과:**
```
X-Cache: MISS     (첫 요청)
X-Cache: HIT      (두 번째 요청)
X-Cache: MISS     (refresh=1 요청)
```

---

## 7️⃣ 성능 테스트

### 응답 시간 측정

```bash
# macOS/Linux
time curl -s "http://localhost:3000/api/stats?username=torvalds" > /dev/null

# Windows PowerShell
Measure-Command { curl "http://localhost:3000/api/stats?username=torvalds" }
```

**예상 결과:**
```
real    0m0.XXXs  (첫 요청: 300-500ms)
real    0m0.XXXs  (캐시 히트: 50-100ms)
```

---

## 8️⃣ 브라우저 DevTools 테스트

### Chrome/Firefox에서 테스트

1. `http://localhost:3000/api/stats?username=torvalds` 접속
2. **F12** 키로 DevTools 열기
3. **Network** 탭 확인:
   - **Headers**: `Content-Type: image/svg+xml`
   - **Response**: SVG 마크업 보임
   - **Size**: ~2-3KB
   - **Time**: 300-500ms (첫 요청), 50-100ms (캐시)

---

## 🔍 문제 해결

### ❌ "GITHUB_TOKEN is not set" 에러

**원인:** `.env.local` 파일이 없거나 토큰이 설정되지 않음

**해결책:**
```bash
# .env.local 파일 확인
cat .env.local

# 파일이 없으면 생성
echo "GITHUB_TOKEN=your_token_here" > .env.local

# npm run dev 재시작
npm run dev
```

### ❌ "User not found" 에러

**원인:** GitHub 사용자가 존재하지 않거나 프로필이 비공개

**해결책:**
- 사용자명 확인 (대소문자 구분 없음)
- GitHub에서 해당 프로필이 공개 상태인지 확인
- 공개 프로필 사용: `torvalds`, `gvanrossum`, `octocat` 등

### ❌ "Rate limit exceeded" 에러

**원인:** IP당 분당 30 요청 초과

**해결책:**
- 1분 대기 후 재시도
- Rate limit 코드 로컬에서 재설정되지 않으므로 node 프로세스 재시작
```bash
# 현재 프로세스 중지 (Ctrl+C)
# 다시 시작
npm run dev
```

### ❌ "Cannot find module" 에러

**원인:** 의존성이 설치되지 않음

**해결책:**
```bash
npm install
npm run dev
```

### ❌ "Port 3000 is already in use" 에러

**원인:** 다른 프로세스가 포트 3000을 사용 중

**해결책:**
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# 또는 다른 포트 사용
PORT=3001 npm run dev
```

---

## 📊 테스트 체크리스트

모두 체크되면 로컬 테스트 완료:

- [ ] 토큰이 `.env.local`에 설정됨
- [ ] `npm run dev` 실행 가능
- [ ] `http://localhost:3000/api/stats?username=torvalds` 접속 가능
- [ ] SVG 이미지가 렌더링됨
- [ ] 다양한 테마 적용됨 (dark, light, blue, purple, github)
- [ ] 색상 커스터마이징 작동 (bg_color, text_color)
- [ ] 에러 처리 정상 (존재하지 않는 사용자)
- [ ] 캐싱 작동 (X-Cache 헤더 확인)
- [ ] Rate limiting 작동 (30개 요청 이상에서 제한)
- [ ] 응답 시간 적절 (< 500ms)

---

## 🎯 테스트 사용자 추천

GitHub의 공개 프로필을 가진 유명 개발자들:

```bash
# Linux 창시자
http://localhost:3000/api/stats?username=torvalds

# Python 창시자
http://localhost:3000/api/stats?username=gvanrossum

# GitHub mascot
http://localhost:3000/api/stats?username=octocat

# JavaScript 창시자
http://localhost:3000/api/stats?username=BrendanEich

# Ruby 창시자
http://localhost:3000/api/stats?username=matz
```

---

## 💡 팁

### IDE에서 즉시 테스트 (VS Code)

VS Code 확장 설치:
- **Thunder Client** 또는 **REST Client**

`.rest` 파일 생성:
```
GET http://localhost:3000/api/stats?username=torvalds
Accept: image/svg+xml

###

GET http://localhost:3000/api/stats?username=torvalds&theme=dark
Accept: image/svg+xml

###

GET http://localhost:3000/api/stats?username=torvalds&theme=light
Accept: image/svg+xml
```

파일을 열고 요청 옆의 "Send Request" 클릭

---

## ✨ 다음 단계

로컬 테스트가 완료되면:

1. ✅ Vercel에 배포
2. ✅ GitHub 저장소에 Push
3. ✅ 환경변수 설정
4. ✅ 프로덕션 테스트

배포 방법: `DEPLOYMENT_CHECKLIST.md` 참조

---

**이제 로컬에서 완벽하게 테스트할 준비가 되었습니다!** 🚀
