import random

import pytest

from app.game.combat import executor
from app.game.combat.card import Operator
from app.game.combat.combat_manager import CombatConfig, CombatManager, EnemyLevel
from app.schemas.combat import (
    CombatAction,
    CombatEnemyStatus,
    CombatEventType,
    CombatPhase,
    CombatPlayerStatus,
    CombatResult,
    CombatState,
    RejectReason,
)

START = 100
CONFIG = CombatConfig()
OPERATORS = list(Operator)
NORMAL = EnemyLevel.NORMAL.value


@pytest.fixture(autouse=True)
def fixed_seed():
    random.seed(0)

def make_combat(
        hp: int = 10,
        mp: int = 5,
        enemy: CombatEnemyStatus = NORMAL,
        config: CombatConfig = CONFIG,
) -> CombatManager:
    combat = CombatManager(
        combat_id="c1",
        player_id=7,
        enemy_id=3,
        player=CombatPlayerStatus(hp=hp, max_hp=hp, mp=mp),
        enemy=enemy,
        operators=OPERATORS,
        config=config,
    )
    combat.start(START)
    return combat


# ------------------------------------------------------------ start
# A combat starts with the player's turn and a full, playable hand.

def test_start_deals_a_full_playable_hand():
    combat = make_combat()
    state = combat.get_state()
    assert state.phase is CombatPhase.PLAYER_TURN
    assert state.turn_ends_at_tick == START + CONFIG.player_turn_ticks
    assert state.result is None
    assert len(state.hand) == CONFIG.hand_size
    assert state.target_numbers[0] is not None
    assert event_types(combat) == [CombatEventType.TURN_STARTED, CombatEventType.HAND_DEALT]

def test_start_twice_is_an_error():
    combat = make_combat()
    with pytest.raises(RuntimeError):
        combat.start(START)

def test_state_before_start_is_an_error():
    combat = CombatManager(
        combat_id="c1",
        player_id=7,
        enemy_id=3,
        player=CombatPlayerStatus(hp=10, max_hp=10, mp=5),
        enemy=NORMAL,
        operators=OPERATORS,
    )
    assert not combat.is_started()
    with pytest.raises(RuntimeError):
        combat.get_state()


# ------------------------------------------------------------ time-driven
# Turns change when their time runs out (update(tick)).

def test_nothing_happens_before_the_deadline():
    combat = make_combat()
    before = combat.get_state()

    combat.update(turn_end(combat) - 1)
    assert combat.get_state() == before

def test_player_turn_timeout_lets_the_enemy_attack():
    combat = make_combat()
    combat.update(turn_end(combat))

    state = combat.get_state()
    assert state.phase is CombatPhase.ENEMY_TURN
    assert state.player.hp == 10 - NORMAL.attack_damage
    assert event_types(combat)[-2:] == [CombatEventType.TURN_STARTED, CombatEventType.ENEMY_ATTACK]

def test_enemy_turn_ends_with_a_new_player_turn_and_hand():
    combat = make_combat()
    first_hand = hand_ids(combat)
    combat.update(turn_end(combat))

    enemy_turn_end = turn_end(combat)
    assert enemy_turn_end == START + CONFIG.player_turn_ticks + CONFIG.enemy_turn_ticks

    combat.update(enemy_turn_end)
    state = combat.get_state()
    assert state.phase is CombatPhase.PLAYER_TURN
    assert state.turn_ends_at_tick == enemy_turn_end + CONFIG.player_turn_ticks
    assert set(hand_ids(combat)).isdisjoint(first_hand)
    assert event_types(combat)[-2:] == [CombatEventType.TURN_STARTED, CombatEventType.HAND_DEALT]


# ------------------------------------------------------------ playing cards
# What happens when the player plays a formula.

@pytest.mark.parametrize("seed", range(10))
def test_hit_damages_the_enemy_and_the_player_guards(seed):
    random.seed(seed)
    combat = make_combat()

    card_ids = find_formula(combat, hit=True)
    assert card_ids is not None
    tick = START + 1
    assert combat.play_cards(card_ids, tick)

    state = combat.get_state()
    assert event_types(combat)[-3:] == [
        CombatEventType.PLAYER_ATTACK,
        CombatEventType.TURN_STARTED,
        CombatEventType.PLAYER_GUARD,
    ]

    attack = state.events[-3]
    damage = executor.DAMAGE_TO_ENEMY[attack.combo]
    assert attack.enemy.hp == NORMAL.hp - damage
    assert state.enemy.hp == attack.enemy.hp
    assert state.phase is CombatPhase.ENEMY_TURN
    assert state.turn_ends_at_tick == tick + CONFIG.enemy_turn_ticks

def test_miss_has_no_penalty():
    combat = make_combat()
    hand_before = hand_ids(combat)

    card_ids = find_formula(combat, hit=False)
    assert card_ids is not None
    tick = START + 1
    assert not combat.play_cards(card_ids, tick)

    state = combat.get_state()
    assert event_types(combat)[-1] == CombatEventType.PLAY_MISSED
    assert state.enemy.hp == NORMAL.hp
    assert state.player.hp == 10
    assert hand_ids(combat) == hand_before

def test_killing_the_enemy_wins_without_an_enemy_turn():
    combat = make_combat(enemy=CombatEnemyStatus(hp=1, max_hp=1, attack_damage=4))
    card_ids = find_formula(combat, hit=True)
    assert card_ids is not None
    tick = START + 1
    assert combat.play_cards(card_ids, tick)

    state = combat.get_state()
    assert state.phase is CombatPhase.OVER
    assert state.result is CombatResult.WIN
    assert state.turn_ends_at_tick is None
    assert event_types(combat)[-2:] == [CombatEventType.PLAYER_ATTACK, CombatEventType.COMBAT_END]

def test_dying_to_the_enemy_is_a_loss():
    combat = make_combat(hp=3)
    combat.update(turn_end(combat))

    state = combat.get_state()
    assert state.phase is CombatPhase.OVER
    assert state.result is CombatResult.LOSE
    assert state.player.hp == 0
    assert event_types(combat)[-2:] == [CombatEventType.ENEMY_ATTACK, CombatEventType.COMBAT_END]

def test_finished_combat_ignores_time_and_actions():
    combat = make_combat(enemy=CombatEnemyStatus(hp=1, max_hp=1, attack_damage=4))
    card_ids = find_formula(combat, hit=True)
    assert card_ids is not None
    tick = START + 1
    assert combat.play_cards(card_ids, tick)

    events_after_end = len(combat.get_state().events)
    combat.update(START + 10_000)
    assert len(combat.get_state().events) == events_after_end
    assert not combat.redraw(START + 10_001)

    last_event = combat.get_state().events[-1]
    assert last_event.type is CombatEventType.ACTION_REJECTED
    assert last_event.reason is RejectReason.NOT_PLAYER_TURN
    assert combat.get_state().phase is CombatPhase.OVER


# ------------------------------------------------------------ rejected actions
# Invalid actions are rejected and recorded with a reason.

def test_playing_during_the_enemy_turn_is_rejected():
    combat = make_combat()

    combat.update(turn_end(combat))
    assert not combat.play_cards(hand_ids(combat)[:3], turn_end(combat) - 1)

    last_event = combat.get_state().events[-1]
    assert last_event.type is CombatEventType.ACTION_REJECTED
    assert last_event.action is CombatAction.PLAY_CARDS
    assert last_event.reason is RejectReason.NOT_PLAYER_TURN

def test_unknown_card_is_rejected():
    combat = make_combat()
    first, second = hand_ids(combat)[:2]
    tick = START + 1
    assert not combat.play_cards([first, second, "not-a-card"], tick)

    last_event = combat.get_state().events[-1]
    assert last_event.type is CombatEventType.ACTION_REJECTED
    assert last_event.reason is RejectReason.UNKNOWN_CARD

def test_duplicate_card_is_rejected():
    combat = make_combat()
    card_id = hand_ids(combat)[0]
    tick = START + 1
    assert not combat.play_cards([card_id, card_id, card_id], tick)

    last_event = combat.get_state().events[-1]
    assert last_event.type == CombatEventType.ACTION_REJECTED
    assert last_event.reason is RejectReason.DUPLICATE_CARD

def test_malformed_selection_is_rejected():
    combat = make_combat()
    numbers = [card.id for card in combat.get_state().hand if isinstance(card.value, int)]
    tick = START + 1
    assert not combat.play_cards(numbers[:3], tick)

    last_event = combat.get_state().events[-1]
    assert last_event.type is CombatEventType.ACTION_REJECTED
    assert last_event.reason is RejectReason.INVALID_SELECTION
    assert combat.get_state().phase is CombatPhase.PLAYER_TURN


# ------------------------------------------------------------ redraw
# Redrawing replaces the hand and costs MP.

def test_redraw_costs_mp_and_replaces_the_hand():
    combat = make_combat(mp=2)
    first_hand = hand_ids(combat)
    tick = START + 1
    assert combat.redraw(tick)

    state = combat.get_state()
    assert state.player.mp == 2 - CONFIG.redraw_cost
    assert set(hand_ids(combat)).isdisjoint(first_hand)
    last_event = state.events[-1]
    assert last_event.type is CombatEventType.HAND_DEALT
    assert state.turn_ends_at_tick == START + CONFIG.player_turn_ticks

def test_redraw_without_mp_is_rejected():
    combat = make_combat(mp=0)
    hand_before = hand_ids(combat)
    tick = START + 1
    assert not combat.redraw(tick)

    last_event = combat.get_state().events[-1]
    assert last_event.type is CombatEventType.ACTION_REJECTED
    assert last_event.action is CombatAction.REDRAW
    assert last_event.reason is RejectReason.NOT_ENOUGH_MP
    assert hand_ids(combat) == hand_before


# ------------------------------------------------------------ copies / templates
# The combat never changes data it was given or has returned.

def test_returned_state_does_not_change_afterwards():
    combat = make_combat()
    state = combat.get_state()

    combat.update(turn_end(combat))
    assert state.player.hp == 10
    assert combat.get_state().player.hp == 10 - NORMAL.attack_damage

def test_templates_are_not_modified():
    player = CombatPlayerStatus(hp=10, max_hp=10, mp=5)
    combat = CombatManager("c1", 7, 3, player, EnemyLevel.EASY.value, OPERATORS)
    combat.start(START)
    card_ids = find_formula(combat, hit=True)
    assert card_ids is not None
    tick = START + 1
    assert combat.play_cards(card_ids, tick)

    combat.update(turn_end(combat)) # enemy turn ends
    combat.update(turn_end(combat)) # timeout -> the enemy attacks the player
    assert player.hp == 10
    assert player.mp == 5
    assert EnemyLevel.EASY.value.hp == 5


# ------------------------------------------------------------ events / wire format
# Events and the state can be sent to the client.

def test_event_seq_is_increasing_and_the_log_is_bounded():
    combat = make_combat(mp=100, config=CombatConfig(max_events=5))
    for tick in range(START + 1, START + 20):
        combat.redraw(tick)
    seqs = [event.seq for event in combat.get_state().events]
    assert len(seqs) == 5
    assert seqs == sorted(seqs)
    assert len(set(seqs)) == 5
    assert seqs[0] > 1

def test_state_round_trips_through_json():
    combat = make_combat()
    card_ids = find_formula(combat, hit=True)
    assert card_ids is not None
    tick = START + 1
    assert combat.play_cards(card_ids, tick)

    state = combat.get_state()
    restored = CombatState.model_validate_json(state.model_dump_json())
    assert restored == state
    assert [event.type for event in restored.events] == event_types(combat)

def event_types(combat: CombatManager) -> list[CombatEventType]:
    return [event.type for event in combat.get_state().events]

def turn_end(combat: CombatManager) -> int:
    tick = combat.get_state().turn_ends_at_tick
    assert tick is not None
    return tick

def hand_ids(combat: CombatManager) -> list[str]:
    return [card.id for card in combat.get_state().hand]

def find_formula(combat: CombatManager, hit: bool) -> list[str] | None:
    hand = combat._hand.get_cards()
    for num_operators in (1, 2, 3):
        target = combat.target_numbers[num_operators - 1]
        for cards in executor.formulas(hand, num_operators):
            result = executor.evaluate(cards)
            if result is not None and (result == target) == hit:
                return [card.id for card in cards]
    return None
