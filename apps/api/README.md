---
title: Kinship Verification API
emoji: 🌳
colorFrom: pink
colorTo: gray
sdk: docker
app_port: 7860
fullWidth: true
short_description: Graph-based ancestry tracing and marriage eligibility API
---

# Kinship Verification API

FastAPI backend for the Kinship Verification Framework. The service stores lineage entities and
kinship edges in Neon PostgreSQL, exposes graph-based ancestry and relationship verification APIs,
and is designed to run as a Hugging Face Docker Space.

## Service URLs

After deployment, replace `<owner>` and `<space-name>` with the values from the Space:

- API root: `https://<owner>-<space-name>.hf.space`
- Health check: `https://<owner>-<space-name>.hf.space/health`
- Swagger UI: `https://<owner>-<space-name>.hf.space/docs`
- OpenAPI schema: `https://<owner>-<space-name>.hf.space/openapi.json`
- Versioned API: `https://<owner>-<space-name>.hf.space/api/v1`

The Docker container listens on port `7860`, matching the `app_port` in the Space metadata above.

## Hugging Face Deployment

### 1. Create the Space

1. Sign in to Hugging Face and select **New Space**.
2. Choose an owner and a Space name such as `kinship-api`.
3. Select **Docker** as the Space SDK.
4. Choose the required visibility. A public Space exposes both its source and API publicly; a
   private Space also restricts access to the running application.
5. Select CPU Basic unless the workload requires upgraded hardware.

Use **Public** for a Vercel frontend that calls the API without Hugging Face authentication.
Protected visibility can keep the source private while leaving the app public, but it requires an
eligible paid plan. A Private Space is not directly callable by an ordinary public Vercel frontend.

Hugging Face currently lists CPU Basic with no hourly hardware charge, but its current policy may
require a paid account to create a new Docker/compute Space. Check the account prompt shown during
Space creation.

### 2. Configure secrets and variables

Open the Space, go to **Settings**, and add the following entries. Never commit these values.

#### Secrets

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon pooled PostgreSQL connection string. The standard `postgresql://...?...sslmode=require` format is supported. |
| `REDIS_URL` | Upstash Redis TLS connection string, normally beginning with `rediss://`. |
| `JWT_SECRET` | A long, randomly generated production secret. |

#### Variables

| Name | Recommended value |
|---|---|
| `ENVIRONMENT` | `production` |
| `APP_DEBUG` | `false` |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
| `RELATEDNESS_THRESHOLD_DEGREE` | `2` |
| `CORS_ORIGINS` | `https://<your-vercel-project>.vercel.app` |

`CORS_ORIGINS` accepts a comma-separated list. Add the final custom domain and any specific Vercel
preview URL that needs API access, for example:

```text
https://kinship.vercel.app,https://www.example.com
```

Do not use `*` with credentialed browser requests.

### 3. Apply database migrations

Run migrations deliberately from the local repository before deploying a release that introduces
new migrations. The Space does not run Alembic automatically on every restart.

```powershell
cd apps/api
uv sync
uv run alembic upgrade head
uv run alembic current
cd ../..
```

The current migration chain creates the application schema, inserts the initial Igbo lineage
dataset, and links families to clans. Alembic is transactional and will not seed the initial data
again after its revision has been recorded.

### 4. Authenticate with Hugging Face

Install the Hugging Face CLI and sign in with an account or fine-grained token that can write to the
Space:

```powershell
uv tool install huggingface_hub
hf auth login
hf auth whoami
```

Keep the token out of shell history, `.env` files committed to Git, and repository URLs.

### 5. Upload only the API folder

The Kinship project is a monorepo, but the contents of `apps/api` must appear at the root of the
Hugging Face Space so that Hugging Face can find this `README.md` and the `Dockerfile`.

Run this command from the Kinship repository root:

```powershell
hf upload <owner>/<space-name> ./apps/api . --repo-type=space --exclude ".venv/**" --exclude "**/__pycache__/**" --exclude ".pytest_cache/**" --exclude ".ruff_cache/**" --exclude ".env" --commit-message "Deploy Kinship API"
```

For later deployments, run the same command again. Add `--delete="*"` only when the Space should be
made an exact mirror of `apps/api`; that option removes remote files that do not exist locally.

Every upload commit triggers a Docker rebuild and restarts the Space.

### 6. Verify the deployment

Wait until the Space status changes to **Running**, then check:

```powershell
$apiRoot = "https://<owner>-<space-name>.hf.space"
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

If the Space builds but API requests fail, review **Logs** in the Space and confirm that all secret
names match exactly. Database authentication and CORS problems are runtime configuration errors and
do not usually appear during the Docker image build.

### 7. Connect Vercel

Set these environment variables in the Vercel project for `apps/web`:

```text
NEXT_PUBLIC_API_BASE_URL=https://<owner>-<space-name>.hf.space/api/v1
NEXT_PUBLIC_SITE_URL=https://<your-vercel-project>.vercel.app
```

Redeploy the Vercel project after changing `NEXT_PUBLIC_*` values because Next.js inlines them during
the production build. Also update the Space's `CORS_ORIGINS` variable whenever the production web
origin changes.

## Local Development

```powershell
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

Local endpoints:

- API: `http://localhost:8000`
- Health: `http://localhost:8000/health`
- Swagger UI: `http://localhost:8000/docs`

## Quality Checks

```powershell
uv run ruff check app alembic
uv run pytest
```

## Deployment Notes

- The Space filesystem is ephemeral. Persistent application data belongs in Neon and Upstash.
- Free CPU hardware can sleep after inactivity, so the first request after a pause may take longer.
- Do not run multiple Uvicorn workers on the initial CPU Basic deployment until database pool and
  memory behavior have been measured.
- Deploy schema migrations before code that depends on them.
- Rotate `JWT_SECRET` deliberately because changing it invalidates all existing access tokens.

## Official Hugging Face References

- [Docker Spaces](https://huggingface.co/docs/hub/spaces-sdks-docker)
- [Spaces configuration reference](https://huggingface.co/docs/hub/spaces-config-reference)
- [Spaces secrets and variables](https://huggingface.co/docs/hub/spaces-overview#managing-secrets-and-environment-variables)
- [Hugging Face CLI authentication](https://huggingface.co/docs/huggingface_hub/quick-start#authentication)
- [Uploading files with the CLI](https://huggingface.co/docs/huggingface_hub/guides/upload#upload-from-the-cli)
