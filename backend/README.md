# 🧗‍♂️ CodeClimb API - Enterprise-Grade Coding Judge Backend

> A high-performance, scalable backend execution engine powering a competitive programming and algorithmic learning platform.

CodeClimb is not just a CRUD application; it is a comprehensive, secure code execution environment and learning platform. This backend is engineered to handle real-time code compilation, AI-driven doubt resolution, dynamic user gamification, and robust security protocols. It is built with a heavy focus on system architecture, performance optimization, and clean data modeling.

---

## 🚀 Core Architectural Features

### 1. Distributed Code Execution Pipeline
The core of CodeClimb is a robust bridge to the **Judge0 API**, designed to handle untrusted user code safely and efficiently.
* **Batch Processing:** Submissions are bundled and sent to Judge0 in batches to test against hidden test cases, minimizing network overhead.
* **Asynchronous Polling:** Built-in delay mechanisms to poll for execution tokens without overwhelming the execution server.
* **Smart Error Mapping:** Dynamically parses Judge0 outputs into human-readable formats (Time Limit Exceeded, Runtime Error, Compilation Error, Wrong Answer) with detailed input/expected output diffs.
* **Pre-Validation Architecture:** Admin routes strictly enforce that a problem's reference solution must pass all its own visible test cases via Judge0 *before* the problem can be saved to the database. This guarantees zero broken problems are published.

### 2. AI-Powered DSA Tutor
Integrated **Google Gemini 3 Flash** to act as a dedicated algorithmic teaching assistant.
* **Strict JSON Enforcement:** Engineered system prompts and MIME-type restrictions to force the AI to return structured JSON `{"explanation", "approach", "code", "tips"}` rather than raw markdown, allowing the frontend to render custom UI components.
* **Contextual Awareness:** The AI is fed the problem description, hidden test cases, and the user's initial code state to provide highly specific, relevant hints without spoon-feeding the final answer.

### 3. Advanced Security & Authentication
Built with a "trust nothing" approach, securing both user data and platform infrastructure.
* **Dual-Strategy Auth:** Supports both Local (Bcrypt hashed) and Google OAuth 2.0 authentication.
* **Stateless JWT + Stateful Invalidation:** Uses JSON Web Tokens stored in secure, HTTP-only, SameSite cookies. Implemented a **Redis-backed token blocklist** to handle instant, secure logouts and invalidate compromised sessions.
* **Aggressive Rate Limiting:** Custom sliding-window rate limiters tune endpoint access based on computational cost (e.g., 60 seconds for AI chats, 3600 seconds for problem creation, 86400 seconds for profile deletion) to prevent brute-force attacks and API quota abuse.

### 4. Gamification & Progression Engine
A dynamic data layer that tracks and rewards user engagement.
* **Algorithmic Leaderboard:** A highly optimized aggregation pipeline that calculates global rank by sorting on total points, then total problems solved, and finally username alphabetically for tie-breakers.
* **Streak Tracking:** Custom utility logic calculates days since the last submission to dynamically increment, maintain, or break consecutive daily coding streaks.
* **Dynamic Scoring & Acceptance Rates:** Points are awarded based on difficulty multipliers (Easy: 10, Medium: 20, Hard: 30), with half-points for re-solves. Problem acceptance rates are recalculated automatically upon every submission.

### 5. Secure Asset Management
* **Signed Media Uploads:** Generates secure signatures on the backend for direct-to-Cloudinary video uploads. This offloads heavy media processing from the Node.js server, ensuring the main thread remains unblocked for code execution tasks.

---

## 🛠 Tech Stack

* **Runtime & Framework:** Node.js, Express.js
* **Database:** MongoDB (Mongoose ORM)
* **Caching & Security:** Redis
* **External APIs:** Judge0 (RapidAPI), Google GenAI (Gemini 3 Flash), Google OAuth 2.0 Auth Library, Cloudinary
* **Utilities:** JSON Web Tokens (JWT), Bcrypt, Validator.js, Axios

---

## 🗄️ Database Schema Overview

The database is heavily indexed for read-heavy operations (like leaderboards and problem querying) using Mongoose schemas.

* **User Model:** Tracks authentication data, total points, global rank, arrays of solved/liked/favourite problems, and embedded subdocuments for streak tracking.
* **Problem Model:** Stores comprehensive problem data, including markdown descriptions, tags, difficulty, constraints, hints, companies, start code for 5 languages, and arrays of both visible and hidden test cases.
* **Submission Model:** Logs every code execution attempt, recording the exact code, language, memory usage, runtime, test cases passed, and points earned.
* **Video Model:** Maps specific problem IDs to Cloudinary secure URLs and public IDs for solution walkthroughs.

---

## 🛣️ API Ecosystem

The API is structured following RESTful principles across modular domains:

### Authentication (`/user`)
* `POST /register`, `POST /login`, `POST /google-auth`
* `POST /logout` (Triggers Redis blocklist)
* `GET /check` (Validates HTTP-only cookie and updates daily streak)

### Problems (`/problem`)
* `GET /` (Paginated problem listing)
* `GET /:id` (Fetch specific problem details)
* `POST /:problemId/like`, `/favourite`, `/comment` (Social interactions)
* `POST /bookmarks` (Manage custom problem lists)
* `POST /create`, `PUT /update/:id` *(Admin Only - Includes Judge0 pre-validation)*

### Code Execution (`/submission`)
* `POST /submit/:id` (Compiles code, runs hidden test cases, updates user points)
* `POST /run/:id` (Compiles code against custom/visible test cases only)
* `GET /:problemId` (Fetch user's submission history for a problem)

### AI & Media (`/ai`, `/video`)
* `POST /ai/chat` (Rate-limited Gemini DSA tutor)
* `GET /video/upload/:problemId` *(Admin Only - Generates Cloudinary signature)*

### User Profile (`/profile`)
* `GET /me` (Aggregated statistics and recently solved problems)
* `GET /leaderboard` (Paginated global rankings)
* `GET /sprints` (Heatmap data generation based on submission history)

---

## ⚙️ Local Setup & Installation

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/codeclimb-backend.git](https://github.com/yourusername/codeclimb-backend.git)
cd codeclimb-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
PORT=8000
NODE_ENV=development

# Database & Caching
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string

# Security
SECRET_KEY=your_jwt_secret

# External APIs
GOOGLE_CLIENT_ID=your_google_oauth_client_id
RAPIDAPI_KEY=your_judge0_rapidapi_key
GEMINI_KEY=your_google_gemini_api_key

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 4. Start the Server
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## 📋 Development Changelog
For a detailed log of implemented features, changes, and version history, please refer to the [Backend Changelog](docs/BACKEND_CHANGELOG.md).
