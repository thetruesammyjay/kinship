/**
 * Well-known IDs from the Alembic seed migration
 * (apps/api/alembic/versions/202607310001_initial_schema_and_seed.py).
 * The tree endpoint currently returns the whole graph regardless of family,
 * but the URL contract wants a family id — use the seeded Worlu lineage.
 */
export const SEED_FAMILY_ID = "00000000-0000-4000-8000-000000000020";
