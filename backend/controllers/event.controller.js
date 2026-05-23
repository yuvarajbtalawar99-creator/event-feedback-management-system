const Event = require('../models/event.model');

const sampleEvents = [
  {
    title: 'AI Workshop 2026',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop&q=60',
    description:
      'Dive deep into Artificial Intelligence with hands-on workshops covering machine learning, neural networks, and generative AI. Perfect for developers and data scientists looking to upskill.',
    location: 'San Francisco Convention Center, CA',
    date: new Date('2026-07-15'),
    category: 'Technology',
  },
  {
    title: 'Cloud Computing Summit',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=60',
    description:
      'Explore cutting-edge cloud solutions from AWS, Azure, and GCP. Learn about serverless architectures, cloud security, and cost optimization strategies from industry experts.',
    location: 'Seattle Tech Hub, WA',
    date: new Date('2026-08-22'),
    category: 'Technology',
  },
  {
    title: 'Blockchain Expo',
    image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&auto=format&fit=crop&q=60',
    description:
      'The premier blockchain event covering DeFi, NFTs, Web3 development, and enterprise blockchain solutions. Network with founders, investors, and developers shaping the decentralized future.',
    location: 'Miami Beach Convention Center, FL',
    date: new Date('2026-09-10'),
    category: 'Technology',
  },
  {
    title: 'Full Stack Bootcamp',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60',
    description:
      'An intensive 3-day bootcamp covering modern full-stack development with React, Node.js, MongoDB, and DevOps practices. Build real-world projects and level up your career.',
    location: 'Austin Innovation Campus, TX',
    date: new Date('2026-10-05'),
    category: 'Education',
  },
];

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed sample events
// @route   POST /api/events/seed
// @access  Public
const seedEvents = async (req, res, next) => {
  try {
    const count = await Event.countDocuments();
    if (count > 0) {
      return res.status(200).json({
        success: true,
        message: `Database already has ${count} events. Skipping seed.`,
        data: await Event.find(),
      });
    }
    const events = await Event.insertMany(sampleEvents);
    res.status(201).json({
      success: true,
      message: `✅ ${events.length} events seeded successfully!`,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Public
const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Public
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents, getEventById, seedEvents, createEvent, deleteEvent };
