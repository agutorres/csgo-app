# Supabase Authentication Setup

This document outlines the enhanced Supabase authentication system implemented in the CSGO app.

## Features Implemented

### 1. Centralized Authentication Context
- **File**: `lib/AuthContext.tsx`
- **Purpose**: Provides a centralized authentication state management system
- **Features**:
  - User session management
  - Authentication state tracking
  - Loading states
  - Error handling

### 2. Enhanced Authentication Modal
- **File**: `components/AuthModal.tsx`
- **Features**:
  - Email/password sign up and sign in
  - Password reset functionality
  - Social authentication (Google, GitHub)
  - Password visibility toggle
  - Improved UI with icons and better styling
  - Form validation and error handling

### 3. Custom Authentication Hooks
- **File**: `hooks/useAuth.ts`
- **Purpose**: Provides easy-to-use hooks for authentication operations
- **Hooks**:
  - `useAuth()`: Main authentication hook
  - `useRequireAuth()`: Hook for protected routes

### 4. Authentication Routes
- **Auth Callback**: `app/auth/callback.tsx` - Handles OAuth redirects
- **Password Reset**: `app/reset-password.tsx` - Password reset page

## Setup Instructions

### 1. Environment Variables
Ensure your `.env` file contains:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Configuration
In your Supabase dashboard:

1. **Enable Authentication Providers**:
   - Go to Authentication > Providers
   - Enable Email provider
   - Enable Google OAuth (optional)
   - Enable GitHub OAuth (optional)

2. **Configure OAuth Providers** (if using social auth):
   - **Google**: Add your Google OAuth credentials
   - **GitHub**: Add your GitHub OAuth credentials

3. **Set Redirect URLs**:
   - Add your app's redirect URL: `your-app-scheme://auth/callback`
   - For web: `http://localhost:8081/auth/callback`

### 3. Database Schema
The authentication system works with the existing database schema. No additional tables are required as Supabase handles user management through the `auth.users` table.

## Usage

### Using the Authentication Context
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {user ? (
        <button onClick={signOut}>Sign Out</button>
      ) : (
        <button onClick={() => setShowAuthModal(true)}>Sign In</button>
      )}
    </div>
  );
}
```

### Protected Routes
```tsx
import { useRequireAuth } from '@/hooks/useAuth';

function ProtectedComponent() {
  const { user } = useRequireAuth(); // Will redirect if not authenticated
  
  return <div>Protected content</div>;
}
```

## Authentication Methods

### 1. Email/Password
- Standard email and password authentication
- Email confirmation required for new accounts
- Password reset via email

### 2. Social Authentication
- Google OAuth
- GitHub OAuth
- Easy to add more providers

### 3. Password Management
- Password reset via email
- Password update for authenticated users
- Password visibility toggle

## Security Features

- **Session Management**: Automatic session handling and refresh
- **Route Protection**: Admin routes are protected and redirect unauthenticated users
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Type Safety**: Full TypeScript support with proper typing

## Admin Panel Integration

The authentication system is fully integrated with the admin panel:
- Admin routes automatically check authentication
- Unauthenticated users are redirected to the main app
- User information is displayed in the profile section

## Troubleshooting

### Common Issues

1. **OAuth Redirect Issues**:
   - Ensure redirect URLs are properly configured in Supabase
   - Check that your app scheme is correctly set up

2. **Type Errors**:
   - The system includes type assertions for Supabase operations
   - If you encounter type errors, check your database schema

3. **Authentication State Not Updating**:
   - Ensure the `AuthProvider` wraps your app in `app/_layout.tsx`
   - Check that you're using the `useAuth` hook correctly

### Debug Mode
To debug authentication issues, check the browser console for Supabase auth events and errors.

## Future Enhancements

Potential future improvements:
- Two-factor authentication
- Role-based access control
- User profile management
- Session persistence across app restarts
- Biometric authentication (mobile)
