# Dog Health App

A production-grade React Native + Expo application for smart wearable dog health monitoring. This app connects to an ESP32-S3 dog collar wearable via BLE and provides comprehensive health monitoring including heart rate, GPS tracking, geofencing, activity tracking, sleep monitoring, and environmental alerts.

## Features

- **Heart Rate Monitoring**: Real-time heart rate tracking with configurable alerts
- **GPS Tracking**: Live location monitoring with geofencing support
- **Activity Tracking**: Step counting, distance, and activity level monitoring
- **Sleep Tracking**: Monitor your dog's sleep patterns and quality
- **Environmental Monitoring**: Temperature and humidity tracking
- **Alert System**: Push notifications for health anomalies and geofence breaches
- **Real-time Analytics**: Visual charts showing health trends over time
- **Supabase Backend**: Cloud sync and data persistence

## Tech Stack

- **Framework**: React Native with Expo SDK 52
- **Language**: TypeScript 5.3
- **State Management**: Zustand
- **Navigation**: React Navigation 7 (Bottom Tabs + Stack)
- **Backend**: Supabase
- **BLE**: react-native-ble-plx
- **Maps**: react-native-maps
- **Charts**: react-native-gifted-charts

## Project Structure

```
dog-health-app/
├── app/
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # All app screens
│   ├── components/        # Reusable UI components
│   ├── services/          # BLE, API, storage services
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── theme/              # Theme configuration
│   ├── assets/             # Images, fonts, etc.
│   ├── config/             # App configuration
│   └── App.tsx             # App entry point
├── tests/                  # Test files
├── docs/                   # Documentation
└── [config files]          # Package.json, tsconfig, etc.
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dog-health-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on iOS/Android:
```bash
npm run ios    # iOS
npm run android # Android
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Configure your Supabase credentials and BLE UUIDs.

## Authentication Flow

The app uses phone number + OTP authentication:

1. **WelcomeScreen**: Introduction and login/signup options
2. **AddPhoneNumberScreen**: Enter phone number
3. **OTPVerificationScreen**: Verify OTP code
4. **SetupDogProfileScreen**: Add dog information
5. **PairDeviceScreen**: Connect to ESP32-S3 collar
6. **DashboardScreen**: Main app dashboard

## BLE Communication

The app communicates with the ESP32-S3 collar using BLE with the following service structure:

- **Heart Rate Service**: Real-time heart rate data (UUID: 180d)
- **GPS Service**: Location coordinates
- **Temperature Service**: Ambient temperature
- **Battery Service**: Battery level monitoring
- **Activity Service**: Step count and activity levels

## State Management

Uses Zustand stores for different domains:

- `dogStore`: Dog profiles and information
- `healthStore`: Health metrics (heart rate, temperature, etc.)
- `bleStore`: BLE connection and device state
- `trackingStore`: GPS tracking and geofencing
- `alertStore`: Alerts and notifications
- `settingsStore`: App settings and preferences

## Available Scripts

- `npm start` - Start Expo development server
- `npm run dev` - Start with dev client
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run tests

## Build for Production

### Android
```bash
npx expo build:android
# or with EAS
eas build --platform android
```

### iOS
```bash
npx expo build:ios
# or with EAS
eas build --platform ios
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request