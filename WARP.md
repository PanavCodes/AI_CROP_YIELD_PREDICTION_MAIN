# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Install dependencies (use legacy peer deps for compatibility)
npm install --legacy-peer-deps

# Start development server (runs on http://localhost:3000)
npm run dev
# Alternative start command
npm start

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

### Development Notes
- Development server auto-opens browser by default (configured in vite.config.ts)
- Uses Vite for fast development and building
- TypeScript compilation happens during build process (`tsc --noEmit && vite build`)

## Architecture Overview

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with path aliases (`@/` → `src/`)
- **Styling**: TailwindCSS with custom agricultural color palette
- **Routing**: React Router DOM v7
- **Internationalization**: i18next (English/Hindi support)
- **Charts**: Recharts for data visualization
- **Icons**: React Icons (Feather, Game Icons)
- **Animations**: Framer Motion for smooth transitions

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (Button, Input, Header)
│   ├── Navigation.tsx   # Main navigation with mobile support
│   ├── AIChatbot.tsx    # AI assistant interface
│   ├── OnboardingFlow.tsx # New user tutorial flow
│   └── WeatherDashboard.tsx # Weather data display
├── pages/               # Route-specific page components
│   ├── Login.tsx        # Authentication
│   ├── Dashboard.tsx    # Main dashboard with weather, predictions, charts
│   ├── DataInput.tsx    # Farm data input forms
│   ├── Suggestions.tsx  # AI optimization recommendations
│   └── Community.tsx    # Forum interface (UI-only)
├── utils/               # Utility functions and configurations
│   ├── userUtils.ts     # User management and authentication
│   ├── i18n.ts         # Internationalization setup
│   └── notificationUtils.ts # Notification system
├── mockData/            # Demo data for prototype
│   └── mockData.ts      # Weather, predictions, optimization data
└── App.tsx              # Main app with routing and authentication
```

### Key Features & User Flows

#### Authentication System
- Mock authentication with predefined users:
  - `demo@farm.com` / `e@gmail.com` → Existing users (complete data)
  - `n@gmail.com` → New user (triggers tutorial + data input flow)
  - Any email → New signup registration
- User state managed via localStorage with UserUtils interface

#### User Flow Architecture
The app implements a sophisticated user flow system:

1. **New Users (`n@gmail.com`)**:
   - Login → OnboardingFlow (tutorial) → DataInput → restricted Dashboard access
   - Navigation items are visible but disabled until farm data is complete

2. **Existing Users**:
   - Login → Full Dashboard access with all features enabled

3. **Route Protection**:
   - `PrivateRoute` component enforces authentication
   - `AuthenticatedRedirect` determines user destination based on completion status

#### State Management Pattern
- **User State**: Managed through `userUtils.ts` with localStorage persistence
- **Mock Data**: Centralized in `mockData/mockData.ts` for consistent demo experience
- **Internationalization**: Language preference persisted across sessions
- **Navigation State**: Dynamic rendering based on user completion status

### Design System

#### Color Palette
- **Agricultural Theme**: earth-brown, leaf-green, sky-blue, wheat-gold, soil-dark
- **AI/Professional**: ai-purple, success-green, info-blue, warning-orange
- **System Colors**: Defined with CSS variables for theming support

#### Component Architecture
- **Reusable UI Components**: Located in `components/ui/` following shadcn/ui patterns
- **Route Transitions**: `RouteTransition` and `PageTransition` components for smooth navigation
- **Responsive Design**: Mobile-first approach with TailwindCSS breakpoints

### Development Patterns

#### TypeScript Integration
- Strict TypeScript configuration with path mapping (`@/*` aliases)
- Interface definitions for User, Location, Weather data types
- Type-safe component props and utility functions

#### Internationalization
- i18next configuration with English/Hindi translations
- Translation keys organized by feature (`nav.*, auth.*, dashboard.*`)
- Persistent language selection with localStorage

#### Mock Data Strategy
- Comprehensive mock data covering weather, predictions, optimizations
- Realistic agricultural scenarios for demonstration
- Centralized data management for easy updates

### Key Components

#### Navigation.tsx
- Adaptive navigation with user status awareness
- Mobile-responsive with collapsible menu
- Profile dropdown with language switching
- Disabled states for incomplete user flows

#### OnboardingFlow.tsx & Tutorial.tsx
- Multi-step tutorial system for new users
- Progressive disclosure of application features
- Skip option with completion tracking

#### Dashboard.tsx
- Weather dashboard with current conditions and forecasts
- AI prediction displays with confidence metrics
- Interactive charts using Recharts
- Quick action panels for common tasks

### Testing & Development Notes
- Uses Vitest for testing framework
- Mock authentication system for development
- Hot reload enabled via Vite
- TypeScript compilation checked during build process

### Environment Setup
- Node.js v14+ required
- Port 3000 default for development server
- Source maps enabled for debugging
- Path aliases configured for clean imports