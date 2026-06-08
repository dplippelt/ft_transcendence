import Component from "./Component";
import type IPlayerInput from "./IPlayerInput";
import { GameObjects, Physics } from "phaser";

export default class MovementComponent extends Component {
  input: IPlayerInput;
  movementSpeed: number;

  constructor(
    gameObject: GameObjects.GameObject,
    movementSpeed: number,
    input: IPlayerInput,
  ) {
    super(gameObject);

    this.movementSpeed = movementSpeed;
    this.input = input;
  }

  update(): void {
    const movement = this.input.getInputDirection().scale(this.movementSpeed);
    (this.gameObject as Physics.Arcade.Sprite).setVelocity(
      movement.x,
      movement.y,
    );
  }
}
