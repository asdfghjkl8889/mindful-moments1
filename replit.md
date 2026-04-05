# Mindful Moments

## Overview
A mindfulness and wellness mobile app built with Expo React Native. Converted from the web app at mindful-moments.blog (Zen Zoo). Features mood tracking, guided meditation with voiceovers, gratitude journaling, mindful eating, daily inspiration with 100+ quotes, mood calendar, resources, courses, and interactive games. Larry the Turtle is the app mascot. All data stored locally with AsyncStorage for privacy.

## Architecture
- **Frontend**: Expo Router with file-based routing, React Native
- **Backend**: Express server on port 5000 (serves landing page + API)
- **State**: AsyncStorage for local data persistence
- **Styling**: React Native StyleSheet with Nunito font family
- **Theme**: Sage green / teal color palette with dark mode support

## Key Features
- **Home**: Mood tracking (5 moods), daily greeting, streak/progress stats, mood history, inspirational quotes, mood calendar with monthly view, Larry the Turtle mascot
- **Meditate**: Timer with breathing animation, 1-20 min durations, pause/resume, session tracking, guided voiceovers using expo-speech (5 sessions: Calm Mind, Body Scan, Gratitude, Sleep, Focus)
- **Journal**: Two tabs — Entries (gratitude + reflection + photo) and Gratitude Wall (photo tile grid, import from journal or add standalone tiles)
- **Eating**: Mindful eating tips and guidance
- **Explore**: Resources (20+ external links in 5 categories), Courses (6 comprehensive courses with lessons), Games (Breathing Exercise, Zen Memory, Focus Tap)
- **Daily Inspiration**: Modal with 100+ quotes across 7 categories, navigation arrows, shuffle, share, category filtering
- **Profile**: Avatar selection, name editing, comprehensive statistics grid

## File Structure
- `app/(tabs)/` - Tab screens (index, meditate, journal, eating, explore)
- `app/(tabs)/_layout.tsx` - Tab bar with NativeTabs (liquid glass) + classic fallback
- `app/inspiration.tsx` - Daily Inspiration modal with quote categories and navigation
- `app/game/[type].tsx` - Dynamic game routes (breathing, memory, focus)
- `app/profile.tsx` - Profile modal screen
- `lib/storage.ts` - AsyncStorage wrapper, 100+ quotes with categories, resources data
- `constants/colors.ts` - Theme colors (light/dark)
- `app/_layout.tsx` - Root layout with fonts, providers

## Navigation Structure
- 5 bottom tabs: Home, Meditate, Journal, Eating, Explore
- Modal routes: Profile, Daily Inspiration
- Stack routes: Game screens (/game/breathing, /game/memory, /game/focus)

## Recent Changes
- Apr 2026: Major redesign — immersive home hero (time-of-day gradient), Quick Actions row, "For You Today" mood-aware recommendations, full-screen orbital-ring meditation experience, colorful gradient guided session cards
- Apr 2026: Rebuilt Journal with 2-tab system: Entries + Gratitude Wall (photo tiles from journal + standalone tiles)
- Apr 2026: Created Games Hub (/games) — dedicated page with 3 games, science descriptions, best scores
- Apr 2026: Created Mood Garden (/mood-garden) — animated living garden from mood history, 5 plant types
- Apr 2026: Created Quick Calm (/quick-calm) — 6 voiced micro-exercises (30-90 seconds) with science backing
- Apr 2026: Updated Explore Tools: Mood Garden, Quick Calm, Mindful Games hub (replaces individual game links)
- Apr 2026: Added Mindful Eating Timer (10/20/30 min) with 8 guided prompts to Eating tab
- Apr 2026: Created Challenges screen (/challenges) — Duolingo-style XP/levels (Seed→Forest), 5 daily missions, weekly quest, 6 achievement badges
- Apr 2026: Created 7-Day Wellness Course (/course-week) — 5+ sessions/day per day (sunrise, midday, mid-afternoon, sunset, evening) with meals, exercise, environment, mindset themes. Progress checkboxes persisted.
- Apr 2026: Created Negative Thoughts / CBT screen (/negative-thoughts) — 3-step thought record (identify, evidence, reframe), 8 cognitive distortions, saved history
- Apr 2026: Added Tools tab to Explore (default) with grid cards linking to all wellness tools + games
- Apr 2026: Added pulsing red panic button to Home screen → breathing exercise
- Apr 2026: Added Crisis Support modal (/emergency) with 6 hotlines, 5-4-3-2-1 grounding, breathing tips
- Feb 2026: Added mood calendar to Home screen with monthly view and color-coded moods
- Feb 2026: Expanded quotes to 100+ with 7 categories (mindfulness, peace, strength, gratitude, wisdom, nature, love)
- Feb 2026: Built Daily Inspiration modal with category filtering, navigation, shuffle, share
- Feb 2026: Created Explore tab with Resources (21 links, 5 categories), Courses (6 courses), Games (3 games)
- Feb 2026: Added meditation voiceovers using expo-speech with 5 guided sessions
- Feb 2026: Restructured navigation from Games tab to Explore tab (5-tab Android limit)
- Feb 2026: Initial mobile app build from web app conversion
