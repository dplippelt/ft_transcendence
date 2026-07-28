import Component from "../Component";
import { GameObjects } from "phaser";
import { type Room } from "../../map/procedural";
import { Dungeon } from "../../gameobjects/Dungeon";
import { Vector2 } from "../../map/math";

/// Debugger for the DungeonLocation class and
/// requires drawCursor and drawRoom to be called within the DungeonLocation.update call
export class LocaterDebugger extends Component {
  highlight: GameObjects.Rectangle; // room marker
  cursor: GameObjects.Rectangle; // tile marker
  isDestroyed: boolean;

  constructor(gameObject: GameObjects.GameObject) {
    super(gameObject);
    this.highlight = gameObject.scene.add.rectangle(0, 0, 10, 10);
    this.highlight.setOrigin(0, 0);
    this.highlight.setStrokeStyle(4, 0x00ff00);
    this.highlight.setFillStyle();

    this.cursor = gameObject.scene.add.rectangle(0, 0, 24, 24, 0xff0000, 85);
    this.isDestroyed = false;
  }

  destroy() {
    this.highlight.destroy();
    this.cursor.destroy();
    this.isDestroyed = true;
  }

  drawCursor(point: Vector2, dungeon: Dungeon) {
    if (this.isDestroyed) {
      return;
    }
    point = dungeon.transformPointToWorld(point.addXY(0.5, 0.5));
    this.cursor.setPosition(point.x, point.y);
  }

  drawRoom(room: Room | undefined, dungeon: Dungeon) {
    if (room === undefined || this.isDestroyed) {
      return;
    }

    const min = dungeon.transformPointToWorld(room.aabb.min);
    const max = dungeon.transformPointToWorld(room.aabb.max);
    this.highlight.setPosition(min.x, min.y);
    this.highlight.setSize(max.x - min.x, max.y - min.y);
  }
}
