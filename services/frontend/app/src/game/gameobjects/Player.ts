import { Physics, Scene } from "phaser";
import { AssetsKey } from "../Assets";
import MovementComponent from "../components/MovementComponent";
import KeyboardComponent, {
  type IKeySchema,
} from "../components/KeyboardComponent";

export default class Player extends Physics.Arcade.Sprite {
  playerInput: KeyboardComponent;
  movement: MovementComponent;

  constructor(scene: Scene, x: number, y: number, keySchema: IKeySchema) {
    super(scene, x, y, AssetsKey.Player);

    this.playerInput = new KeyboardComponent(this, keySchema);
    this.movement = new MovementComponent(this, 200, this.playerInput);
    this.name = "player";
  }
}
