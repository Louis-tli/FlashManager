@echo off
chcp 65001 >nul
title TLiFlashManager Launcher
cd /d "%~dp0"

echo ================================================================
echo    TLiFlashManager - ARM Cortex-M0 TCON Flash Platform
echo ================================================================
echo.

if not exist "node_modules" (
    echo [알림] 필수 라이브러리를 설치합니다 (최초 1회 실행)...
    call npm install
)

if not exist "dist" (
    echo [알림] 프로젝트 빌드를 진행합니다...
    call npm run build
)

echo.
echo [1] 로컬 웹 서버 시작 중: http://localhost:5173
echo [2] 브라우저를 자동으로 엽니다...
echo [3] 종료하려면 이 콘솔 창에서 Ctrl + C 를 누르거나 창을 닫으세요.
echo.

start "" "http://localhost:5173"
call npm run preview -- --port 5173 --host
pause
