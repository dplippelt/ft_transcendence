import asyncio
from unittest.mock import AsyncMock, call

from sqlalchemy.orm import sessionmaker

from app.api.v1 import friends as friends_api
from app.core.websocket_manager import ConnectionManager
from app.models.friendship import Friendship
from app.services import presence_service


class FakeWebSocket:
    def __init__(self):
        self.accepted = False

    async def accept(self):
        self.accepted = True


def test_presence_stays_online_while_another_tab_is_connected():
    manager = ConnectionManager()
    first = FakeWebSocket()
    second = FakeWebSocket()

    assert manager.is_online(42) is False

    asyncio.run(manager.connect(42, first))
    asyncio.run(manager.connect(42, second))
    assert first.accepted and second.accepted
    assert manager.is_online(42) is True

    manager.disconnect(42, first)
    assert manager.is_online(42) is True

    manager.disconnect(42, second)
    assert manager.is_online(42) is False


def test_friends_api_exposes_only_connected_friends(db, make_user, monkeypatch):
    user = make_user()
    friend = make_user()
    unrelated = make_user()
    pair = sorted([user.id, friend.id])

    db.add(Friendship(user_a_id=pair[0], user_b_id=pair[1]))
    db.commit()

    manager = ConnectionManager()
    monkeypatch.setattr(friends_api, "connection_manager", manager)
    manager.active_connections[friend.id] = [FakeWebSocket()]
    manager.active_connections[unrelated.id] = [FakeWebSocket()]

    response = friends_api.get_friends(current_user=user, db=db)
    assert len(response.friends) == 1
    assert response.friends[0].friend.id == friend.id
    assert response.friends[0].is_online is True

    manager.active_connections.pop(friend.id)
    response = friends_api.get_friends(current_user=user, db=db)
    assert response.friends[0].is_online is False


def test_presence_notifies_only_on_first_connection_and_last_disconnect():
    async def exercise():
        notify = AsyncMock()
        manager = ConnectionManager(on_presence_changed=notify)
        first = FakeWebSocket()
        second = FakeWebSocket()

        await manager.connect(42, first)
        await manager.connect(42, second)
        manager.disconnect(42, first)
        await asyncio.sleep(0)

        assert manager.is_online(42) is True
        notify.assert_awaited_once_with(manager, 42)

        manager.disconnect(42, second)
        manager.disconnect(42, second)  # Duplicate cleanup must be a no-op.
        await asyncio.sleep(0)

        assert manager.is_online(42) is False
        assert notify.await_args_list == [call(manager, 42), call(manager, 42)]

    asyncio.run(exercise())


def test_failed_socket_send_notifies_when_last_connection_is_removed():
    async def exercise():
        notify = AsyncMock()
        manager = ConnectionManager(on_presence_changed=notify)
        socket = FakeWebSocket()
        socket.send_json = AsyncMock(side_effect=RuntimeError("Socket closed"))
        socket.close = AsyncMock()

        await manager.connect(42, socket)
        await asyncio.sleep(0)
        notify.reset_mock()

        assert await manager.send_to_user(42, {"type": "test"}) is False
        await asyncio.sleep(0)

        assert manager.is_online(42) is False
        notify.assert_awaited_once_with(manager, 42)
        socket.close.assert_awaited_once()

        manager.disconnect(42, socket)
        await asyncio.sleep(0)
        notify.assert_awaited_once_with(manager, 42)

    asyncio.run(exercise())


def test_presence_notification_only_targets_accepted_friends(db, make_user, monkeypatch):
    lower_id_friend = make_user()
    user = make_user()
    higher_id_friend = make_user()
    unrelated = make_user()

    db.add_all([
        Friendship(user_a_id=lower_id_friend.id, user_b_id=user.id),
        Friendship(user_a_id=user.id, user_b_id=higher_id_friend.id),
    ])
    db.commit()

    monkeypatch.setattr(presence_service, "SessionLocal", sessionmaker(bind=db.get_bind()))
    manager = ConnectionManager()
    manager.send_to_user = AsyncMock(return_value=True)

    asyncio.run(presence_service.notify_friend_presence_change(manager, user.id))

    payload = {"type": "friend_presence_changed"}
    assert manager.send_to_user.await_count == 2
    manager.send_to_user.assert_has_awaits(
        [call(lower_id_friend.id, payload), call(higher_id_friend.id, payload)],
        any_order=True,
    )
    assert all(args.args[0] != unrelated.id for args in manager.send_to_user.await_args_list)
