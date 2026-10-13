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


def test_create_lobby_rejects_duplicate_name(db, user):
    # Arrange
    create_lobby(db, user, "Test Lobby",)

    # Act
    with pytest.raises(HTTPException) as exc_info:
        create_lobby(db, user, "Test Lobby",)

    # Assert
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == ErrorCode.LOBBY_NAME_ALREADY_EXISTS


def test_create_lobby_rejects_duplicate_name_case_insensitive(db, user):
    # Arrange
    create_lobby(db, user, "Test Lobby",)

    # Act
    with pytest.raises(HTTPException) as exc_info:
        create_lobby(db, user, "test lobby",)

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
