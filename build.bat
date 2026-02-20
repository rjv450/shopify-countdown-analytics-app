@echo off
REM Build script for Countdown Timer App (Windows)

echo 🔨 Building Countdown Timer App...

REM Check if .env file exists
if not exist ".env" (
    if not exist "app\.env" (
        echo ⚠️  Warning: No .env file found. Creating from .env.example...
        if exist ".env.example" (
            copy .env.example .env
            echo ✅ Created .env file from .env.example
            echo 📝 Please update .env with your actual values
        )
    )
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Build frontend
echo 🎨 Building frontend...
cd app\frontend
call npm install
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    exit /b 1
)
call npm run build
if errorlevel 1 (
    echo ❌ Failed to build frontend
    exit /b 1
)
cd ..\..

REM Build extension
echo 🔌 Building extension...
cd extensions\countdown-timer
call npm install
if errorlevel 1 (
    echo ❌ Failed to install extension dependencies
    exit /b 1
)
call npm run build
if errorlevel 1 (
    echo ❌ Failed to build extension
    exit /b 1
)
cd ..\..

echo ✅ Build complete!
echo.
echo 📁 Build outputs:
echo    - Frontend: app\frontend\dist\
echo    - Extension: extensions\countdown-timer\assets\






