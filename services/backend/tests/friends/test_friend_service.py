from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ErrorCode
from app.models.friend_request import FriendRequest
from app.models.friendship import Friendship
from app.services import friend_service


@pytest.fixture
def mock_notify(monkeypatch):
    notification = Mock()
    monkeypatch.setattr(friend_service, "notify_friend_change", notification)
    return notification


def test_send_friend_request_notifies_both_users(db, make_user, mock_notify):
    # Arrange
    alice = make_user()
    bob = make_user()

    # Act
    request = friend_service.send_friend_request(db, alice, bob)

    # Assert
    assert request.status == friend_service.PENDING
    assert request.requester_id == alice.id
    assert request.recipient_id == bob.id
    assert request.responded_at is None
    mock_notify.assert_called_once_with({alice.id, bob.id})


def test_send_friend_request_to_selfs_does_not_notify(db, make_user, mock_notify):
    # Arrange
    alice = make_user()

    # Act
    with pytest.raises(HTTPException) as exc_info:
        friend_service.send_friend_request(db, alice, alice)

    # Assert
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == ErrorCode.CANNOT_ADD_SELF.value
    assert db.query(FriendRequest).count() == 0
    mock_notify.assert_not_called()


def test_duplicate_friend_request_does_not_notify(db, make_user, mock_notify):
    # Arrange
    alice = make_user()
    bob = make_user()
    request = friend_service.send_friend_request(db, alice, bob)
    mock_notify.reset_mock()

    # Act
    with pytest.raises(HTTPException) as exc_info:
        friend_service.send_friend_request(db, alice, bob)

    # Assert
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == ErrorCode.FRIEND_REQUEST_ALREADY_SENT.value
    assert request.status == friend_service.PENDING
    assert db.query(FriendRequest).count() == 1
    mock_notify.assert_not_called()


def test_reverse_friend_request_auto_accepts_and_notifies(db, make_user, mock_notify):
    # Arrange
    alice = make_user()
    bob = make_user()
    request_id = friend_service.send_friend_request(db, alice, bob).id
    mock_notify.reset_mock()

    # Act
    accepted = friend_service.send_friend_request(db, bob, alice)

    # Assert
    assert accepted.id == request_id
    assert accepted.status == friend_service.ACCEPTED
    assert accepted.responded_at is not None
    assert friend_service.get_friendship(db, alice.id, bob.id) is not None
    assert db.query(FriendRequest).count() == 1
    assert db.query(Friendship).count() == 1
    mock_notify.assert_called_once_with({alice.id, bob.id})


def test_accept_friend_request_notifies_both_users(db, make_user, mock_notify):
    # Arrange
    alice = make_user()
    bob = make_user()
    request_id = friend_service.send_friend_request(db, alice, bob).id
    mock_notify.reset_mock()

    # Act
    accepted = friend_service.accept_friend_request(db, request_id, bob)

    # Assert
    assert accepted.id == request_id
    assert accepted.status == friend_service.ACCEPTED
    assert accepted.responded_at is not None
    assert friend_service.get_friendship(db, alice.id, bob.id) is not None
    mock_notify.assert_called_once_with({alice.id, bob.id})


def test_reject_friend_request_notifies_both_users(db, make_user, mock_notify):
    # Arrange
    alice = make_user()
    bob = make_user()
    request_id = friend_service.send_friend_request(db, alice, bob).id
    mock_notify.reset_mock()

    # Act
    rejected = friend_service.reject_friend_request(db, request_id, bob)

    # Assert
    assert rejected.id == request_id
    assert rejected.status == friend_service.REJECTED
    assert rejected.requester_id == alice.id
    assert rejected.recipient_id == bob.id
    assert rejected.responded_at is not None
    assert friend_service.get_friendship(db, alice.id, bob.id) is None
    mock_notify.assert_called_once_with({alice.id, bob.id})


@pytest.mark.parametrize("reverse", [False, True], ids=["same-direction", "reverse-direction"])
def test_reopen_rejected_friend_request_notifies_both_users(db, make_user, mock_notify, reverse,):
    # Arrange
    alice = make_user()
    bob = make_user()
    request_id = friend_service.send_friend_request(db, alice, bob).id
    friend_service.reject_friend_request(db, request_id, bob)
    requester, recipient = (bob, alice) if reverse else (alice, bob)
    mock_notify.reset_mock()

    # Act
    reopened = friend_service.send_friend_request(db, requester, recipient)

    # Assert
    assert reopened.id == request_id
    assert reopened.status == friend_service.PENDING
    assert reopened.requester_id == requester.id
    assert reopened.recipient_id == recipient.id
    assert reopened.responded_at is None
    assert friend_service.get_friendship(db, alice.id, bob.id) is None
    assert db.query(FriendRequest).count() == 1
    mock_notify.assert_called_once_with({alice.id, bob.id})


def test_cancel_friend_request_notifies_both_users(db, make_user, mock_notify):
    # Arrange
    alice = make_user()
    bob = make_user()
    request_id = friend_service.send_friend_request(db, alice, bob).id
    mock_notify.reset_mock()

    # Act
    friend_service.cancel_friend_request(db, request_id, alice)

    # Assert
    assert db.get(FriendRequest, request_id) is None
    assert friend_service.get_friendship(db, alice.id, bob.id) is None
    mock_notify.assert_called_once_with({alice.id, bob.id})


def test_remove_friend_notifies_both_users_once(db, make_user, mock_notify):
    # Arrange
    alice = make_user()
    bob = make_user()
    request_id = friend_service.send_friend_request(db, alice, bob).id
    friend_service.accept_friend_request(db, request_id, bob)
    mock_notify.reset_mock()

    # Act
    friend_service.remove_friend(db, alice, bob.id)

    # Assert
    assert friend_service.get_friendship(db, alice.id, bob.id) is None
    assert db.get(FriendRequest, request_id) is None
    mock_notify.assert_called_once_with({alice.id, bob.id})


def test_remove_friend_without_request_notifies_both_users(db, make_user, mock_notify):
    # Arrange
    alice = make_user()
    bob = make_user()
    friend_service.create_friendship(db, alice.id, bob.id)
    db.commit()
    mock_notify.reset_mock()

    # Act
    friend_service.remove_friend(db, alice, bob.id)

    # Assert
    assert friend_service.get_friendship(db, alice.id, bob.id) is None
    mock_notify.assert_called_once_with({alice.id, bob.id})


@pytest.mark.parametrize(
    ("action", "wrong_actor", "error_code"),
    [
        ("accept_friend_request", "requester", ErrorCode.NOT_FRIEND_REQUEST_RECIPIENT),
        ("accept_friend_request", "outsider", ErrorCode.NOT_FRIEND_REQUEST_RECIPIENT),
        ("reject_friend_request", "requester", ErrorCode.NOT_FRIEND_REQUEST_RECIPIENT),
        ("reject_friend_request", "outsider", ErrorCode.NOT_FRIEND_REQUEST_RECIPIENT),
        ("cancel_friend_request", "recipient", ErrorCode.NOT_FRIEND_REQUEST_REQUESTER),
        ("cancel_friend_request", "outsider", ErrorCode.NOT_FRIEND_REQUEST_REQUESTER),
    ],
)
def test_unauthorized_friend_request_action_does_not_notify(db, make_user, mock_notify, action, wrong_actor, error_code,):
    # Arrange
    alice = make_user()
    bob = make_user()
    outsider = make_user()
    request = friend_service.send_friend_request(db, alice, bob)
    actor = {"requester": alice, "recipient": bob, "outsider": outsider}[wrong_actor]
    mock_notify.reset_mock()

    # Act
    with pytest.raises(HTTPException) as exc_info:
        getattr(friend_service, action)(db, request.id, actor)

    # Assert
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail["code"] == error_code.value
    db.refresh(request)
    assert request.status == friend_service.PENDING
    assert request.responded_at is None
    assert friend_service.get_friendship(db, alice.id, bob.id) is None
    mock_notify.assert_not_called()


@pytest.mark.parametrize("action", ["accept_friend_request", "reject_friend_request", "cancel_friend_request"])
def test_missing_friend_request_does_not_notify(db, make_user, mock_notify, action):
    # Arrange
    alice = make_user()

    # Act
    with pytest.raises(HTTPException) as exc_info:
        getattr(friend_service, action)(db, 999999, alice)

    # Assert
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["code"] == ErrorCode.FRIEND_REQUEST_NOT_FOUND.value
    mock_notify.assert_not_called()


@pytest.mark.parametrize("action", ["accept_friend_request", "reject_friend_request", "cancel_friend_request"])
def test_non_pending_request_does_not_notify(db, make_user, mock_notify, action):
    # Arrange
    alice = make_user()
    bob = make_user()
    request = friend_service.send_friend_request(db, alice, bob)
    friend_service.reject_friend_request(db, request.id, bob)
    actor = alice if action == "cancel_friend_request" else bob
    mock_notify.reset_mock()

    # Act
    with pytest.raises(HTTPException) as exc_info:
        getattr(friend_service, action)(db, request.id, actor)

    # Assert
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == ErrorCode.FRIEND_REQUEST_NOT_PENDING.value
    db.refresh(request)
    assert request.status == friend_service.REJECTED
    mock_notify.assert_not_called()


def test_send_request_to_existing_friend_does_not_notify(db, make_user, mock_notify):
    # Arrange
    alice = make_user()
    bob = make_user()
    request = friend_service.send_friend_request(db, alice, bob)
    friend_service.accept_friend_request(db, request.id, bob)
    mock_notify.reset_mock()

    # Act
    with pytest.raises(HTTPException) as exc_info:
        friend_service.send_friend_request(db, alice, bob)

    # Assert
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == ErrorCode.ALREADY_FRIENDS.value
    mock_notify.assert_not_called()


def test_remove_nonexistent_friendship_does_not_notify(db, make_user, mock_notify):
    # Arrange
    alice = make_user()
    bob = make_user()

    # Act
    with pytest.raises(HTTPException) as exc_info:
        friend_service.remove_friend(db, alice, bob.id)

    # Assert
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["code"] == ErrorCode.FRIENDSHIP_NOT_FOUND.value
    mock_notify.assert_not_called()


def test_remove_self_does_not_notify(db, make_user, mock_notify):
    # Arrange
    alice = make_user()

    # Act
    with pytest.raises(HTTPException) as exc_info:
        friend_service.remove_friend(db, alice, alice.id)

    # Assert
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == ErrorCode.CANNOT_REMOVE_SELF.value
    mock_notify.assert_not_called()


@pytest.mark.parametrize(
    ("action", "expected_exception"),
    [
        ("send", HTTPException),
        ("accept", HTTPException),
        ("auto_accept", HTTPException),
        ("reopen", HTTPException),
        ("reject", IntegrityError),
        ("cancel", IntegrityError),
        ("remove", IntegrityError),
    ],
)
def test_failed_commit_does_not_notify(db, make_user, mock_notify, monkeypatch, action, expected_exception,):
    # Arrange
    alice = make_user()
    bob = make_user()
    alice_id, bob_id = alice.id, bob.id
    request_id = None
    previous_status = None

    if action != "send":
        request = friend_service.send_friend_request(db, alice, bob)
        request_id = request.id
        if action == "reopen":
            friend_service.reject_friend_request(db, request_id, bob)
        elif action == "remove":
            friend_service.accept_friend_request(db, request_id, bob)
        previous_status = request.status

    mock_notify.reset_mock()
    failed_commit = Mock(side_effect=IntegrityError("COMMIT", None, Exception("forced failure")))
    monkeypatch.setattr(db, "commit", failed_commit)

    # Act
    with pytest.raises(expected_exception) as exc_info:
        if action == "send":
            friend_service.send_friend_request(db, alice, bob)
        elif action in {"auto_accept", "reopen"}:
            friend_service.send_friend_request(db, bob, alice)
        elif action == "accept":
            friend_service.accept_friend_request(db, request_id, bob)
        elif action == "reject":
            friend_service.reject_friend_request(db, request_id, bob)
        elif action == "cancel":
            friend_service.cancel_friend_request(db, request_id, alice)
        else:
            friend_service.remove_friend(db, alice, bob_id)

    # Assert
    # Some existing service paths let IntegrityError propagate. Roll back
    # explicitly before querying the stored state in those cases.
    db.rollback()
    failed_commit.assert_called_once()
    mock_notify.assert_not_called()
    if expected_exception is HTTPException:
        assert exc_info.value.status_code == 400

    if request_id is None:
        assert friend_service.get_existing_friend_request(db, alice_id, bob_id) is None
    else:
        assert db.get(FriendRequest, request_id).status == previous_status

    friendship = friend_service.get_friendship(db, alice_id, bob_id)
    assert (friendship is not None) == (action == "remove")
