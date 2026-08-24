import type { GameObjects, Physics } from "phaser";
import type { Dungeon } from "../gameobjects/dungeon/Dungeon";
import type { Room } from "../map/procedural";
import { Vector2, randomPoint } from "../map/math";
import Component from "./Component";

export class DungeonLocation extends Component {
  private _currentRoom: Room | undefined;
  private _dungeon: Dungeon;
  private _tilePosition: Vector2;
  private _body: Physics.Arcade.Sprite;

  constructor(gameObject: GameObjects.GameObject, room: Room, dungeon: Dungeon) {
    super(gameObject);

    this._currentRoom = room;
    this._body = gameObject as Physics.Arcade.Sprite;
    this._dungeon = dungeon;
    this._tilePosition = this._dungeon.transformPointToLocal(new Vector2(this._body.x, this._body.y)).floor();
  }

  update(): void {
    let point = new Vector2(this._body.x, this._body.y);
    point = this._dungeon.transformPointToLocal(point).floor();

    if (point.equals(this._tilePosition)) {
      return;
    }
    this._tilePosition = point;

    if (this.isWithinRoom()) {
      return;
    }
    this._currentRoom = this._dungeon.findRoom(point);
  }

  isWithinRoom(): boolean {
    return this._currentRoom !== undefined && this._currentRoom.aabb.isPointWithin(this._tilePosition);
  }

  isTargetWithinRoom(target: DungeonLocation): boolean {
    return this._currentRoom === target._currentRoom;
  }

  getRandomPositionInRoom(): Vector2 {
    if (this._currentRoom === undefined) {
      throw new Error("_currentRoom is undefined");
    }
    const point = randomPoint(
      this._currentRoom.aabb.min.clone().addXY(1, 1),
      this._currentRoom.aabb.max.clone().subXY(2, 2),
    );
    return this._dungeon.transformPointToWorld(point.addXY(0.5, 0.5));
  }
}
