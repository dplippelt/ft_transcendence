import app.api.v1.lobbies as lobbies_module
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
def test_get_lobbies(client, auth_headers, make_user, make_auth_headers,):
    # Arrange
    response1 = client.post(
        "/lobbies",
        json={"name": "Lobby One"},
        headers=auth_headers,
    )

    another_user = make_user()
    another_headers = make_auth_headers(another_user)

    response2 = client.post(
        "/lobbies",
        json={"name": "Lobby Two"},
        headers=another_headers,
    )

    assert response1.status_code == 201
    assert response2.status_code == 201

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

    def fake_notify_lobby_updated(lobby):
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

    def fake_notify_lobby_updated(lobby):
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


def test_close_lobby_notifies_closed(client, auth_headers, monkeypatch):
    # Arrange
    create_response = client.post(
        "/lobbies",
        json={"name": "Test Lobby"},
        headers=auth_headers,
    )
    lobby_id = create_response.json()["id"]

    notified = []

    def fake_notify_lobby_closed(closed_lobby_id):
        notified.append(closed_lobby_id)

    monkeypatch.setattr(
        lobbies_module,
        "notify_lobby_closed",
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

    def fake_notify_lobby_updated(lobby):
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


def test_public_lobby_updates_are_broadcast(client, auth_headers, make_user, make_auth_headers, monkeypatch):
    # A non-member browsing public lobbies must see changes too.
    messages = []
    monkeypatch.setattr(lobbies_module.connection_manager, "notify_all", messages.append)

    create = client.post("/lobbies", json={"name": "Public lobby"}, headers=auth_headers)
    assert create.status_code == 201
    lobby_id = create.json()["id"]

    guest = make_user()
    guest_headers = make_auth_headers(guest)
    join = client.post(f"/lobbies/{lobby_id}/join", headers=guest_headers)
    assert join.status_code == 200
    leave = client.post(f"/lobbies/{lobby_id}/leave", headers=guest_headers)
    assert leave.status_code == 204
    close = client.delete(f"/lobbies/{lobby_id}", headers=auth_headers)
    assert close.status_code == 204

    assert [message["type"] for message in messages] == [
        "lobby_updated", "lobby_updated", "lobby_updated", "lobby_closed"
    ]
    assert [len(message["lobby"]["members"]) for message in messages[:3]] == [1, 2, 1]
    assert messages[3]["lobby_id"] == lobby_id


def test_invite_online_friend_delivers_payload_and_rejects_repeat(
    client, db, auth_headers, user, make_user, monkeypatch,
):
    from app.models.friendship import Friendship
    from app.services import lobby_service

    # The cooldown dictionaries are shared by the process, so isolate this test.
    monkeypatch.setattr(lobby_service, "_recent_invites", {})
    monkeypatch.setattr(lobby_service, "_invite_send_times", {})
    friend = make_user()
    db.add(Friendship(user_a_id=min(user.id, friend.id), user_b_id=max(user.id, friend.id)))
    db.commit()

    create = client.post("/lobbies", json={"name": "Invite test"}, headers=auth_headers)
    lobby_id = create.json()["id"]
    payloads = []

    def fake_notify(user_id, message_type, build_fields):
        payloads.append((user_id, message_type, build_fields()))
        return True

    monkeypatch.setattr(lobbies_module.connection_manager, "notify_safely", fake_notify)

    response = client.post(f"/lobbies/{lobby_id}/invite", json={"friend_id": friend.id}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"delivered": True}
    assert len(payloads) == 1
    assert payloads[0][0] == friend.id
    assert payloads[0][1] == "lobby_invite"
    assert payloads[0][2]["lobby_id"] == lobby_id
    assert payloads[0][2]["inviter"]["id"] == user.id

    repeat = client.post(f"/lobbies/{lobby_id}/invite", json={"friend_id": friend.id}, headers=auth_headers)
    assert repeat.status_code == 409
    assert repeat.json()["detail"]["code"] == ErrorCode.INVITE_ALREADY_SENT
    assert len(payloads) == 1


def test_invite_offline_friend_returns_not_delivered(
    client, db, auth_headers, user, make_user, monkeypatch,
):
    from app.models.friendship import Friendship
    from app.services import lobby_service

    monkeypatch.setattr(lobby_service, "_recent_invites", {})
    monkeypatch.setattr(lobby_service, "_invite_send_times", {})
    friend = make_user()
    db.add(Friendship(user_a_id=min(user.id, friend.id), user_b_id=max(user.id, friend.id)))
    db.commit()

    create = client.post("/lobbies", json={"name": "Offline invite"}, headers=auth_headers)
    lobby_id = create.json()["id"]
    monkeypatch.setattr(lobbies_module.connection_manager, "notify_safely", lambda *_args: False)

    response = client.post(f"/lobbies/{lobby_id}/invite", json={"friend_id": friend.id}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"delivered": False}


def test_invite_rejects_non_friend_and_self_without_notification(
    client, auth_headers, user, make_user, monkeypatch,
):
    from app.services import lobby_service

    monkeypatch.setattr(lobby_service, "_recent_invites", {})
    monkeypatch.setattr(lobby_service, "_invite_send_times", {})
    create = client.post("/lobbies", json={"name": "Private invite"}, headers=auth_headers)
    lobby_id = create.json()["id"]

    sent = []
    monkeypatch.setattr(lobbies_module.connection_manager, "notify_safely", lambda *args: sent.append(args))

    stranger = make_user()
    no_friendship = client.post(
        f"/lobbies/{lobby_id}/invite", json={"friend_id": stranger.id}, headers=auth_headers
    )
    assert no_friendship.status_code == 404
    assert no_friendship.json()["detail"]["code"] == ErrorCode.FRIENDSHIP_NOT_FOUND

    self_invite = client.post(
        f"/lobbies/{lobby_id}/invite", json={"friend_id": user.id}, headers=auth_headers
    )
    assert self_invite.status_code == 400
    assert self_invite.json()["detail"]["code"] == ErrorCode.CANNOT_INVITE_SELF
    assert sent == []


def test_create_lobby_rejects_user_already_in_lobby(client, auth_headers):
    # Arrange
    response = client.post(
        "/lobbies",
        json={"name": "Lobby A"},
        headers=auth_headers,
    )
    assert response.status_code == 201

    # Act
    response = client.post(
        "/lobbies",
        json={"name": "Lobby B"},
        headers=auth_headers,
    )

    # Assert
    assert response.status_code == 409
    assert (
        response.json()["detail"]["code"]
        == ErrorCode.ALREADY_IN_ANOTHER_LOBBY
    )


def test_join_lobby_rejects_user_already_in_another_lobby(client, auth_headers, make_user, make_auth_headers):
    # Arrange
    response = client.post(
        "/lobbies",
        json={"name": "Lobby A"},
        headers=auth_headers,
    )
    assert response.status_code == 201

    another_user = make_user()
    another_headers = make_auth_headers(another_user)

    response = client.post(
        "/lobbies",
        json={"name": "Lobby B"},
        headers=another_headers,
    )
    assert response.status_code == 201

    lobby_b_id = response.json()["id"]

    # Act
    response = client.post(
        f"/lobbies/{lobby_b_id}/join",
        headers=auth_headers,
    )

    # Assert
    assert response.status_code == 409
    assert (
        response.json()["detail"]["code"]
        == ErrorCode.ALREADY_IN_ANOTHER_LOBBY
    )
