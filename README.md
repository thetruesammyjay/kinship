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
- [Deployment on Railway](#deployment-on-railway)
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

## Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        WEB["React SPA<br/>(Vite + TypeScript)"]
    end

    subgraph Edge["Railway Edge"]
        LB["Railway Public Networking<br/>(HTTPS, custom domain)"]
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
        NEO[("Neo4j<br/>Graph DB — Person, Family, Clan nodes<br/>CHILD_OF, MARRIED_TO, SIBLING_OF edges")]
        PG[("PostgreSQL<br/>Users, Auth, Audit Log,<br/>Evaluation Metrics")]
        REDIS[("Redis<br/>Cache + Celery broker + Rate limiting")]
        BLOB["Object Storage<br/>(Railway Volume / S3-compatible)<br/>Documents, tree exports, photos"]
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
    PERSON --> NEO
    PERSON --> PG
    TREE --> NEO
    KINSHIP --> NEO
    KINSHIP --> REDIS
    EVAL --> PG

    PERSON -.enqueue.-> QUEUE
    QUEUE --> BULK --> NEO
    NOTIFY --> SMTP
    KINSHIP -.high-risk match.-> NOTIFY

    PERSON --> BLOB
    TREE --> BLOB

    classDef svc fill:#1f2937,stroke:#60a5fa,color:#f9fafb
    classDef data fill:#111827,stroke:#34d399,color:#f9fafb
    classDef client fill:#111827,stroke:#f472b6,color:#f9fafb
    class GATEWAY,AUTH,PERSON,TREE,KINSHIP,NOTIFY,EVAL,QUEUE,BULK svc
    class NEO,PG,REDIS,BLOB data
    class WEB client
```

### Request flow: verifying marriage eligibility

```mermaid
sequenceDiagram
    actor User as User (Frontend)
    participant FE as React SPA
    participant API as FastAPI Gateway
    participant KIN as Kinship Engine
    participant NEO as Neo4j
    participant CACHE as Redis Cache

    User->>FE: Select Person A, Person B
    FE->>API: POST /api/v1/kinship/verify {personA, personB}
    API->>KIN: verify_relationship(A, B)
    KIN->>CACHE: check cached path(A,B)
    alt cache hit
        CACHE-->>KIN: cached relationship path
    else cache miss
        KIN->>NEO: shortestPath / common ancestor query (Cypher)
        NEO-->>KIN: path, common ancestor, degree
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
2. **Calculate relationship path** — compute the shortest path between A and B through the ancestor graph (Neo4j Cypher `shortestPath`, or BFS if running on the relational fallback).
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
| Frontend | React + Vite + TypeScript | SPA, deployed as a Railway static/Node service |
| Styling | Tailwind CSS | Utility-first, fast to theme |
| Tree/Graph visualization | React Flow or D3.js | For interactive family tree rendering |
| Backend | FastAPI (Python) | Async, OpenAPI docs auto-generated, Pydantic v2 validation |
| Graph database | Neo4j | Native graph storage for Person/Family/Clan nodes and relationship edges — this is where the algorithm's novelty lives |
| Relational database | PostgreSQL | Users, auth, audit trail, evaluation metrics (accuracy/response-time/SUS logs) |
| Cache / broker | Redis | Kinship-path caching, rate limiting, Celery/RQ broker |
| Background jobs | Celery or RQ | Bulk lineage import, notification dispatch |
| Auth | JWT (OAuth2 password flow via FastAPI security) | Roles: Admin, Community Elder, Registrar, User |
| File/object storage | Railway Volume or S3-compatible bucket | Family tree exports (PDF/PNG), supporting documents |
| Hosting | Railway | Every service below maps to a Railway service |

## Monorepo Structure

```
kinship-verification-platform/
├── README.md
├── .gitignore
├── .editorconfig
├── railway.json                      # root Railway config (if using a single monorepo project)
├── docker-compose.yml                # local dev: postgres, neo4j, redis
├── turbo.json                        # optional: Turborepo pipeline if using pnpm workspaces
├── package.json                      # root workspace manifest (pnpm workspaces)
├── pnpm-workspace.yaml
│
├── apps/
│   ├── web/                          # React frontend
│   │   ├── Dockerfile
│   │   ├── railway.toml
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── router.tsx
│   │       ├── api/
│   │       │   ├── client.ts         # axios/fetch wrapper, base URL from env
│   │       │   ├── persons.ts
│   │       │   ├── families.ts
│   │       │   ├── kinship.ts
│   │       │   └── auth.ts
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   ├── Navbar.tsx
│   │       │   │   └── Sidebar.tsx
│   │       │   ├── family-tree/
│   │       │   │   ├── FamilyTreeCanvas.tsx     # React Flow / D3 render
│   │       │   │   ├── PersonNode.tsx
│   │       │   │   └── RelationshipEdge.tsx
│   │       │   ├── kinship/
│   │       │   │   ├── VerificationForm.tsx
│   │       │   │   ├── VerdictBanner.tsx
│   │       │   │   └── RelationshipPath.tsx
│   │       │   └── ui/                          # shared buttons, inputs, modals
│   │       ├── pages/
│   │       │   ├── Dashboard.tsx
│   │       │   ├── RegisterPerson.tsx
│   │       │   ├── FamilyTreePage.tsx
│   │       │   ├── VerifyEligibility.tsx
│   │       │   ├── Login.tsx
│   │       │   └── AdminEvaluation.tsx          # SUS scores, accuracy/perf dashboards
│   │       ├── hooks/
│   │       │   ├── useAuth.ts
│   │       │   └── useKinshipVerification.ts
│   │       ├── store/                            # Zustand or Redux Toolkit
│   │       │   └── authStore.ts
│   │       ├── types/
│   │       │   └── index.ts
│   │       └── styles/
│   │           └── tailwind.css
│   │
│   └── api/                          # FastAPI backend
│       ├── Dockerfile
│       ├── railway.toml
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
│       │   │   ├── neo4j.py          # Neo4j driver session management
│       │   │   └── redis_client.py
│       │   ├── models/               # SQLAlchemy models (Postgres side: users, audit, metrics)
│       │   │   ├── user.py
│       │   │   └── evaluation_log.py
│       │   ├── graph/                # Neo4j-facing domain layer
│       │   │   ├── person_repository.py
│       │   │   ├── family_repository.py
│       │   │   └── cypher_queries.py
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

Graph model (Neo4j) — the primary data store for lineage:

**Nodes**
- `Person` — id, full_name, gender, date_of_birth, is_deceased, clan_id, notes
- `Family` — id, family_name, origin_community
- `Clan` — id, clan_name, region

**Relationships**
- `(:Person)-[:CHILD_OF]->(:Person)`
- `(:Person)-[:PARENT_OF]->(:Person)`
- `(:Person)-[:MARRIED_TO]->(:Person)`
- `(:Person)-[:SIBLING_OF]->(:Person)`
- `(:Person)-[:BELONGS_TO]->(:Clan)`

Relational model (PostgreSQL) — everything that isn't the lineage graph itself:

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
3. **Scalability** — load-tested at 100, 1,000, and 10,000 `Person` nodes using `scripts/load_test.py` against the Railway-hosted Neo4j instance.
4. **Usability (SUS)** — a 10-item System Usability Scale survey collected in-app after user testing sessions, aggregated by `/api/v1/evaluation/sus/summary` (interpretation: ≥68 acceptable, ≥80 excellent).

## Local Development

Prerequisites: Node 20+, pnpm, Python 3.11+, Docker.

```bash
# 1. Clone and install
git clone <repo-url> kinship-verification-platform
cd kinship-verification-platform
pnpm install

# 2. Start local infra (Postgres, Neo4j, Redis)
docker compose up -d

# 3. Backend
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 4. Frontend (new terminal)
cd apps/web
pnpm dev
```

- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs
- Neo4j Browser: http://localhost:7474

## Deployment on Railway

This monorepo maps cleanly onto Railway services — each box in the architecture diagram's Data and Application layers is a Railway service:

| Railway Service | Source | Notes |
|---|---|---|
| `web` | `apps/web` (root directory set in Railway) | Build with Vite, served via a lightweight Node/`serve` process or static output |
| `api` | `apps/api` (root directory set in Railway) | Dockerfile-based deploy, exposes port via `$PORT` |
| `postgres` | Railway's built-in PostgreSQL plugin | One-click provision, injects `DATABASE_URL` |
| `redis` | Railway's built-in Redis plugin | Injects `REDIS_URL` |
| `neo4j` | Railway template / Docker image (`neo4j:5-community`) | Deploy from the Neo4j Docker image; persist data with a Railway Volume |
| `worker` | `apps/api` (same image, different start command: `celery -A app.workers.celery_app worker`) | Separate Railway service reusing the API image |

Steps:

1. Create a Railway project, add each row above as its own service, pointing Railway at the relevant subdirectory (`apps/web`, `apps/api`) using **root directory** settings so it stays one repo.
2. Provision PostgreSQL and Redis from Railway's plugin marketplace — no Dockerfile needed for these.
3. Deploy Neo4j from its official Docker image as a Railway service, attach a Railway Volume at `/data` for persistence.
4. Set environment variables (below) on each service, referencing Railway's auto-generated connection strings (`${{Postgres.DATABASE_URL}}`, `${{Redis.REDIS_URL}}`) and the Neo4j service's internal URL.
5. Set `web`'s `VITE_API_BASE_URL` to the `api` service's public Railway domain.
6. Enable Railway's public networking on `web` and `api`; keep `postgres`, `redis`, and `neo4j` on private networking only.

## Environment Variables

**`apps/api/.env`**
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/kinship
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=changeme
REDIS_URL=redis://redis:6379/0
JWT_SECRET=changeme
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
RELATEDNESS_THRESHOLD_DEGREE=2
CORS_ORIGINS=https://your-web-service.up.railway.app
```

**`apps/web/.env`**
```
VITE_API_BASE_URL=https://your-api-service.up.railway.app/api/v1
```

## Roadmap

Per the study's recommendations for future work:

1. Integration with DNA verification services.
2. Native mobile application (React Native, reusing `packages/shared-types`).
3. Blockchain-based record integrity for tamper-evident lineage records.
4. Inter-community genealogy federation (cross-instance kinship queries).
5. Integration with traditional institution and community registries.