from unittest.mock import Mock, call

import pytest

from app.services import friend_notification_service


@pytest.fixture
def manager(monkeypatch):
    manager = friend_notification_service.connection_manager
    build_payload = Mock(wraps=manager.build_payload_safely)
    notify = Mock(return_value=True)
    monkeypatch.setattr(manager, "build_payload_safely", build_payload)
    monkeypatch.setattr(manager, "notify", notify)
    return manager


def test_notify_friend_change_builds_one_payload_for_both_users(manager):
    friend_notification_service.notify_friend_change({1, 2})

    manager.build_payload_safely.assert_called_once()
    event_type, build_fields = manager.build_payload_safely.call_args.args
    assert event_type == "friends_updated"
    assert build_fields() == {}
    assert manager.notify.call_count == 2
    manager.notify.assert_has_calls(
        [call(1, {"type": "friends_updated"}), call(2, {"type": "friends_updated"})],
        any_order=True,
    )
    first_payload = manager.notify.call_args_list[0].args[1]
    second_payload = manager.notify.call_args_list[1].args[1]
    assert first_payload is second_payload


def test_notify_friend_change_with_empty_set_does_nothing(manager):
    friend_notification_service.notify_friend_change(set())

    manager.build_payload_safely.assert_not_called()
    manager.notify.assert_not_called()


def test_notify_friend_change_skips_delivery_if_payload_build_fails(manager):
    manager.build_payload_safely.return_value = None

    friend_notification_service.notify_friend_change({1, 2})

    manager.build_payload_safely.assert_called_once()
    manager.notify.assert_not_called()


def test_notify_friend_change_continues_after_failed_delivery(manager):
    # Independent of the iteration order: the first delivery fails.
    manager.notify.side_effect = [False, True]

    friend_notification_service.notify_friend_change({1, 2})

    assert manager.notify.call_count == 2
    manager.notify.assert_has_calls(
        [call(1, {"type": "friends_updated"}), call(2, {"type": "friends_updated"})],
        any_order=True,
    )
