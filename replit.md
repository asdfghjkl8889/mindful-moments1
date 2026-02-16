# Mindful Moments

## Overview
A mindfulness and wellness mobile app built with Expo React Native. Converted from the web app at mindful-moments.blog (Zen Zoo). Features mood tracking, meditation timer, gratitude journaling, and profile with statistics.

## Architecture
- **Frontend**: Expo Router with file-based routing, React Native
- **Backend**: Express server on port 5000 (serves landing page + API)
- **State**: AsyncStorage for local data persistence
- **Styling**: React Native StyleSheet with Nunito font family
- **Theme**: Sage green / teal color palette with dark mode support

## Key Features
- **Home**: Mood tracking (5 moods), daily greeting, streak/progress stats, mood history, inspirational quotes
- **Meditate**: Timer with breathing animation, 1-20 min durations, pause/resume, session tracking
- **Journal**: Gratitude entries (3 items) + reflection text, compose modal, long-press to delete
- **Profile**: Avatar selection, name editing, comprehensive statistics grid

## File Structure
- `app/(tabs)/` - Tab screens (index, meditate, journal, profile)
- `app/(tabs)/_layout.tsx` - Tab bar with NativeTabs (liquid glass) + classic fallback
- `lib/storage.ts` - AsyncStorage wrapper for all data operations
- `constants/colors.ts` - Theme colors (light/dark)
- `app/_layout.tsx` - Root layout with fonts, providers

## Recent Changes
- Feb 2026: Initial mobile app build from web app conversion
