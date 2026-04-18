#!/bin/bash
# PersonalFinance 프로젝트 초기 셋업 스크립트

set -e
echo "=== PersonalFinance 프로젝트 초기 설정 ==="

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Backend 설정
echo "[1/3] Backend 패키지 설치..."
cd "$PROJECT_DIR/backend"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Frontend 설정
echo "[2/3] Frontend 패키지 설치..."
cd "$PROJECT_DIR/frontend"
npm install

# 완료
echo "[3/3] 설정 완료!"
echo ""
echo "== 실행 방법 =="
echo "1) Docker로 전체 실행: cd $PROJECT_DIR && docker compose up -d"
echo "2) 개별 실행:"
echo "   - Backend: cd $PROJECT_DIR/backend && source venv/bin/activate && uvicorn main:app --reload"
echo "   - Frontend: cd $PROJECT_DIR/frontend && npm run dev"
echo ""
echo "== 접속 URL =="
echo "  웹: http://localhost:3000"
echo "  API: http://localhost:8000/docs"
