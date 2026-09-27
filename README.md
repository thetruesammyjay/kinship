# Kinship Verification Framework

Kinship is a research prototype for recording family lineage and screening two person records for recorded blood relationships. It gives community registrars and elders a family registry, lineage maps, and explainable kinship results.

The project supports the research artifact, *Design and Evaluation of a Kinship Verification Framework for Preventing Consanguineous Marriages in African Communities*. The framework and its relationship-detection method are the research contribution. The web application demonstrates the framework and supports evaluation.

Kinship results describe the relationships in the recorded data. Missing or incorrect lineage records can produce an incorrect result. Marriage eligibility is a configurable screening result for community review. It is not a legal, medical, religious, or cultural ruling, and it does not prove biological relationships.

## Deployment

- Web application: [kinship-web-silk.vercel.app](https://kinship-web-silk.vercel.app)
- API documentation: [kinship-m1n0.onrender.com/docs](https://kinship-m1n0.onrender.com/docs)
- API health: [kinship-m1n0.onrender.com/health](https://kinship-m1n0.onrender.com/health)

## What the application does

- Stores people, families, clans, and lineage relationships.
- Shows a selected family's lineage and connected people from other families.
- Checks two people for recorded shared ancestry.
- Reports the relationship label, degree, common ancestor, and each person along the recorded path.
- Checks marriage eligibility against the configured minimum degree.
- Supports user roles, registry management, record disputes, and audit history.
- Collects System Usability Scale (SUS) survey responses.

## How a kinship check works

The API stores people and relationships in PostgreSQL. The kinship engine builds a parent map from recorded <code>CHILD_OF</code> and <code>PARENT_OF</code> edges, then searches upward from each person with breadth-first search.

For two different people, the engine:

1. Checks for a direct spouse or sibling record.
2. Finds each person's recorded ancestors.
3. Selects the shared ancestor with the smallest total generation distance.
4. Classifies the relationship and computes its degree.
5. Returns the result and each person along the selected recorded path, with the parent or child link between each pair.

The engine labels a result as closely related when its degree is at or below <code>RELATEDNESS_THRESHOLD_DEGREE</code>. The default is 2. The marriage check uses <code>MARRIAGE_MINIMUM_DEGREE</code>, which defaults to 5. It blocks the listed close relationships and any relationship below that minimum. A pair with no shared ancestor in the recorded graph is currently marked eligible.

| Relationship | Degree returned by the engine |
| --- | ---: |
| Parent and child | 1 |
| Siblings | 1 |
| Grandparent and grandchild | 2 |
| Aunt or uncle and niece or nephew | 2 |
| First cousins | 3 |
| Second cousins | 5 |

The degree is a project rule based on the recorded lineage graph. It does not include relationships that the registry has not recorded. A family tree starts with every person in the selected family, then follows recorded relationship edges to show connected people in other families. Each node displays its family label. Verification paths include intermediate ancestors when those links are recorded.

## Architecture

~~~mermaid
flowchart LR
    WEB[Next.js web application] --> API[FastAPI REST API]
    API --> DB[(PostgreSQL)]
    API --> AUTH[JWT authentication and role checks]
    API --> KIN[Kinship engine]
    KIN --> DB
    WEB -->|JSON over HTTP| API
~~~

PostgreSQL stores the application records and the graph edges. The API loads the recorded relationships and performs graph traversal in application code. The project does not require Neo4j.

The web application uses Next.js 15, React 19, and TypeScript. The API uses FastAPI, SQLAlchemy, Pydantic, and Alembic. React Flow and Dagre render family trees.

Redis settings and worker modules exist in the repository, but the current request handlers do not use Redis. The worker modules are placeholders. There is no active background-job service.

## Roles and access

The application uses four roles:

| Role | Current permissions |
| --- | --- |
| <code>Admin</code> | Manage users, disputes, audit records, families, clans, and people |
| <code>Registrar</code> | Manage families and clans; create people and lineage links |
| <code>Elder</code> | Create people and lineage links |
| <code>User</code> | View the app, check relationships, report record concerns, and submit SUS surveys |

The API also allows unauthenticated requests to read person search results, person records, family and clan lists, family trees, and kinship results. These responses can include personal record data. The web sign-in screen does not protect those API routes. Review this access policy before using real personal lineage data.

## Repository layout

~~~text
apps/
  api/
    app/
      api/v1/endpoints/    FastAPI routes
      models/              SQLAlchemy database models
      schemas/             Pydantic request and response schemas
      services/            Registry, kinship, tree, and evaluation logic
      workers/             Placeholder background workers
    alembic/               Database migrations and initial sample data
    scripts/               Seed and load-test utilities
    app/tests/             API tests
  web/
    app/                   Next.js routes
    components/            Tree, verification, and navigation components
    lib/                   API client, session, and frontend types
docs/                      Architecture, algorithm, data model, and evaluation notes
~~~

## Data model

PostgreSQL stores these records:

- <code>Person</code>: name, contact details, gender, birth date, deceased status, family, clan, community, and notes.
- <code>Family</code>: family name, origin community, and optional clan.
- <code>Clan</code>: clan name and region.
- <code>KinshipEdge</code>: source person, target person, relationship type, confidence score, and recorder.
- <code>User</code>: account, password hash, role, and active status.
- <code>Dispute</code> and <code>AuditLog</code>: record concerns and administrative history.
- <code>EvaluationMetric</code>: SUS scores and fields for accuracy and response-time metrics.

The relationship schema includes <code>CHILD_OF</code>, <code>PARENT_OF</code>, <code>MARRIED_TO</code>, <code>SIBLING_OF</code>, and <code>BELONGS_TO_CLAN</code>. The current person registration interface creates parent and spouse links. Kinship ancestry searches use parent-child links. Spouse and sibling edges are checked as direct pair records.

## API overview

The API base path is <code>/api/v1</code>. FastAPI provides interactive documentation at <code>/docs</code> and the OpenAPI schema at <code>/openapi.json</code>.

| Route | Purpose |
| --- | --- |
| <code>POST /auth/register</code> | Create an account. The configured bootstrap email receives the <code>Admin</code> role. |
| <code>POST /auth/login</code> and <code>GET /auth/me</code> | Sign in and read the current account. |
| <code>GET /persons/search?q=...</code> and <code>GET /persons/{id}</code> | Search and read person records. |
| <code>POST /persons</code> | Create a person. Requires <code>Admin</code>, <code>Registrar</code>, or <code>Elder</code>. |
| <code>POST /persons/{id}/parents</code> and <code>POST /persons/{id}/spouse</code> | Add a parent or spouse link. Requires <code>Admin</code>, <code>Registrar</code>, or <code>Elder</code>. |
| <code>GET /families</code>, <code>POST /families</code>, <code>PATCH /families/{id}</code> | Read or manage families. Writes require <code>Admin</code> or <code>Registrar</code>. |
| <code>GET /families/{id}/tree</code> | Read a family's recorded tree. |
| <code>GET /clans</code>, <code>POST /clans</code>, <code>PATCH /clans/{id}</code> | Read or manage clans. Writes require <code>Admin</code> or <code>Registrar</code>. |
| <code>POST /kinship/verify</code> | Check recorded kinship between two people. |
| <code>POST /kinship/marriage-eligibility</code> | Apply the configured marriage screening rule. |
| <code>POST /disputes</code> and <code>GET /disputes/mine</code> | Submit and read the current user's record concerns. |
| <code>GET /evaluation/accuracy</code> and <code>GET /evaluation/performance</code> | Read the accuracy and response-time summaries. |
| <code>POST /evaluation/sus</code> and <code>GET /evaluation/sus/summary</code> | Submit an SUS survey and read its summary. |
| <code>/admin/*</code> | Admin-only user, dispute, and audit operations. |

The <code>POST /disputes</code>, <code>GET /disputes/mine</code>, and <code>POST /evaluation/sus</code> endpoints require a signed-in user. Check the API source or <code>/docs</code> for request schemas and the full access rules.

## Evaluation status

The evaluation page shows relationship accuracy, response time, and SUS results. The API can summarize accuracy and response-time rows, but the current application does not write those rows. Those summaries remain empty unless another process adds data.

The API records SUS submissions from signed-in users. The repository also includes <code>apps/api/scripts/load_test.py</code> for load testing. A load test does not automatically populate the accuracy or response-time summaries.

## Local development

### Requirements

- Node.js 20 or later
- pnpm 9
- Python 3.11 or later
- uv
- PostgreSQL
- Docker, if you want to run PostgreSQL in a container

The repository's <code>docker-compose.yml</code> does not currently define services. Use an existing PostgreSQL server or start one with Docker.

### 1. Install JavaScript dependencies

Run this command from the repository root:

~~~sh
pnpm install
~~~

### 2. Start PostgreSQL

For a local Docker database, run:

~~~sh
docker run --name kinship-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=kinship -p 5432:5432 -v kinship-postgres-data:/var/lib/postgresql/data -d postgres:16
~~~

If the container already exists, start it with <code>docker start kinship-postgres</code>.

### 3. Configure the API

Copy the root <code>.env.example</code> file to <code>.env</code>. Set <code>DATABASE_URL</code> to the PostgreSQL connection string for your database.

For the Docker command above, use:

~~~dotenv
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/kinship
JWT_SECRET=replace-this-for-local-development
BOOTSTRAP_ADMIN_EMAIL=admin@example.test
CORS_ORIGINS=http://localhost:3000
~~~

The initial migration adds sample lineage records and a placeholder admin row. That placeholder account has no usable password. To create a working admin account, set <code>BOOTSTRAP_ADMIN_EMAIL</code> to a new email address, apply the migrations, then register with that email in the web app. Other new accounts receive the <code>User</code> role.

### 4. Run the API

Run these commands from <code>apps/api</code>:

~~~sh
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
~~~

The migration chain seeds sample data, including a synthetic marriage between the Rivers and Imo lineages and two children linked to both parents. Alembic does not seed it again during normal restarts.

The API runs at <code>http://localhost:8000</code>. Open <code>http://localhost:8000/docs</code> for the API documentation.

### 5. Run the web application

Open a second terminal at the repository root. The default API URL is <code>http://localhost:8000/api/v1</code>. To change it, copy <code>apps/web/.env.example</code> to <code>apps/web/.env.local</code> and edit <code>NEXT_PUBLIC_API_BASE_URL</code>.

Start the web application:

~~~sh
pnpm dev:web
~~~

Open <code>http://localhost:3000</code>.

### Quality checks

Run these commands from the repository root:

~~~sh
pnpm lint:web
pnpm build:web
~~~

<code>pnpm lint:web</code> runs the TypeScript compiler with <code>--noEmit</code>.

Run the API checks from <code>apps/api</code>:

~~~sh
uv run ruff check app alembic
uv run pytest
~~~

## Environment variables

The root <code>.env.example</code> contains the API settings. The <code>apps/web/.env.example</code> file contains the web settings.

| Variable | Used by | Purpose |
| --- | --- | --- |
| <code>DATABASE_URL</code> | API | PostgreSQL connection string. |
| <code>JWT_SECRET</code> | API | Secret used to sign access tokens. Set a strong value outside local development. |
| <code>BOOTSTRAP_ADMIN_EMAIL</code> | API | Email address that receives the <code>Admin</code> role when it registers. |
| <code>CORS_ORIGINS</code> | API | Comma-separated list of allowed web origins. |
| <code>RELATEDNESS_THRESHOLD_DEGREE</code> | API | Degree at or below which the result is labeled closely related. Default: <code>2</code>. |
| <code>MARRIAGE_MINIMUM_DEGREE</code> | API | Minimum degree allowed by the screening rule. Default: <code>5</code>. |
| <code>REDIS_URL</code> | API config | Accepted by settings. Current request handlers do not use Redis. |
| <code>NEXT_PUBLIC_API_BASE_URL</code> | Web | API base URL. Include the <code>/api/v1</code> suffix. |
| <code>NEXT_PUBLIC_SITE_URL</code> | Web | Public site URL used for site metadata. |

Do not commit <code>.env</code>, <code>.env.local</code>, or production secrets.

## Deployment

The deployment files target Render for the API and Vercel for the web application.

- Render reads the root <code>render.yaml</code>. Set its database, JWT, bootstrap-admin, CORS, and Redis environment values in the Render service.
- Vercel should use <code>apps/web</code> as the project root. Set <code>NEXT_PUBLIC_API_BASE_URL</code> to the Render URL with <code>/api/v1</code> at the end.
- Set <code>CORS_ORIGINS</code> to the exact Vercel site origin.
- From <code>apps/api</code>, run <code>uv run alembic upgrade head</code> against the production database before deploying code that requires a new schema revision. See [the API deployment guide](apps/api/README.md) for deployment details.

The Render blueprint requests <code>REDIS_URL</code>, but the current API request handlers do not use Redis. The blueprint does not define a separate worker service.

## Project notes and references

- [Architecture notes](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Kinship algorithm](docs/algorithm.md)
- [Evaluation plan](docs/evaluation-plan.md)
- [API reference](docs/api-reference.md)
- [Research material](docs/Graph-Based-Kinship-Verification.md)
- [API deployment guide](apps/api/README.md)

Future work in the research plan includes mobile access, cross-community registry queries, connections to community registries, and tamper-evident lineage records.
