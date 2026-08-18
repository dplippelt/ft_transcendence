import uuid

from app.core.websocket_manager import ConnectionManager

from .game_session import GameSession, JoinStatus


# TODO: the payload should only be sent through the sockets that are connected to the game
# TODO: Should GameSessionManager have its own instance of ConnectionManager?
class GameSessionManager:
    def __init__(self):
        self.game_sessions: dict[int, GameSession] = {}

    def create(self, connection_manager: ConnectionManager) -> GameSession:
        session_id = uuid.uuid4()
        game_session = GameSession(session_id.int, connection_manager)

        self.game_sessions[session_id.int] = game_session
        return game_session

    def join_session(self, session_id: int, user_id: int) -> tuple[JoinStatus, GameSession | None]:
        game_session = self.game_sessions.get(session_id)
        if game_session is None:
            return (JoinStatus.GAME_NOT_FOUND, None)

        join_status = game_session.join_session(user_id)
        return (join_status, game_session)

    def remove_session(self, session_id: int) -> None:
        # TODO: run a a coroutine instead that check state or ping the session
        raise NotImplementedError("existing forever and ever and ever and ever and ever...")

    def get_session(self, session_id: int) -> GameSession | None:
        return self.game_sessions.get(session_id)


# TODO: Lifespan objects instead?
game_session_manager = GameSessionManager()
