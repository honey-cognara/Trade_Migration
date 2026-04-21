@echo off
title Backend - FastAPI

set ROOT=%~dp0
set PYTHON=C:\Users\SAIF\AppData\Local\Programs\Python\Python314\python.exe

echo.
echo  ============================================
echo   Starting Backend on http://localhost:8000
echo   Swagger UI : http://localhost:8000/docs
echo  ============================================
echo.

:: Start backend in a new window
start "Backend - FastAPI" cmd /k "cd /d "%ROOT%" && title Backend - FastAPI && echo. && echo  Backend running on http://localhost:8000 && echo  Swagger UI : http://localhost:8000/docs && echo  Press Ctrl+C to stop. && echo. && "%PYTHON%" -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait 3 seconds for the server to start, then open Swagger UI
timeout /t 3 /nobreak >nul
start "" "http://localhost:8000/docs"

echo  Backend started. Swagger UI opened in browser.
echo.
