const express = require('express');
const router = express.Router();
const {
  create,
  getAll,
  getById,
  update,
  deleteOne,
  searchSuggestions,
  availability,
} = require('../controllers/book.controller');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Public routes
router.get('/', getAll);
router.get('/suggest', searchSuggestions);
router.get('/availability', availability);
router.get('/:id', getById);

// Admin only routes
router.post('/', authMiddleware, roleMiddleware('ADMIN'), create);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), update);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteOne);

module.exports = router;
