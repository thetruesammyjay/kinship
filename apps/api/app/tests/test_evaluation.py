from fastapi.testclient import TestClient


def test_health_check(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_evaluation_summaries(client: TestClient) -> None:
    accuracy = client.get("/api/v1/evaluation/accuracy")
    performance = client.get("/api/v1/evaluation/performance")
    sus = client.get("/api/v1/evaluation/sus/summary")

    assert accuracy.status_code == 200
    assert performance.status_code == 200
    assert sus.status_code == 200
    assert accuracy.json()["accuracy"] == 0.0


def test_register_and_login_user(client: TestClient) -> None:
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Community Registrar",
            "email": "registrar@example.com",
            "phone_number": "+2348000000000",
            "password": "correct-horse-battery",
        },
    )
    assert register_response.status_code == 201
    assert register_response.json()["phone_number"] == "+2348000000000"

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "registrar@example.com", "password": "correct-horse-battery"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["token_type"] == "bearer"
