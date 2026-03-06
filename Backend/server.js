const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const errorMiddleware = require('./src/middleware/error');
const apiKeyMiddleware = require('./src/middleware/apiKey');
const db = require('./src/config/db');

const authRoutes = require('./src/routes/auth.routes');
const bookRoutes = require('./src/routes/book.routes');
const categoryRoutes = require('./src/routes/category.routes');
const copyRoutes = require('./src/routes/copy.routes');
const userRoutes = require('./src/routes/user.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '50mb';

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = allowedOrigins.length
  ? {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }
  : {
      origin: true,
      credentials: true,
    };

const cors = require("cors");
app.use(cors(corsOptions));
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
  });
});

let dbInitializationPromise = null;

const initializeApp = async () => {
  if (!dbInitializationPromise) {
    dbInitializationPromise = db
      .initializeDatabase()
      .then(() => {
        console.log('✅ Database initialized successfully');
      })
      .catch((error) => {
        dbInitializationPromise = null;
        throw error;
      });
  }

  return dbInitializationPromise;
};

app.use(async (req, res, next) => {
  try {
    await initializeApp();
    next();
  } catch (error) {
    console.error('❌ Failed to initialize app:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server initialization failed',
    });
  }
});

app.use('/api', apiKeyMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/copies', copyRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorMiddleware);

if (process.env.VERCEL !== '1') {
  initializeApp()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    });
}

module.exports = app;