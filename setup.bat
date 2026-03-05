@echo off
REM Setup script for ASTRA Library Management System

echo.
echo ============================================
echo  ASTRA Library Management System Setup
echo ============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if MySQL is installed
mysql --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: MySQL might not be in PATH. Make sure MySQL is running.
)

echo.
echo --- Backend Setup ---
cd Backend
if exist node_modules (
    echo ✅ Backend dependencies already installed
) else (
    echo Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)

echo ✅ Backend setup complete

REM Go back to root
cd ..

echo.
echo --- Frontend Setup ---
cd library\library
if exist node_modules (
    echo ✅ Frontend dependencies already installed
) else (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

echo ✅ Frontend setup complete

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Set up the database:
echo    - Open MySQL command line
echo    - Run: SOURCE Database\AstraUltimateprojectdb\tables\users.sql;
echo    - Run: SOURCE Database\AstraUltimateprojectdb\tables\BookDetails.sql;
echo    - Run: SOURCE Database\AstraUltimateprojectdb\tables\categories.sql;
echo    - Run: SOURCE Database\AstraUltimateprojectdb\tables\Bookcopies.sql;
echo.
echo 2. Configure Backend:
echo    - Edit Backend\.env with your database credentials
echo.
echo 3. Start Backend:
echo    - cd Backend
echo    - npm run dev
echo.
echo 4. Start Frontend (new terminal):
echo    - cd library\library
echo    - npm run dev
echo.
echo 5. Open http://localhost:5173 in your browser
echo.
pause
