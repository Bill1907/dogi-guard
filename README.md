# DogiGuard 🐕

A React Native app for tracking pet medications and health records, built with Expo, Clerk authentication, and Supabase database.

## ✨ Features

- 🔐 **Secure Authentication**: Clerk integration with email code verification
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
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_your_key_here
```

### 3. Start Development
```bash
npm start
# Choose your platform: iOS, Android, or Web
```

## 📋 Setup Guide

### Authentication (Clerk)
1. Create account at [Clerk Dashboard](https://dashboard.clerk.com)
2. Create new React Native application
3. Enable **Email Code** verification
4. Copy publishable key to `.env`

### Database (Supabase)
1. Create project at [Supabase Dashboard](https://app.supabase.com)
2. Copy project URL and publishable key to `.env`
3. Run database schema from `database/2025-native-schema.sql`

**📖 Detailed Setup**: See [docs/ENVIRONMENT-SETUP.md](docs/ENVIRONMENT-SETUP.md)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native 0.79.5 + React 19
- **Navigation**: Expo Router v5.1 (file-based routing)
- **Authentication**: Clerk with email code verification
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
├── useSupabase.ts   # Authenticated Supabase client
├── useDatabaseMigration.ts  # Auto migration logic
└── useSupabaseDogs.ts      # Dog data operations

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
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk authentication key |
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_KEY` | ✅ | Supabase publishable key (new format) |

### Legacy Support
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Legacy anon key (deprecated Nov 2025)

## 🚨 Troubleshooting

### Common Issues

**"supabaseKey is required"**
- Check `.env` file exists in project root
- Verify environment variable names have `EXPO_PUBLIC_` prefix
- Restart development server after changes

**Authentication errors**
- Enable email code verification in Clerk dashboard
- Avoid email links (not supported in Expo)

**Database RLS errors**
- Ensure user is authenticated
- Check Clerk-Supabase JWT integration
- Verify RLS policies in database

**📖 Complete Troubleshooting**: See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## 📚 Documentation

- 📋 **[Environment Setup](docs/ENVIRONMENT-SETUP.md)**: Complete setup guide
- 🚨 **[Troubleshooting](docs/TROUBLESHOOTING.md)**: Common issues and solutions
- 🏗️ **[Architecture Guide](CLAUDE.md)**: Development patterns and conventions
- 🔄 **[2025 Update Summary](SUPABASE-2025-UPDATE.md)**: Recent security improvements

## 🔄 Recent Updates

### v1.1.0 - 2025 Security Update
- ✅ Fixed "supabaseKey is required" startup crash
- ✅ Updated to 2025 Supabase security standards
- ✅ Improved Clerk-Supabase JWT integration
- ✅ Enhanced authentication error handling
- ✅ Added comprehensive environment validation
- ✅ Bilingual error messages (Korean/English)

### Key Features
- 🔐 **Secure**: Row Level Security + JWT authentication
- 📱 **Cross-platform**: iOS, Android, Web support
- 🌍 **International**: Korean/English UI
- ☁️ **Cloud-ready**: Automatic data migration and sync
- 🛡️ **Resilient**: Graceful error handling and recovery

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
