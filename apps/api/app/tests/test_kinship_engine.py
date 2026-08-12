from fastapi.testclient import TestClient


def test_verify_kinship_finds_shared_ancestor(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    def create_person(name: str) -> dict[str, str]:
        return client.post(
            "/api/v1/persons", json={"full_name": name}, headers=auth_headers
        ).json()

    grandparent = create_person("Grandparent")
    parent_a = create_person("Parent A")
    parent_b = create_person("Parent B")
    person_a = create_person("Person A")
    person_b = create_person("Person B")

    client.post(
        f"/api/v1/persons/{parent_a['id']}/parents",
        json={"target_person_id": grandparent["id"]},
        headers=auth_headers,
    )
    client.post(
        f"/api/v1/persons/{parent_b['id']}/parents",
        json={"target_person_id": grandparent["id"]},
        headers=auth_headers,
    )
    client.post(
        f"/api/v1/persons/{person_a['id']}/parents",
        json={"target_person_id": parent_a["id"]},
        headers=auth_headers,
    )
    client.post(
        f"/api/v1/persons/{person_b['id']}/parents",
        json={"target_person_id": parent_b["id"]},
        headers=auth_headers,
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


def test_verify_kinship_returns_unrelated_without_shared_ancestor(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    person_a = client.post(
        "/api/v1/persons", json={"full_name": "Person A"}, headers=auth_headers
    ).json()
    person_b = client.post(
        "/api/v1/persons", json={"full_name": "Person B"}, headers=auth_headers
    ).json()

    response = client.post(
        "/api/v1/kinship/verify",
        json={"person_a_id": person_a["id"], "person_b_id": person_b["id"]},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Unrelated"
