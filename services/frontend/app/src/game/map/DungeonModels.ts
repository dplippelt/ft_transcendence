import { BoundingBox, random, Vector2, type Bound2D } from "./math";
import type { RoomGraph } from "./RoomGraph";

export enum Direction {
  None = 0x0,
  Top = 0x01,
  Right = 0x02,
  Down = 0x04,
  Left = 0x08,
  TopLeft = 0x10,
  TopRight = 0x20,
  DownLeft = 0x40,
  DownRight = 0x80
}

export enum Tile {
  NONE = '.'.charCodeAt(0),
  OPEN = '_'.charCodeAt(0),
  WALL = '#'.charCodeAt(0),
  CORNER = '@'.charCodeAt(0),
  DOOR = 'D'.charCodeAt(0),
  ENTER = '<'.charCodeAt(0),
  EXIT = '>'.charCodeAt(0),
  SPAWN = 'S'.charCodeAt(0),
}

export enum RoomType {
  None,
  Standard,
  Entrance,
  Exit,
}

export enum TileNodeType {
  None,
  EnterPoint,
  SpawnPoint,
  ExitPoint,
}

export interface MapData {
  map: number[][];
  doors: Door[];
  rooms: Room[];
  width: number;
  height: number;
  graph: RoomGraph;
}

export interface DungeonConfig {
  roomCount: Bound2D;
  roomWidth: Bound2D;
  roomHeight: Bound2D;
  doorCount: Bound2D;
}

export interface TileNode {
  position: Vector2;
  type: TileNodeType;
}

export interface Door {
  position: Vector2;
  direction: Direction;
}

export class Room {
  id: number;
  aabb: BoundingBox
  doors: Array<Door>
  type: RoomType;
  tileNode: TileNode | null;

  constructor(id: number, aabb: BoundingBox) {
    this.id = id;
    this.aabb = aabb;
    this.doors = [];
    this.type = RoomType.None;
    this.tileNode = null;
  }

  hasOpenSpace(): boolean {
    return this.aabb.size.x > 2 && this.aabb.size.y > 2;
  }

  static createRoom(id: number, width: Bound2D, height: Bound2D): Room {
    return new Room(id, new BoundingBox(
      new Vector2(0, 0),
      new Vector2(
        random(width.min, width.max + 1),
        random(height.min, height.max + 1))
    ));
  }
}
