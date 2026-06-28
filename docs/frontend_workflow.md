# CodeClimb Frontend Workflow: Technical Reference Manual

A reference manual describing the folder structure, Redux slices, core interface flows, and performance optimizations used in CodeClimb.

---

## 1. Folder & Component Architecture

The CodeClimb frontend is built with React, Vite, Tailwind CSS, and Redux Toolkit. The source code is organized inside the [src](file:///c:/CodeClimb/frontend/src) folder:

```
frontend/src/
├── assets/           # Static media assets, icons, and illustrations
├── components/       # Reusable UI widgets and workspace-specific sub-layouts
│   ├── admin/        # Admin forms and database editors
│   └── workspace/    # Monaco editor, console, tabs, and workspace header
├── pages/            # Full-page routing components
│   ├── admin/        # Admin management screens
│   ├── user/         # Profile, leaderboard, saved problems, and submissions
│   └── WorkspacePage/ # Split-pane coding IDE workspace
├── redux/            # Global Redux Toolkit state slice definitions and store setup
└── utils/            # Shared Axios client wrappers and validation schemas
```

### Folder Roles & Core Files

*   **[components](file:///c:/CodeClimb/frontend/src/components/)**: Contains modular visual blocks.
    *   [Navbar.jsx](file:///c:/CodeClimb/frontend/src/components/Navbar.jsx): Global navigation bar that renders profile details, streaks, and links depending on authentication status.
    *   **[workspace](file:///c:/CodeClimb/frontend/src/components/workspace/)**: Visual elements of the coding IDE.
        *   [PlaygroundPanel.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/PlaygroundPanel.jsx): Manages Monaco code editor states, language selections, reset controls, and holds the vertical split console.
        *   [EditorHeader.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/EditorHeader.jsx): Houses language selections, font size adjusters, and the Run/Submit triggers.
        *   [ConsolePanel.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/ConsolePanel.jsx): Displays standard test case inputs, expected values, execution outputs, and compilation logs.
        *   [SubmissionResultPanel.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/SubmissionResultPanel.jsx): Slide-in card that reports points awarded, runtime benchmarks, memory footprint, and test case passing progress.
        *   **[tabs](file:///c:/CodeClimb/frontend/src/components/workspace/tabs/)**: Sub-tabs for the left pane of the IDE.
            *   [DescriptionTab.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/tabs/DescriptionTab.jsx): Formats description details, constraints, examples, difficulty labels, and tags.
            *   [AskAITab.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/tabs/AskAITab.jsx): Provides the chatbot interface for resolving doubts with the AI tutor.
*   **[pages](file:///c:/CodeClimb/frontend/src/pages/)**: Primary pages corresponding to router paths.
    *   [ProblemsPage.jsx](file:///c:/CodeClimb/frontend/src/pages/ProblemsPage.jsx): Shows paginated problem tables, difficulties, search bars, and tags.
    *   [WorkspacePage/index.jsx](file:///c:/CodeClimb/frontend/src/pages/WorkspacePage/index.jsx): Combines the left description tab and right editor using split drag handles.
*   **[redux](file:///c:/CodeClimb/frontend/src/redux/)**: Defines global state stores and slices.
    *   [store.js](file:///c:/CodeClimb/frontend/src/redux/store.js): Configures store options and registers slices.
    *   **[slices](file:///c:/CodeClimb/frontend/src/redux/slices/)**: Redux state slices.
        *   [authSlice.js](file:///c:/CodeClimb/frontend/src/redux/slices/authSlice.js): Handles login, registration, checkAuth, and user statistics.
        *   [workspaceSlice.js](file:///c:/CodeClimb/frontend/src/redux/slices/workspaceSlice.js): Governs editor configurations, console states, language selections, and Judge0 code run details.
*   **[utils](file:///c:/CodeClimb/frontend/src/utils/)**: General utility libraries.
    *   [axiosClient.js](file:///c:/CodeClimb/frontend/src/utils/axiosClient.js): Configures Axios with a base URL and sets credentials to true to send and receive secure cookies.

> [!NOTE]
> **Note on Custom Hooks and Services**: The CodeClimb frontend does not use separate `hooks` or `services` directories. All API integrations are defined directly inside Redux async thunks within the slices, and standard React hooks are used inside the component files to keep the structure flat and easy to maintain.

---

## 2. State Management Deep-Dive (Redux Toolkit)

CodeClimb uses Redux Toolkit to synchronize data across the codebase.

### Redux Slices & Stored State

*   **[authSlice.js](file:///c:/CodeClimb/frontend/src/redux/slices/authSlice.js)**:
    *   `user`: Current user profile data, including points, streaks, solved problems, and liked/favourited problem lists.
    *   `isAuthenticated`: Boolean showing if the user has a valid active session.
    *   `loading`: Boolean tracking request processing.
*   **[workspaceSlice.js](file:///c:/CodeClimb/frontend/src/redux/slices/workspaceSlice.js)**:
    *   `currentProblem`: Details of the active problem in the workspace.
    *   `userCode`: A dictionary map storing code drafts by problem ID, preventing users from losing their work when navigating between problems.
    *   `isConsoleOpen` & `activeConsoleTab`: Governs the bottom console panel.
    *   `runStatus` & `runResult`: Tracks execution status and outputs of local code runs.
    *   `submissionStatus` & `submissionResult`: Tracks official grading results.
    *   `activeLanguage`: Current programming language selected for the editor.
    *   `editorPreferences`: Font size and dark/light theme choices.
*   **[problemSlice.js](file:///c:/CodeClimb/frontend/src/redux/slices/problemSlice.js)**:
    *   Handles actions like liking, bookmarking, and commenting on problems.
*   **[adminSlice.js](file:///c:/CodeClimb/frontend/src/redux/slices/adminSlice.js)**:
    *   Manages user statistics and admin problem creation utilities.

### Reactive State Flow: A Step-by-Step Example

Let's walk through what happens when a user edits code and clicks the "Run" button:

1.  **User Inputs Code**: As the user types in Monaco, the change triggers `handleEditorChange` in [PlaygroundPanel.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/PlaygroundPanel.jsx). This updates local component state for lag-free typing and dispatches the `updateUserCode` action. The workspace slice reducer updates the `userCode` dictionary in the Redux store.
2.  **User Clicks Run**: The user clicks the "Run" button in [EditorHeader.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/EditorHeader.jsx), dispatching the `runCodeAsync` thunk.
3.  **Pending State Transition**: The workspace slice receives the pending thunk action. It updates `runStatus` to `'loading'`, resets past run results, automatically slides open the bottom console, and sets `activeConsoleTab` to `'result'`.
4.  **UI Updates Reactively**:
    *   The "Run" button selects `runStatus` from Redux, sees `'loading'`, disables itself, and displays a spinning loader wheel.
    *   The console panel sees `'loading'` and displays a "Running Code..." screen.
5.  **Thunk Resolves**: The thunk makes a POST request to `/submission/run/:problemId` and waits for Judge0 to compile and run the code. Once the results are fetched, the thunk returns.
6.  **Fulfilled State Transition**: The workspace slice handles the fulfilled action, updating `runStatus` to `'success'` and setting `runResult` to the execution details.
7.  **Final UI Render**: The loading spinner stops, and the console panel updates to display the run result details, showing runtime, memory, outputs, and status.

---

## 3. Core Interface Features Workflow

### Initial Loading

When a user opens the application, the system loads the session and problem details:

1.  **Session Validation**: The global [AppContent](file:///c:/CodeClimb/frontend/src/App.jsx#L38-L94) wrapper mounts and runs a `useEffect` hook that dispatches the `checkAuth` thunk.
2.  **Auth State Sync**: The thunk calls `/user/check` via Axios. If the server verifies the HttpOnly cookie, it returns user information. Redux sets `isAuthenticated` to true, and the navigation bar updates to display the user's streaks, points, and avatar.
3.  **Loading the Workspace**: When a user navigates to `/problem/:id`, [WorkspacePage](file:///c:/CodeClimb/frontend/src/pages/WorkspacePage/index.jsx) mounts. It reads the problem ID from the URL parameters and calls GET `/problem/:id`.
4.  **Workspace State Sync**: Once problem details are retrieved, they are saved to `currentProblem` via `setProblem` in the workspace slice, which populates the workspace description panel.

---

### The Code Workspace

The coding editor handles layout, language selection, and drafts:

1.  **Monaco Editor Mounts**: Monaco Editor loads inside [PlaygroundPanel.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/PlaygroundPanel.jsx).
2.  **Restoring Drafts**: The component checks the Redux `userCode` dictionary for existing draft code under the problem ID. If found, it populates the editor with the saved draft.
3.  **Loading Starters**: If no draft exists, the system finds the starter code matching the active language in `currentProblem.startCode` and sets it in the editor.
4.  **Language Switching**: When the user switches languages, the dropdown in [EditorHeader.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/EditorHeader.jsx) dispatches the `setActiveLanguage` action. Monaco updates its syntax highlighting and compiler rules. The editor text remains unchanged, allowing developers to switch languages without losing their typed code.
5.  **Resetting Code**: Clicking the reset button retrieves the original starter code template from the problem model and replaces the editor contents.

---

### Live Results Render

This is the process of executing code and presenting compilation feedback:

1.  **Triggering Runs**: When the user clicks "Run", the system dispatches `runCodeAsync` with the code and language.
2.  **Triggering Submissions**: When the user clicks "Submit", the system dispatches `submitCodeAsync` with the code and language.
3.  **Handling Pending Submissions**: The workspace slice sets `submissionStatus` to `'loading'` and displays a loading spinner on the submit button.
4.  **Awaiting Final Grade**: The thunk makes an API call to `/submission/submit/:problemId` and waits. The backend runs all hidden test cases and polls Judge0.
5.  **Grader Response**: Once execution completes, the thunk returns with the test outcomes, runtime metrics, memory metrics, and points earned.
6.  **Displaying Results**: Redux stores the outcomes in `submissionResult`. [WorkspacePage](file:///c:/CodeClimb/frontend/src/pages/WorkspacePage/index.jsx) sees that a submission result exists, slides out the problem description, and renders the [SubmissionResultPanel.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/SubmissionResultPanel.jsx) screen showing details, points, and error logs.

---

### Triggering AI Debug

This is the flow of the AI tutor doubt-solving tab:

1.  **Opening the Chat Tab**: The user opens the "Ask AI" tab inside [AskAITab.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/tabs/AskAITab.jsx).
2.  **Submitting a Doubt**: The user types a question about their code and presses Enter. The text is added to the local messages state.
3.  **Sending the Request**: The frontend makes a POST request to `/ai/chat` containing:
    *   The conversation history (including the new question).
    *   The current editor code.
    *   The problem title, description, visible test cases, and starter templates.
4.  **Loading Indicator**: The chat pane displays a Bot icon with animated loading dots.
5.  **Receiving the Output**: The backend returns the final response as a JSON string from Gemini. The chatbot component appends this stringified response to the message array.
6.  **Structured Card Rendering**: The message bubbles use JSON parsing:
    *   If it is a regular text message, it renders as standard chat text.
    *   If it is a structured JSON response, it parses the keys and renders them in styled cards (Explanation card, Approach step card, monospaced Code blocks, and warning alert boxes).

---

## 4. UI Performance & Optimization Wins

To keep the coding interface smooth and responsive, several optimization techniques are used:

### 1. Preventing Typing Lag in Monaco Editor
Every keystroke in a code editor triggers a state change. If updating Redux triggered a re-render of the entire layout, typing would feel sluggish. To prevent this:
*   [PlaygroundPanel.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/PlaygroundPanel.jsx) manages the editor text in local component state (`value`) for instant response.
*   It updates Redux in the background. Because Monaco is isolated within its own canvas element, updating Redux does not trigger expensive DOM updates, keeping keystroke input latency at zero.

### 2. Search Debouncing on the Problems Page
Typing in a search bar usually fires a database query on every keystroke, which can slow down the interface and waste server bandwidth. To prevent this:
*   [ProblemsPage.jsx](file:///c:/CodeClimb/frontend/src/pages/ProblemsPage.jsx) uses a debounce timer inside a `useEffect` hook.
*   When the user types, a `setTimeout` timer is set to fetch results after 500ms.
*   If the user presses another key within 500ms, the cleanup function runs `clearTimeout`, cancelling the previous request. This ensures a database query is only fired when the user pauses typing.

### 3. Memoizing Calculations with `useMemo`
To avoid recalculating values on every render:
*   Inside [EditorHeader.jsx](file:///c:/CodeClimb/frontend/src/components/workspace/EditorHeader.jsx), the list of supported languages is calculated using `useMemo`.
*   It filters the languages array based on `currentProblem.startCode`. This filter only runs when the active problem changes, rather than on every editor click or state update.

### 4. Split-Pane layout styling without Re-renders
Draggable panel splitters can cause layout calculations that lag if they trigger React updates:
*   [WorkspacePage](file:///c:/CodeClimb/frontend/src/pages/WorkspacePage/index.jsx) uses `react-split` to handle split panels.
*   `react-split` updates element flexbox sizes directly in the DOM using style attributes. This bypasses React re-renders during dragging, keeping panel resizing smooth.
