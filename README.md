# 🚀 EventPulse — Event Feedback Management System

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**A production-ready, full-stack Event Feedback Management System with a futuristic glassmorphism UI, real-time analytics, and complete CRUD operations.**

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Links & Demos](#-live-links--demos)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation Guide](#-installation-guide)
- [MongoDB Setup](#-mongodb-setup)
- [Environment Variables](#-environment-variables)
- [Run Commands](#-run-commands)
- [API Endpoints](#-api-endpoints)
- [Frontend Sections](#-frontend-sections)
- [Deployment Guide](#-deployment-guide)
- [Screenshots](#-screenshots)

---

## 🌟 Overview

**EventPulse** is a full-stack web application that enables event organisers to collect, manage, and visualise attendee feedback in real time. It features a modern **glassmorphism + neon** UI built as a **Single Page Application** (SPA) with Vanilla JavaScript — no frameworks required on the frontend.

The backend is built with **Node.js + Express + MongoDB** following the **MVC architecture**, exposing a RESTful API that powers the frontend entirely through `fetch()` calls.

---

## ✨ Features

### Frontend
- 🎨 **Futuristic Glassmorphism UI** — blur cards, neon gradients, floating orbs
- 📱 **Fully Responsive** — mobile-first, works on all screen sizes
- 🌙 **Dark / Light Mode** — toggle with LocalStorage persistence
- 🔀 **SPA Navigation** — four sections with no page reloads
- 🔍 **Search & Filter** — real-time event search + category filters
- ⭐ **Star Rating Selector** — interactive CSS-only star picker
- ✅ **Form Validation** — inline errors, email regex, min-length checks
- 🔔 **Toast Notifications** — animated success/error/info/warning toasts
- 📊 **Chart.js Analytics** — bar chart + doughnut chart, theme-aware
- ✏️ **Edit Modal** — in-place feedback editing with validation
- 🗑️ **Delete with Confirm** — safe deletion flow
- 🔄 **Auto-seed** — events are auto-seeded when the DB is empty

### Backend
- 🏗️ **MVC Architecture** — Models, Controllers, Routes cleanly separated
- 🔒 **Centralised Error Middleware** — handles Mongoose, cast, validation, duplicate errors
- 📦 **Mongoose Schemas** — typed models with validation rules
- 📈 **Aggregation Pipeline** — stats, avg rating, feedback per event
- 🌐 **CORS Enabled** — cross-origin requests allowed
- 🌱 **Auto-seed** — sample events inserted on first startup

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | HTML5, Vanilla JS (SPA), CSS3       |
| Styling    | Tailwind CSS (CDN) + Custom CSS     |
| Charts     | Chart.js 4.x (CDN)                  |
| Icons      | FontAwesome 6.5 (CDN)               |
| Fonts      | Google Fonts — Inter, Space Grotesk |
| Backend    | Node.js 18+, Express.js 4.x         |
| Database   | MongoDB 7.x + Mongoose 8.x          |
| Dev Server | Nodemon                             |

---

## 📁 Project Structure

```
Event-Feedback-System/
│
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   │
│   ├── controllers/
│   │   ├── event.controller.js    # Event CRUD + seed logic
│   │   └── feedback.controller.js # Feedback CRUD + stats aggregation
│   │
│   ├── middleware/
│   │   └── error.middleware.js    # Centralised error handler
│   │
│   ├── models/
│   │   ├── event.model.js         # Event Mongoose schema
│   │   └── feedback.model.js      # Feedback Mongoose schema
│   │
│   ├── routes/
│   │   ├── event.routes.js        # /api/events routes
│   │   └── feedback.routes.js     # /api/feedback routes
│   │
│   ├── .env                       # Environment variables
│   ├── package.json               # Dependencies + scripts
│   └── server.js                  # Express app entry point
│
├── frontend/
│   ├── index.html                 # SPA shell — all four sections
│   ├── style.css                  # Custom CSS (glassmorphism, animations)
│   └── app.js                     # All SPA logic, API calls, charts
│
└── README.md
```

---

## ⚙️ Installation Guide

### Prerequisites

Make sure you have the following installed:

| Tool    | Version  | Download |
|---------|----------|----------|
| Node.js | 18+      | [nodejs.org](https://nodejs.org) |
| npm     | 9+       | Bundled with Node |
| MongoDB | 6+ or Atlas | [mongodb.com](https://mongodb.com) |

---

### Step 1 — Clone / Download

```bash
# If using Git
git clone https://github.com/your-username/Event-Feedback-System.git
cd Event-Feedback-System
```

Or simply extract the project zip to your desired directory.

---

### Step 2 — Install Backend Dependencies

```bash
cd backend
npm install
```

This installs:
- `express` — web framework
- `mongoose` — MongoDB ODM
- `cors` — cross-origin support
- `dotenv` — environment variables
- `nodemon` — dev auto-restart

---

## 🍃 MongoDB Setup

### Option A — Local MongoDB

1. [Download & Install MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB

   # macOS / Linux
   sudo systemctl start mongod
   ```
3. MongoDB will run on `mongodb://127.0.0.1:27017` by default.
4. The database **`eventFeedbackDB`** will be created automatically when the server starts.

### Option B — MongoDB Atlas (Cloud)

1. Create a free account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a new cluster → Get your connection string
3. Replace `MONGO_URI` in `.env` with your Atlas URI:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/eventFeedbackDB?retryWrites=true&w=majority
   ```

---

## 🔐 Environment Variables

Create / edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/eventFeedbackDB
NODE_ENV=development
```

| Variable    | Default                                      | Description             |
|-------------|----------------------------------------------|-------------------------|
| `PORT`      | `5000`                                       | Express server port     |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/eventFeedbackDB`  | MongoDB connection URI  |
| `NODE_ENV`  | `development`                                | Environment mode        |

---

## ▶️ Run Commands

### Backend

```bash
# Navigate to backend directory
cd backend

# Development mode (with auto-restart via nodemon)
npm run dev

# Production mode
npm start
```

Server starts at: **`http://localhost:5000`**

On first start, **4 sample events** are automatically seeded into MongoDB.

---

### Frontend

Open `frontend/index.html` using **VS Code Live Server**:

1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code
2. Right-click `frontend/index.html` → **"Open with Live Server"**
3. The app opens at **`http://127.0.0.1:5500`**

> **Important:** The backend must be running on port 5000 before opening the frontend.

---

## 🔌 API Endpoints

### Base URL: `http://localhost:5000`

#### Root

| Method | Endpoint | Description       |
|--------|----------|-------------------|
| GET    | `/`      | API health check  |

---

#### Events — `/api/events`

| Method | Endpoint             | Description                     |
|--------|----------------------|---------------------------------|
| GET    | `/api/events`        | Return all events               |
| GET    | `/api/events/:id`    | Return single event by ID       |
| POST   | `/api/events`        | Create a new event              |
| POST   | `/api/events/seed`   | Seed sample events (idempotent) |
| DELETE | `/api/events/:id`    | Delete an event                 |

**Event Schema:**
```json
{
  "title":       "AI Workshop 2026",
  "image":       "https://...",
  "description": "Hands-on AI workshop...",
  "location":    "San Francisco, CA",
  "date":        "2026-07-15T00:00:00.000Z",
  "category":    "Technology"
}
```

**Categories:** `Technology` | `Education` | `Business` | `Design` | `Science` | `Other`

---

#### Feedback — `/api/feedback`

| Method | Endpoint               | Description                   |
|--------|------------------------|-------------------------------|
| GET    | `/api/feedback`        | Get all feedback (populated)  |
| GET    | `/api/feedback/stats`  | Get aggregated statistics     |
| POST   | `/api/feedback`        | Submit new feedback           |
| PUT    | `/api/feedback/:id`    | Update feedback by ID         |
| DELETE | `/api/feedback/:id`    | Delete feedback by ID         |

**Feedback Payload (POST):**
```json
{
  "name":    "Jane Doe",
  "email":   "jane@example.com",
  "event":   "<event_objectId>",
  "rating":  5,
  "message": "Absolutely amazing workshop! Learned so much."
}
```

**Stats Response:**
```json
{
  "success": true,
  "data": {
    "totalFeedback": 12,
    "avgRating": "4.33",
    "ratingDistribution": [{ "_id": 5, "count": 7 }, ...],
    "feedbackPerEvent":   [{ "_id": "AI Workshop 2026", "count": 5, "avgRating": 4.6 }, ...]
  }
}
```

---

#### Error Response Format

```json
{
  "success": false,
  "message": "Descriptive error message",
  "stack":   "..." // only in development mode
}
```

---

## 🖥 Frontend Sections

| Section    | Description |
|------------|-------------|
| **Home**       | Hero with animated background, live stats, feature cards, footer |
| **Events**     | Dynamic event cards from API, search + category filter |
| **Feedback**   | Submission form with star rating + recent feedback list |
| **Dashboard**  | Admin panel with stats, 2 charts, full feedback table + CRUD |

---

## 🚀 Deployment Guide

### Backend — Deploy to Render / Railway

1. Push the `backend/` folder to a GitHub repo
2. Create a new **Web Service** on [Render](https://render.com)
3. Set environment variables in the dashboard:
   - `MONGO_URI` → your Atlas connection string
   - `PORT` → `5000`
   - `NODE_ENV` → `production`
4. Build command: `npm install`
5. Start command: `npm start`

### Frontend — Deploy to Netlify / GitHub Pages

1. Update `API_BASE` in `frontend/app.js` to your deployed backend URL:
   ```js
   const API_BASE = 'https://your-backend.onrender.com/api';
   ```
2. Drag & drop the `frontend/` folder to [netlify.com/drop](https://app.netlify.com/drop)

---

## 🎨 Screenshots

### 🏠 Home View
The landing page features a dynamic glassmorphism hero banner, floating glowing orbs, and live dashboard metrics (Total Feedback, Average Rating) that animate on load.
![Home Page Mockup](assets/screenshots/home.png)

### 📅 Events View
Organizers and attendees can explore lists of events. Supports real-time search queries and category filtering (Technology, Design, Business, etc.) in a sleek grid format.
![Events Page Mockup](assets/screenshots/events.png)

### 💬 Feedback Form & Submission
Interactive CSS rating stars with instant validation, detailed comment inputs, and a real-time side panel showing recently submitted feedback.
![Feedback Submission Page Mockup](assets/screenshots/feedback.png)

### 📊 Admin Analytics Dashboard
A powerful visual command center showing interactive Chart.js analytics (ratings breakdown and feedback per event) along with a rich data table supporting inline Edit and Delete operations.
![Admin Dashboard Page Mockup](assets/screenshots/dashboard.png)

---

## 📄 License

MIT © 2026 EventPulse

---

<div align="center">
Built with ❤️ using Node.js · Express · MongoDB · Vanilla JS
</div>
