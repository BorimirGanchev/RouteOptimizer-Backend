# RouteOptimizer Backend

Backend service for the **RouteOptimizer** project. Built with **Node.js + Express** and **MongoDB (Mongoose)**, exposing REST endpoints for managing users and orders, and intended to be consumed by a frontend deployment (CORS is configured for specific CloudFront / domain origins).

## Tech Stack
- **Node.js / Express** (REST API)
- **MongoDB + Mongoose** (data persistence)
- **JWT** (authentication / authorization)
- **Jest** (unit tests + coverage)
- **ESLint** (linting)
- **Docker** (containerization)

## Project Structure
> Note: the actual backend code lives in the `Backend/` folder.

- `Backend/index.js` — Express app entrypoint
- `Backend/routes/` — API routes (example: orders)
- `Backend/databaseOrders/` — DB connection + order schemas
- `Backend/databaseUsers/` — user schemas
- `Backend/dataProcessing/` — data extraction/processing modules (covered by unit tests)
- `.github/workflows/` — CI pipeline (lint/build/test)

## API Overview (high-level)
The server runs on **port `8000`** and includes endpoints such as:
- `GET /health` — health check
- `GET /` — welcome route
- `GET /backend/user` — returns user info (JWT required)
- `GET /backend/users` — lists users (JWT required)
- `GET /backend/users/:id/orders` — orders for a user
- `PUT /backend/users/:id/status` — update status (implementation continues in code)
- `GET /backend/orders/*` — orders routes (mounted via `Backend/routes/orders`)

## Getting Started (Local Development)

### 1) Prerequisites
- **Node.js** (recommended: Node 20+)
- **npm**
- A running **MongoDB** instance (local or cloud)

### 2) Install dependencies
```bash
cd Backend
npm install
```

### 3) Environment variables
This project uses `dotenv`. Create a `Backend/.env` file.

Minimum expected variables:
```bash
MONGODB_URI="your-mongodb-connection-string"
JWT_SECRET="your-jwt-secret"
```

Notes:
- MongoDB connection is read from `process.env.MONGODB_URI`.
- The DB name is set explicitly in code as `Route-Optimizer`.

### 4) Run the server
```bash
cd Backend
npm start
```

Server will start on:
- `http://localhost:8000`

## Running with Docker

A Dockerfile is provided in `Backend/Dockerfile`.

### Build
```bash
cd Backend
docker build -t routeoptimizer-backend .
```

### Run
```bash
docker run --rm -p 8000:8000 --env-file .env routeoptimizer-backend
```

## Quality & CI (What recruiters usually care about)

### Lint
```bash
cd Backend
npm run lint
```

### Tests + Coverage
```bash
cd Backend
npm test
```

CI uses:
```bash
npm run test:ci
```

The GitHub Actions workflow runs **lint + tests** on pushes to feature branches and on PRs (see `.github/workflows/main.yml`). The repo also includes a short pipeline explanation in `pipeline.txt`.

## Security Notes
- Do **not** commit `.env` files (already ignored via `.dockerignore`).
- JWT secrets and DB URIs must be stored in environment variables (GitHub Secrets in CI/CD).

## Future Improvements (planned / nice-to-have)
- Add an `.env.example` to make onboarding easier.
- Expand test coverage for error scenarios and route-level integration tests.
- Refactor JWT usage to ensure secrets are always read from `process.env.JWT_SECRET` (avoid hardcoded secrets).
- Add OpenAPI/Swagger docs for easier API review.

## Author
**BorimirGanchev** — GitHub: `@BorimirGanchev`
