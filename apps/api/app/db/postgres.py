from collections.abc import AsyncIterator

from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(AsyncAttrs, DeclarativeBase):
    pass


settings = get_settings()


def asyncpg_connection_options(database_url: str) -> tuple[URL, dict[str, object]]:
    url = make_url(database_url)
    query = dict(url.query)
    ssl_mode = query.pop("sslmode", None)
    query.pop("channel_binding", None)

    connect_args: dict[str, object] = {}
    if ssl_mode and ssl_mode != "disable":
        connect_args["ssl"] = True

    return url.set(query=query), connect_args


engine_url, engine_connect_args = asyncpg_connection_options(settings.database_url)
engine = create_async_engine(
    engine_url,
    connect_args=engine_connect_args,
    pool_pre_ping=True,
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
