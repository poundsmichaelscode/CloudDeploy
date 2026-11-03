# CloudDeploy phase 1 database patch

Original project: https://github.com/TonyMckes/conduit-realworld-example-app (MIT license retained in upstream root LICENSE).

Apply patch from repository root, preserving original Git history, license, and migrations.

1. Copy the three backend files from this patch to matching paths.
2. Add `DEV_DB_PORT=5435` to the ignored root `.env` (do not commit credentials).
3. Apply the targeted changes to `backend/models/User.js` and `backend/models/Tag.js` using the Python snippet in the accompanying chat instructions. The User–Comment association must use userId; TagList must use explicit `otherKey` matching the migration.
4. Run `node --check` against modified JS files.
5. Run `npm run sqlz -- db:migrate` from project root after PostgreSQL is healthy.
6. Verify tables: `docker compose exec -T postgres psql -U clouddeploy_app -d clouddeploy_dev -c '\dt'`.
7. Run `npm test -- --run`.

CAUTION: New migration assumes an empty, newly initialized project database. Do not run unreviewed migration on an existing populated database. Existing migrations remain unchanged; the `sequelize.sync({ alter: true })` startup call MUST be removed before using the app in production. This patch does not change the server entry point, does not establish app uptime, and does not claim an integration-test pass.
