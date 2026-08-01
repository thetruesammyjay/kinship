# Kinship API

FastAPI backend for the Kinship Verification Framework.

## Development

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

## Tests

```bash
uv run pytest
```

Python bytecode caches such as `__pycache__/` and pytest caches such as `.pytest_cache/` are local runtime artifacts and are ignored by Git.

## Database

The API uses async SQLAlchemy with PostgreSQL in production. Configure `DATABASE_URL` with an async driver URL:

```bash
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/kinship
```

Run migrations with:

```bash
uv run alembic upgrade head
```

The initial Alembic migration creates the core tables and inserts seed data for:

- an admin registrar user with name, email, phone number, role, and password hash placeholder
- a clan and family
- sample persons with names, emails, phone numbers, gender, family/clan links, community, and notes
- `CHILD_OF` graph edges for a cousin-style kinship traversal demo
