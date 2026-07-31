# Current Context

## Active Tasks
- Implementing and verifying Google OAuth 2FA integration (Backend + Frontend). [DONE - Pushed, pending deploy]
- Ensuring GitHub Actions deployments run reliably for Fly.io.

## Recent Architectural Decisions
- `ddl-auto` is set to `none` in production to prevent Hibernate from crashing before Flyway runs.
- 2FA is now enforced for Google OAuth login (in `GoogleAuthService`), frontend intercepts `requires2FA` flag and shows TOTP screen.

## Notes for Next Session
- Verify that `V110` migration successfully applies on Fly.io after deployment.
- Check if frontend Google login TOTP flow works flawlessly on production.
