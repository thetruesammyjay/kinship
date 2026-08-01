from fastapi.testclient import TestClient


def test_verify_kinship_finds_shared_ancestor(client: TestClient) -> None:
    grandparent = client.post("/api/v1/persons", json={"full_name": "Grandparent"}).json()
    parent_a = client.post("/api/v1/persons", json={"full_name": "Parent A"}).json()
    parent_b = client.post("/api/v1/persons", json={"full_name": "Parent B"}).json()
    person_a = client.post("/api/v1/persons", json={"full_name": "Person A"}).json()
    person_b = client.post("/api/v1/persons", json={"full_name": "Person B"}).json()

    client.post(
        f"/api/v1/persons/{parent_a['id']}/parents",
        json={"target_person_id": grandparent["id"]},
    )
    client.post(
        f"/api/v1/persons/{parent_b['id']}/parents",
        json={"target_person_id": grandparent["id"]},
    )
    client.post(
        f"/api/v1/persons/{person_a['id']}/parents",
        json={"target_person_id": parent_a["id"]},
    )
    client.post(
        f"/api/v1/persons/{person_b['id']}/parents",
        json={"target_person_id": parent_b["id"]},
    )

    response = client.post(
        "/api/v1/kinship/verify",
        json={"person_a_id": person_a["id"], "person_b_id": person_b["id"]},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "Distantly Related"
    assert payload["common_ancestor_id"] == grandparent["id"]
    assert payload["degree"] == 3


def test_verify_kinship_returns_unrelated_without_shared_ancestor(client: TestClient) -> None:
    person_a = client.post("/api/v1/persons", json={"full_name": "Person A"}).json()
    person_b = client.post("/api/v1/persons", json={"full_name": "Person B"}).json()

    response = client.post(
        "/api/v1/kinship/verify",
        json={"person_a_id": person_a["id"], "person_b_id": person_b["id"]},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Unrelated"
