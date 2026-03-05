# ⚡ QUICK START GUIDE - ASTRA LMS

## 🎯 What Was Fixed

| Issue | Status | File |
|-------|--------|------|
| Missing server.js | ✅ Created | `Backend/src/server.js` |
| Frontend not calling APIs | ✅ Fixed | `login.jsx`, `register.jsx` |
| JWT token not stored | ✅ Fixed | `AppContext.jsx` |
| Database schema mismatch | ✅ Fixed | All table files |
| SQL JOIN alias conflict | ✅ Fixed | `book.service.js` |
| API configuration missing | ✅ Created | `config/api.js` |

---

## 🚀 QUICK START (Windows)

```bash
# 1. Run setup script
setup.bat

# 2. Setup database (in MySQL)
mysql -u root -p
CREATE DATABASE astra_lms;
SOURCE Database\AstraUltimateprojectdb\tables\users.sql;
SOURCE Database\AstraUltimateprojectdb\tables\BookDetails.sql;
SOURCE Database\AstraUltimateprojectdb\tables\categories.sql;
SOURCE Database\AstraUltimateprojectdb\tables\Bookcopies.sql;

# 3. Edit Backend/.env with your database password

# 4. Start Backend (Terminal 1)
cd Backend
npm run dev

# 5. Start Frontend (Terminal 2)
cd library\library
npm run dev

# 6. Open browser to http://localhost:5173
```

---

## 🚀 QUICK START (Mac/Linux)

```bash
# 1. Run setup script
chmod +x setup.sh
./setup.sh

# Rest is same as Windows above
```

---

## 🔍 KEY FIXES EXPLAINED

### Fix 1: Missing Server Entry Point
**Before:** Backend couldn't start  
**After:** Created `src/server.js` with full Express setup including:
- CORS configuration
- Route mounting (auth, books, categories, copies)
- Error handling middleware
- Health check endpoint

### Fix 2: Frontend Authentication Broken
**Before:** Login form directly updated context without calling backend  
**After:** 
- Created `src/config/api.js` with centralized API calls
- Updated login.jsx to make actual API request
- Updated register.jsx to make actual API request
- Added error handling and loading states

### Fix 3: Database Schema Mismatch
**Before:** Code expected different column names than database had
**After:** Updated all 4 table schemas to match backend expectations:
```javascript
// Now all match:
Users: id, first_name, last_name, email, username, password_hash, role, is_deleted
Books: id, title, author, isbn, language, price, category_id, cover_image_url, is_deleted
Categories: id, name (table renamed to book_categories)
Copies: id, book_id, copy_code, status, is_deleted
```

### Fix 4: SQL JOIN Alias Conflict
**Before:** 
```sql
LEFT JOIN book_categories bc...
LEFT JOIN book_copies bc...  -- ❌ Same alias!
```
**After:** Used proper aliases `cat` and `cop`

### Fix 5: JWT Token Not Stored
**Before:** Context stored entire user object but no token
**After:** Context now stores and manages JWT token in localStorage

---

## 📝 FILES CREATED

```
├── Backend/
│   ├── src/server.js .................... ✨ NEW - Entry point
│   └── .env.example ..................... ✨ NEW - Config template
├── library/library/
│   ├── src/config/api.js ................ ✨ NEW - API configuration
│   ├── .env ............................ ✨ NEW - Frontend config
│   ├── src/pages/login.jsx .............. 🔧 UPDATED
│   ├── src/pages/register.jsx ........... 🔧 UPDATED
│   ├── src/context/AppContext.jsx ....... 🔧 UPDATED
│   └── src/context/AppProvider.jsx ...... 🔧 UPDATED
├── Database/AstraUltimateprojectdb/tables/
│   ├── users.sql ....................... 🔧 UPDATED
│   ├── BookDetails.sql ................. 🔧 UPDATED
│   ├── categories.sql .................. 🔧 UPDATED
│   └── Bookcopies.sql .................. 🔧 UPDATED
├── DEBUG_REPORT.md ..................... 📄 NEW - Full report
├── setup.bat ........................... 📄 NEW - Windows setup
└── setup.sh ............................ 📄 NEW - Linux/Mac setup
```

---

## ✅ VERIFICATION STEPS

After setup, test these:

1. **Backend Running:**
   ```bash
   curl http://localhost:5000/api/health
   # Should return: {"message":"API is running"}
   ```

2. **Frontend Loads:**
   - Open http://localhost:5173
   - Navbar should appear

3. **Registration Works:**
   - Click "Register"
   - Fill in form
   - Should create user and redirect

4. **Login Works:**
   - Click "Login"
   - Use registered credentials
   - Should redirect to profile

5. **Books Display:**
   - Navigate to home page
   - Should show books from database

6. **Token Storage:**
   - Open DevTools → Application → LocalStorage
   - Should see `token` and `user` keys

---

## 🐛 COMMON ERRORS & FIXES

| Error | Solution |
|-------|----------|
| `Cannot find module` | Run `npm install` |
| `ECONNREFUSED 127.0.0.1:3306` | Start MySQL service |
| `CORS error` | Check frontend .env has correct API_URL |
| `401 Unauthorized` | Token not being sent, check login |
| `404 Not Found` | Backend server not running |
| `SyntaxError in SQL` | Re-run table creation scripts |

---

## 📞 API ENDPOINTS (Ready to Use)

**Auth:**
- POST `/api/auth/register` - Create account
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get profile (requires token)

**Books:**
- GET `/api/books` - List all
- GET `/api/books/:id` - Get single book
- POST `/api/books` - Create (admin only)
- PUT `/api/books/:id` - Update (admin only)
- DELETE `/api/books/:id` - Delete (admin only)

**Categories:**
- GET `/api/categories` - List all
- POST `/api/categories` - Create (admin only)

**Copies:**
- GET `/api/copies/:bookId` - Get book copies
- POST `/api/copies/:bookId` - Add copies (admin only)
- PATCH `/api/copies/:copyId` - Update status
- DELETE `/api/copies/:copyId` - Delete (admin only)

---

## 🔐 SECURITY NOTES

1. Change `JWT_SECRET` in `.env` to a strong random value
2. Use strong database password in production
3. Never commit `.env` files to git
4. Enable HTTPS in production
5. Add rate limiting to login endpoint

---

**Your project is now fully debugged and ready to run!** 🎉

For detailed information, see `DEBUG_REPORT.md`
