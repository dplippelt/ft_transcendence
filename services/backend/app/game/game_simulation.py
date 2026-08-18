from app.schemas.game import GameSnapshot, GameState


class GameSimulation:
    # dungeonMap
    # players
    # enemies
    # player lives
    # player position
    # enemy positions
    #
    # arePlayesAlive
    # areEnemiesDefeated

    def __init__(self):
        self.game_state = GameState.PAUSED

    def tick(self, deltaTime: float) -> None:
        pass

    def update_players(self) -> None:
        pass

    def update_enemies(self) -> None:
        pass

    def connect_player(self, user_id: int):
        pass

    def disconnect_player(self, user_id: int) -> None:
        pass

    def get_snapshot(self) -> GameSnapshot:
        pass
