const express = require('express');
const router = express.Router();
const {
  getAllFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
} = require('../controllers/feedback.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/stats', getFeedbackStats);
router.get('/', getAllFeedback);
router.post('/', protect, createFeedback);

// Admin-only routes
router.put('/:id', protect, isAdmin, updateFeedback);
router.delete('/:id', protect, isAdmin, deleteFeedback);

module.exports = router;
