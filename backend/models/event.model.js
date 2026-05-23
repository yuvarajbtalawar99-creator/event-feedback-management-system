const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      enum: ['Technology', 'Business', 'Design', 'Science', 'Education', 'Other'],
      default: 'Technology',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);
