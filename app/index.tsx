import 'react-native-gesture-handler';            // Required for React Navigation
import 'expo-router/entry';
// Registers the main app component so that it runs correctly in both Expo Go and standalone builds.
// Ensures that the app works in an Expo-managed environment.
import { registerRootComponent } from 'expo';

// Loads the App.tsx or App.js file, which is the entry point of the application.
// This file usually contains the main UI and navigation setup.
import App from './App';

// Register the root component for Expo
registerRootComponent(App);
