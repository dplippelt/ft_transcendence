import { random, shuffle, Vector2, type Bound2D } from "./math";
import { Direction, type Door, type DungeonConfig, Room, Tile } from "./DungeonModels";
import { RoomGraph } from "./RoomGraph";

export class Map {
  map: number[][];
  width: number;
  height: number;
  rooms: Array<Room>;
  doors: Array<Door>
  roomGraph: RoomGraph;

  constructor(map: number[][], width: number, height: number, rooms: Array<Room>, doors: Array<Door>, roomGraph: RoomGraph) {
    this.map = map;
    this.width = width;
    this.height = height;
    this.rooms = rooms;
    this.doors = doors;
    this.roomGraph = roomGraph;
  }

  toString(): string {
    const strMap: string[][] = this.map.map(row => row.map(column => String.fromCharCode(column)));

    let asciiMap: string = "";
    for (const row of strMap) {
      asciiMap = asciiMap.concat(row.join("")).concat("\n");
    }
    return asciiMap;
  }
}

export class MapBuilder {
  create(config: DungeonConfig): Map {
    const [rooms, doors, graph] = this.createRoomLayout(config);
    const [min, size] = this.calculateMapBounds(rooms);
    this.normalizeToOrigin(min, rooms, doors);
    const map = this.createMap(size.x, size.y, rooms, doors);

    return new Map(map, size.x, size.y, rooms, doors, graph);
  }

  private generateRooms(config: DungeonConfig): Array<Room> {
    const roomCount = random(config.roomCount.min, config.roomCount.max + 1);
    const rooms: Array<Room> = [];
    for (let i = 0; i < roomCount; ++i) {
      rooms.push(Room.createRoom(i, config.roomWidth, config.roomHeight));
    }
    return rooms;
  }

  private randomDoorCount(remainingDoorCount: number, doorCount: Bound2D): number {
    return Math.min(remainingDoorCount, random(doorCount.min, doorCount.max + 1));
  }

  private putRoomAt(unplaced: Room, placed: Room, direction: Direction, placedRooms: Iterable<Room>): boolean {
    const placedSize = placed.aabb.size;
    const unplacedSize = unplaced.aabb.size;
    const offset = new Vector2(0, 0);

    switch (direction) {
      case Direction.Top:
        offset.y = -unplacedSize.y;
        offset.x = random(-unplacedSize.x + 3, placedSize.x - 2);
        break;
      case Direction.Right:
        offset.x = placedSize.x;
        offset.y = random(-unplacedSize.y + 3, placedSize.y - 2);
        break;
      case Direction.Down:
        offset.y = placedSize.y;
        offset.x = random(-unplacedSize.x + 3, placedSize.x - 2);
        break;
      case Direction.Left:
        offset.x = -unplacedSize.x;
        offset.y = random(-unplacedSize.y + 3, placedSize.y - 2);
        break;
      default:
        throw new Error(`Invalid Direction value ${direction} for room placement`);
    }

    unplaced.aabb.place(Vector2.add(placed.aabb.min, offset));
    for (const room of placedRooms) {
      if (unplaced.aabb.isIntOverlap(room.aabb)) {
        return false;
      }
    }
    return true;
  }

  private addDoorway(doors: Array<Door>, roomA: Room, roomB: Room, direction: Direction): void {
    const topLeft = Vector2.max(roomA.aabb.min, roomB.aabb.min);
    const bottomRight = Vector2.min(roomA.aabb.max, roomB.aabb.max);

    let x: number;
    let y: number;
    let positionA: Vector2;
    let positionB: Vector2;

    switch (direction) {
      case Direction.Top:
        x = random(topLeft.x + 1, bottomRight.x - 1);
        positionA = new Vector2(x, roomA.aabb.min.y);
        positionB = new Vector2(x, roomB.aabb.max.y - 1);
        break;
      case Direction.Right:
        y = random(topLeft.y + 1, bottomRight.y - 1);
        positionA = new Vector2(roomA.aabb.max.x - 1, y);
        positionB = new Vector2(roomB.aabb.min.x, y);
        break;
      case Direction.Down:
        x = random(topLeft.x + 1, bottomRight.x - 1);
        positionA = new Vector2(x, roomA.aabb.max.y - 1);
        positionB = new Vector2(x, roomB.aabb.min.y);
        break;
      case Direction.Left:
        y = random(topLeft.y + 1, bottomRight.y - 1);
        positionA = new Vector2(roomA.aabb.min.x, y);
        positionB = new Vector2(roomB.aabb.max.x - 1, y);
        break;
      default:
        throw new Error(`Invalid Direction value ${direction} for room placement`);
    }

    const doorA: Door = { position: positionA, direction: direction };
    const doorB: Door = { position: positionB, direction: direction };
    roomA.doors.push(doorA);
    roomB.doors.push(doorB);
    doors.push(doorA);
    doors.push(doorB);
  }

  private calculateMapBounds(rooms: Array<Room>): [Vector2, Vector2] {
    let min = new Vector2(999999, 999999);
    let max = new Vector2(-999999, -999999);

    for (const room of rooms) {
      min = Vector2.min(room.aabb.min, min);
      max = Vector2.max(room.aabb.max, max);
    }

    return [min, max.sub(min)];
  }

  private normalizeToOrigin(mapOrigin: Vector2, rooms: Array<Room>, doors: Array<Door>): void {
    const offset: Vector2 = mapOrigin.clone().flip();
    for (const room of rooms) {
      room.aabb.move(offset);
    }

    for (const door of doors) {
      door.position.add(offset);
    }
  }

  private createMap(width: number, height: number, rooms: Array<Room>, doors: Array<Door>): number[][] {
    const map: number[][] = Array.from({ length: height }, () => Array(width).fill(Tile.NONE));

    for (const room of rooms) {
      for (let y = room.aabb.min.y; y < room.aabb.max.y; ++y) {
        for (let x = room.aabb.min.x; x < room.aabb.max.x; ++x) {
          const isVertical = x == room.aabb.min.x || x == room.aabb.max.x - 1;
          const isHorizontal = y == room.aabb.min.y || y == room.aabb.max.y - 1;

          if (isVertical && isHorizontal) {
            map[y][x] = Tile.CORNER;
          } else if (isVertical || isHorizontal) {
            map[y][x] = Tile.WALL;
          } else {
            map[y][x] = Tile.OPEN;
          }
        }
      }
    }

    for (const door of doors) {
      const [x, y] = door.position.unpack();
      map[y][x] = Tile.DOOR;
    }

    return map;
  }

  private createRoomLayout(config: DungeonConfig): [Array<Room>, Array<Door>, RoomGraph] {
    const rooms = this.generateRooms(config);
    const queuedRooms: Array<Room> = [];
    const doors: Array<Door> = [];
    const directions: Array<Direction> = [Direction.Top, Direction.Right, Direction.Down, Direction.Left];
    const graph: RoomGraph = new RoomGraph();
    let roomIdx = 1;

    queuedRooms.push(rooms[0]);
    while (queuedRooms.length > 0 && roomIdx < rooms.length) {
      const placedRoom: Room = queuedRooms.shift()!;
      let doorCount = this.randomDoorCount(rooms.length - roomIdx, config.doorCount);

      shuffle(directions);
      for (let i = 0; i < directions.length; ++i) {
        if (doorCount == 0) {
          break;
        }
        const direction = directions[i % directions.length];
        if (this.putRoomAt(rooms[roomIdx], placedRoom, direction, rooms.slice(0, roomIdx))) {
          graph.addConnection(placedRoom, rooms[roomIdx]);
          this.addDoorway(doors, placedRoom, rooms[roomIdx], direction);
          queuedRooms.push(rooms[roomIdx]);
          doorCount -= 1;
          roomIdx += 1;
        }
      }
    }

    return [rooms, doors, graph];
  }
}
