@echo off
chcp 65001 >nul
title TLiFlashManager Dev Server
cd /d "%~dp0"

echo ================================================================
echo    TLiFlashManager - 개발자 실시간 수정 모드 (Hot Reload)
echo ================================================================
echo.

start "" "http://localhost:5173"
call npm run dev -- --port 5173 --host
pause
