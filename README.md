# ETL HubSpot

## Docker

This repository includes two Docker setups:

- Development (with Postgres) using `docker-compose.dev.yml`.
- Production multi-stage `Dockerfile` for building a minimal production image.

Quick start - Development (the compose file will build the app container, install dependencies, run Postgres and start the app in watch mode):

```bash
# from the repository root
docker compose -f docker-compose.dev.yml up --build
```

The app will be reachable at http://localhost:3000 and Postgres at port 5432. Environment variables for DB are set in the compose file (user: `postgres`, password: `postgres`, db: `etlhubspot`).

Quick start - Production (build a production image and run):

```bash
# build the production image
docker build -t etl-hubspot:prod .

# run
docker run -p 3000:3000 --env NODE_ENV=production etl-hubspot:prod
```

Notes:
- Development image installs deps and relies on a bind-mount to hot-reload the source and run `pnpm run start:dev`.
- Production Dockerfile is multi-stage: it builds the app and then installs only production dependencies in the runtime image.


