# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 Important Recent Changes

This project recently underwent major authentication and database improvements:
- **Authentication Migration**: Transitioned from Clerk to native Supabase Auth
- **Environment Variable Handling**: Fixed "supabaseKey is required" startup crash
- **Error Handling**: Comprehensive error handling with Korean/English bilingual UI
- **Database Migration**: Automatic migration from local storage to Supabase
- **RLS Policies**: Row Level Security with user-scoped data access
- **Sentry Integration**: Error tracking and performance monitoring added

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
- **Authentication**: Native Supabase Auth with email/password and deep linking
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Internationalization**: Korean/English UI support via I18nContext
- **Error Monitoring**: Sentry integration for crash reporting and performance

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
- **Authentication**: `useSupabaseAuth()` hook for auth state management
- **Database**: `useSupabase()` hook for authenticated Supabase client
- **Dog Data**: `DogContext` with real-time Supabase synchronization
- **Medication Tracking**: `MedicationRecordService` for dose scheduling
- **Migration**: `useDatabaseMigration()` for local-to-cloud data migration
- **Internationalization**: `I18nContext` for Korean/English switching
- **Error Handling**: Comprehensive error boundary with Sentry integration

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
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_KEY`: New format key (sb_publishable_...)
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API for veterinary search
- `EXPO_PUBLIC_SENTRY_DSN`: Sentry error tracking DSN
- Legacy `EXPO_PUBLIC_SUPABASE_ANON_KEY` supported for migration
- Legacy `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (deprecated)

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
├── useSupabaseAuth.ts       # Native Supabase Auth management
├── useSupabase.ts          # Authenticated Supabase client
├── useDatabaseMigration.ts # Auto migration logic
├── useSupabaseDogs.ts      # Dog data operations with medications
├── useTranslation.ts       # i18n translation hook
└── useColorScheme.ts       # Theme and color management

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

**DogiGuard** is a comprehensive pet health management app with:
- ✅ **Native Authentication**: Supabase Auth with email verification and password reset
- ✅ **Cloud Database**: Supabase PostgreSQL with real-time sync and RLS
- ✅ **Dog Profile Management**: Complete CRUD with photo upload and Expo Image
- ✅ **Medication Tracking**: Advanced scheduling with calendar view and dose calculations
- ✅ **Map Integration**: Google Maps for finding nearby veterinary services
- ✅ **Error Monitoring**: Sentry integration for crash reporting and performance
- ✅ **Bilingual Support**: Full Korean/English UI with context-aware translations
- ✅ **Offline Support**: Local storage fallback with automatic cloud sync

### Key Features Implemented

#### Authentication & Security
- Native Supabase Auth with email/password
- Email verification with deep linking support
- Password reset flow with secure tokens
- Row Level Security (RLS) for user data isolation
- Secure token storage with expo-secure-store

#### Dog Profile Management  
- Create, read, update, delete dog profiles
- Photo capture and upload with Expo Image Picker
- Weight tracking with unit conversion (kg/lbs)
- Age calculation from birth date
- Real-time sync across devices

#### Medication Tracking
- Medication schedule management
- Next dose date auto-calculation
- Medication history with calendar view
- Flip-card UI with 3D animations
- Daily medication summaries and statistics
- Heartworm medication specific tracking

#### Map & Location Services
- Google Maps integration for veterinary search
- Current location detection
- Nearby veterinary hospitals and pharmacies
- Distance calculation and routing
- Custom map markers with dog photos

#### UI/UX Features
- Pokemon card-style profile cards with holographic effects
- Gesture-based interactions (long press, swipe)
- Haptic feedback for better user experience
- Dark/light theme support
- Responsive design for all screen sizes

### Recent Updates & Fixes
- ✅ Migrated from Clerk to native Supabase Auth
- ✅ Fixed "supabaseKey is required" startup crash
- ✅ Updated to 2025 Supabase security standards (sb_publishable_ keys)
- ✅ Improved authentication error handling with bilingual messages
- ✅ Added comprehensive environment variable validation
- ✅ Integrated Sentry for production error tracking
- ✅ Enhanced medication tracking with calendar visualization
- ✅ Added Google Maps for veterinary service discovery
- ✅ Implemented 3D flip animations for profile cards
- ✅ Added comprehensive error boundaries with fallback UI

## API & Data Models

### Database Schema

#### Dogs Table
```typescript
interface Dog {
  id: string;                          // UUID primary key
  user_id: string;                      // User ID (foreign key)
  name: string;                         // Dog's name
  weight: number;                       // Weight in kg
  birth: Date;                          // Birth date (TIMESTAMPTZ)
  photo?: string;                       // Photo URL (optional)
  current_medications: string[];        // Array of current medications
  next_heartwork_medication_date: Date; // Next heartworm dose
  last_heartwork_medication_date: Date; // Last heartworm dose
  heartwork_medication_name: string;    // Heartworm medication name
  created_at: Date;                     // Creation timestamp
  updated_at: Date;                     // Update timestamp
}
```

#### Medication Records Table
```typescript
interface MedicationRecord {
  id: string;                    // UUID primary key
  dog_id: string;                // Dog ID (foreign key)
  medication_name: string;        // Medication name
  dosage?: string;               // Dosage information
  recorded_date: string;         // Date medication was given
  notes?: string;                // Optional notes
  is_heartworm_medication: boolean; // Heartworm medication flag
  created_at: Date;              // Creation timestamp
  updated_at: Date;              // Update timestamp
}
```

### Key Services

#### SupabaseDogService
- `getAllDogs()`: Fetch all dogs for authenticated user
- `createDog(data)`: Create new dog profile
- `updateDog(id, updates)`: Update existing dog
- `deleteDog(id)`: Delete dog profile
- `searchDogs(query)`: Search dogs by name
- `subscribeToChanges(callback)`: Real-time updates

#### MedicationRecordService  
- `recordMedication(input)`: Record medication administration
- `getMedicationRecords(dogId, limit?)`: Get medication history
- `getMedicationRecordsForDate(dogId, date)`: Get records for specific date
- `getMedicationStats(dogId, startDate?)`: Get medication statistics
- `getDailyMedicationSummary(dogId, start, end)`: Daily summaries
- `calculateNextDoseDate(currentDate, intervalDays)`: Calculate next dose

### Authentication Flow

1. **Sign Up**: Email/password → Email verification → Auto sign in
2. **Sign In**: Email/password → Session creation → Navigate to home
3. **Password Reset**: Request reset → Email link → Update password
4. **Session Management**: Auto refresh tokens, persistent sessions
5. **Deep Linking**: Handle email confirmation and password reset callbacks

### Data Migration Strategy

Automatic migration from AsyncStorage to Supabase:
1. Check for local data on app startup
2. Authenticate user with Supabase
3. Upload local dog profiles to cloud
4. Clear local storage after successful migration
5. Enable real-time sync for future updates

## Performance Optimizations

- **Image Optimization**: Expo Image with memory-disk caching
- **Lazy Loading**: Components loaded on-demand with React.lazy
- **Memoization**: React.memo for expensive components
- **Virtual Lists**: FlashList for large data sets
- **Bundle Optimization**: Metro bundler with Hermes engine
- **Animation Performance**: Reanimated 3 with native driver

## Security Best Practices

- **RLS Policies**: User can only access their own data
- **Input Validation**: Comprehensive validation on all forms
- **Secure Storage**: Sensitive data in expo-secure-store
- **API Keys**: Environment variables with validation
- **Error Handling**: No sensitive data in error messages
- **Deep Link Validation**: Verify all incoming deep links

## Testing Strategy

- **Unit Tests**: Jest for utility functions and hooks
- **Component Tests**: React Native Testing Library
- **E2E Tests**: Detox for critical user flows
- **Manual Testing**: iOS Simulator and Android Emulator
- **Error Monitoring**: Sentry for production issues

## Deployment

### Development
```bash
npm start           # Start Expo development server
npm run ios        # iOS Simulator
npm run android    # Android Emulator
npm run web        # Web browser
```

### Production Build
```bash
eas build --platform ios      # iOS production build
eas build --platform android  # Android production build
eas submit                     # Submit to app stores
```

### Environment Management
- Development: `.env.development`
- Staging: `.env.staging`
- Production: `.env.production`

## Future Roadmap

- [ ] Push notifications for medication reminders
- [ ] Health record document storage
- [ ] Vet appointment scheduling
- [ ] Multi-pet household support
- [ ] Social features for pet communities
- [ ] AI-powered health insights
- [ ] Wearable device integration
- [ ] Offline-first architecture improvements