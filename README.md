# DogVita

Smart wearable dog health monitoring system. A React Native app that connects to an ESP32-S3 dog collar via BLE for real-time health tracking.

## Features

- Heart rate monitoring with alerts
- GPS tracking with geofencing
- Activity and sleep tracking
- Environmental monitoring (temperature/humidity)
- Push notification alerts
- Supabase cloud backend

## Project Structure

- `dog-health-app/` — React Native (bare workflow) TypeScript app
- `graphify-setup/` — Knowledge graph tooling

## Quick Start

```bash
cd dog-health-app
npm install
npx react-native start --reset-cache
npx react-native run-android
```

## Tech Stack

React Native 0.76 · TypeScript 5.3 · Zustand · React Navigation 7 · Supabase · react-native-ble-plx

## License

MIT
