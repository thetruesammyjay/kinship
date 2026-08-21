from fastapi.testclient import TestClient


def register_user(client: TestClient, email: str) -> dict[str, object]:
    response = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Registry User", "email": email, "password": "secure-password"},
    )
    assert response.status_code == 201
    return response.json()


def test_admin_can_manage_user_and_review_audit_log(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    user = register_user(client, "member@example.com")
    updated = client.patch(
        f"/api/v1/admin/users/{user['id']}",
        json={"role": "Registrar"},
        headers=auth_headers,
    )
    audit = client.get("/api/v1/admin/audit-logs", headers=auth_headers)

    assert updated.status_code == 200
    assert updated.json()["role"] == "Registrar"
    assert audit.status_code == 200
    assert audit.json()[0]["action"] == "user.updated"


def test_regular_user_cannot_open_admin_or_create_registry_records(client: TestClient) -> None:
    register_user(client, "ordinary@example.com")
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "ordinary@example.com", "password": "secure-password"},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    assert client.get("/api/v1/admin/users", headers=headers).status_code == 403
    clan_response = client.post(
        "/api/v1/clans", json={"clan_name": "Restricted"}, headers=headers
    )
    person_response = client.post(
        "/api/v1/persons", json={"full_name": "Restricted"}, headers=headers
    )
    assert clan_response.status_code == 403
    assert person_response.status_code == 403


def test_user_can_submit_dispute_and_admin_can_resolve_it(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    family = client.post(
        "/api/v1/families",
        json={"family_name": "Disputed Family"},
        headers=auth_headers,
    ).json()
    submitted = client.post(
        "/api/v1/disputes",
        json={
            "entity_type": "family",
            "entity_id": family["id"],
            "reason": "The community name needs verification.",
        },
        headers=auth_headers,
    )
    resolved = client.patch(
        f"/api/v1/admin/disputes/{submitted.json()['id']}",
        json={"status": "resolved", "resolution_notes": "Confirmed with the registrar."},
        headers=auth_headers,
    )

    assert submitted.status_code == 201
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"
    assert resolved.json()["resolved_by"] is not None
