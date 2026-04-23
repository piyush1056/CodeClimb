# 🧗‍♂️ CodeClimb | AI‑Ready Full‑Stack Judge & Scalable Execution Infrastructure  

> A Production-Ready high-performance, scalable full-stack application delivering a seamless competitive programming and algorithmic learning experience, featuring Secure Execution and AI-Driven Mentorship.

CodeClimb isn't just another CRUD application—it’s an exercise in modern system architecture. Designed to bridge the gap between simple web apps and industrial coding judges, it combines a sandboxed multi-language execution engine with a structured AI tutor. Built with a focus on security bottlenecks, asynchronous scaling, and high-precision UX.

By combining a **React/Monaco-powered IDE** on the frontend with a **highly secure, distributed Node.js/Judge0 execution engine** on the backend, the goal was to create a platform that feels incredibly premium, handles untrusted code safely, and uses AI to actually teach rather than just give away answers.

CodeClimb is engineered for scalability: asynchronous execution pipelines prevent overload, Redis‑backed session invalidation supports distributed deployments, and MongoDB aggregation ensures leaderboard and search remain performant even under heavy load.

---

## 🏗️ Core System Architecture

### 1. High-Precision Workspace & Editor Engine
The frontend is built to mimic a professional desktop IDE directly within your browser.
* **Monaco Editor Integration:** Powered by the core engine of VS Code (`@monaco-editor/react`), providing true syntax highlighting, IntelliSense-like auto-completion, and multi-language support (C++, Java, JS/TS).
* **Fluid UI & Resizable Layouts:** Implemented a custom split-pane architecture (`react-split`) to let users balance their focus, paired with a stateful theme toggling system that ensures zero re-render jank when switching between dark and light modes.
* **Unified State Management:** Driven by a modular Redux Toolkit (RTK) store. Execution states (Queued, Processing, Accepted) are handled independently so you can switch tabs or read the problem without interrupting a background submission.

### 2. Distributed Code Execution Pipeline
The backend acts as a robust bridge to the **Judge0 API**, designed to handle untrusted user code with military precision.
* **Asynchronous Polling & Batching:** Submissions are bundled and sent to Judge0 in batches against hidden test cases. The backend handles the polling delay mechanisms so the frontend doesn't overwhelm the execution server.
* **Smart Error Mapping:** Dynamically parses Judge0 outputs into human-readable IDE formats (Time Limit Exceeded, Runtime Error, Compilation Error) with detailed diffs showing exactly where the code failed.
* **Pre-Validation Architecture:** Admin routes strictly enforce that a problem's reference solution must pass all its own visible test cases via Judge0 *before* it can be published to the database. Zero broken problems.

### 3. AI-Powered DSA Tutor Interface
Integrated **Google Gemini 3 Flash** to act as a dedicated algorithmic teaching assistant, but with a twist.
* **Strict JSON Enforcement:** The backend uses engineered system prompts to force Gemini to return structured JSON (`{"explanation", "approach", "code", "tips"}`). 
* **JSON-to-UI Pipeline:** The frontend intercepts this payload and dynamically generates beautiful, isolated React components—Theory Cards, Logic Steps, and Syntax Blocks—ensuring a structured learning path that avoids "spoon-feeding" raw markdown.

### 4. Advanced Security & Access Control
Built with a "trust nothing" approach to secure user data and platform health.
* **Dual-Strategy Auth:** Supports both Bcrypt-hashed local authentication and Google OAuth 2.0.
* **Stateless JWT + Stateful Invalidation:** Sessions are managed via JWTs stored in secure, HTTP-only cookies. A **Redis-backed token blocklist** ensures instant, secure logouts and immediate invalidation of compromised sessions.
* **Aggressive Rate Limiting:** Custom sliding-window rate limiters tune access based on computational cost (e.g., 60s for AI chats, 10 submissions per minute) to prevent abuse.

### 5. Gamification & Search Infrastructure
* **Algorithmic Leaderboard & Streaks:** A highly optimized MongoDB aggregation pipeline calculates global ranks. Custom utility logic tracks daily coding streaks and handles dynamic scoring based on problem difficulty.
* **Performance-First Search:** Problem discovery uses dynamic backend query parameters rather than heavy client-side filtering, protected by a **500ms debounced search mechanism** to prevent API spam.

---

## 🛠️ The Tech Stack

### Frontend Client
* **Framework:** React v19 (Vite)
* **State Management:** Redux Toolkit (`@reduxjs/toolkit`)
* **Styling:** Tailwind CSS v4, DaisyUI v5, Lucide React
* **Editor/UI:** `@monaco-editor/react`, `react-split`
* **Utilities:** Axios, React Hot Toast, Plyr React (Video Player)

### Backend Execution Server
* **Runtime & Framework:** Node.js, Express.js
* **Database:** MongoDB (Mongoose ORM)
* **Caching & Security:** Redis
* **External APIs:** Judge0 (RapidAPI), Google GenAI (Gemini 3 Flash), Cloudinary
* **Utilities:** JSON Web Tokens (JWT), Bcrypt, Validator.js

---

## 🗄️ Database & Data Flow
The MongoDB database is heavily indexed for read-heavy operations:
* **User Model:** Tracks total points, global rank, arrays of solved/saved problems, and embedded subdocuments for streaks.
* **Problem Model:** Stores markdown descriptions, constraints, company tags, start code for 5 languages, and hidden/visible test cases.
* **Submission Model:** Logs every code attempt—recording exact code, memory usage, runtime, and points earned.

---

## ⚡ Performance & Engineering Flags
If you are reviewing this code, here is what I hope you notice:
* **Debounced Interactions:** Text searches and editor keystrokes are managed carefully to prevent unnecessary server load and re-renders.
* **Code Splitting:** Heavy assets like Monaco Editor are lazy-loaded, keeping the initial bundle incredibly lightweight and the Time-to-Interactive (TTI) blazingly fast.
* **Clean Separation of Concerns:** Both the frontend (`/pages`, `/components`, `/redux`) and backend (`/routes`, `/controllers`, `/models`) adhere to strict modular architecture.

---

## 🗂️ Project Structure

```text
codeclimb/
├── frontend/               # React 19 Frontend (Vite)
│   ├── src/components/     # Modular UI (Workspace, Admin, Shared primitives)
│   ├── src/redux/          # RTK Slices (Auth, Workspace, Problem)
│   └── src/pages/          # Route-level views (WorkspacePage, Leaderboard, etc.)
└── backend/                # Express 5 Backend
    ├── controllers/        # Domain logic (Auth, Problem, Submission,Profile)
    ├── middleware/         # Security (RateLimiter, AuthGuard, AdminCheck)
    ├── models/             # Mongoose Schemas (User, Problem,Submission Video)
    └── utils/              # Logic helpers (Judge0, Gemini, Streaks) 
```

---

## ⚙️ Local Setup & Installation

To run the full stack locally, you'll need three terminal windows: one for your Redis server, one for the backend, and one for the frontend.

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/codeclimb.git
cd codeclimb
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create a .env file based on the backend instructions
# You will need MongoDB, Redis, Judge0, Gemini, and Cloudinary credentials.
npm run dev
```

### 3. Frontend Setup
```bash
# Open a new terminal
cd frontend
npm install

# Create a .env file
# VITE_API_BASE_URL=http://localhost:8000
# VITE_GOOGLE_CLIENT_ID=your_oauth_client_id
npm run dev
```

---
## 📋 Development Changelog
For a detailed log of implemented features, changes, and version history, please refer to the [Frontend/Backend Changelog](docs/Changelog).

*Built with an obsession for high-performance engineering, clean architecture, and exceptional user experiences.*
