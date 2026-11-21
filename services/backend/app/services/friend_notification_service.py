from app.core.websocket_manager import connection_manager


def notify_friend_change(user_ids: set[int]) -> None:
    if not user_ids:
        return
    payload = connection_manager.build_payload_safely("friends_updated", dict)

    if payload is None:
        return
    for user_id in user_ids:
        connection_manager.notify(user_id, payload)
