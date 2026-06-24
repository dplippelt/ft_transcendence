import { Core, Math, Input, GameObjects, Scene } from "phaser";
import Component from "./Component";
import type IPlayerInput from "./IPlayerInput";

export interface IKeySchema {
  [name: string]: number;
}

export const playerOne: IKeySchema = {
  up: Input.Keyboard.KeyCodes.W,
  down: Input.Keyboard.KeyCodes.S,
  left: Input.Keyboard.KeyCodes.A,
  right: Input.Keyboard.KeyCodes.D,
  action: Input.Keyboard.KeyCodes.E,
};

export const playerTwo: IKeySchema = {
  up: Input.Keyboard.KeyCodes.UP,
  down: Input.Keyboard.KeyCodes.DOWN,
  left: Input.Keyboard.KeyCodes.LEFT,
  right: Input.Keyboard.KeyCodes.RIGHT,
  action: Input.Keyboard.KeyCodes.K,
};

interface KeyBindings {
  up: Input.Keyboard.Key;
  down: Input.Keyboard.Key;
  left: Input.Keyboard.Key;
  right: Input.Keyboard.Key;
  action: Input.Keyboard.Key;
}

const blockedKeyCodes: number[] = [
  Input.Keyboard.KeyCodes.ALT,
  Input.Keyboard.KeyCodes.BACKSPACE,
  Input.Keyboard.KeyCodes.CTRL,
  Input.Keyboard.KeyCodes.TAB,
  91, 92, 93// Windows/Meta keys
];

export default class KeyboardComponent
  extends Component
  implements IPlayerInput
{
  private keyBindings: KeyBindings;
  private direction: Math.Vector2;
  private interact: boolean;
  private scene: Scene;
  private blockedKeys: Input.Keyboard.Key[] = [];

  constructor(gameObject: GameObjects.GameObject, keySchema: IKeySchema) {
    super(gameObject);

    this.scene = gameObject.scene;
    this.keyBindings = this.scene.input.keyboard?.addKeys(
      keySchema,
    ) as KeyBindings;
    this.direction = new Math.Vector2(0, 0);
    this.interact = false;
    this.scene.game.events.on(Core.Events.BLUR, this.resetKeys, this);

    // Note: This is affects all scenes
    this.scene.input.keyboard?.enableGlobalCapture();
    this.initBlockedKeys();
  }

  initBlockedKeys() {
    for (const key of blockedKeyCodes) {
      this.blockedKeys.push(
        this.scene.input.keyboard?.addKey(key, true) as Input.Keyboard.Key,
      );
    }
  }

  isBlockedKeyActive(key: Input.Keyboard.Key) {
    return Input.Keyboard.JustUp(key) || key.isDown;
  }

  resetKeys() {
    for (const key in this.keyBindings) {
      this.keyBindings[key as keyof KeyBindings].reset();
    }

    this.direction.set(0, 0);
    this.interact = false;
  }

  getInputDirection(): Math.Vector2 {
    return this.direction;
  }

  getInteraction(): boolean {
    return this.interact;
  }

  update() {
    if (this.keyBindings.up.isDown) {
      this.direction.y = -1;
    } else if (this.keyBindings.down.isDown) {
      this.direction.y = 1;
    } else {
      this.direction.y = 0;
    }

    if (this.keyBindings.left.isDown) {
      this.direction.x = -1;
    } else if (this.keyBindings.right.isDown) {
      this.direction.x = 1;
    } else {
      this.direction.x = 0;
    }

    this.interact = Input.Keyboard.JustDown(this.keyBindings.action);

    if (this.blockedKeys.some(this.isBlockedKeyActive)) {
      this.resetKeys();
    }
  }

  destroy(): void {
    this.scene.game.events.off(Core.Events.BLUR, this.resetKeys, this);
    this.scene.input.keyboard?.disableGlobalCapture();
  }
}
