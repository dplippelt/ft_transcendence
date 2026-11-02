import Component from "./Component";
import type IPlayerInput from "./IPlayerInput";
import { GameObjects, Physics } from "phaser";
import { Math as PhaserMath } from "phaser";

type TetherTarget = () => PhaserMath.Vector2 | null;

export default class MovementComponent extends Component {
  input: IPlayerInput;
  movementSpeed: number;
  private _tetherTarget?: TetherTarget;

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
    const sprite = this.gameObject as Physics.Arcade.Sprite;
    const worldView = sprite.scene.cameras.main.worldView;
    const maxVerticalDistance = worldView.height;
    const maxHorizontalDistance = worldView.width;
    const movement = this.input.getInputDirection().scale(this.movementSpeed);

    if ( this._tetherTarget && maxVerticalDistance !== undefined ) {
      const target = this._tetherTarget();

      if ( target ) {
        const deltaX = target.x - sprite.x;
        const deltaY = target.y - sprite.y;
        const isMovingAwayY = movement.y * deltaY < 0;
        const isMovingAwayX = movement.x * deltaX < 0;

        if ( isMovingAwayX && Math.abs(deltaX) >= maxHorizontalDistance )
          movement.x = 0;
        if ( isMovingAwayY && Math.abs(deltaY) >= maxVerticalDistance )
          movement.y = 0;
      }
    }

    sprite.setVelocity(movement.x, movement.y);
  }

  setTetherTarget(target: TetherTarget | undefined): void {
    this._tetherTarget = target;
  }
}
