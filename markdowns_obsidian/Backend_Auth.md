# Backend Authentication & Security

This module is responsible for protecting the application from unauthorized access, securing data integrity, and maintaining the global audit trail.

## Spring Security Configuration
- **SecurityFilterChain:** The `SecurityConfig.java` defines strict access rules. Public endpoints (like `/api/auth/**` and `/api/services/public`) are explicitly whitelisted. All other endpoints require authentication.
- **CORS & CSRF:** Cross-Origin Resource Sharing is strictly configured to only accept requests from the deployed frontend domain. CSRF is disabled in favor of stateless JWT authentication.
- **Rate Limiting:** A `RateLimitFilter` utilizing `bucket4j` is applied to critical endpoints (like login and registration) to prevent brute-force attacks.

## JWT & Session Architecture
- **Stateless Access Tokens:** Upon successful login, the `JwtService` issues a short-lived Access Token containing the user's ID, Role, and Email in its claims.
- **Stateful Refresh Tokens:** A long-lived Refresh Token is generated and stored securely in **Redis**. This allows the backend to instantly revoke access if a security breach is detected, bridging the gap between stateless and stateful authentication.

## Global Audit Logging
- **Concept:** Financial and legal applications require strict accountability. Every mutation to critical database tables must be recorded.
- **Implementation:** The system uses JPA's `@EntityListeners(AuditEntityListener.class)`. 
- Whenever an `INSERT`, `UPDATE`, or `DELETE` occurs on entities like `Task`, `Invoice`, or `User`, the listener intercepts the transaction and automatically writes an `AuditLog` record containing the timestamp, the action type, and the ID of the user who performed the action.

Back to index: [[Index]]
