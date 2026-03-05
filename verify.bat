@echo off
REM Verification script for ASTRA Library Management System

echo.
echo ============================================
echo  ASTRA - System Verification
echo ============================================
echo.

setlocal enabledelayedexpansion

REM Colors would be nice but cmd.bat doesn't support it easily
REM So we'll use simple check marks

set checks_passed=0
set checks_failed=0

REM Check 1: Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Node.js is not installed
    set /a checks_failed+=1
) else (
    for /f "tokens=*" %%A in ('@node --version') do (
        echo [PASS] Node.js %%A
        set /a checks_passed+=1
    )
)

REM Check 2: npm
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] npm is not installed
    set /a checks_failed+=1
) else (
    for /f "tokens=*" %%A in ('@npm --version') do (
        echo [PASS] npm %%A
        set /a checks_passed+=1
    )
)

REM Check 3: Backend files exist
echo.
echo Checking Backend structure...
if exist "Backend\src\server.js" (
    echo [PASS] Backend\src\server.js exists
    set /a checks_passed+=1
) else (
    echo [FAIL] Backend\src\server.js NOT found
    set /a checks_failed+=1
)

if exist "Backend\package.json" (
    echo [PASS] Backend\package.json exists
    set /a checks_passed+=1
) else (
    echo [FAIL] Backend\package.json NOT found
    set /a checks_failed+=1
)

if exist "Backend\.env" (
    echo [PASS] Backend\.env exists
    set /a checks_passed+=1
) else (
    echo [WARN] Backend\.env not found (copy from .env.example)
)

REM Check 4: Frontend files exist
echo.
echo Checking Frontend structure...
if exist "library\library\src\config\api.js" (
    echo [PASS] Frontend config\api.js exists
    set /a checks_passed+=1
) else (
    echo [FAIL] Frontend config\api.js NOT found
    set /a checks_failed+=1
)

if exist "library\library\src\pages\login.jsx" (
    echo [PASS] Frontend login.jsx exists
    set /a checks_passed+=1
) else (
    echo [FAIL] Frontend login.jsx NOT found
    set /a checks_failed+=1
)

if exist "library\library\.env" (
    echo [PASS] Frontend\.env exists
    set /a checks_passed+=1
) else (
    echo [WARN] Frontend\.env not found (created during setup)
)

REM Check 5: Database files exist
echo.
echo Checking Database structure...
if exist "Database\AstraUltimateprojectdb\tables\users.sql" (
    echo [PASS] Database users.sql exists
    set /a checks_passed+=1
) else (
    echo [FAIL] Database users.sql NOT found
    set /a checks_failed+=1
)

if exist "Database\AstraUltimateprojectdb\tables\BookDetails.sql" (
    echo [PASS] Database BookDetails.sql exists
    set /a checks_passed+=1
) else (
    echo [FAIL] Database BookDetails.sql NOT found
    set /a checks_failed+=1
)

REM Check 6: Dependencies installed
echo.
echo Checking dependencies...
if exist "Backend\node_modules" (
    echo [PASS] Backend dependencies installed
    set /a checks_passed+=1
) else (
    echo [WARN] Backend dependencies not installed (run setup.bat)
)

if exist "library\library\node_modules" (
    echo [PASS] Frontend dependencies installed
    set /a checks_passed+=1
) else (
    echo [WARN] Frontend dependencies not installed (run setup.bat)
)

REM Summary
echo.
echo ============================================
echo  Verification Summary
echo ============================================
echo Checks Passed: %checks_passed%
echo Checks Failed: %checks_failed%
echo.

if %checks_failed% gtr 0 (
    echo ERROR: Some checks failed!
    echo Please review the failures above and run setup.bat
    pause
    exit /b 1
) else (
    echo SUCCESS: All critical checks passed!
    echo.
    echo Next steps:
    echo 1. Make sure MySQL is running
    echo 2. Set up database with scripts from Database folder
    echo 3. Edit Backend\.env with database credentials
    echo 4. Run Backend: cd Backend ^&^& npm run dev
    echo 5. Run Frontend: cd library\library ^&^& npm run dev
    echo.
    pause
    exit /b 0
)
