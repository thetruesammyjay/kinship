# Kinship Verification Framework

A graph-based kinship verification platform for ancestry tracing and marriage eligibility assessment in African communities. The system digitizes family lineage records, models relationships as a graph, and runs a relationship-detection algorithm to flag consanguineous marriage risk before it happens.

This repository is the proof-of-concept implementation supporting the research artifact: *"Design and Evaluation of a Kinship Verification Framework for Preventing Consanguineous Marriages in African Communities."* The scholarly contribution is the kinship verification framework and relationship-detection algorithm; the web platform below is the vehicle that demonstrates and evaluates it.

## Live Deployment

- **Web application:** [https://kinship-web-silk.vercel.app](https://kinship-web-silk.vercel.app)
- **API documentation:** [https://kinship-m1n0.onrender.com/docs](https://kinship-m1n0.onrender.com/docs)
- **API health:** [https://kinship-m1n0.onrender.com/health](https://kinship-m1n0.onrender.com/health)

## Table of Contents

- [Live Deployment](#live-deployment)
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

- **Genealogy** Ã¢â‚¬â€ the digitized record of ancestry and lineage.
- **Kinship** Ã¢â‚¬â€ consanguinity (blood relation), affinity (relation by marriage), clan relationships, extended family relationships.
- **Consanguineous marriage** Ã¢â‚¬â€ marriage between individuals related by blood within a socially or biologically significant degree.
- **Family tree** Ã¢â‚¬â€ a hierarchical/graph representation of lineage.
- **Graph-based relationship network** Ã¢â‚¬â€ persons as nodes, relationships (parent-child, marriage, sibling) as edges. This is the structural backbone of the whole system.

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

    subgraph API["Application Layer Ã¢â‚¬â€ FastAPI Service"]
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
    KIN-->>API: {status, relationship, degree, path}
    FE->>API: POST /api/v1/kinship/marriage-eligibility {personA, personB}
    API-->>FE: {can_marry, decision, relationship, reason}
    API-->>FE: 200 OK JSON result
    FE-->>User: Render verdict + relationship path + warning banner if closely related
```

## Kinship Verification Algorithm

This is the core scholarly contribution. Given Person A and Person B:

1. **Find common ancestor(s)** Ã¢â‚¬â€ traverse `CHILD_OF` / `PARENT_OF` edges upward from both A and B in the graph until a shared ancestor node is found (or none exists within a bounded depth).
2. **Calculate relationship path** Ã¢â‚¬â€ compute the shortest path between A and B through the ancestor graph using PostgreSQL recursive CTEs and/or an application-level BFS over indexed relationship edges.
3. **Determine degree of relatedness** Ã¢â‚¬â€ derive a numeric degree from path length and generation offset.
4. **Classify the relationship** - distinguish direct ancestry, siblings, aunt/uncle relationships, cousins, spouses, and unrelated records.
5. **Assess marriage eligibility** - block direct ancestors and relationships closer than second cousins; allow degree 5 or higher and pairs with no shared ancestor.

| Relationship | Degree |
|---|---|
| Siblings | 1 |
| First Cousins | 3 |
| Second Cousins | 5 |
| Third Cousins | 7 |

**Output:** `Unrelated`, `Distantly Related`, or `Closely Related`, plus the full relationship path and computed degree so the result is explainable, not a black box.

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript | Server-rendered/prerendered pages, deployable as a Node service |
| Styling | Tailwind CSS v4 | `@theme` design tokens in `app/globals.css` |
| Tree/Graph visualization | React Flow + Dagre | Interactive family graph with parent, spouse, and cross-branch edges |
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
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ README.md
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ .gitignore
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ .editorconfig
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ docker-compose.yml                # local dev: postgres, redis-compatible cache
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ turbo.json                        # optional: Turborepo pipeline if using pnpm workspaces
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ package.json                      # root workspace manifest (pnpm workspaces)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ pnpm-workspace.yaml
Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ apps/
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ web/                          # Next.js 15 App Router frontend
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Dockerfile
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ package.json
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ next.config.ts
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ postcss.config.mjs        # @tailwindcss/postcss
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ tsconfig.json
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ public/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ favicon.svg
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app/                      # file-based routes
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ layout.tsx            # root layout, wraps <SessionProvider>
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ globals.css           # Tailwind v4 import + @theme tokens
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ page.tsx              # marketing landing
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ signin/page.tsx       # login + register (JWT auth)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ (app)/                # authenticated route group
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ layout.tsx        # <AppGate><AppShell>Ã¢â‚¬Â¦
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ dashboard/page.tsx
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ register/page.tsx
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ tree/page.tsx
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ verify/page.tsx
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ evaluation/page.tsx        # SUS scores, accuracy/perf dashboards
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ components/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ shell/                # AppShell, AppGate, LeftRail, BottomNav, navItems
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ family-tree/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ FamilyTreeCanvas.tsx     # React Flow / D3 render
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ PersonNode.tsx
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ RelationshipEdge.tsx
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ kinship/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ VerificationForm.tsx
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ VerdictBanner.tsx
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ RelationshipPath.tsx
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ ui/                          # PersonPicker (search-as-you-type)
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ lib/
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ api.ts                # fetch wrapper, base URL from env, Bearer token
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ session.tsx           # JWT session context, persisted to localStorage
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ types.ts              # types mirroring the FastAPI schemas
Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ constants.ts
Ã¢â€â€š   Ã¢â€â€š
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ api/                          # FastAPI backend
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Dockerfile
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ README.md                  # Render deployment notes
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ pyproject.toml            # or requirements.txt
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ alembic.ini
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ alembic/
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ versions/
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ app/
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ main.py               # FastAPI app factory, router registration
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ config.py             # Pydantic Settings, reads env vars
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ dependencies.py       # DB sessions, current_user, pagination
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ api/
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ v1/
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ router.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ endpoints/
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ auth.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ persons.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ families.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ family_tree.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ kinship.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ evaluation.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ admin.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ core/
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ security.py       # JWT encode/decode, password hashing
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ exceptions.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ db/
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ postgres.py       # SQLAlchemy engine/session
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ redis_client.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ models/               # SQLAlchemy models (users, lineage graph, audit, metrics)
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ user.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ person.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ kinship_edge.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ evaluation_log.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ graph/                # Postgres-backed graph traversal domain layer
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ person_repository.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ family_repository.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ traversal_queries.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ schemas/              # Pydantic request/response models
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ person.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ family.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ kinship.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ auth.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ services/
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ person_service.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ family_tree_service.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ kinship_engine.py         # the algorithm from section above
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ evaluation_service.py     # accuracy / response-time / SUS aggregation
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ notification_service.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ workers/
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ celery_app.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ bulk_import_worker.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ notification_worker.py
Ã¢â€â€š       Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ tests/
Ã¢â€â€š       Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ conftest.py
Ã¢â€â€š       Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ test_kinship_engine.py
Ã¢â€â€š       Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ test_person_endpoints.py
Ã¢â€â€š       Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ test_evaluation.py
Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ scripts/
Ã¢â€â€š           Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ seed_data.py                  # sample African family datasets for evaluation
Ã¢â€â€š           Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ load_test.py                  # scalability tests: 100 / 1,000 / 10,000 persons
Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ packages/
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ shared-types/                 # TS types shared between frontend and OpenAPI-generated client
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ package.json
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ src/index.ts
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ ui/                           # optional shared component library
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ package.json
Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ src/
Ã¢â€â€š
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ docs/
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ architecture.md
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ data-model.md
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ algorithm.md
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ evaluation-plan.md            # SUS instrument, accuracy test protocol
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ api-reference.md              # generated/curated from FastAPI OpenAPI schema
Ã¢â€â€š
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ .github/
    Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ workflows/
        Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ ci-api.yml                # lint + pytest on apps/api
        Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ ci-web.yml                # lint + build on apps/web
```

## Data Model

PostgreSQL stores both the application records and the graph-modeled lineage data. The lineage graph is represented with normalized entity tables and indexed edge tables, so the framework remains graph-based even without a dedicated graph database.

**Graph vertices**
- `Person` Ã¢â‚¬â€ id, full_name, gender, date_of_birth, is_deceased, clan_id, notes
- `Family` Ã¢â‚¬â€ id, family_name, origin_community
- `Clan` Ã¢â‚¬â€ id, clan_name, region

**Graph edges**
- `kinship_edges` Ã¢â‚¬â€ id, source_person_id, target_person_id, relationship_type, confidence_score, recorded_by, created_at
- Supported `relationship_type` values: `CHILD_OF`, `PARENT_OF`, `MARRIED_TO`, `SIBLING_OF`, `BELONGS_TO_CLAN`
- Indexes: `(source_person_id, relationship_type)`, `(target_person_id, relationship_type)`, and `(source_person_id, target_person_id, relationship_type)` for traversal and duplicate prevention

**Application tables**

- `users` Ã¢â‚¬â€ auth accounts (Admin, Registrar, Elder, standard User), hashed passwords, roles
- `audit_log` Ã¢â‚¬â€ who registered/edited which person/relationship, when
- `evaluation_metrics` Ã¢â‚¬â€ accuracy test results, response-time samples, SUS survey responses (supports Chapter 4 evaluation directly)

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

1. **Relationship Detection Accuracy** Ã¢â‚¬â€ `accuracy = correct_detections / total_tests`, computed against an expert-validated test dataset seeded via `scripts/seed_data.py`.
2. **Response Time** Ã¢â‚¬â€ average and max query time for `/api/v1/kinship/verify`, logged per request into `evaluation_metrics` and exposed via `/api/v1/evaluation/performance`.
3. **Scalability** Ã¢â‚¬â€ load-tested at 100, 1,000, and 10,000 `Person` vertices using `scripts/load_test.py` against the PostgreSQL edge-table graph and API deployment.
4. **Usability (SUS)** Ã¢â‚¬â€ a 10-item System Usability Scale survey collected in-app after user testing sessions, aggregated by `/api/v1/evaluation/sus/summary` (interpretation: Ã¢â€°Â¥68 acceptable, Ã¢â€°Â¥80 excellent).

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
4. Verify [the health endpoint](https://kinship-m1n0.onrender.com/health) and [API documentation](https://kinship-m1n0.onrender.com/docs) after the deploy reaches Live.
5. Deploy `apps/web` to Vercel and set `NEXT_PUBLIC_API_BASE_URL` to `https://kinship-m1n0.onrender.com/api/v1`.
6. Set `CORS_ORIGINS` on Render to `https://kinship-web-silk.vercel.app`.

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
CORS_ORIGINS=https://kinship-web-silk.vercel.app
```

**`apps/web/.env`**
```
NEXT_PUBLIC_API_BASE_URL=https://kinship-m1n0.onrender.com/api/v1
NEXT_PUBLIC_SITE_URL=https://kinship-web-silk.vercel.app
```

## Roadmap

Per the study's recommendations for future work:

1. Integration with DNA verification services.
2. Native mobile application (React Native, reusing `packages/shared-types`).
3. Blockchain-based record integrity for tamper-evident lineage records.
4. Inter-community genealogy federation (cross-instance kinship queries).
5. Integration with traditional institution and community registries.
