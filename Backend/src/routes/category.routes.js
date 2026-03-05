const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory } = require('../controllers/category.controller');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Public - get all categories
router.get('/', getAllCategories);

// Admin only - create category
router.post('/', authMiddleware, roleMiddleware('ADMIN'), createCategory);

module.exports = router;
