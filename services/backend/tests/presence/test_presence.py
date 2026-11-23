import asyncio

from app.api.v1 import friends as friends_api
from app.core.websocket_manager import ConnectionManager
from app.models.friendship import Friendship


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
