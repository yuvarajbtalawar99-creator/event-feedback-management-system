const Feedback = require('../models/feedback.model');

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Public
const getAllFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('event', 'title category date location')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit new feedback
// @route   POST /api/feedback
// @access  Public
const createFeedback = async (req, res, next) => {
  try {
    const { name, email, event, rating, message } = req.body;

    if (!name || !email || !event || !rating || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const feedback = await Feedback.create({ name, email, event, rating, message });
    const populated = await feedback.populate('event', 'title category date location');

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully!',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Public
const updateFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('event', 'title category date location');

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully!',
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Public
const deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully!',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get feedback stats
// @route   GET /api/feedback/stats
// @access  Public
const getFeedbackStats = async (req, res, next) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const avgRatingResult = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    const avgRating = avgRatingResult.length ? avgRatingResult[0].avgRating.toFixed(2) : 0;

    const ratingDistribution = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const feedbackPerEvent = await Feedback.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData',
        },
      },
      { $unwind: '$eventData' },
      {
        $group: {
          _id: '$eventData.title',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalFeedback,
        avgRating,
        ratingDistribution,
        feedbackPerEvent,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllFeedback, createFeedback, updateFeedback, deleteFeedback, getFeedbackStats };
