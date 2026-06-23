import { Vector2, BoundingBox, random, shuffle } from "./math";

enum TileType {
  Closed,
  Hallway,
  Entrance,
  Exit,
  Treasure,
  Puzzle,
  Empty,
}

enum Direction {
  Top,
  Right,
  Down,
  Left
}

interface Door {
  position: Vector2;
  to: Room;
}

class Room {
  aabb: BoundingBox;
  doorways: Vector2[];
  roomType: TileType;
}

class RoomConfig {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minDoorCount: number;
  maxDoorCount: number;
}

class PuzzleConfig {
  amountOfPuzzles: number;
  maxPuzzlePerRoom: number; // cannot exceed amount of puzzles
  artifactsInTreasure: number; // One artifact per treasure chest
  artifactsDroppedByEnemies: number; // One artifact per enemy
}

class DungeonConfig {
  puzzleConfig: PuzzleConfig;
  puzzleRoom: RoomConfig;
  treasureRoom: RoomConfig;
  emptyRoom: RoomConfig;
  entranceRoom: RoomConfig;
  exitRoom: RoomConfig;
}

class Map {
  map: number[][];
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = Math.floor(width);
    this.height = Math.floor(height);
    this.map = Array.from({ length: this.height }, () =>
      Array(this.width).fill(0),
    );
  }

  isBounded(pos: Vector2): boolean {
    return !(
      pos.x < 0 ||
      pos.y < 0 ||
      pos.x > this.width ||
      pos.y > this.height
    ); // TODO: Dangerzone!
  }

  insertTile(pos: Vector2, tile: TileType): void {
    if (!this.isBounded(pos)) {
      return;
    }
    this.map[pos.y][pos.x] = tile;
  }

  insertTiles(min: Vector2, max: Vector2, tile: TileType): boolean {
    if (!this.isBounded(min) || !this.isBounded(max)) {
      return false;
    }

    for (let y = min.y; y < max.y; ++y) {
      for (let x = min.x; x < max.x; ++x) {
        this.map[y][x] = tile;
      }
    }
    return true;
  }

  print(): void {
    const alphanum: string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (const row of this.map) {
      for (const column of row) {
        if (column === 0) {
          process.stdout.write(`${alphanum[column]}`);
        } else {
          process.stdout.write(`\x1b[1;44m${alphanum[column]}\x1b[0m`);
        }
      }
      process.stdout.write("\n");
    }
  }
}

/*
  Rooms are always connected
  Exit must be minimum of x rooms aways from entrance
  Puzzle must be minimum of y rooms away from entrance
  !Puzzle must be minimum of z rooms away from another puzzle room

  Distance from entrance
  1. Generate Entrance, Exit, Puzzle Rooms
  2. Generate Mob Rooms and Treasure Rooms
  3. Queue entrance
  4. While unconnected Rooms
  5. Put newly connected Rooms in Queue
  6. Back to point 4

  1. Generate n rooms
  2. Randomly select room as starting
  3.

*/

function translateRoom(room: Room, offset: Vector2): void {
  room.aabb.move(offset);
  for (let i = 0; i < room.doorways.length; ++i) {
    room.doorways[i] = Vector2.add(room.doorways[i], offset);
  }
}

function mapBounds(rooms: Room[]): [Vector2, Vector2] {
  const mapSize: Vector2 = new Vector2(0, 0);
  const offset: Vector2 = new Vector2(999999, 999999);
  for (const room of rooms) {
    const min = room.aabb.min;
    offset.x = Math.min(offset.x, min.x);
    offset.y = Math.min(offset.y, min.y);

    const max = room.aabb.max;
    mapSize.x = Math.max(mapSize.x, max.x);
    mapSize.y = Math.max(mapSize.y, max.y);
  }

  offset.flip();
  return [offset, Vector2.add(mapSize, offset)];
}

function generateRooms(amount: number, roomConfig: RoomConfig): Room[] {
  const rooms: Room[] = [];

  for (let i = 0; i < amount; ++i) {
    rooms.push({
      aabb: new BoundingBox(
        new Vector2(0, 0),
        new Vector2(
          random(roomConfig.minWidth, roomConfig.maxWidth),
          random(roomConfig.minHeight, roomConfig.maxHeight),
        ),
      ),
      doorways: [],
      roomType: i + 1,
    });
  }

  return rooms;
}

// TODO: Allow rooms to be adjusted in their position when they are overlapping
function tryPlaceRoom(
  roomToPlace: Room,
  currentRoom: Room,
  direction: Direction,
  placedRooms: Room[],
): boolean {
  const roomSize = roomToPlace.aabb.halfSize;
  const otherRoomSize = currentRoom.aabb.halfSize;
  const offset: Vector2 = new Vector2(0, 0);
  switch (direction) {
    case Direction.Top:
      offset.y = -(roomSize.y + otherRoomSize.y + 1);
      offset.x = random(-roomSize.x + 1, otherRoomSize.x - 1);
      break;
    case Direction.Right:
      offset.x = roomSize.x + otherRoomSize.x + 1;
      offset.y = random(-roomSize.y + 1, otherRoomSize.y - 1);
      break;
    case Direction.Down:
      offset.y = roomSize.y + otherRoomSize.y + 1;
      offset.x = random(-roomSize.x + 1, otherRoomSize.x - 1);
      break;
    default:
      offset.x = -(roomSize.x + otherRoomSize.x + 1);
      offset.y = random(-roomSize.y + 1, otherRoomSize.y - 1);
      break;
  }

  roomToPlace.aabb.place(Vector2.add(currentRoom.aabb.position, offset));
  console.assert(
    roomToPlace.aabb.isOverlap(currentRoom.aabb) === false,
    "SOMETHING WENT WRONG!",
  );

  const overlapBoxes: BoundingBox[] = [];
  for (const room of placedRooms) {
    if (roomToPlace.aabb.isOverlap(room.aabb)) {
      overlapBoxes.push(room.aabb);
    }
  }

  if (overlapBoxes.length === 0) {
    return true;
  } else {
    return false;
  }
}

function placeDoorway(pivotRoom: Room, neighborRoom: Room, direction: Direction) {
  const topLeft = Vector2.max(pivotRoom.aabb.min, neighborRoom.aabb.min);
  const bottomRight = Vector2.min(pivotRoom.aabb.max, neighborRoom.aabb.max);

  switch (direction) {
    case Direction.Top:
      pivotRoom.doorways.push(
        new Vector2(
          random(topLeft.x + 1, bottomRight.x - 1),
          pivotRoom.aabb.position.y - pivotRoom.aabb.halfSize.y - 1,
        ),
      );
      break;
    case Direction.Right:
      pivotRoom.doorways.push(
        new Vector2(
          pivotRoom.aabb.position.x + pivotRoom.aabb.halfSize.x,
          random(topLeft.y + 1, bottomRight.y - 1),
        ),
      );
      break;
    case Direction.Down:
      pivotRoom.doorways.push(
        new Vector2(
          random(topLeft.x + 1, bottomRight.x - 1),
          pivotRoom.aabb.position.y + pivotRoom.aabb.halfSize.y,
        ),
      );
      break;
    default:
      pivotRoom.doorways.push(
        new Vector2(
          pivotRoom.aabb.position.x - pivotRoom.aabb.halfSize.x - 1,
          random(topLeft.y + 1, bottomRight.y - 1),
        ),
      );
      break;
  }
}

/*
 * Per entrance keep attaching rooms until all conditions are matched
 */
function DungeonGenerator(): Map {
  const roomConfig: RoomConfig = {
    minWidth: 3,
    maxWidth: 9,
    minHeight: 3,
    maxHeight: 9,
    minDoorCount: 1,
    maxDoorCount: 4,
  };
  const rooms: Room[] = generateRooms(24, roomConfig);
  const placedRooms: Room[] = [rooms.shift()];
  const queue: Room[] = [placedRooms[0]];

  const directions: Direction[] = [Direction.Top, Direction.Right, Direction.Down, Direction.Left];
  while (queue.length > 0 && rooms.length > 0) {
    const pivotRoom = queue.shift();
    shuffle(directions);
    for (
      let roomCount = random(
        roomConfig.minDoorCount,
        Math.min(roomConfig.maxDoorCount, rooms.length),
      );
      roomCount > 0;
      --roomCount
    ) {
      const direction: Direction = directions[roomCount];
      if (tryPlaceRoom(rooms[0], pivotRoom, direction, placedRooms)) {
        placeDoorway(pivotRoom, rooms[0], direction);
        placedRooms.push(rooms.shift());
        queue.push(placedRooms[placedRooms.length - 1]);
      } else {
        console.log("No suitable room placement found! Skipping...");
      }
    }
  }

  console.log("room count: ", placedRooms.length);
  const [mapOffset, mapSize]: [Vector2, Vector2] = mapBounds(placedRooms);
  const map: Map = new Map(mapSize.x, mapSize.y);
  for (const room of placedRooms) {
    translateRoom(room, mapOffset);
    if (
      !map.insertTiles(
        room.aabb.min.clone().floor(),
        room.aabb.max.clone().floor(),
        room.roomType,
      )
    ) {
      console.log("Not inserted room", room);
    }

    for (const door of room.doorways) {
      map.insertTile(door.floor(), TileType.Hallway);
    }
  }

  // TODO: For debugging; draw the doors afterwards
  // for (const room of placedRooms) {
  //   for (const door of room.doorways) {
  //     map.insertTile(door.floor(), TileType.Hallway);
  //   }
  // }
  return map;
}

DungeonGenerator().print();

// const a: BoundingBox = new BoundingBox(new Vector2(6, 6), new Vector2(10, 10));
// const b: BoundingBox = new BoundingBox(new Vector2(3, 3), new Vector2(2, 2));

// console.log("a: ", a, "b: ", b);
// console.log(a.min(), a.max());
// console.log(b.min(), b.max());
// console.log("a => b: ", a.isOverlap(b));
// console.log("b => a: ", b.isOverlap(a));

// TODO:
// 4. Scan code and clean up where needed
// 5. Tile map construction
// 7. Expand the room to include the border when tryPlaceRoom
// 8. Assign rooms and apply basic rules (no entrance and exit directly connected)
