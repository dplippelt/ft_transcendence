import { Physics, Scene } from "phaser";
import { AssetsKey } from "../Assets";
import MovementComponent from "../components/MovementComponent";
import KeyboardComponent, { playerOne, playerTwo, type IKeySchema } from "../components/KeyboardComponent";
import { DungeonLocation } from "../components/DungeonLocation";
import { type SpawnLocation } from "./dungeon/Dungeon";

export enum PlayerNum {
  One,
  Two,
}

export interface IPlayerConfig {
  name: string;
  keySchema: IKeySchema;
  texture: AssetsKey;
}

export const playerConfigs: Record<PlayerNum, IPlayerConfig> = {
  [PlayerNum.One]: {
    name: "player_1",
    keySchema: playerOne,
    texture: AssetsKey.Knight,
  },
  [PlayerNum.Two]: {
    name: "player_2",
    keySchema: playerTwo,
    texture: AssetsKey.Soldier,
  },
};

export default class Player extends Physics.Arcade.Sprite {
  playerInput: KeyboardComponent;
  movement: MovementComponent;
  dungeonLocation: DungeonLocation;
  inCombat: boolean;
  isAlive: boolean;

  constructor(scene: Scene, playerConfig: IPlayerConfig, spawnLocation: SpawnLocation) {
    super(scene, spawnLocation.spawnPoint.x, spawnLocation.spawnPoint.y, playerConfig.texture);

    this.name = playerConfig.name;
    this.inCombat = false;
    this.isAlive = true;
    this.playerInput = new KeyboardComponent(this, playerConfig.keySchema);
    this.movement = new MovementComponent(this, 200, this.playerInput);
    this.dungeonLocation = new DungeonLocation(this, spawnLocation.startingRoom, spawnLocation.dungeon);

    scene.add.existing(this);
    scene.physics.add.existing(this);
  }
}
