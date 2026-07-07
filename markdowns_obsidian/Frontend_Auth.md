# Frontend Authentication Flow

This module handles all user identity verification processes before they are allowed into the Dashboard. It is built to be secure, resilient, and user-friendly.

## Authentication Mechanisms

### 1. Traditional Email/Password
- The `LoginPage` and `RegisterPage` handle standard credentials.
- The registration flow includes strict client-side validation (password strength, email formatting) to reduce unnecessary API calls.
- Users must explicitly select their intended role during registration (though Employee registrations may require backend approval in the future).

### 2. Google OAuth Integration
- Users can bypass manual registration using the "Continue with Google" button.
- Because Google only provides basic information (Email, Name, Avatar), Zhan Finance requires additional business data (Phone Number, Company Name) to function properly.
- **Complete Profile Logic:** If a new user logs in via Google, the backend detects missing mandatory fields and flags the account. The frontend intercepts this flag and traps the user in the `CompleteProfilePage` until they provide the missing data.

## Route Protection & Session Management
- **RequireAuth Wrapper:** Critical routes are wrapped in a higher-order component that verifies the presence of a valid JWT access token.
- **Axios Interceptors:** All outgoing API requests are piped through an Axios instance located in `http.ts`. 
- If the server responds with a `401 Unauthorized` error, the interceptor automatically attempts to hit the `/api/auth/refresh` endpoint to obtain a new access token using the HTTP-only refresh cookie. If successful, the original request is seamlessly retried.

Back to index: [[Index]]
