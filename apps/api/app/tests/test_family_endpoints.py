from fastapi.testclient import TestClient


def test_list_clans_families_and_scope_tree(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    family_a = client.post(
        "/api/v1/families",
        json={"family_name": "Family A"},
        headers=auth_headers,
    ).json()
    family_b = client.post(
        "/api/v1/families",
        json={"family_name": "Family B"},
        headers=auth_headers,
    ).json()

    person_a = client.post(
        "/api/v1/persons",
        json={"full_name": "Family A Person", "family_id": family_a["id"]},
        headers=auth_headers,
    ).json()
    client.post(
        "/api/v1/persons",
        json={"full_name": "Family B Person", "family_id": family_b["id"]},
        headers=auth_headers,
    )

    clans = client.get("/api/v1/clans")
    families = client.get("/api/v1/families")
    tree = client.get(f"/api/v1/families/{family_a['id']}/tree")

    assert clans.status_code == 200
    assert clans.json() == []
    assert families.status_code == 200
    assert len(families.json()) == 2
    assert tree.status_code == 200
    assert [node["id"] for node in tree.json()["nodes"]] == [person_a["id"]]


def test_family_tree_returns_not_found(client: TestClient) -> None:
    response = client.get(
        "/api/v1/families/00000000-0000-4000-8000-000000000099/tree"
    )

    assert response.status_code == 404
