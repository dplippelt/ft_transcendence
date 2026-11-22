
from unittest.mock import Mock, call

import pytest

from app.services import friend_notification_service


@pytest.fixture
def mock_notify_safely(monkeypatch):
    notification = Mock(return_value=True)

    monkeypatch.setattr(
        friend_notification_service.connection_manager,
        "notify_safely",
        notification,
    )

    return notification


def test_notify_friend_change_notifies_both_users(mock_notify_safely):
    # Act
    friend_notification_service.notify_friend_change({1, 2})

    # Assert
    assert mock_notify_safely.call_count == 2
    mock_notify_safely.assert_has_calls(
        [
            call(1, "friends_updated", dict),
            call(2, "friends_updated", dict),
        ],
        any_order=True,
    )


def test_notify_friend_change_with_empty_set_does_nothing(
    mock_notify_safely,
):
    # Act
    friend_notification_service.notify_friend_change(set())

    # Assert
    mock_notify_safely.assert_not_called()


def test_notify_friend_change_continues_after_failed_delivery(
    mock_notify_safely,
):
    # Arrange
    mock_notify_safely.side_effect = [False, True]

    # Act
    friend_notification_service.notify_friend_change({1, 2})

    # Assert
    assert mock_notify_safely.call_count == 2
    mock_notify_safely.assert_has_calls(
        [
            call(1, "friends_updated", dict),
            call(2, "friends_updated", dict),
        ],
        any_order=True,
    )
