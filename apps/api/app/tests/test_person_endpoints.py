from fastapi.testclient import TestClient


def test_create_and_search_person(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/v1/persons",
        json={"full_name": "Ama Okoro", "gender": "female"},
        headers=auth_headers,
    )

    assert response.status_code == 201
    created = response.json()
    assert created["full_name"] == "Ama Okoro"

    search_response = client.get("/api/v1/persons/search", params={"q": "ama"})

    assert search_response.status_code == 200
    assert search_response.json()["total"] == 1


def test_add_parent_relationship(client: TestClient, auth_headers: dict[str, str]) -> None:
    child = client.post(
        "/api/v1/persons", json={"full_name": "Child"}, headers=auth_headers
    ).json()
    parent = client.post(
        "/api/v1/persons", json={"full_name": "Parent"}, headers=auth_headers
    ).json()

    response = client.post(
        f"/api/v1/persons/{child['id']}/parents",
        json={"target_person_id": parent["id"]},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["relationship_type"] == "CHILD_OF"


def test_create_person_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/v1/persons", json={"full_name": "Private Record"})

    assert response.status_code == 401
