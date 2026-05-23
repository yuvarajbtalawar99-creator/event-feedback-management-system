const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  seedEvents,
  createEvent,
  deleteEvent,
} = require('../controllers/event.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/seed', seedEvents);

// Admin-only routes
router.post('/', protect, isAdmin, createEvent);
router.delete('/:id', protect, isAdmin, deleteEvent);

module.exports = router;
