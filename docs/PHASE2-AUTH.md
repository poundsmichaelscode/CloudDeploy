# Phase 2 authentication hardening

Changes are scoped to account updates and JWT verification; preserve the Conduit API shape and original MIT attribution.

- Fix password change condition: only hash a provided password; require length >= 12.
- Validate and allowlist editable profile fields; deny mass assignment.
- Remove mutation of request headers to pass email between middleware and controller.
- Return UnauthorizedError for malformed, expired, or unknown-user JWTs.
- Continue supporting both `Token <jwt>` (RealWorld convention) and `Bearer <jwt>`.
- Reissue a JWT after an email change so subsequent authenticated calls use the new email identity.

## Follow-up security work

- Invalidate or rotate old JWTs on password/email changes (token version or jti deny-list); JWT reissue alone does not revoke existing tokens.
- Validate email format and normalize case consistently with registration/login.
- Catch unique constraint errors for duplicate username/email and map to 422 or 409.
- Audit public endpoints and all authorization boundaries with PostgreSQL-backed tests.
- Consider requiring current password for sensitive account changes.

## Verification

Run `node --check` on the changed JavaScript modules, `CI=true npm test -- --run`, `npm run build -w frontend`, and exercise account update requests against a test database. This patch has not been verified on the user's local database.
