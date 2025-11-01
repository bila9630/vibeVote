# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Pulse Game" - a gamified employee feedback/survey application built with React, TypeScript, Vite, and Supabase. Users answer various types of questions (multiple-choice, yes/no, ranking, ideation, open-ended), earn XP, level up, and compete on leaderboards. The app emphasizes engagement through game mechanics like streaks, rewards, and visualizations.

## Commands

### Development
- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build
- `npm run build:dev` - Development mode build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Setup
This project requires Supabase environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anonymous key

These should be set in a `.env` file (not tracked in git).

## Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics visualizations

### Project Structure

```
src/
├── pages/              # Route pages (Homepage, Analytics, QuestionDetail, Rewards, Trees, Profile)
├── components/         # React components
│   ├── ui/            # shadcn/ui components (Button, Card, Dialog, etc.)
│   └── *.tsx          # Feature components (Layout, AppSidebar, BottomNav, etc.)
├── integrations/
│   └── supabase/      # Supabase client and auto-generated types
├── lib/               # Utilities
│   ├── utils.ts       # cn() helper for Tailwind classes
│   └── xpSystem.ts    # XP/leveling logic
├── hooks/             # Custom React hooks
└── assets/            # Static assets
```

### Key Concepts

**Routing**:
- All routes defined in `src/App.tsx`
- Pages are lazy-loaded for code splitting
- Layout component wraps all pages with sidebar and bottom navigation
- When adding new routes, place them BEFORE the catch-all `*` route in App.tsx

**Question Types**:
Questions support five types with distinct color coding:
- `ideation` - Purple - Open brainstorming questions
- `yes-no` - Blue - Binary choice questions
- `multiple-choice` - Green - Single choice from options
- `open-ended` - Orange - Free text responses
- `ranking` - Pink - Drag-and-drop ordering

Use `getQuestionTypeColor()` and `getQuestionTypeDisplay()` helpers when displaying question types.

**XP System** (`src/lib/xpSystem.ts`):
- Users earn XP by completing questions
- XP requirements grow exponentially: `100 * 1.5^(level-1)`
- Progress stored in localStorage
- Rewards unlock at level milestones (2, 3, 5, 7, 10, 15, 20, 25, 30)
- Use `addXP()` to handle XP addition and level-up detection
- `LevelUpModal` component displays rewards when leveling up

**Supabase Integration**:
- Client configured in `src/integrations/supabase/client.ts`
- Types auto-generated in `src/integrations/supabase/types.ts` (do not manually edit)
- Auth uses localStorage with persistent sessions
- Main tables:
  - `questions` - Survey questions with type, text, options, category
  - `user_responses` - User answers to questions
  - `response_keypoints` - Aggregated insights from responses
  - `keypoint_likes` - User likes on keypoints
  - `leaderboards` - User rankings and scores

**Responsive Design**:
- Desktop: Full sidebar navigation + top header
- Mobile: Bottom navigation bar replaces sidebar
- Use `useIsMobile()` hook from `@/hooks/use-mobile.tsx` to detect mobile viewport
- Mobile breakpoint: 768px (Tailwind `md` breakpoint)

**Component Structure**:
- `Layout` - Main layout with sidebar, header, bottom nav
- `AppSidebar` - Desktop navigation (Home, Analytics, Rewards, Trees, Profile)
- `BottomNav` - Mobile navigation
- `Homepage` - Main question feed with tabs for different question categories
- `Analytics` - Question insights with charts and word clouds
- `QuestionDetail` - Detailed view for individual question analytics
- `LeaderboardSidebar` - Shows top performers and relative rankings
- `RelativeLeaderboard` - User's position relative to nearby competitors

**State Management**:
- Server state managed via TanStack Query
- Local UI state with React useState/useEffect
- User progress (XP/level) stored in localStorage
- No global state management library - keep state close to where it's used

### Code Style

- TypeScript with relaxed strictness (`noImplicitAny: false`, `strictNullChecks: false`)
- Functional components with hooks
- Import alias `@/` maps to `src/`
- Tailwind utility classes composed with `cn()` helper
- shadcn/ui components in `src/components/ui/` - these are meant to be customized
- ESLint configured with React hooks rules; `@typescript-eslint/no-unused-vars` disabled

### Database Schema Notes

When working with Supabase queries:
- Always handle errors from async Supabase calls
- Use `.select('*')` or specific columns for queries
- Chain `.order()`, `.filter()`, `.limit()` as needed
- For real-time updates, consider Supabase subscriptions
- Question options stored as JSON in `questions.options`
- User responses store answer data as JSON in `user_responses.response_data`

### Component Development

When creating new components:
- Place feature components directly in `src/components/`
- Use shadcn/ui primitives from `src/components/ui/`
- Import UI components: `import { Button } from "@/components/ui/button"`
- Use Lucide React for icons: `import { Icon } from "lucide-react"`
- Toast notifications via Sonner: `import { toast } from "sonner"`
- Follow existing color coding patterns for question types

### Performance Considerations

- Pages use React.lazy() for code splitting
- Images and heavy components should be lazy loaded
- Use TanStack Query caching to avoid redundant API calls
- Supabase queries should be optimized with proper indexes
- Mobile-specific optimizations via `useIsMobile()` hook
