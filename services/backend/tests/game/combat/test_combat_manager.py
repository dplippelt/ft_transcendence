from app.game.combat.card import Operator
from app.game.combat.combat_manager import CombatManager, EnemyLevel

DEFAULT_OPERATORS = [Operator.PLUS, Operator.MINUS, Operator.MULTIPLY, Operator.DIVIDE, Operator.MODULO]

# def make_combat(player=DUMMY_PLAYER, enemy=EnemyLevel.NORMAL, operator=DEFAULT_OPERATORS) -> CombatManager:
#     combat = CombatManager(player_status=player, enemy_data=enemy, operators=DEFAULT_OPERATORS)
#     return combat
