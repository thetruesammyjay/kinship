# Kinship Verification API

FastAPI backend for the Kinship Verification Framework. The service stores graph-modeled lineage
records in Neon PostgreSQL, uses Upstash Redis for shared cache infrastructure, and is deployed as a
Render Docker web service.

## Production Architecture

| Component | Provider |
|---|---|
| API | Render Web Service |
| Database | Neon PostgreSQL |
| Redis | Upstash Redis |
| Web | Vercel |

The API container binds to `0.0.0.0` and uses Render's injected `PORT` environment variable. The
Dockerfile falls back to port `10000` for compatible local runs.

## Deploy With Render Blueprint

The repository root contains `render.yaml`, which defines the free Docker web service and sets
`apps/api` as its monorepo root.

1. Push the latest Kinship changes to GitHub.
2. Sign in to Render and select **New > Blueprint**.
3. Connect `thetruesammyjay/kinship` and select the `main` branch.
4. Render reads `render.yaml` and creates the `kinship-api` web service.
5. Supply every environment value marked as not synchronized.
6. Select **Apply** and watch the build logs until the service reaches **Live**.

Render automatically deploys later commits that change files under `apps/api` or the Blueprint.

## Manual Render Setup

If you prefer not to use the Blueprint, create **New > Web Service** and configure:

| Setting | Value |
|---|---|
| Repository | `https://github.com/thetruesammyjay/kinship` |
| Branch | `main` |
| Runtime | Docker |
| Root Directory | `apps/api` |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context | `.` |
| Instance Type | Free |
| Health Check Path | `/health` |

The Dockerfile supplies the start command, so no Docker Command override is required.

## Environment Variables

Add these values under the Render service's **Environment** page.

### Secrets

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string. Standard `postgresql://` URLs with `sslmode=require` are supported. |
| `REDIS_URL` | Upstash TLS connection string beginning with `rediss://`. |
| `JWT_SECRET` | Long randomly generated production secret. |
| `BOOTSTRAP_ADMIN_EMAIL` | Email that receives the `Admin` role when it registers. |

### Configuration

| Name | Recommended value |
|---|---|
| `ENVIRONMENT` | `production` |
| `APP_DEBUG` | `false` |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
| `RELATEDNESS_THRESHOLD_DEGREE` | `2` |
| `CORS_ORIGINS` | `https://<your-vercel-project>.vercel.app` |

Set `BOOTSTRAP_ADMIN_EMAIL` before creating the first production account, then register with that
exact email address. Choose an address you control and create it before sharing the public site;
all later accounts start with the `User` role and can be promoted from the admin interface.

`CORS_ORIGINS` accepts comma-separated exact origins:

```text
https://kinship.vercel.app,https://www.example.com
```

Do not commit production values or use `*` with credentialed browser requests.

## Database Migrations

Render's pre-deploy command is not available on free web services. Run Alembic deliberately from
the local repository before deploying code that requires a new schema revision:

```powershell
cd apps/api
uv sync
uv run alembic upgrade head
uv run alembic current
cd ../..
```

The expected current revision is:

```text
202608120001
```

The initial seed migration runs only when Alembic applies its revision for the first time. Normal
service restarts do not insert the dataset again.

## Verify the Deployment

Render assigns a URL such as `https://kinship-api.onrender.com`. After the service reaches Live:

```powershell
$apiRoot = "https://kinship-api.onrender.com"
Invoke-RestMethod "$apiRoot/health"
Invoke-WebRequest "$apiRoot/docs" | Select-Object StatusCode
Invoke-RestMethod "$apiRoot/api/v1/families"
Invoke-RestMethod "$apiRoot/api/v1/clans"
```

Expected health response:

```json
{
  "status": "ok",
  "service": "Kinship Verification API"
}
```

Other useful endpoints:

- Swagger UI: `https://kinship-api.onrender.com/docs`
- OpenAPI schema: `https://kinship-api.onrender.com/openapi.json`
- Versioned API: `https://kinship-api.onrender.com/api/v1`

Replace `kinship-api` if Render assigns a different service subdomain.

## Connect Vercel

Set the following variables in the Vercel project that deploys `apps/web`:

```text
NEXT_PUBLIC_API_BASE_URL=https://kinship-api.onrender.com/api/v1
NEXT_PUBLIC_SITE_URL=https://<your-vercel-project>.vercel.app
```

Redeploy Vercel after changing a `NEXT_PUBLIC_*` variable because Next.js inlines it during the
production build. The Render `CORS_ORIGINS` value must contain the exact Vercel production origin.

## Free Service Behavior

Render free web services:

- spin down after 15 minutes without inbound traffic;
- wake when the next HTTP request arrives;
- can take about one minute to become responsive after sleeping;
- receive 750 free instance hours per workspace each month;
- use an ephemeral local filesystem.

The Kinship API keeps persistent state in Neon and Upstash, so sleeping or restarting the container
does not remove lineage data. The Vercel client should show a waking state and retry temporary
startup failures instead of treating the first failed request as a permanent outage.

## Local Development

```powershell
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

Local URLs:

- API: `http://localhost:8000`
- Health: `http://localhost:8000/health`
- Swagger UI: `http://localhost:8000/docs`

## Quality Checks

```powershell
uv run ruff check app alembic
uv run pytest
```

## Official Render References

- [Deploy a web service](https://render.com/docs/web-services)
- [Deploy with Docker](https://render.com/docs/docker)
- [Monorepo support](https://render.com/docs/monorepo-support)
- [Render Blueprints](https://render.com/docs/infrastructure-as-code)
- [Free web service limits](https://render.com/docs/free)
- [Environment variables and secrets](https://render.com/docs/configure-environment-variables)
