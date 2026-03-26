# FitNova Frontend

AI-powered fitness SaaS platform frontend built with React, TypeScript, Tailwind CSS, and Vite.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 3
- **Routing**: React Router v7
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Design**: Custom components with dark theme (#0B0B0B, #00FF88, #FF6B00)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── pages/              # Page components
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Dashboard.tsx
│   ├── Workouts.tsx
│   ├── Diet.tsx
│   └── CoachChat.tsx
├── components/
│   ├── Layout/         # Layout wrappers
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MainLayout.tsx
│   ├── Common/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── ProtectedRoute.tsx
├── services/
│   └── api.ts          # Backend API client
├── stores/
│   └── authStore.ts    # Zustand auth store
├── hooks/
│   └── useAuth.ts      # Auth hook
├── types/
│   └── index.ts        # TypeScript types
├── App.tsx
└── main.tsx
```

## Features

### ✅ Implemented

- **Authentication**
  - Login/Signup pages
  - JWT token management with refresh flow
  - Protected routes
  - Auto re-authentication

- **Dashboard**
  - User stats (workout/meal completion, weight, progress)
  - Active plan display
  - Quick action buttons

- **Pages**
  - Landing page with features showcase
  - Login/Signup forms with validation
  - Dashboard with real data integration
  - Placeholder pages for Workouts, Diet, AI Coach Chat

- **UI Components**
  - Responsive Button (primary, secondary, accent variants)
  - Form Input with error handling
  - Card components (default, gradient, glass)
  - Header with navigation
  - Footer with links
  - Mobile-responsive navbar

- **API Integration**
  - Full API client setup for all endpoints
  - User management
  - Workouts module
  - Diet planning
  - Progress tracking
  - AI interactions

### 🚀 Next Steps

1. **Integrate Workout Plans Page**
   - Fetch and display user's workout plans
   - Show active plan details
   - Add ability to create new plans
   - Integrate AI plan generation

2. **Integrate Diet Plans Page**
   - Fetch diet plans
   - Display meal details
   - Track meal completion
   - Integrate AI diet plan generation

3. **AI Coach Chat**
   - Implement real-time chat interface
   - Connect to backend AI endpoints
   - Message history display

4. **Advanced Features**
   - Progress tracking visualizations
   - Analytics charts
   - Workout/diet plan details pages
   - Premium feature gating

5. **Polish**
   - Add loading animations (Framer Motion)
   - Error boundaries
   - Toast notifications
   - Form validation improvements

## API Endpoints Used

All endpoints are prefixed with `http://localhost:4000/api/v1`

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `GET /users/profile` - Get user profile
- `GET /users/dashboard` - Get dashboard summary
- `GET /workouts` - List workout plans
- `POST /workouts` - Create workout plan
- `POST /ai/workout-plan/save` - Generate and save workout
- `GET /diet` - List diet plans
- `POST /diet` - Create diet plan
- `POST /ai/diet-plan/save` - Generate and save diet plan
- `POST /ai/coach-chat` - Chat with AI coach

## Authentication Flow

1. User enters credentials on login page
2. Credentials sent to `/auth/login` endpoint
3. Backend returns `accessToken` and `refreshToken`
4. Tokens stored in localStorage and Zustand store
5. Axios interceptor adds `Authorization: Bearer {token}` to all requests
6. If 401 response, automatically refresh token
7. If refresh fails, redirect to login

## Styling

The project uses Tailwind CSS with custom FitNova theme colors:

- **Background**: `#0B0B0B` (dark)
- **Primary**: `#00FF88` (green)
- **Accent**: `#FF6B00` (orange)
- **Text**: `#F7F7F7` (light)
- **Border**: `#2e303a` (dark gray)

Custom components with utility classes and component classes are in `src/index.css`.

## Development Notes

- TypeScript strict mode enabled
- ESLint configured for React
- Vite hot module reload (HMR) enabled
- Auth state persists across page refreshes
- API calls handle errors gracefully
- Protected routes require valid auth token

## License

MIT
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
