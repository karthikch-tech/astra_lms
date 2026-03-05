const express = require('express');
const router = express.Router();
const {
  addCopies,
  getCopies,
  updateStatus,
  deleteCopyHandler,
  searchCopy,
} = require('../controllers/copy.controller');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Public search
router.get('/search', searchCopy);

// Public - get book copies
router.get('/:bookId', getCopies);

// Admin only - add copies
router.post('/:bookId', authMiddleware, roleMiddleware('ADMIN'), addCopies);
router.patch('/:copyId', authMiddleware, roleMiddleware('ADMIN'), updateStatus);
router.delete('/:copyId', authMiddleware, roleMiddleware('ADMIN'), deleteCopyHandler);

module.exports = router;
