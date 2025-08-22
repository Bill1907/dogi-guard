# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 Important Recent Changes

This project recently underwent major authentication and database improvements:
- **Environment Variable Handling**: Fixed "supabaseKey is required" startup crash
- **Clerk-Supabase Integration**: Updated to 2025 native integration (no JWT templates)
- **Error Handling**: Improved authentication error handling with Korean/English UI
- **Database Migration**: Automatic migration from local storage to Supabase
- **RLS Policies**: Fixed Row Level Security integration with Clerk user IDs

## Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Start the development server
npm start
# or specific platforms:
npm run ios      # Start iOS simulator
npm run android  # Start Android emulator  
npm run web      # Start web version

# Linting and Type Checking
npm run lint        # ESLint checks
npx tsc --noEmit   # TypeScript type checking

# Reset project to blank state
npm run reset-project  # Moves starter code to app-example/ and creates blank app/
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env
# Edit .env with your actual credentials:
# - EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY (from Clerk Dashboard)
# - EXPO_PUBLIC_SUPABASE_URL (from Supabase Dashboard)
# - EXPO_PUBLIC_SUPABASE_KEY (new format: sb_publishable_...)
```

### Testing Individual Files
For focused development:
```bash
# Run Expo with specific entry points
npx expo start --clear  # Clear cache when debugging
```

## Architecture Overview

### Project Structure
- **Expo Router with File-based Routing**: File structure in `app/` directory defines routes
- **React Native 0.79.5 with React 19**: Latest RN with new architecture enabled
- **TypeScript Configuration**: Strict mode with `@/*` path aliases
- **Authentication**: Clerk for user management with React Native integration
- **Database**: Supabase with Row Level Security (RLS) and automatic migration
- **Internationalization**: Korean/English UI support via I18nContext

### Key Architectural Patterns

#### Navigation Architecture
- Uses Expo Router's file-based routing system
- Stack navigation is the default with `app/_layout.tsx` defining the root Stack navigator
- Nested routes supported through directory structure (e.g., `(tabs)` for grouped routes)
- Typed routes enabled via `experiments.typedRoutes` in app.json

#### Component Architecture (from app-example)
- **Themed Components**: Pattern of themed wrapper components (`ThemedText`, `ThemedView`) that adapt to light/dark mode
- **Platform-specific Components**: `.ios.tsx` and `.web.ts` extensions for platform-specific implementations
- **Hooks Pattern**: Custom hooks in `hooks/` for reusable logic (theme, color scheme)
- **Constants**: Centralized color definitions in `constants/Colors.ts` with light/dark variants

#### State & Data Flow
- **Authentication**: Clerk's `useAuth()` and `useSession()` hooks
- **Database**: Custom `useSupabase()` hook with Clerk JWT integration
- **Dog Data**: `DogContext` with automatic Supabase synchronization
- **Migration**: `useDatabaseMigration()` for local-to-cloud data migration
- **Internationalization**: `I18nContext` for Korean/English switching
- **Error Handling**: Comprehensive error boundary with localized messages

### Configuration Files

#### TypeScript (`tsconfig.json`)
- Extends Expo's base configuration
- Strict mode enabled for better type safety
- Path alias `@/` configured for cleaner imports

#### ESLint (`eslint.config.js`)
- Uses `eslint-config-expo` flat config
- Ignores `dist/` directory

#### Expo Configuration (`app.json`)
- Scheme: `dogiguard` for deep linking
- New architecture enabled (`newArchEnabled: true`)
- Typed routes experiment enabled
- Splash screen and adaptive icons configured

#### Environment Variables (`.env`)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication key
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_KEY`: New format key (sb_publishable_...)
- Legacy `EXPO_PUBLIC_SUPABASE_ANON_KEY` supported for migration

## Development Patterns

### File Organization
```
app/
├── (auth)/          # Authentication screens
├── (home)/          # Main app screens (protected)
├── _layout.tsx      # Root layout with Clerk provider
└── index.tsx        # App entry point with auth check

components/
├── auth/            # Authentication components
├── ui/              # Reusable UI components
└── MigrationStatus.tsx  # Database migration UI

hooks/
├── useSupabase.ts   # Authenticated Supabase client
├── useDatabaseMigration.ts  # Auto migration logic
└── useSupabaseDogs.ts      # Dog data operations

utils/
├── supabase.ts      # Supabase configuration
├── validateEnv.ts   # Environment validation
└── authErrorHandler.ts    # Localized error handling
```

### Import Conventions
- Use `@/` prefix for root-relative imports (e.g., `@/hooks/useColorScheme`)
- React Native imports from `react-native` package
- Navigation imports from `expo-router` for routing components

### Styling Approach
- Inline styles for simple components
- StyleSheet.create for complex/reusable styles
- Theme-aware styling through `useThemeColor` hook pattern
- Responsive design using flex layouts

## Current State

**DogiGuard** is a pet medication tracking app with:
- ✅ **Complete Authentication**: Clerk integration with Korean/English UI
- ✅ **Database Integration**: Supabase with automatic migration from local storage
- ✅ **Dog Profile Management**: Full CRUD operations with photo support
- ✅ **Medication Tracking**: Heartwork medication scheduling and notifications
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Environment Resilience**: Graceful handling of missing configuration

### Key Features Implemented
- User registration/login with email code verification
- Dog profile creation and editing with photo upload
- Medication tracking with next dose calculations
- Automatic data migration from local storage to cloud
- Bilingual UI (Korean/English) with proper localization
- Row Level Security (RLS) for data isolation between users

### Recent Fixes
- Fixed "supabaseKey is required" startup crash
- Updated to 2025 Supabase security standards
- Resolved Clerk-Supabase JWT integration issues
- Improved authentication error handling
- Added comprehensive environment variable validation