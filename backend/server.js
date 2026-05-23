require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const eventRoutes = require('./routes/event.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const authRoutes = require('./routes/auth.routes');
const errorMiddleware = require('./middleware/error.middleware');
const Event = require('./models/event.model');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Connect to MongoDB ─────────────────────────────────────────────────────
connectDB();

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (dev) ────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Serve Frontend ──────────────────────────────────────────────────────────
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Root Route ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Event Feedback Management System API is running!',
    version: '1.0.0',
    endpoints: {
      events: '/api/events',
      seedEvents: 'POST /api/events/seed',
      feedback: '/api/feedback',
      feedbackStats: '/api/feedback/stats',
    },
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/events', eventRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Middleware ─────────────────────────────────────────────────────────
app.use(errorMiddleware);

// ─── Auto-seed on startup ─────────────────────────────────────────────────────
const autoSeed = async () => {
  try {
    const count = await Event.countDocuments();
    if (count === 0) {
      const { seedEvents } = require('./controllers/event.controller');
      // Trigger seed via direct import (simulate request)
      const Event = require('./models/event.model');
      const sampleEvents = [
        {
          title: 'AI Workshop 2026',
          image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop&q=60',
          description: 'Dive deep into Artificial Intelligence with hands-on workshops covering machine learning, neural networks, and generative AI.',
          location: 'San Francisco Convention Center, CA',
          date: new Date('2026-07-15'),
          category: 'Technology',
        },
        {
          title: 'Cloud Computing Summit',
          image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=60',
          description: 'Explore cutting-edge cloud solutions from AWS, Azure, and GCP. Learn about serverless architectures and cloud security.',
          location: 'Seattle Tech Hub, WA',
          date: new Date('2026-08-22'),
          category: 'Technology',
        },
        {
          title: 'Blockchain Expo',
          image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&auto=format&fit=crop&q=60',
          description: 'The premier blockchain event covering DeFi, NFTs, Web3 development, and enterprise blockchain solutions.',
          location: 'Miami Beach Convention Center, FL',
          date: new Date('2026-09-10'),
          category: 'Technology',
        },
        {
          title: 'Full Stack Bootcamp',
          image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60',
          description: 'An intensive 3-day bootcamp covering modern full-stack development with React, Node.js, MongoDB, and DevOps practices.',
          location: 'Austin Innovation Campus, TX',
          date: new Date('2026-10-05'),
          category: 'Education',
        },
      ];
      await Event.insertMany(sampleEvents);
      console.log('✅ Auto-seeded 4 sample events into the database.');
    }
  } catch (err) {
    console.error('❌ Auto-seed failed:', err.message);
  }
};

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: eventFeedbackDB\n`);
  // Give mongoose a moment to connect before seeding
  setTimeout(autoSeed, 2000);
});
