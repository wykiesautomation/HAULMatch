@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1 && (set "PY=py -3.11") || (set "PY=python")
if not exist ".venv\Scripts\python.exe" %PY% -m venv ".venv"
".venv\Scripts\python.exe" -m pip install --upgrade pip
".venv\Scripts\python.exe" -m pip install -r requirements.txt
".venv\Scripts\python.exe" -m pip uninstall -y bcrypt >nul 2>&1
if not exist .env copy .env.example .env >nul
start "" http://127.0.0.1:8080
".venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8080
if errorlevel 1 pause
