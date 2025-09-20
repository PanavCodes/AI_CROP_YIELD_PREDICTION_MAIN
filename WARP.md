# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: Crop Prediction App (React + Vite + TypeScript)

Commands

- Install dependencies
  - npm ci
  - If install fails due to peer deps: npm install --legacy-peer-deps

- Start dev server (Vite, opens at http://localhost:3000)
  - npm run dev
  - npm start

- Build (type-checks then bundles to dist/)
  - npm run build

- Preview production build (serves dist/)
  - npm run preview

- Tests (Vitest + Testing Library)
  - Run all tests (watch): npm test
  - Run once (CI style): npm run test -- --run
  - Run a single file: npm run test -- src/App.test.tsx
  - Run tests by name/pattern: npm run test -- -t "renders learn react link"

Notes: No linter configured in this repo (no ESLint/Prettier scripts found).

High-level architecture

- App shell and routing
  - Single-page app using React Router (BrowserRouter) in src/App.tsx
  - Route guard pattern:
    - PrivateRoute wraps protected routes and redirects unauthenticated users to /login
    - AuthenticatedRedirect (/) routes users based on profile state:
      - New-user tutorial gate via needsTutorial(user)
      - Farm data completion gate (hasFarmData) redirects to /data-input
  - Top-level layout (AppLayout) shows Navigation and AIChatbot only for authenticated routes

- Authentication and session model (mocked)
  - Local-only mock auth in src/utils/userUtils.ts using localStorage
  - isAuthenticated(), getCurrentUser(), saveUserSession(), updateUserFarmData(), needsTutorial()
  - Special-case flow for the demo user n@gmail.com: restricted to onboarding and data-input until completion

- Internationalization (i18n)
  - i18next configured in src/utils/i18n.ts and initialized application-wide
  - English (en) and Hindi (hi) resources defined inline
  - Language preference persisted to localStorage; language switchers in UI (e.g., Navigation, Login/Signup)

- UI and styling
  - TailwindCSS with custom agricultural color palette (tailwind.config.js)
  - Design tokens (colors/typography) extended; utility-first styling throughout
  - UI primitives in src/components/ui (Button, Header, Input)

- Core pages and flows
  - Authentication: src/pages/Login.tsx, src/pages/Signup.tsx
  - Onboarding flow: src/components/OnboardingFlow.tsx orchestrates tutorial and initial data collection
  - Farm data input: src/pages/DataInput.tsx supports manual form and mock CSV/Excel upload
  - Main features:
    - Dashboard: src/pages/Dashboard.tsx (weather, predictions, charts, AI yield modal)
    - Suggestions: src/pages/Suggestions.tsx (categorized optimization tasks with completion state)
    - Market Insights: src/pages/MarketInsights.tsx
    - Community: src/pages/Community.tsx
    - Profile Settings: src/pages/profile-settings

- Data and utilities
  - Mock domain data in src/mockData/mockData.ts (weather, yields, optimization suggestions, etc.)
  - User/session helpers in src/utils/userUtils.ts
  - Notifications in src/utils/notificationUtils.ts consumed by Navigation/NotificationIcon
  - Misc utilities in src/lib/utils.ts

- Project configuration and build
  - Vite config (vite.config.ts):
    - Alias @ -> ./src
    - Dev server: port 3000, open: true
    - Build outDir: dist, sourcemap: true
    - assetsInclude for common image types
  - TypeScript config (tsconfig.json):
    - Strict mode; path mapping "@/*" -> "src/*"
    - noEmit builds; tsc used for type-checking in build script

- Testing setup
  - Vitest test runner via script "test": "vitest"
  - Testing Library and jest-dom set up in src/setupTests.ts (global matchers)
  - Example test: src/App.test.tsx

Repository conventions and tips (actionable)

- Use path aliases for imports (Vite + TS):
  - import Something from '@/components/Navigation'
- When adding tests, keep them alongside components or under src/** with .test.tsx and they will be picked up by Vitest
- Production build artifacts are emitted to dist/

Key context from README.md

- This is a prototype with mocked authentication, data, and AI outputs for demo purposes
- Demo behavior: any password works; sample emails influence flow
  - e@gmail.com (existing user): routed to dashboard
  - n@gmail.com (new user): forced through tutorial and data input before gaining full access
