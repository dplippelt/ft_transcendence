import { Physics, Scene } from "phaser";
import { AssetsKey } from "../Assets";
import MovementComponent from "../components/MovementComponent";
import KeyboardComponent, { type IKeySchema } from "../components/KeyboardComponent";
import { DungeonLocation } from "../components/DungeonLocation";
import { type SpawnLocation } from "./Dungeon";

export default class Player extends Physics.Arcade.Sprite {
  playerInput: KeyboardComponent;
  movement: MovementComponent;
  dungeonLocation: DungeonLocation;
  inCombat: boolean;
  isAlive: boolean;

  constructor(scene: Scene, keySchema: IKeySchema, spawnLocation: SpawnLocation) {
    super(scene, spawnLocation.spawnPoint.x, spawnLocation.spawnPoint.y, AssetsKey.Player);

    this.name = "player";
    this.inCombat = false;
    this.isAlive = true;
    this.playerInput = new KeyboardComponent(this, keySchema);
    this.movement = new MovementComponent(this, 200, this.playerInput);
    this.dungeonLocation = new DungeonLocation(this, spawnLocation.startingRoom, spawnLocation.dungeon);

    scene.add.existing(this);
    scene.physics.add.existing(this);
  }
}
