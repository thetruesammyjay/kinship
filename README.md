# Kinship Verification Framework

A graph-based kinship verification platform for ancestry tracing and marriage eligibility assessment in African communities. The system digitizes family lineage records, models relationships as a graph, and runs a relationship-detection algorithm to flag consanguineous marriage risk before it happens.

This repository is the proof-of-concept implementation supporting the research artifact: *"Design and Evaluation of a Kinship Verification Framework for Preventing Consanguineous Marriages in African Communities."* The scholarly contribution is the kinship verification framework and relationship-detection algorithm; the web platform below is the vehicle that demonstrates and evaluates it.

## Table of Contents

- [Problem and Motivation](#problem-and-motivation)
- [Core Concepts](#core-concepts)
- [Architecture](#architecture)
- [Kinship Verification Algorithm](#kinship-verification-algorithm)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Data Model](#data-model)
- [API Overview](#api-overview)
- [Evaluation Framework](#evaluation-framework)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)

## Problem and Motivation

Many African communities have historically relied on elders and oral tradition to determine family relationships before marriage. Migration, urbanization, displacement, and the erosion of oral record-keeping have weakened this mechanism, creating real risk that individuals unknowingly enter marriages with close relatives. Existing genealogy platforms (FamilySearch, MyHeritage, Ancestry, Gramps) are built for Western record structures and do not provide a culturally contextualized, graph-native kinship verification mechanism suited to African family and clan structures. No scalable digital framework currently exists for systematically storing lineage information and verifying kinship relationships within African communities. This project fills that gap.

## Core Concepts

- **Genealogy** — the digitized record of ancestry and lineage.
- **Kinship** — consanguinity (blood relation), affinity (relation by marriage), clan relationships, extended family relationships.
- **Consanguineous marriage** — marriage between individuals related by blood within a socially or biologically significant degree.
- **Family tree** — a hierarchical/graph representation of lineage.
- **Graph-based relationship network** — persons as nodes, relationships (parent-child, marriage, sibling) as edges. This is the structural backbone of the whole system.

Theoretical grounding: **Graph Theory** (individuals as vertices, relationships as edges, shortest-path computation for relatedness), **Social Network Theory** (relationships as networks), and the **Information Systems Success Model** (used for the usability/effectiveness evaluation in Chapter 4).

### Graph-based without Neo4j

Removing Neo4j does **not** stop the framework from being graph-based. The system remains graph-based because the domain is still modeled as vertices (`Person`, `Family`, `Clan`) and edges (`CHILD_OF`, `PARENT_OF`, `MARRIED_TO`, `SIBLING_OF`, `BELONGS_TO`), and the kinship engine still performs graph traversal, common-ancestor discovery, and shortest-path relatedness computation. PostgreSQL becomes the persistence layer for the graph, using normalized node and edge tables plus recursive queries/application-level BFS instead of Cypher.

## Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        WEB["Next.js App Router<br/>(React + TypeScript)"]
    end

    subgraph Edge["Public Edge"]
        LB["Web/API Public Endpoints<br/>(HTTPS, custom domain)"]
    end

    subgraph API["Application Layer — FastAPI Service"]
        GATEWAY["API Gateway / Routing<br/>(FastAPI + Pydantic v2)"]
        AUTH["Auth Service<br/>(JWT, OAuth2 password flow)"]
        PERSON["Person & Family Registry Service"]
        TREE["Family Tree Builder Service"]
        KINSHIP["Kinship Verification Engine<br/>(graph traversal algorithm)"]
        NOTIFY["Notification Service<br/>(email / SMS eligibility alerts)"]
        EVAL["Evaluation & Metrics Service<br/>(accuracy, response time, SUS logging)"]
    end

    subgraph Workers["Background Workers"]
        QUEUE["Task Queue<br/>(Celery / RQ + Redis broker)"]
        BULK["Bulk Import Worker<br/>(CSV / elder-interview data ingestion)"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL<br/>Graph-modeled lineage tables,<br/>Users, Auth, Audit Log,<br/>Evaluation Metrics")]
        REDIS[("Upstash Redis<br/>Cache + Celery/RQ broker + Rate limiting")]
        BLOB["Object Storage<br/>(S3-compatible)<br/>Documents, tree exports, photos"]
    end

    subgraph External["External / Optional"]
        SMTP["Email Provider<br/>(Resend / SendGrid)"]
    end

    WEB -->|HTTPS / REST + JSON| LB --> GATEWAY
    GATEWAY --> AUTH
    GATEWAY --> PERSON
    GATEWAY --> TREE
    GATEWAY --> KINSHIP
    GATEWAY --> EVAL

    AUTH --> PG
    PERSON --> PG
    TREE --> PG
    KINSHIP --> PG
    KINSHIP --> REDIS
    EVAL --> PG

    PERSON -.enqueue.-> QUEUE
    QUEUE --> BULK --> PG
    NOTIFY --> SMTP
    KINSHIP -.high-risk match.-> NOTIFY

    PERSON --> BLOB
    TREE --> BLOB

    classDef svc fill:#1f2937,stroke:#60a5fa,color:#f9fafb
    classDef data fill:#111827,stroke:#34d399,color:#f9fafb
    classDef client fill:#111827,stroke:#f472b6,color:#f9fafb
    class GATEWAY,AUTH,PERSON,TREE,KINSHIP,NOTIFY,EVAL,QUEUE,BULK svc
    class PG,REDIS,BLOB data
    class WEB client
```

### Request flow: verifying marriage eligibility

```mermaid
sequenceDiagram
    actor User as User (Frontend)
    participant FE as Next.js Web
    participant API as FastAPI Gateway
    participant KIN as Kinship Engine
    participant PG as PostgreSQL Graph Tables
    participant CACHE as Upstash Redis Cache

    User->>FE: Select Person A, Person B
    FE->>API: POST /api/v1/kinship/verify {personA, personB}
    API->>KIN: verify_relationship(A, B)
    KIN->>CACHE: check cached path(A,B)
    alt cache hit
        CACHE-->>KIN: cached relationship path
    else cache miss
        KIN->>PG: recursive CTE / adjacency-list query
        PG-->>KIN: path, common ancestor, degree
        KIN->>CACHE: store result (TTL)
    end
    KIN->>KIN: classify degree vs threshold
    KIN-->>API: {status: Unrelated | Distantly Related | Closely Related, degree, path}
    API-->>FE: 200 OK JSON result
    FE-->>User: Render verdict + relationship path + warning banner if closely related
```

## Kinship Verification Algorithm

This is the core scholarly contribution. Given Person A and Person B:

1. **Find common ancestor(s)** — traverse `CHILD_OF` / `PARENT_OF` edges upward from both A and B in the graph until a shared ancestor node is found (or none exists within a bounded depth).
2. **Calculate relationship path** — compute the shortest path between A and B through the ancestor graph using PostgreSQL recursive CTEs and/or an application-level BFS over indexed relationship edges.
3. **Determine degree of relatedness** — derive a numeric degree from path length and generation offset.
4. **Compare against threshold** — classify the pair against a configurable eligibility threshold.

| Relationship | Degree |
|---|---|
| Sibling | 1 |
| First Cousin | 2 |
| Second Cousin | 3 |
| Third Cousin | 4 |

**Output:** `Unrelated`, `Distantly Related`, or `Closely Related`, plus the full relationship path and computed degree so the result is explainable, not a black box.

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript | Server-rendered/prerendered pages, deployable as a Node service |
| Styling | Tailwind CSS v4 | `@theme` design tokens in `app/globals.css` |
| Tree/Graph visualization | React Flow or D3.js | For interactive family tree rendering (current build renders edge rows) |
| Backend | FastAPI (Python) | Async, OpenAPI docs auto-generated, Pydantic v2 validation |
| Graph-modeled persistence | PostgreSQL | Stores persons/clans/families as entities and kinship links as indexed edge tables; the algorithm still treats the data as a graph |
| Relational database | PostgreSQL | Users, auth, audit trail, lineage graph tables, evaluation metrics (accuracy/response-time/SUS logs) |
| Cache / broker | Upstash Redis Free tier | Kinship-path caching, rate limiting, Celery/RQ broker where supported |
| Background jobs | Celery or RQ | Bulk lineage import, notification dispatch |
| Auth | JWT (OAuth2 password flow via FastAPI security) | Roles: Admin, Community Elder, Registrar, User |
| File/object storage | S3-compatible bucket | Family tree exports (PDF/PNG), supporting documents |
| Hosting | Render for API; Vercel for web | FastAPI runs as a Render web service; the Next.js app points at its public URL |

## Monorepo Structure

```
kinship-verification-platform/
├── README.md
├── .gitignore
├── .editorconfig
├── docker-compose.yml                # local dev: postgres, redis-compatible cache
├── turbo.json                        # optional: Turborepo pipeline if using pnpm workspaces
├── package.json                      # root workspace manifest (pnpm workspaces)
├── pnpm-workspace.yaml
│
├── apps/
│   ├── web/                          # Next.js 15 App Router frontend
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── postcss.config.mjs        # @tailwindcss/postcss
│   │   ├── tsconfig.json
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   ├── app/                      # file-based routes
│   │   │   ├── layout.tsx            # root layout, wraps <SessionProvider>
│   │   │   ├── globals.css           # Tailwind v4 import + @theme tokens
│   │   │   ├── page.tsx              # marketing landing
│   │   │   ├── signin/page.tsx       # login + register (JWT auth)
│   │   │   └── (app)/                # authenticated route group
│   │   │       ├── layout.tsx        # <AppGate><AppShell>…
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── register/page.tsx
│   │   │       ├── tree/page.tsx
│   │   │       ├── verify/page.tsx
│   │   │       └── evaluation/page.tsx        # SUS scores, accuracy/perf dashboards
│   │   ├── components/
│   │   │   ├── shell/                # AppShell, AppGate, LeftRail, BottomNav, navItems
│   │   │   ├── family-tree/
│   │   │   │   ├── FamilyTreeCanvas.tsx     # React Flow / D3 render
│   │   │   │   ├── PersonNode.tsx
│   │   │   │   └── RelationshipEdge.tsx
│   │   │   ├── kinship/
│   │   │   │   ├── VerificationForm.tsx
│   │   │   │   ├── VerdictBanner.tsx
│   │   │   │   └── RelationshipPath.tsx
│   │   │   └── ui/                          # PersonPicker (search-as-you-type)
│   │   └── lib/
│   │       ├── api.ts                # fetch wrapper, base URL from env, Bearer token
│   │       ├── session.tsx           # JWT session context, persisted to localStorage
│   │       ├── types.ts              # types mirroring the FastAPI schemas
│   │       └── constants.ts
│   │
│   └── api/                          # FastAPI backend
│       ├── Dockerfile
│       ├── README.md                  # Render deployment notes
│       ├── pyproject.toml            # or requirements.txt
│       ├── alembic.ini
│       ├── alembic/
│       │   └── versions/
│       ├── app/
│       │   ├── main.py               # FastAPI app factory, router registration
│       │   ├── config.py             # Pydantic Settings, reads env vars
│       │   ├── dependencies.py       # DB sessions, current_user, pagination
│       │   ├── api/
│       │   │   └── v1/
│       │   │       ├── router.py
│       │   │       ├── endpoints/
│       │   │       │   ├── auth.py
│       │   │       │   ├── persons.py
│       │   │       │   ├── families.py
│       │   │       │   ├── family_tree.py
│       │   │       │   ├── kinship.py
│       │   │       │   ├── evaluation.py
│       │   │       │   └── admin.py
│       │   ├── core/
│       │   │   ├── security.py       # JWT encode/decode, password hashing
│       │   │   └── exceptions.py
│       │   ├── db/
│       │   │   ├── postgres.py       # SQLAlchemy engine/session
│       │   │   └── redis_client.py
│       │   ├── models/               # SQLAlchemy models (users, lineage graph, audit, metrics)
│       │   │   ├── user.py
│       │   │   ├── person.py
│       │   │   ├── kinship_edge.py
│       │   │   └── evaluation_log.py
│       │   ├── graph/                # Postgres-backed graph traversal domain layer
│       │   │   ├── person_repository.py
│       │   │   ├── family_repository.py
│       │   │   └── traversal_queries.py
│       │   ├── schemas/              # Pydantic request/response models
│       │   │   ├── person.py
│       │   │   ├── family.py
│       │   │   ├── kinship.py
│       │   │   └── auth.py
│       │   ├── services/
│       │   │   ├── person_service.py
│       │   │   ├── family_tree_service.py
│       │   │   ├── kinship_engine.py         # the algorithm from section above
│       │   │   ├── evaluation_service.py     # accuracy / response-time / SUS aggregation
│       │   │   └── notification_service.py
│       │   ├── workers/
│       │   │   ├── celery_app.py
│       │   │   ├── bulk_import_worker.py
│       │   │   └── notification_worker.py
│       │   └── tests/
│       │       ├── conftest.py
│       │       ├── test_kinship_engine.py
│       │       ├── test_person_endpoints.py
│       │       └── test_evaluation.py
│       └── scripts/
│           ├── seed_data.py                  # sample African family datasets for evaluation
│           └── load_test.py                  # scalability tests: 100 / 1,000 / 10,000 persons
│
├── packages/
│   ├── shared-types/                 # TS types shared between frontend and OpenAPI-generated client
│   │   ├── package.json
│   │   └── src/index.ts
│   └── ui/                           # optional shared component library
│       ├── package.json
│       └── src/
│
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── algorithm.md
│   ├── evaluation-plan.md            # SUS instrument, accuracy test protocol
│   └── api-reference.md              # generated/curated from FastAPI OpenAPI schema
│
└── .github/
    └── workflows/
        ├── ci-api.yml                # lint + pytest on apps/api
        └── ci-web.yml                # lint + build on apps/web
```

## Data Model

PostgreSQL stores both the application records and the graph-modeled lineage data. The lineage graph is represented with normalized entity tables and indexed edge tables, so the framework remains graph-based even without a dedicated graph database.

**Graph vertices**
- `Person` — id, full_name, gender, date_of_birth, is_deceased, clan_id, notes
- `Family` — id, family_name, origin_community
- `Clan` — id, clan_name, region

**Graph edges**
- `kinship_edges` — id, source_person_id, target_person_id, relationship_type, confidence_score, recorded_by, created_at
- Supported `relationship_type` values: `CHILD_OF`, `PARENT_OF`, `MARRIED_TO`, `SIBLING_OF`, `BELONGS_TO_CLAN`
- Indexes: `(source_person_id, relationship_type)`, `(target_person_id, relationship_type)`, and `(source_person_id, target_person_id, relationship_type)` for traversal and duplicate prevention

**Application tables**

- `users` — auth accounts (Admin, Registrar, Elder, standard User), hashed passwords, roles
- `audit_log` — who registered/edited which person/relationship, when
- `evaluation_metrics` — accuracy test results, response-time samples, SUS survey responses (supports Chapter 4 evaluation directly)

## API Overview

FastAPI auto-generates OpenAPI/Swagger docs at `/docs`. Representative endpoints:

```
POST   /api/v1/auth/login
POST   /api/v1/auth/register

POST   /api/v1/persons                     # register individual
GET    /api/v1/persons/{id}
POST   /api/v1/persons/{id}/parents        # link parent
POST   /api/v1/persons/{id}/spouse         # link spouse

GET    /api/v1/families/{id}/tree          # generate family tree (graph traversal)
GET    /api/v1/persons/search?q=

POST   /api/v1/kinship/verify              # { personAId, personBId } -> verdict + path + degree

GET    /api/v1/evaluation/accuracy
GET    /api/v1/evaluation/performance
POST   /api/v1/evaluation/sus              # submit SUS survey response
GET    /api/v1/evaluation/sus/summary
```

## Evaluation Framework

The platform is built to directly produce the four evaluation dimensions from the study:

1. **Relationship Detection Accuracy** — `accuracy = correct_detections / total_tests`, computed against an expert-validated test dataset seeded via `scripts/seed_data.py`.
2. **Response Time** — average and max query time for `/api/v1/kinship/verify`, logged per request into `evaluation_metrics` and exposed via `/api/v1/evaluation/performance`.
3. **Scalability** — load-tested at 100, 1,000, and 10,000 `Person` vertices using `scripts/load_test.py` against the PostgreSQL edge-table graph and API deployment.
4. **Usability (SUS)** — a 10-item System Usability Scale survey collected in-app after user testing sessions, aggregated by `/api/v1/evaluation/sus/summary` (interpretation: ≥68 acceptable, ≥80 excellent).

## Local Development

Prerequisites: Node 20+, pnpm, Python 3.11+, uv, Docker.

```bash
# 1. Clone and install
git https://github.com/thetruesammyjay/kinship
cd kinship
pnpm install

# 2. Start local infra (Postgres and Redis-compatible cache)
docker compose up -d

# 3. Backend
cd apps/api
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# Run API tests
uv run pytest

# 4. Frontend (new terminal, from the repo root)
pnpm dev:web
```

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs
- PostgreSQL: configured via `DATABASE_URL`

## Deployment

The API runs on a **Render web service**, with Neon PostgreSQL as the persistent database and the **free Upstash Redis** tier for caching/rate limiting/background-job coordination. The frontend runs on Vercel and calls the public Render API URL.

| Component | Host | Notes |
|---|---|---|
| `web` | Vercel | Next.js server; set `NEXT_PUBLIC_API_BASE_URL` to the Render service URL |
| `api` | Render | Docker web service running FastAPI/Uvicorn; exposes `/health`, `/docs`, and `/api/v1/*` |
| `postgres` | Managed PostgreSQL provider | Stores auth, audit, evaluation, and graph-modeled lineage tables |
| `redis` | Upstash Redis Free tier | Provides `REDIS_URL` for cache, rate limiting, and lightweight queue/broker use |
| `worker` | Optional external worker | Uses the same application code with a worker start command if background jobs are needed |
| `object storage` | S3-compatible bucket | Stores documents, family tree exports, and photos |

Steps:

1. In Render, create a Blueprint from this repository using the root `render.yaml`, or create a Docker web service with Root Directory set to `apps/api`.
2. Add `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, and `CORS_ORIGINS` in the Render service environment settings.
3. Run Alembic migrations against Neon before deploying code that depends on a new revision.
4. Verify `https://<service>.onrender.com/health` and `https://<service>.onrender.com/docs` after the deploy reaches Live.
5. Deploy `apps/web` to Vercel and set `NEXT_PUBLIC_API_BASE_URL` to `https://<service>.onrender.com/api/v1`.
6. Configure `CORS_ORIGINS` on Render to allow the final Vercel production origin.

## Environment Variables

**`apps/api/.env`**
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/kinship
REDIS_URL=rediss://default:password@host.upstash.io:6379
JWT_SECRET=changeme
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
RELATEDNESS_THRESHOLD_DEGREE=2
CORS_ORIGINS=https://your-frontend-domain.example
```

**`apps/web/.env`**
```
NEXT_PUBLIC_API_BASE_URL=https://kinship-api.onrender.com/api/v1
```

## Roadmap

Per the study's recommendations for future work:

1. Integration with DNA verification services.
2. Native mobile application (React Native, reusing `packages/shared-types`).
3. Blockchain-based record integrity for tamper-evident lineage records.
4. Inter-community genealogy federation (cross-instance kinship queries).
5. Integration with traditional institution and community registries.
