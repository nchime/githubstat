#!/bin/bash

echo "🧪 GitHub Stats Extended - 로컬 서버"
echo "===================================="
echo ""

if [ ! -f .env.local ]; then
  echo "❌ 에러: .env.local 파일이 없습니다"
  echo ""
  echo "GitHub Personal Access Token을 생성하세요:"
  echo "1. https://github.com/settings/tokens/new 접속"
  echo "2. Token name: github-stats-test"
  echo "3. Scope: public_repo 선택"
  echo "4. Generate token 클릭"
  echo ""
  echo "그 다음 .env.local 파일 생성:"
  echo "  echo 'GITHUB_TOKEN=ghp_XXXX' > .env.local"
  echo ""
  exit 1
fi

echo "✅ .env.local 파일 확인 완료"
echo ""

if [ ! -d "node_modules" ]; then
  echo "📦 의존성 설치 중..."
  npm install
  echo ""
fi

echo "✅ 준비 완료!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 로컬 서버 시작..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

node local-server.js
