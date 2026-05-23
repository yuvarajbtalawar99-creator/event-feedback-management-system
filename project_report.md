# 🚀 EventPulse — Technical & Architectural Project Report

An executive architectural review, database analysis, and security summary of the **EventPulse Event Feedback Management System**.

---

## 📋 Executive Summary

**EventPulse** is a production-ready, full-stack web application designed for event organizers to seamlessly collect, manage, and visualize attendee feedback in real time. Architected as a high-performance **Single Page Application (SPA)** on the frontend and backed by a robust **Model-View-Controller (MVC)** server on the backend, the platform blends cutting-edge web performance with a modern **glassmorphism + neon** visual design.

```
+--------------------------------------------------------------------------+
|                              Client Browser                              |
+--------------------------------------------------------------------------+
                                     ^
                                     | HTTPS / REST API
                                     v
+--------------------------------------------------------------------------+
|                          Express.js Web Server                           |
+--------------------------------------------------------------------------+
                                     ^
                                     | Mongoose ODM
                                     v
+--------------------------------------------------------------------------+
|                            MongoDB Database                              |
+--------------------------------------------------------------------------+
```

### Core Value Proposition:
* **Frictionless Experience**: Zero page reloads for attendees submitting ratings or organizers analyzing metrics.
* **Instant Actionable Insights**: Interactive visual charts update instantly, providing organizers with feedback metrics on rating distributions and event performance.
* **Zero-Trust Security**: Enterprise-grade client-side routing interceptions combined with strict server-side middleware gates (`protect` + `isAdmin`).

---

## ✨ System Capabilities & User Roles

EventPulse separates core experiences into two distinct user personas, ensuring clean, role-tailored workspaces.

### 👤 1. The Attendee (Regular User) Workspace
Tailored for maximum submission speed and ease of use:
* **Interactive CSS Rating Star Picker**: Micro-interactions with instant validation checks.
* **Unified Event Explorer**: Sleek grid layout showing all seeded and created events with real-time text search and quick category filters (`Technology`, `Education`, `Business`, `Design`, `Science`).
* **Instant Validation Checks**: Client-side form input validation prevents empty submissions, enforces valid email formats, and sets comment length requirements.
* **Read-only Autofill Security**: Once logged in, the attendee's name and email are pre-filled and locked to prevent spoofed or forged submissions.

### 🔑 2. The Organizer (Admin) Workspace
A high-powered visual command center for event and feedback management:
* **KPI Metrics Dashboard**: Highlights Total Events, Total Feedback, average rating, and top-rated events using real-time calculations.
* **Theme-Aware Analytics Charts**: Custom-integrated **Chart.js** renders real-time rating distributions and feedback count comparisons per event. Supports dynamic dark/light mode transitions.
* **Granular Feedback Grid**: A complete database table showcasing all submitted feedback with in-place **Edit** (via validation-guarded modal) and **Delete** capabilities.
* **Event Management System**: Interactive grid to create new events (with title, category, date, location, and image fields) or delete redundant events.

---

## 🛠 Technical Stack & Architecture

EventPulse follows high-efficiency web standards, maximizing vanilla technologies to minimize bundle size and dependencies.

| Layer | Component | Implementation Details |
| :--- | :--- | :--- |
| **Frontend UI** | SPA Layout | Hand-coded HTML5 layout organized into modular sections mapped to client-side visibility controls. |
| **Styling** | Modern Theme | Tailwind CSS CDN combined with customized Vanilla CSS covering glassmorphism blurs (`backdrop-filter`), neon glows, custom scrollbars, and keyframe animations. |
| **Data Viz** | Analytics | **Chart.js 4.x** mapping API statistics into responsive doughnut and bar charts. |
| **Backend Core**| MVC REST API | **Node.js 18+** with **Express.js 4.x** exposing clean route maps, controllers, and database models. |
| **Database** | ODM | **MongoDB 7.x** cluster managed through **Mongoose 8.x** for typed, validated schema enforcement. |

---

## 🔒 Security & Authorization Framework

We implemented multiple crucial security updates to elevate EventPulse's security posture to industry standards:

### 1. Unified Route Interception & Page Load Redirection
* **Role-Based Routing Helper (`resolveAndNavigate`)**: Added a global routing helper that automatically redirects users upon login/signup to their permitted page. Regular users who try to access dashboard links are gracefully routed to `'events'` instead of being shown a raw "Access Denied" page.
* **Page Reload State Persistence**: Fixed page initialization so that already logged-in users are automatically navigated to their respective allowed workspace (`'events'` for attendees, `'dashboard'` for admins) on page load/refresh, preventing session booting back to the home screen.

### 2. Google Identity Callback Relocation
* **Race Condition Fix**: Moved `window.handleGoogleCredentialResponse` from the DOMContentLoaded callback to the top-level global scope in `app.js`. This guarantees the global callback is registered as soon as the browser parses the file, resolving the race condition where Google's async Identity Services library (`gsi/client`) initializes before `DOMContentLoaded` triggers.

### 3. Server-Side Gates (`protect` + `isAdmin` Middlewares)
Even if a malicious attendee attempts to bypass the client-side router (e.g. by editing variables in the browser console), the backend server restricts access at the API boundary:
* **JWT Token Validation (`protect`)**: Extracts the Bearer token, verifies its signature against the server's `JWT_SECRET`, and attaches the matching user document to the request context.
* **Role Gate (`isAdmin`)**: Ensures `req.user.role === 'admin'` before allowing state-changing operations like event creation/deletion or feedback editing/deletion.

### 4. Repository Security & Blueprints
* **Root `.gitignore`**: Created to exclude configuration variables (`.env`, `backend/.env`) and dependencies (`node_modules`), ensuring zero credentials are leaked to public repositories.
* **`.env.example` Blueprint**: Created a safe configuration template for external developers to quickly recreate their local workspace.

---

## 📊 Database Analytics & Aggregation Engine

The analytics dashboard is powered by MongoDB’s high-performance **Aggregation Framework**, calculating averages and grouping data at the database layer rather than using expensive in-memory operations.

### Aggregation Pipeline (Feedback Stats):
Located in `backend/controllers/feedback.controller.js`, the `/api/feedback/stats` endpoint runs three parallel aggregation pipelines:

1. **Overall average & feedback counts**:
   ```javascript
   const generalStats = await Feedback.aggregate([
     {
       $group: {
         _id: null,
         totalFeedback: { $sum: 1 },
         avgRating: { $avg: '$rating' }
       }
     }
   ]);
   ```

2. **Rating Star Distribution (1★ to 5★ breakdown)**:
   ```javascript
   const ratingDist = await Feedback.aggregate([
     { $group: { _id: '$rating', count: { $sum: 1 } } },
     { $sort: { _id: 1 } }
   ]);
   ```

3. **Per-Event Statistics (Total submissions + average rating per event)**:
   ```javascript
   const feedbackPerEvent = await Feedback.aggregate([
     {
       $group: {
         _id: '$event',
         count: { $sum: 1 },
         avgRating: { $avg: '$rating' }
       }
     },
     { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'eventDetails' } },
     { $unwind: '$eventDetails' },
     { $project: { _id: '$eventDetails.title', count: 1, avgRating: { $round: ['$avgRating', 1] } } },
     { $sort: { count: -1 } }
   ]);
   ```

---

## 🔮 Future Scalability & Roadmap

To prepare EventPulse for enterprise production scaling, we recommend the following enhancements:

1. **Performance: Pagination & Infinite Scrolling**
   * *Enhancement*: Implement cursor-based pagination for the feedback lists and admin tables.
   * *Impact*: Keeps the UI fluid and lightweight when thousands of feedback entries are submitted.
2. **Engagement: Real-time Live Feeds via WebSockets**
   * *Enhancement*: Integrate `socket.io` to push feedback submissions immediately to the organizer's dashboard.
   * *Impact*: Allows organizers to see live attendee sentiment on big screens during hybrid or virtual workshops.
3. **Automation: AI Sentiment Analysis**
   * *Enhancement*: Add a sentiment analysis step in the backend (using lightweight ML libraries like `natural` or external APIs) when feedback is posted.
   * *Impact*: Automatically tags feedback as positive, neutral, or negative, allowing organizers to quickly filter for high-priority complaints.
