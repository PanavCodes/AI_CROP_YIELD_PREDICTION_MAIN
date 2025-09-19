# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Setup and Installation
```bash
# Install dependencies (use --legacy-peer-deps for compatibility)
npm install --legacy-peer-deps

# Start development server
npm run dev
# or
npm start

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run single test file
npm test -- src/components/__tests__/ComponentName.test.tsx
```

### Development Server
- Development server runs on `http://localhost:3000`
- Lightning-fast hot module replacement (HMR) via Vite
- TailwindCSS builds automatically during development
- Vite provides instant server startup and optimized builds

## Project Architecture

### Tech Stack Overview
- **Frontend**: React 18 with TypeScript
- **Styling**: TailwindCSS with custom agricultural color palette
- **Routing**: React Router DOM v7
- **Internationalization**: i18next (English/Hindi support)
- **Charts**: Recharts for data visualization
- **Icons**: React Icons (Feather Icons & Game Icons)
- **State Management**: React hooks + localStorage for persistence
- **Build Tool**: Vite (lightning-fast build tool and dev server)

### User Flow Architecture
The application implements a sophisticated user flow with three distinct user types:

1. **New Users (`n@gmail.com`)**: Tutorial → Data Input → Dashboard
2. **Existing Users**: Direct to Dashboard
3. **Demo Users**: Full access to all features

**Key Routing Logic** (in `src/App.tsx`):
- `AuthenticatedRedirect` component handles initial routing based on user state
- `PrivateRoute` wrapper enforces authentication and user-specific access controls
- New users are restricted to onboarding and data-input pages until setup is complete

### Core Components Structure

**Navigation System**:
- `Navigation.tsx`: Adaptive navigation that disables certain features for new users
- Profile dropdown with language switching
- Mobile-responsive collapsible menu

**User Onboarding Flow**:
- `OnboardingFlow.tsx`: Manages tutorial progression
- `Tutorial.tsx`: Interactive 5-step tutorial component
- Progressive disclosure based on user completion state

**Data Architecture**:
- `mockData/mockData.ts`: Comprehensive mock data including weather, crops, predictions, and user profiles
- `utils/userUtils.ts`: User state management with localStorage persistence
- `utils/i18n.ts`: Complete bilingual translations (800+ keys)

### State Management Patterns

**User Authentication**:
```typescript
// User state is managed via localStorage with typed interfaces
interface User {
  hasCompletedProfile: boolean;
  hasFarmData: boolean;
  hasCompletedTutorial: boolean;
  // ... other properties
}
```

**Feature Flags via User State**:
- Navigation items are conditionally disabled based on `user.hasFarmData`
- Tutorial completion tracked via `user.hasCompletedTutorial`
- Route access controlled by user type and completion status

## Vite Configuration

The project uses Vite for fast development and optimized production builds:

**Key Features:**
- **Fast HMR**: Instant hot module replacement during development
- **Optimized Builds**: Advanced code splitting and tree-shaking
- **TypeScript Support**: Built-in TypeScript compilation
- **Path Aliases**: `@/` mapped to `src/` directory for cleaner imports
- **Asset Handling**: Automatic optimization of images and static assets

**Configuration** (`vite.config.ts`):
```typescript
// Path aliases for cleaner imports
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
  },
}

// Development server on port 3000 (matches CRA)
server: {
  port: 3000,
  open: true,
}
```

## Key Development Guidelines

### Mock Data System
All data is currently mocked in `src/mockData/mockData.ts`. When transitioning to real APIs:
- Replace mock weather data with actual weather service
- Implement backend authentication instead of localStorage
- Convert mock crop predictions to actual ML model integration

### Internationalization (i18n)
- All UI text must use `t()` function from `useTranslation()` hook
- Translation keys are nested (e.g., `t('dashboard.weather')`)
- Language preference persisted in localStorage
- Add new languages by extending the `resources` object in `i18n.ts`

### Color System (TailwindCSS)
Custom agricultural-themed colors are defined in `tailwind.config.js`:
```javascript
colors: {
  'leaf-green': '#228B22',
  'earth-brown': '#8B4513', 
  'sky-blue': '#87CEEB',
  'wheat-gold': '#F5DEB3',
  'soil-dark': '#654321'
}
```

### User Testing Accounts
For development and testing:
- `demo@farm.com`: Full-featured existing user
- `e@gmail.com`: Another existing user with complete setup
- `n@gmail.com`: New user for testing onboarding flow
- Any email with any password works (authentication is mocked)

### Component File Organization
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI primitives (Button, Input, etc.)
│   ├── AIChatbot.tsx    # AI assistant component
│   └── Navigation.tsx   # Main navigation
├── pages/               # Route-level page components
├── utils/               # Helper functions and utilities
├── mockData/           # All mock data and sample content
├── types/              # TypeScript type definitions
└── lib/                # Shared utilities (utils.ts for cn() helper)
```

### Responsive Design Approach
- Mobile-first design with TailwindCSS breakpoints
- Navigation collapses to hamburger menu on mobile
- Touch-friendly interface with large clickable areas
- Consistent spacing using Tailwind's spacing scale

## Prototype Limitations

This is a hackathon prototype with simulated features:
- No real backend or database integration
- Mock AI predictions (not actual ML models)
- Simulated file uploads (UI only)
- No real SMS/WhatsApp notifications
- Community forum is UI-only
- Weather data is mocked (not live API)

When extending this prototype, prioritize implementing actual backend services for authentication, data persistence, and AI model integration.