# CloudDeploy

**Secure Full-Stack Application | Backend Engineering | DevOps**

CloudDeploy is a full-stack engineering project focused on secure REST API development, PostgreSQL database management, automated testing, containerization, and cloud-ready engineering practices.

The project extends the open-source [Conduit RealWorld Example App](https://github.com/TonyMckes/conduit-realworld-example-app) with backend security hardening, database migrations, operational health checks, and integration testing.

**Status:** Active development. Local application security and PostgreSQL integration testing are implemented. Production cloud deployment is planned.

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Node.js 26, Express 5 |
| Frontend | React 19, Vite |
| Database | PostgreSQL 17 |
| ORM | Sequelize 6 |
| Authentication | JWT, bcrypt |
| Infrastructure | Docker, Docker Compose |
| Testing | Vitest, Supertest |
| Version control | Git, GitHub |

## Architecture

Browser / React Frontend → Express REST API → Sequelize ORM → PostgreSQL 17

The development PostgreSQL service runs in Docker Compose with persistent storage. The frontend and backend run locally during development.

## Implemented Features

- REST endpoints for users, articles, profiles, comments, and favorites
- JWT authentication with 15-minute expiration
- Required and optional authentication middleware
- Registration and login input validation
- Generic invalid-credential responses
- bcrypt password hashing
- Version-controlled database migrations
- PostgreSQL database associations
- Liveness and readiness endpoints
- Structured HTTP logging and request IDs
- Restricted CORS and request body size limits
- Sanitized server error responses
- Unit, HTTP middleware, and PostgreSQL integration tests

## Getting Started

### Prerequisites

Git, Node.js 26, npm, Docker, and Docker Compose.

### Installation

Clone the repository:

    git clone https://github.com/poundsmichaelscode/CloudDeploy.git
    cd CloudDeploy

Install dependencies:

    npm install

Copy the example environment file:

    cp backend/.env.example .env

Set secure local database credentials and replace JWT_KEY with a randomly generated secret of at least 32 characters.

Do not commit .env.

Start PostgreSQL:

    docker compose up -d postgres
    docker compose ps

Apply migrations:

    npm run sqlz -- db:migrate
    npm run sqlz -- db:migrate:status

Start the frontend and backend:

    npm run dev

The backend API defaults to http://localhost:3001. Vite prints the frontend development URL.

## Health Endpoints

| Endpoint | Purpose |
|---|---|
| GET /health/live | Application liveness |
| GET /health/ready | Database readiness |

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/users | Registration |
| POST | /api/users/login | Login |
| GET | /api/user | Current account |
| PUT | /api/user | Update account |
| GET | /api/articles | Article listing |
| POST | /api/articles | Create article |
| GET | /api/articles/feed | Personalized feed |
| GET | /api/profiles/:username | Profile |
| GET | /api/tags | Tags |

Protected routes accept a valid JWT using the Token or Bearer authorization scheme.

## Testing

Run regular automated tests:

    CI=true npm test -- --run

Latest verified regular-test baseline: 39 passing tests.

### PostgreSQL Integration Tests

Create a separate clouddeploy_test database in the running PostgreSQL container if it does not already exist.

Configure TEST_DB_* variables to point to that database.

Apply the test migrations:

    NODE_ENV=test npm run sqlz -- db:migrate

Run real HTTP and PostgreSQL authentication tests:

    NODE_ENV=test RUN_DB_INTEGRATION=1 CI=true npx vitest run backend/tests/auth-postgres.integration.test.js

Latest verified integration-test baseline: nine passing tests.

The integration suite verifies database isolation and cleans up temporary test users.

### Frontend Build

    npm run build -w frontend

## Security

The application implements JWT verification, password hashing, required authentication for protected routes, request validation, and sanitized error responses.

Rate limiting, security headers, uniqueness constraints, and token lifecycle improvements remain planned.

CloudDeploy is not yet considered production-ready.

## Roadmap

- [x] PostgreSQL Docker Compose environment
- [x] Sequelize migrations
- [x] Health and readiness endpoints
- [x] Structured request logging
- [x] Authentication hardening
- [x] Protected API routes
- [x] Input validation
- [x] PostgreSQL integration tests
- [ ] Rate limiting and security headers
- [ ] Database uniqueness constraints
- [ ] Token revocation improvements
- [ ] GitHub Actions CI/CD
- [ ] Production application containers
- [ ] AWS deployment
- [ ] Monitoring and alerting
- [ ] Operational runbooks

## Original Project and License

CloudDeploy builds upon [TonyMckes/conduit-realworld-example-app](https://github.com/TonyMckes/conduit-realworld-example-app), based on the RealWorld specification.

The original project is licensed under MIT. See [LICENSE](LICENSE).

## Repository

https://github.com/poundsmichaelscode/CloudDeploy
