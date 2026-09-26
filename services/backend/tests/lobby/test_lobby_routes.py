from app.core.exceptions import ErrorCode


# AUTH
def test_lobbies_requires_authentication(client):
    # Act
    response = client.get("/lobbies")

    # Assert
    assert response.status_code == 401


# CREATE
def test_create_lobby(client, auth_headers, user):
    # Act
    response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )

    # Assert
    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["name"] == "Test Lobby"
    assert len(data["members"]) == 1

    member = data["members"][0]

    assert member["role"] == "host"
    assert member["user"]["id"] == user.id


# LIST
def test_get_lobbies(client, auth_headers):
    # Arrange
    client.post(
        "/lobbies",
        json={"name": "Lobby One"},
        headers=auth_headers,
    )

    client.post(
        "/lobbies",
        json={"name": "Lobby Two"},
        headers=auth_headers,
    )

    # Act
    response = client.get(
        "/lobbies",
        headers=auth_headers,
    )

    # Assert
    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert {lobby["name"] for lobby in data} == {
        "Lobby One",
        "Lobby Two",
    }


# GET
def test_get_lobby(client, auth_headers):
    # Arrange
    create_response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )

    lobby_id = create_response.json()["id"]

    # Act
    response = client.get(
        f"/lobbies/{lobby_id}",
        headers=auth_headers,
    )

    # Assert
    assert response.status_code == 200

    data = response.json()

    assert data["id"] == lobby_id
    assert data["name"] == "Test Lobby"


def test_get_lobby_rejects_missing_lobby(client, auth_headers):
    # Act
    response = client.get(
        "/lobbies/999",
        headers=auth_headers,
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == ErrorCode.LOBBY_NOT_FOUND


# JOIN
def test_join_lobby(
    client,
    auth_headers,
    make_user,
    make_auth_headers,
):
    # Arrange
    create_response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )

    lobby_id = create_response.json()["id"]

    guest = make_user()
    guest_headers = make_auth_headers(guest)

    # Act
    response = client.post(
        f"/lobbies/{lobby_id}/join",
        headers=guest_headers,
    )

    # Assert
    assert response.status_code == 200

    data = response.json()

    assert len(data["members"]) == 2

    guest_member = next(
        member
        for member in data["members"]
        if member["user"]["id"] == guest.id
    )

    assert guest_member["role"] == "guest"


# LEAVE
def test_leave_lobby(
    client,
    auth_headers,
    make_user,
    make_auth_headers,
):
    # Arrange
    create_response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )

    lobby_id = create_response.json()["id"]

    guest = make_user()
    guest_headers = make_auth_headers(guest)

    client.post(
        f"/lobbies/{lobby_id}/join",
        headers=guest_headers,
    )

    # Act
    response = client.post(
        f"/lobbies/{lobby_id}/leave",
        headers=guest_headers,
    )

    # Assert
    assert response.status_code == 204

    lobby_response = client.get(
        f"/lobbies/{lobby_id}",
        headers=auth_headers,
    )

    members = lobby_response.json()["members"]

    assert len(members) == 1
    assert members[0]["user"]["id"] != guest.id


# CLOSE
def test_close_lobby(client, auth_headers):
    # Arrange
    create_response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )

    lobby_id = create_response.json()["id"]

    # Act
    response = client.delete(
        f"/lobbies/{lobby_id}",
        headers=auth_headers,
    )

    # Assert
    assert response.status_code == 204

    get_response = client.get(
        f"/lobbies/{lobby_id}",
        headers=auth_headers,
    )

    assert get_response.status_code == 404
    assert (
        get_response.json()["detail"]["code"]
        == ErrorCode.LOBBY_NOT_FOUND
    )


def test_join_full_lobby_returns_conflict(client, auth_headers, make_user, make_auth_headers,):
    # Arrange
    create_response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )

    lobby_id = create_response.json()["id"]

    guest = make_user()
    guest_headers = make_auth_headers(guest)

    client.post(
        f"/lobbies/{lobby_id}/join",
        headers=guest_headers,
    )

    new_guest = make_user()
    new_guest_headers = make_auth_headers(new_guest)

    # Act
    response = client.post(
        f"/lobbies/{lobby_id}/join",
        headers=new_guest_headers,
    )

    # Assert
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == ErrorCode.LOBBY_FULL


def test_join_lobby_notifies_members(client, auth_headers, make_user, make_auth_headers, monkeypatch,):
    # Arrange
    response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )
    lobby_id = response.json()["id"]

    guest = make_user()

    notified_lobbies = []

    def fake_notify_lobby_updated(lobby, member_ids=None):
        notified_lobbies.append(lobby.id)

    monkeypatch.setattr(
        "app.api.v1.lobbies.notify_lobby_updated",
        fake_notify_lobby_updated,
    )

    # Act
    response = client.post(
        f"/lobbies/{lobby_id}/join",
        headers=make_auth_headers(guest),
    )

    # Assert
    assert response.status_code == 200
    assert notified_lobbies == [lobby_id]


def test_leave_lobby_notifies_members(client, auth_headers, make_user, make_auth_headers, monkeypatch,):
    # Arrange
    create_response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )
    lobby_id = create_response.json()["id"]

    guest = make_user()
    guest_headers = make_auth_headers(guest)

    client.post(
        f"/lobbies/{lobby_id}/join",
        headers=guest_headers,
    )

    notified = []

    def fake_notify_lobby_updated(lobby, member_ids=None):
        notified.append(lobby.id)

    monkeypatch.setattr(
        "app.api.v1.lobbies.notify_lobby_updated",
        fake_notify_lobby_updated,
    )

    # Act
    response = client.post(
        f"/lobbies/{lobby_id}/leave",
        headers=guest_headers,
    )

    # Assert
    assert response.status_code == 204
    assert notified == [lobby_id]


def test_close_lobby_notifies_members(client, auth_headers, monkeypatch,):
    # Arrange
    create_response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )
    lobby_id = create_response.json()["id"]

    notified = []

    def fake_notify_lobby_closed(closed_lobby_id, member_ids):
        notified.append(closed_lobby_id)

    monkeypatch.setattr(
        "app.api.v1.lobbies.notify_lobby_closed",
        fake_notify_lobby_closed,
    )

    # Act
    response = client.delete(
        f"/lobbies/{lobby_id}",
        headers=auth_headers,
    )

    # Assert
    assert response.status_code == 204
    assert notified == [lobby_id]


def test_failed_join_does_not_notify_members(client, auth_headers, make_user, make_auth_headers, monkeypatch,):
    # Arrange
    lobby_response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )
    lobby_id = lobby_response.json()["id"]

    guest = make_user()
    client.post(
        f"/lobbies/{lobby_id}/join",
        headers=make_auth_headers(guest),
    )

    third_user = make_user()

    notification_count = 0

    def fake_notify_lobby_updated(lobby, member_ids=None):
        nonlocal notification_count
        notification_count += 1

    monkeypatch.setattr(
        "app.api.v1.lobbies.notify_lobby_updated",
        fake_notify_lobby_updated,
    )

    # Act
    response = client.post(
        f"/lobbies/{lobby_id}/join",
        headers=make_auth_headers(third_user),
    )

    # Assert
    assert response.status_code == 409
    assert notification_count == 0
