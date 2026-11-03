# CloudDeploy phase 1 — application startup hardening

Upstream: https://github.com/TonyMckes/conduit-realworld-example-app (MIT). This patch preserves the existing API routes and migration history.

## Changes

- `backend/app.js`: testable Express application factory, limited JSON bodies, configurable CORS, request ID and HTTP logs, liveness/readiness, preserved upstream HTTP error statuses (401, 403, 404, 422), with generic 500 responses.
- `backend/index.js`: wait for PostgreSQL before binding the HTTP listener; **removed `sequelize.sync({alter:true})`**; SIGINT/SIGTERM graceful shutdown.
- `backend/observability/logger.js`: JSON event logger with basic field redaction (do not pass raw headers, request bodies, tokens or credentials to logger).
- `backend/tests/health.test.js`: independent, non-database health tests using ephemeral HTTP ports.

## Apply

From repository root, extract ZIP, retaining relative folders. Review `git diff -- backend/index.js backend/app.js` before continuing. `backend/index.js` is deliberately replaced.

## Validate

```sh
node --check backend/index.js
node --check backend/app.js
node --check backend/observability/logger.js
CI=true npm test -- --run
npm run sqlz -- db:migrate:status
node backend/index.js
```

In a second terminal:

```sh
curl -i http://127.0.0.1:3001/health/live
curl -i http://127.0.0.1:3001/health/ready
curl -i http://127.0.0.1:3001/api/tags
```

For `NODE_ENV=development`, the root ignored `.env` must contain `DEV_DB_*` values, including `DEV_DB_PORT=5435` from the prior patch. If using auth flows, set a secure, local `JWT_KEY` in ignored `.env`, generated with `openssl rand -hex 32`.

## Limits and next steps

- This is a foundation patch, not complete production hardening. Verify upstream error-handler semantics, CORS failure behavior, JWT verification, auth scope, database constraints and migrations with integration tests before production.
- Native JSON logging is intentionally dependency-free. Replace with Pino or OpenTelemetry tracing later, with log redaction policy and sampling.
- This patch has not been deployed to AWS or run against your machine; the startup, endpoints, and database integration require local confirmation.
- A successful liveness check does not prove database readiness. ECS/ALB health configuration should use the intended readiness policy after validation.
