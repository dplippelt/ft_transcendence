from dataclasses import dataclass

from app.schemas.combat import CombatPhase


@dataclass
class TurnConfig:
    player_turn_ticks: int
    enemy_turn_ticks: int


class TurnManager:
    def __init__(self, config: TurnConfig) -> None:
        self._config = config
        self.phase: CombatPhase | None = None
        self.turn_ends_at_tick: int | None = None

    def is_player_turn(self) -> bool:
        return self.phase is CombatPhase.PLAYER_TURN

    def start_player_turn(self, tick: int) -> None:
        self.phase = CombatPhase.PLAYER_TURN
        self.turn_ends_at_tick = tick + self._config.player_turn_ticks

    def start_enemy_turn(self, tick: int) -> None:
        self.phase = CombatPhase.ENEMY_TURN
        self.turn_ends_at_tick = tick + self._config.enemy_turn_ticks

    def end(self) -> None:
        self.phase = CombatPhase.OVER
        self.turn_ends_at_tick = None

    def update(self, tick: int) -> CombatPhase | None:
        if self.turn_ends_at_tick is None or tick < self.turn_ends_at_tick:
            return None
        return self.phase
