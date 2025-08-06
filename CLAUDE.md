# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

# Linting
npm run lint

# Reset project to blank state
npm run reset-project  # Moves starter code to app-example/ and creates blank app/
```

### Testing Individual Files
For focused development:
```bash
# Run Expo with specific entry points
npx expo start --clear  # Clear cache when debugging
```

## Architecture Overview

### Project Structure
- **Expo Router with File-based Routing**: The app uses Expo Router v5.1 for navigation, with routes defined by file structure in the `app/` directory
- **React Native 0.79.5 with React 19**: Built on the latest React Native with new architecture enabled
- **TypeScript Configuration**: Strict mode enabled with path alias `@/*` mapping to root directory

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
- React Context for theme management (via `@react-navigation/native` ThemeProvider)
- Custom hooks for accessing theme and color scheme consistently across components

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

## Development Patterns

### File Organization
- Main app code goes in `app/` directory
- Example/reference code preserved in `app-example/`
- Shared components should follow the pattern in `app-example/components/`
- Platform-specific code uses `.ios.tsx`, `.android.tsx`, or `.web.ts` extensions

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

The project is a fresh Expo app with:
- Basic routing setup with a single index screen
- Example code in `app-example/` demonstrating tabs navigation, theming, and component patterns
- Ready for development with all dependencies installed

To start building, modify files in the `app/` directory following the patterns demonstrated in `app-example/`.