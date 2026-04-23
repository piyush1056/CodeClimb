# 🧗‍♂️ CodeClimb Frontend - Enterprise-Grade IDE Experience

> A high-performance, scalable client application delivering a seamless competitive programming and algorithmic learning experience.

CodeClimb Frontend is an interactive code execution environment engineered to bridge the gap between browser-based learning and professional IDE workflows. It handles real-time code editing, AI-driven doubt resolution, complex state management, and a high-precision workspace architecture focused on component reusability and performance.

---

## 🚀 Core Technical Pillars

### 1. High-Precision Workspace Engine
The coding workspace is the heart of the platform, engineered to mimic a professional desktop IDE within a browser environment.
* **Monaco Editor Integration:** Powered by the core engine of VS Code (`@monaco-editor/react`), providing syntax highlighting, IntelliSense-like auto-completion, and multi-language support (C++, Java, JS/TS).
* **Fluid UI Management:** Implemented a stateful theme toggling system mapped directly to Monaco's internal themes, ensuring zero re-render jank when switching between dark and light modes.
* **Resizable Split-Pane Architecture:** Uses a custom implementation of `react-split` to provide a flexible layout, allowing users to balance their focus between problem constraints and the coding playground.

### 2. State Management & Asynchronous Data Flow
The application manages complex, multi-stage processes—from authentication to code judge status—without UI tearing or prop-drilling.
* **Modular Redux Toolkit (RTK) Store:** State is logically partitioned into domain-specific slices (`auth`, `workspace`, `admin`, `problem`), ensuring that auth validation doesn't interfere with the execution console's performance.
* **Isolated Workspace State:** The `workspaceSlice` manages granular execution states (Queued, Processing, Accepted, Error) independently, allowing the user to browse other tabs while a submission is being judged.
* **Unified Execution Consumption:** Leverages a clean, promise-based consumption model for code submissions. By offloading complex polling logic to the backend, the frontend maintains a streamlined flow that keeps the execution UI predictable.

### 3. AI-Powered DSA Tutor Interface
A dedicated interaction layer designed to transform raw AI data into an educational curriculum.
* **Structured JSON-to-UI Pipeline:** The `AskAITab` component intercepts strictly formatted JSON payloads from the Gemini 3 Flash engine. Rather than rendering a wall of text, it maps keys to isolated React components.
* **Contextual UI Elements:** Dynamically generates **Explanation Cards** for theory, **Approach Steps** for logic, and **Syntax Blocks** for code hints, ensuring a structured learning path that avoids "spoon-feeding" the solution.

### 4. Search & Filtering Architecture
Implemented a scalable approach to problem discovery, moving away from simple client-side filters to a robust server-driven model.
* **Dynamic Query Parameter Integration:** Filters for difficulty, tags, and company-specific problems are handled via dynamic backend queries, ensuring the UI always reflects the most up-to-date data without heavy client-side processing.
* **Performance-First Search:** Implemented a **500ms debounced search mechanism**. This prevents API spamming while the user types, significantly reducing server load and improving perceived performance.
---

## 🧩 Modular Component Architecture

The frontend is architected for **high cohesion and low coupling**, ensuring that complex IDE logic remains decoupled from standard UI components.

* **`/components/workspace` (The IDE Engine):** This is the mission-critical core of the app, built using a modular panel system:
    * **Panel Isolation:** Contains `EditorHeader.jsx` (language/theme selection), `ConsolePanel.jsx` (test results/diffs), and `ProblemPanel.jsx` (markdown rendering).
    * **Tab-Based Logic:** A dynamic tab system inside the workspace allows users to toggle between `DescriptionTab`, `SolutionsTab` (video/text), and the AI-driven `AskAITab` without losing their code state or execution context.
* **`/components/shared`:** A library of reusable UI primitives (Buttons, Inputs, Glassmorphic Cards, Loading Skeletons) built with Tailwind CSS, ensuring a consistent design language across User and Admin views.
* **`/utils` & `/hooks`**:
    * **`axiosClient.js`**: Centralized API configuration with automated credential handling (with-credentials) and interceptors for standardized error toast notifications.
    * **Performance Hooks**: Custom hooks used for tasks like window-width detection (for responsive layouts) and debounced search handlers.

---

## 🛣️ Enterprise Route Ecosystem

CodeClimb implements a tiered access model using **React Router v7**, ensuring that sensitive admin tools and personal user data are strictly guarded.

#### 1. Public Access & Auth Flow
* **`/`, `/login`, `/register`**: Entry points optimized for conversion with an "Auth Redirection" logic that prevents authenticated users from re-accessing login pages.

#### 2. The User Workspace & Progression (Protected)
* **`/problems`**: A high-performance listing page featuring dynamic server-side filtering and a **500ms debounced search mechanism** to minimize API spam.
* **`/problem/:id`**: The heart of the app; initializes the IDE environment for specific challenges.
* **`/profile` & `/leaderboard`**: Social and gamification routes that fetch aggregated user stats, submission heatmaps, and global rankings.

#### 3. Administrative Command Center (Admin-Only)
Secured by a robust **`<AdminGuard />`** component that verifies both the JWT and the user's role before mounting the page.
* **`/admin/dashboard`**: A bird's-eye view of platform health featuring real-time statistics (Total Users, Problems, Submissions) and recent activity feeds.
* **`/admin/problems`**: A comprehensive management suite for problem curation.
    * **Creation/Editing**: Includes a complex form with **Judge0 validation integration**, ensuring admins can't publish a problem unless the reference solution passes all test cases.

---

## 🛠️ Tech Stack

* **Framework:** React v19 (Vite)
* **State Management:** Redux Toolkit (`@reduxjs/toolkit`), React Redux
* **Routing:** React Router v7
* **Styling:** Tailwind CSS v4, DaisyUI v5, Lucide React
* **Editor & UI Components:** `@monaco-editor/react`, `react-split`
* **Security & Auth:** Google OAuth (`@react-oauth/google`), Secure HTTP-only Cookie Persistence
* **Utilities:** Axios, React Hot Toast, Plyr React (Video Player)

---

## ⚡ Performance & Security (Recruiter Green Flags)

* **Debounced API Interaction:** Text searches in the problem listing and code updates are debounced to prevent unnecessary server load and re-renders.
* **Code Splitting & Lazy Loading:** Heavy assets like the Monaco Editor and data visualization charts are code-split, ensuring the initial bundle remains lightweight and the Time-to-Interactive (TTI) is fast.
* **Safe State Persistence:** Authentication is handled using secure, HTTP-only cookies communicating with the backend, preventing XSS-based token theft while maintaining a smooth session.
* **Route Protection (HOCs):** Implemented custom Higher-Order Components to guard routes, redirecting unauthenticated users while saving their "intended destination" for a seamless post-login experience.

---
## 📋 Development Changelog
For a detailed log of implemented features, changes, and version history, please refer to the [Frontend Changelog](docs/FRONTEND_CHANGELOG.md).

*Built with an obsession for high-performance frontend engineering and clean architecture.*

