#!/bin/bash

echo "🧪 GitHub Stats Local Test Script"
echo "=================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# .env.local 확인
if [ ! -f .env.local ]; then
  echo -e "${RED}❌ .env.local 파일이 없습니다${NC}"
  echo ""
  echo "GitHub Personal Access Token을 생성하세요:"
  echo "1. https://github.com/settings/tokens/new 접속"
  echo "2. Token name: github-stats-test"
  echo "3. Scope: public_repo 선택"
  echo "4. Generate token 클릭"
  echo ""
  echo "그 다음 .env.local 파일 생성:"
  echo "  echo 'GITHUB_TOKEN=ghp_XXXX' > .env.local"
  exit 1
fi

echo -e "${GREEN}✅ .env.local 파일 확인 완료${NC}"
echo ""

# npm 확인
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm이 설치되지 않았습니다${NC}"
  exit 1
fi

echo -e "${GREEN}✅ npm 확인 완료${NC}"
echo ""

# 의존성 확인
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  의존성이 없습니다. 설치 중...${NC}"
  npm install
  echo ""
fi

echo -e "${GREEN}✅ 로컬 서버 시작 준비 완료${NC}"
echo ""
echo "다음 명령어로 서버를 시작하세요:"
echo ""
echo -e "${YELLOW}npm run dev${NC}"
echo ""
echo "서버가 시작되면 다음 URL들을 테스트하세요:"
echo ""
echo "기본 테스트:"
echo "  http://localhost:3000/api/stats?username=torvalds"
echo ""
echo "테마 테스트:"
echo "  http://localhost:3000/api/stats?username=torvalds&theme=dark"
echo "  http://localhost:3000/api/stats?username=torvalds&theme=light"
echo "  http://localhost:3000/api/stats?username=torvalds&theme=blue"
echo ""
echo "색상 커스터마이징:"
echo "  http://localhost:3000/api/stats?username=torvalds&bg_color=1e1b4b&text_color=e0e7ff"
echo ""
echo "에러 처리 테스트:"
echo "  http://localhost:3000/api/stats?username=invalid-user-xyz"
echo ""
