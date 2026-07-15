import { Physics, Scene } from "phaser";
import { AssetsKey } from "../Assets";
import MovementComponent from "../components/MovementComponent";
import KeyboardComponent, {
  type IKeySchema,
} from "../components/KeyboardComponent";
import { DungeonLocation } from "../components/DungeonLocation";
import type { Dungeon } from "./Dungeon";
import type { Room } from "../map/procedural";

export default class Player extends Physics.Arcade.Sprite {
  playerInput: KeyboardComponent;
  movement: MovementComponent;
  dungeonLocation: DungeonLocation; // TODO: Initialize this...

  constructor(scene: Scene, x: number, y: number, keySchema: IKeySchema, room: Room, dungeon: Dungeon) {
    super(scene, x, y, AssetsKey.Player);

    this.name = "player";
    this.playerInput = new KeyboardComponent(this, keySchema);
    this.movement = new MovementComponent(this, 200, this.playerInput);
    this.dungeonLocation = new DungeonLocation(this, room, dungeon);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // DEBUG
    this.setCircle(8);
    this.setDebug(true, true, 0x00ff00);
    this.setDepth(50);
  }
}
