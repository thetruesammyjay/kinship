import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.postgres import Base, get_db_session
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def test_database():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async def override_db_session():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_db_session
    yield
    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    credentials = {
        "email": "registrar@example.com",
        "password": "correct-horse-battery",
    }
    response = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Community Registrar", **credentials},
    )
    assert response.status_code == 201
    login = client.post("/api/v1/auth/login", json=credentials)
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}
