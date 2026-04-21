@echo off
title Tradie Migration App

set ROOT=C:\Users\SAIF\PycharmProjects\Trade_Migration_App
set PYTHON=C:\Users\SAIF\AppData\Local\Programs\Python\Python314\python.exe

echo.
echo  ============================================
echo   Tradie Migration App - Starting...
echo  ============================================
echo.

:: ── Start Backend (FastAPI + Uvicorn) ──────────────────────────────
echo  [1/2] Starting Backend on http://localhost:8000 ...
start "Backend - FastAPI" cmd /k "cd /d "%ROOT%" && title Backend - FastAPI && echo. && echo  Backend running on http://localhost:8000 && echo  API Docs: http://localhost:8000/docs && echo  Press Ctrl+C to stop. && echo. && "%PYTHON%" -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

:: small delay so backend starts before frontend
timeout /t 2 /nobreak >nul

:: ── Start Frontend (Vite) ───────────────────────────────────────────
echo  [2/2] Starting Frontend on http://localhost:5173 ...
start "Frontend - Vite" cmd /k "cd /d "%ROOT%\frontend" && title Frontend - Vite && echo. && echo  Frontend running on http://localhost:5173 && echo  Press Ctrl+C to stop. && echo. && npm run dev"

echo.
echo  ============================================
echo   Both servers are starting in new windows.
echo   Backend  : http://localhost:8000
echo   Frontend : http://localhost:5173
echo   API Docs : http://localhost:8000/docs
echo  ============================================
echo.
pause
