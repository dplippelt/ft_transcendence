import Phaser from "phaser";
import type { Scene } from "phaser";
import type CombatPlayer from "./CombatPlayer";
import type CombatEnemy from "./CombatEnemy";
import type { ICardView } from "./cards/ICardView";
import type CombatTurnManager from "./CombatTurnManager";
import type CombatExecuteManager from "./CombatExecuteManager";

export interface ICombatView {
    readonly scene: Scene;
    readonly player: CombatPlayer;
    readonly enemy: CombatEnemy;
    readonly cardManager: ICardView;
    readonly events: Phaser.Events.EventEmitter;
    readonly turnManager?: CombatTurnManager;
    readonly executeManager?: CombatExecuteManager;
}