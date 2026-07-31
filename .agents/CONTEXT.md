# Current Context

## Active Tasks
- Implementing and verifying Google OAuth 2FA integration (Backend + Frontend). [DONE - Pushed, pending deploy]
- Ensuring GitHub Actions deployments run reliably for Fly.io.

## Recent Architectural Decisions
- `ddl-auto` is set to `none` in production to prevent Hibernate from crashing before Flyway runs.
- 2FA is now enforced for Google OAuth login (in `GoogleAuthService`), frontend intercepts `requires2FA` flag and shows TOTP screen.
- Total roles in system officially updated to 6 (added ADVISOR) in `AGENTS.md`.

## Current State & Fixes
- `V110` migration was successfully applied on Fly.io (created `two_factor_pre_auth` table and `totp_secret` in `app_users`).
- Temporarily disabled 2FA for admin by manually nullifying `totp_secret` and setting `two_factor_enabled = false` in `app_users` via Fly DB Console.

## Notes for Next Session
- Check if frontend Google login TOTP flow works flawlessly on production.
- Proceed to Phase 4 (updating frontend to use `/api/v1/**`).
