import pytest
from fastapi import HTTPException

from app.core.exceptions import ErrorCode
from app.services.lobby_service import (
    GUEST,
    HOST,
    close_lobby,
    create_lobby,
    get_lobby_by_id,
    get_member,
    join_lobby,
    leave_lobby,
    switch_lobby,
)


# CREATE
def test_create_lobby_creates_lobby_with_host(db, user):
    # Arrange
    lobby_name = "Test Lobby"
    
    # Act
    lobby = create_lobby(db, user, lobby_name)
    
    # Assert
    assert lobby.id is not None
    assert lobby.name == lobby_name
    assert len(lobby.members) == 1

    member = lobby.members[0]
    assert member.user_id == user.id
    assert member.role == HOST


def test_create_lobby_rejects_duplicate_name(db, user, make_user):
    # Arrange
    create_lobby(db, user, "Test Lobby",)
    another_user = make_user()
    
    # Act
    with pytest.raises(HTTPException) as exc_info:
        create_lobby(db, another_user, "Test Lobby",)

    # Assert
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == ErrorCode.LOBBY_NAME_ALREADY_EXISTS


def test_create_lobby_rejects_duplicate_name_case_insensitive(db, user, make_user):
    # Arrange
    create_lobby(db, user, "Test Lobby",)
    another_user = make_user()

    # Act
    with pytest.raises(HTTPException) as exc_info:
        create_lobby(db, another_user, "test lobby",)

    # Assert
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == ErrorCode.LOBBY_NAME_ALREADY_EXISTS


# JOIN
def test_join_lobby_adds_guest(db, user, make_user,):
    # Arrange
    guest = make_user()

    lobby = create_lobby(db, user, "Test Lobby",)

    # Act
    result = join_lobby(db,guest, lobby.id,)

    # Assert
    assert len(result.members) == 2

    guest_member = get_member(db, lobby.id, guest.id,)

    assert guest_member is not None
    assert guest_member.role == GUEST


def test_join_lobby_is_idempotent_for_existing_member(db, user):
    # Arrange
    lobby = create_lobby(db, user, "Test Lobby")

    # Act
    result = join_lobby(db,  user, lobby.id,)

    # Assert
    assert len(result.members) == 1
    member = get_member(db, lobby.id, user.id,)
    assert member is not None
    assert member.role == HOST


def test_join_lobby_rejects_missing_lobby(db, make_user):
    # Arrange
    guest = make_user()

    # Act
    with pytest.raises(HTTPException) as exc_info:
        join_lobby(db, guest, 999,)

    # Assert
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["code"] == ErrorCode.LOBBY_NOT_FOUND


def test_join_lobby_rejects_when_lobby_is_full(db, user, make_user):
    # Arrange
    guest = make_user()
    new_guest = make_user()
    lobby = create_lobby(db, user, "Test Lobby")
    join_lobby(db, guest, lobby.id)

    # Act
    with pytest.raises(HTTPException) as exc_info:
        join_lobby(db, new_guest, lobby.id)

    # Assert
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == ErrorCode.LOBBY_FULL


# LEAVE
def test_leave_lobby_removes_guest(db, user, make_user):
    # Arrange
    guest = make_user()
    lobby = create_lobby(db, user, "Test Lobby",)
    join_lobby(db, guest, lobby.id,)

    # Act
    leave_lobby(db, guest, lobby.id,)

    # Assert
    assert get_member(db, lobby.id, guest.id,) is None
    assert get_member(db, lobby.id, user.id,) is not None # Host should still be present


def test_leave_lobby_as_host_closes_lobby(db, user, make_user):
    # Arrange
    guest = make_user()
    lobby = create_lobby(db, user, "Test Lobby",)
    join_lobby(db, guest, lobby.id,)
    lobby_id = lobby.id

    # Act
    leave_lobby(db, user, lobby_id,)

    # Assert
    assert get_lobby_by_id(db, lobby_id,) is None


def test_leave_lobby_rejects_non_member(db, user, make_user):
    # Arrange
    guest = make_user()
    lobby = create_lobby(db, user, "Test Lobby",)

    # Act
    with pytest.raises(HTTPException) as exc_info:
        leave_lobby(db, guest, lobby.id,)

    # Assert
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == ErrorCode.NOT_LOBBY_MEMBER


# CLOSE
def test_close_lobby_removes_lobby(db, user):
    # Arrange
    lobby = create_lobby(db, user, "Test Lobby",)
    lobby_id = lobby.id

    # Act
    close_lobby(db, user, lobby_id,)

    # Assert
    assert get_lobby_by_id(db, lobby_id,) is None


def test_close_lobby_rejects_non_host(db, user, make_user):
    # Arrange
    guest = make_user()
    lobby = create_lobby(db, user, "Test Lobby",)
    join_lobby(db, guest, lobby.id,)

    # Act
    with pytest.raises(HTTPException) as exc_info:
        close_lobby(db, guest, lobby.id,)

    # Assert
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == ErrorCode.NOT_LOBBY_HOST


def test_create_lobby_rejects_user_already_in_lobby(db, user):
    # Arrange
    create_lobby(db, user, "Lobby A")

    # Act
    with pytest.raises(HTTPException) as exc_info:
        create_lobby(db, user, "Lobby B")

    # Assert
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == ErrorCode.ALREADY_IN_ANOTHER_LOBBY


def test_join_lobby_rejects_host_already_in_another_lobby(db, user, make_user):
    # Arrange
    lobby_a = create_lobby(db, user, "Lobby A")

    another_host = make_user()
    lobby_b = create_lobby(db, another_host, "Lobby B")

    # Act
    with pytest.raises(HTTPException) as exc_info:
        join_lobby(db, user, lobby_b.id)

    # Assert
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == ErrorCode.ALREADY_IN_ANOTHER_LOBBY

    assert get_member(db, lobby_a.id, user.id) is not None
    assert get_member(db, lobby_b.id, user.id) is None


def test_join_lobby_rejects_guest_already_in_another_lobby(db, user, make_user):
    # Arrange
    lobby_a = create_lobby(db, user, "Lobby A")

    another_host = make_user()
    lobby_b = create_lobby(db, another_host, "Lobby B")

    guest = make_user()
    join_lobby(db, guest, lobby_a.id)

    # Act
    with pytest.raises(HTTPException) as exc_info:
        join_lobby(db, guest, lobby_b.id)

    # Assert
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == ErrorCode.ALREADY_IN_ANOTHER_LOBBY

    assert get_member(db, lobby_a.id, guest.id) is not None
    assert get_member(db, lobby_b.id, guest.id) is None


def test_guest_can_join_another_lobby_after_leaving(db, user, make_user):
    # Arrange
    lobby_a = create_lobby(db, user, "Lobby A")

    another_host = make_user()
    lobby_b = create_lobby(db, another_host, "Lobby B")

    guest = make_user()
    join_lobby(db, guest, lobby_a.id)

    # Act
    leave_lobby(db, guest, lobby_a.id)
    join_lobby(db, guest, lobby_b.id)

    # Assert
    assert get_member(db, lobby_a.id, guest.id) is None
    assert get_member(db, lobby_b.id, guest.id) is not None


# SWITCH

def test_switch_lobby_moves_guest_atomically(db, user, make_user):
    source = create_lobby(db, user, "Old lobby")
    guest = make_user()
    join_lobby(db, guest, source.id)
    target = create_lobby(db, make_user(), "New lobby")

    result = switch_lobby(db, guest, target.id, confirmed=True)

    assert result.changed
    assert result.previous_lobby_id == source.id
    assert result.lobby.id == target.id
    assert get_member(db, source.id, guest.id) is None
    assert get_member(db, source.id, user.id) is not None
    assert get_member(db, target.id, guest.id).role == GUEST


def test_switch_lobby_closes_hosted_lobby(db, user, make_user):
    source = create_lobby(db, user, "Old lobby")
    guest = make_user()
    join_lobby(db, guest, source.id)
    source_id = source.id
    target = create_lobby(db, make_user(), "New lobby")

    result = switch_lobby(db, user, target.id, confirmed=True)

    assert result.previous_lobby_id == source_id
    assert get_lobby_by_id(db, source_id) is None
    assert get_member(db, source_id, guest.id) is None
    assert get_member(db, target.id, user.id).role == GUEST
    assert get_member(db, target.id, guest.id) is None


def test_switch_lobby_requires_explicit_confirmation(db, user, make_user):
    source = create_lobby(db, user, "Old lobby")
    target = create_lobby(db, make_user(), "New lobby")

    with pytest.raises(HTTPException) as exc_info:
        switch_lobby(db, user, target.id)

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == ErrorCode.LOBBY_SWITCH_CONFIRMATION_REQUIRED
    assert get_member(db, source.id, user.id).role == HOST


def test_switch_lobby_is_idempotent(db, user):
    lobby = create_lobby(db, user, "Same lobby")

    result = switch_lobby(db, user, lobby.id)

    assert not result.changed
    assert result.previous_lobby_id == lobby.id
    assert get_member(db, lobby.id, user.id).role == HOST
    assert len(get_lobby_by_id(db, lobby.id).members) == 1


def test_switch_lobby_joins_when_not_in_lobby(db, user, make_user):
    lobby = create_lobby(db, user, "New lobby")
    newcomer = make_user()

    result = switch_lobby(db, newcomer, lobby.id)

    assert result.changed
    assert result.previous_lobby_id is None
    assert get_member(db, lobby.id, newcomer.id).role == GUEST


def test_switch_lobby_missing_target_preserves_current_membership(db, user):
    source = create_lobby(db, user, "Old lobby")

    with pytest.raises(HTTPException) as exc_info:
        switch_lobby(db, user, 9999)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["code"] == ErrorCode.LOBBY_NOT_FOUND
    assert get_member(db, source.id, user.id).role == HOST


def test_switch_lobby_full_target_preserves_current_membership(db, user, make_user):
    source = create_lobby(db, user, "Old lobby")
    target = create_lobby(db, make_user(), "Full lobby")
    join_lobby(db, make_user(), target.id)

    with pytest.raises(HTTPException) as exc_info:
        switch_lobby(db, user, target.id, confirmed=True)

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == ErrorCode.LOBBY_FULL
    assert get_member(db, source.id, user.id).role == HOST
    assert get_lobby_by_id(db, source.id) is not None


def test_switch_lobby_rolls_back_on_insert_failure(db, user, make_user, monkeypatch):
    from sqlalchemy.exc import IntegrityError
    source = create_lobby(db, user, "Old lobby")
    target = create_lobby(db, make_user(), "New lobby")
    original_flush = db.flush
    flush_count = 0

    def fail_second_flush(*args, **kwargs):
        nonlocal flush_count
        flush_count += 1
        if flush_count == 2:
            raise IntegrityError("INSERT", {}, Exception("simulated insert failure"))
        return original_flush(*args, **kwargs)

    # Both the old-lobby deletion and new membership INSERT must be rolled
    # back when the second flush (triggered by commit) fails.
    monkeypatch.setattr(db, "flush", fail_second_flush)
    with pytest.raises(HTTPException) as exc_info:
        switch_lobby(db, user, target.id, confirmed=True)
    monkeypatch.setattr(db, "flush", original_flush)

    assert exc_info.value.status_code == 409
    assert get_member(db, source.id, user.id).role == HOST
    assert get_lobby_by_id(db, source.id) is not None
    assert get_member(db, target.id, user.id) is None


def test_switch_lobby_recovers_orphaned_membership(db, user, make_user):
    # Mirrors stale data left by deployments that did not enforce FK cleanup.
    from app.models.lobby_member import LobbyMember
    target = create_lobby(db, make_user(), "New lobby")
    db.add(LobbyMember(lobby_id=9999, user_id=user.id, role=GUEST))
    db.commit()

    result = switch_lobby(db, user, target.id, confirmed=True)

    assert result.previous_lobby_id == 9999
    assert get_member(db, 9999, user.id) is None
    assert get_member(db, target.id, user.id) is not None
