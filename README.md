# DogiGuard 🐕

A React Native app for tracking pet medications and health records, built with Expo, Supabase Auth, and PostgreSQL database.

## ✨ Features

- 🔐 **Secure Authentication**: Native Supabase Auth with email verification
- 🐕 **Pet Profiles**: Complete dog profile management with photo upload
- 💊 **Medication Tracking**: Heartwork medication scheduling and reminders
- 🌐 **Bilingual Support**: Korean/English UI with seamless switching
- ☁️ **Cloud Sync**: Automatic migration from local storage to Supabase
- 🔒 **Data Security**: Row Level Security (RLS) for user data isolation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) or Android Emulator

### 1. Installation
```bash
git clone <repository-url>
cd dogi-guard
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Add your credentials to .env:
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_your_key_here
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

### 3. Start Development
```bash
npm start
# Choose your platform: iOS, Android, or Web
```

## 📋 Setup Guide

### Authentication & Database (Supabase)
1. Create project at [Supabase Dashboard](https://app.supabase.com)
2. Copy project URL and publishable key to `.env`
3. Enable **Authentication** in your Supabase dashboard
4. Configure **Email** provider and templates
5. Set site URL to `dogiguard://` for deep linking
6. Run database schema from `database/2025-native-schema.sql`

### Google Maps (Optional)
1. Create project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Places API (New)**
3. Create API key and restrict to your app
4. Add key to `.env` as `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`

**📖 Complete Setup Guide**: See CLAUDE.md for detailed development instructions

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native 0.79.5 + React 19
- **Navigation**: Expo Router v5.1 (file-based routing)
- **Authentication**: Native Supabase Auth with email verification
- **Database**: Supabase with Row Level Security
- **Internationalization**: Custom I18n context for Korean/English
- **State Management**: React Context + Custom hooks

### Project Structure
```
app/
├── (auth)/          # Authentication screens
├── (home)/          # Main app screens (protected)
├── _layout.tsx      # Root layout with providers
└── index.tsx        # App entry point

components/
├── auth/            # Authentication components
├── ui/              # Reusable UI components
└── MigrationStatus.tsx  # Database migration UI

hooks/
├── useSupabaseAuth.ts       # Native Supabase Auth management  
├── useSupabase.ts          # Authenticated Supabase client
├── useDatabaseMigration.ts # Auto migration logic
├── useSupabaseDogs.ts      # Dog data operations with medications
└── useTranslation.ts       # i18n translation hook

docs/                # Comprehensive documentation
```

## 🛠️ Development

### Available Scripts
```bash
npm start           # Start Expo development server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
npm run web         # Run in web browser
npm run lint        # Run ESLint
npx tsc --noEmit   # TypeScript type checking
```

### Key Commands
```bash
# Clear cache and restart
npx expo start --clear

# Install iOS dependencies
cd ios && pod install && cd ..

# Reset to fresh project
npm run reset-project
```

## 🔧 Configuration

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_KEY` | ✅ | Supabase publishable key (new format) |
| `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` | ⚠️ | Google Places API for map features |
| `EXPO_PUBLIC_SENTRY_DSN` | ⚪ | Sentry error tracking (production only) |

### Legacy Support
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Legacy anon key (deprecated Nov 2025)

## 🚨 Troubleshooting

### Common Issues

**"supabaseKey is required"**
- Check `.env` file exists in project root
- Verify environment variable names have `EXPO_PUBLIC_` prefix
- Restart development server after changes

**Authentication errors**
- Check Supabase authentication is enabled
- Verify email templates are configured
- Ensure deep link scheme matches app.json

**Database RLS errors**
- Ensure user is authenticated with Supabase Auth
- Check RLS policies match user session structure
- Verify RLS policies in database

**📖 Advanced Troubleshooting**: See CLAUDE.md for comprehensive debugging guide

## 📚 Documentation

- 🏗️ **[Development Guide](CLAUDE.md)**: Complete architecture, setup, and troubleshooting
- 📋 **Environment Setup**: Configuration and credentials (above)
- 🚨 **Troubleshooting**: Common issues and solutions (above)
- 🔄 **Recent Updates**: v1.1.0 migration details (below)

## 🔄 Recent Updates

### v1.1.0 - Native Auth Migration
- ✅ **Migration**: Transitioned from Clerk to native Supabase Auth
- ✅ **Security**: Updated to 2025 Supabase security standards  
- ✅ **Startup Fix**: Resolved "supabaseKey is required" crash
- ✅ **Error Handling**: Enhanced authentication with bilingual support
- ✅ **Environment**: Added comprehensive validation and fallback
- ✅ **Deep Linking**: Email verification and password reset support

### Key Features
- 🔐 **Secure**: Row Level Security + native Supabase Auth
- 📱 **Cross-platform**: iOS, Android, Web support
- 🌍 **International**: Korean/English UI with context switching
- ☁️ **Cloud-ready**: Real-time sync and automatic migration
- 🗺️ **Location**: Google Maps integration for veterinary search
- 🎨 **Interactive**: 3D card animations and haptic feedback
- 🛡️ **Resilient**: Comprehensive error handling and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- 📖 **Documentation**: Check `docs/` directory
- 🐛 **Issues**: Report bugs via GitHub Issues
- 💬 **Questions**: Use GitHub Discussions

---

**🚀 Ready to start?** Run `cp .env.example .env`, add your credentials, and `npm start`!
