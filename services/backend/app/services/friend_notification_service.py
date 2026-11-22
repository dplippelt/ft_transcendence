from app.core.websocket_manager import connection_manager


def notify_friend_change(user_ids: set[int]) -> None:
    for user_id in user_ids:
        connection_manager.notify_safely(
            user_id,
            "friends_updated",
            dict,
        )
