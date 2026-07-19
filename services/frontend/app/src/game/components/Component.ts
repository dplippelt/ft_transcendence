import { GameObjects, Scenes } from "phaser";

export default abstract class Component {
  gameObject: GameObjects.GameObject;

  constructor(gameObject: GameObjects.GameObject) {
    this.gameObject = gameObject;

    if (this.update) {
      gameObject.scene.events.on(Scenes.Events.UPDATE, this.preUpdate, this);
    }
    gameObject.on(GameObjects.Events.DESTROY, this.destroy, this);
  }

  private preUpdate(time: number, delta: number) {
    if (this.gameObject.isDestroyed || !this.gameObject.active) {
      return;
    }
    this.update!(time, delta);
  }

  update?(time: number, delta: number): void;

  destroy() {
    if (this.update) {
      this.gameObject.scene.events.off(Scenes.Events.UPDATE, this.update, this);
    }
  }
}
