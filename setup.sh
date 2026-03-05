#!/bin/bash

# Setup script for ASTRA Library Management System

echo ""
echo "============================================"
echo "  ASTRA Library Management System Setup"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed."
    exit 1
fi

echo "✅ npm detected: $(npm --version)"

# Backend Setup
echo ""
echo "--- Backend Setup ---"
cd Backend
if [ -d "node_modules" ]; then
    echo "✅ Backend dependencies already installed"
else
    echo "Installing backend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install backend dependencies"
        exit 1
    fi
fi

echo "✅ Backend setup complete"

# Frontend Setup
cd ../library/library
if [ -d "node_modules" ]; then
    echo "✅ Frontend dependencies already installed"
else
    echo "--- Frontend Setup ---"
    echo "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install frontend dependencies"
        exit 1
    fi
fi

echo "✅ Frontend setup complete"

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Set up the database:"
echo "   - Open MySQL command line"
echo "   - Run: SOURCE Database/AstraUltimateprojectdb/tables/users.sql;"
echo "   - Run: SOURCE Database/AstraUltimateprojectdb/tables/BookDetails.sql;"
echo "   - Run: SOURCE Database/AstraUltimateprojectdb/tables/categories.sql;"
echo "   - Run: SOURCE Database/AstraUltimateprojectdb/tables/Bookcopies.sql;"
echo ""
echo "2. Configure Backend:"
echo "   - Edit Backend/.env with your database credentials"
echo ""
echo "3. Start Backend:"
echo "   - cd Backend"
echo "   - npm run dev"
echo ""
echo "4. Start Frontend (new terminal):"
echo "   - cd library/library"
echo "   - npm run dev"
echo ""
echo "5. Open http://localhost:5173 in your browser"
echo ""
