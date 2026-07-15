import type { GameObjects, Physics, Scene } from "phaser";
import type { Dungeon } from "../gameobjects/Dungeon";
import type { Room } from "../map/procedural";
import { Vector2, randomPoint } from "../map/math";
import Component from "./Component";

class LocaterDebugger {
  highlight: GameObjects.Rectangle; // room marker
  cursor: GameObjects.Rectangle; // tile marker
  isDestroyed: boolean;

  constructor(scene: Scene) {
    this.highlight = scene.add.rectangle(0, 0, 10, 10);
    this.highlight.setOrigin(0, 0);
    this.highlight.setStrokeStyle(4, 0x00FF00);
    this.highlight.setFillStyle();

    this.cursor = scene.add.rectangle(0, 0, 24, 24, 0xFF0000, 85);
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
    point = dungeon.transformPointToWorld(point.addXY(.5, .5));
    this.cursor.setPosition(point.x, point.y);
  }

  drawRoom(room: Room | undefined, dungeon: Dungeon) {
    if (room === undefined || this.isDestroyed) {
      return;
    }

    const min = dungeon.transformPointToWorld(room.aabb.min);
    const max = dungeon.transformPointToWorld(room.aabb.max);
    this.highlight.setPosition(min.x, min.y);
    this.highlight.setSize((max.x - min.x), (max.y - min.y));
  }
}

export class DungeonLocation extends Component {
  private _currentRoom: Room | undefined;
  private _dungeon: Dungeon;
  private _tilePosition: Vector2;
  private _body: Physics.Arcade.Sprite;

  private debug?: LocaterDebugger;

  constructor(gameObject: GameObjects.GameObject, room: Room, dungeon: Dungeon) {
    super(gameObject);

    this._currentRoom = room;
    this._body = gameObject as Physics.Arcade.Sprite;
    this._dungeon = dungeon;
    this._tilePosition = this._dungeon.transformPointToLocal(new Vector2(this._body.x, this._body.y)).floor();

    if (gameObject.name === "player") {
      this.debug = new LocaterDebugger(gameObject.scene);
    }
  }

  update(): void {
    let point = new Vector2(this._body.x, this._body.y);
    point = this._dungeon.transformPointToLocal(point).floor();

    if (point.equals(this._tilePosition)) {
      return;
    }
    this._tilePosition = point;
    this.debug?.drawCursor(point, this._dungeon);

    if (this.isWithinRoom()) {
      return;
    }
    this._currentRoom = this._dungeon.findRoom(point);
    this.debug?.drawRoom(this._currentRoom, this._dungeon);
  }

  destroy(): void {
    this.debug?.destroy();
  }

  isWithinRoom(): boolean {
    return this._currentRoom !== undefined && this._currentRoom.aabb.isPointWithin(this._tilePosition);
  }

  isTargetWithinRoom(target: DungeonLocation): boolean {
    return this._currentRoom === target._currentRoom;
  }

  // TODO: Possible shell required of the entity | floor the point
  getRandomPositionInRoom(): Vector2 {
    if (this._currentRoom === undefined) {
      throw new Error("_currentRoom is undefined");
    }
    const point = randomPoint(this._currentRoom.aabb.min.clone().addXY(1, 1), this._currentRoom.aabb.max.clone().subXY(2, 2));
    return this._dungeon.transformPointToWorld(point.addXY(.5, .5));
  }

  // path find towards goal?
}
