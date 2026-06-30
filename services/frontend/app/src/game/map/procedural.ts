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

interface TileMapping {
  corner: number[],
  wall: number[][],
  floor: number[]
}

interface Door {
  position: Vector2;
  direction: Direction
}

interface Room {
  aabb: BoundingBox;
  doorways: Vector2[];
  roomType: TileType;
}

interface RoomConfig {
  width: Range;
  height: Range;
  doorCount: Range;
  tileMapping: TileMapping
}

class PuzzleConfig {
  amountOfPuzzles: number;
  maxPuzzlePerRoom: number; // cannot exceed amount of puzzles
  artifactsInTreasure: number; // One artifact per treasure chest
  artifactsDroppedByEnemies: number; // One artifact per enemy
}

// class DungeonConfig {
//   puzzleConfig: PuzzleConfig;
//   puzzleRoom: RoomConfig;
//   treasureRoom: RoomConfig;
//   emptyRoom: RoomConfig;
//   entranceRoom: RoomConfig;
//   exitRoom: RoomConfig;
// }

class Map {
  map: number[][];
  width: number;
  height: number;
  rooms: Room[];

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
      pos.x >= this.width ||
      pos.y >= this.height
    ); // TODO: The Dangerzone!
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
  return [offset, Vector2.add(mapSize, offset).floor()];
}

function generateRooms(amount: number, roomConfig: RoomConfig): Room[] {
  const rooms: Room[] = [];

  for (let i = 0; i < amount; ++i) {
    rooms.push({
      aabb: new BoundingBox(
        new Vector2(0, 0),
        new Vector2(
          random(roomConfig.width.min, roomConfig.width.max),
          random(roomConfig.height.min, roomConfig.height.max),
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
  const shrink: number = 2;

  switch (direction) {
    case Direction.Top:
      offset.y = -(roomSize.y + otherRoomSize.y + 1);
      offset.x = random(-roomSize.x + shrink, otherRoomSize.x - shrink);
      break;
    case Direction.Right:
      offset.x = roomSize.x + otherRoomSize.x + 1;
      offset.y = random(-roomSize.y + shrink, otherRoomSize.y - shrink);
      break;
    case Direction.Down:
      offset.y = roomSize.y + otherRoomSize.y + 1;
      offset.x = random(-roomSize.x + shrink, otherRoomSize.x - shrink);
      break;
    default:
      offset.x = -(roomSize.x + otherRoomSize.x + 1);
      offset.y = random(-roomSize.y + shrink, otherRoomSize.y - shrink);
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

function placeDoorway(
  pivotRoom: Room,
  neighborRoom: Room,
  direction: Direction
): Door {
  const topLeft = Vector2.max(pivotRoom.aabb.min, neighborRoom.aabb.min);
  const bottomRight = Vector2.min(pivotRoom.aabb.max, neighborRoom.aabb.max);
  const shrink = 2; // wall + corner

  const door: Door = { position: null, direction: direction };
  switch (direction) {
    case Direction.Top:
      door.position = new Vector2(
        random(topLeft.x + shrink, bottomRight.x - shrink),
        pivotRoom.aabb.position.y - pivotRoom.aabb.halfSize.y - 1,
      );
      break;
    case Direction.Right:
      door.position = new Vector2(
        pivotRoom.aabb.position.x + pivotRoom.aabb.halfSize.x,
        random(topLeft.y + shrink, bottomRight.y - shrink),
      );
      break;
    case Direction.Down:
      door.position = new Vector2(
        random(topLeft.x + shrink, bottomRight.x - shrink),
        pivotRoom.aabb.position.y + pivotRoom.aabb.halfSize.y,
      );
      break;
    default:
      door.position = new Vector2(
        pivotRoom.aabb.position.x - pivotRoom.aabb.halfSize.x - 1,
        random(topLeft.y + shrink, bottomRight.y - shrink),
      );
      break;
  }
  return door;
}

/*
 * Per entrance keep attaching rooms until all conditions are matched
 */
function DungeonGenerator(): Map {
  const roomConfig: RoomConfig = {
    width: {min: 3, max: 9},
    height: { min: 3, max: 9},
    doorCount: { min: 3, max: 4 },
    tileMapping: null
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
        roomConfig.doorCount.min,
        Math.min(roomConfig.doorCount.max, rooms.length),
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

// DungeonGenerator().print();

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

// Tilemap construction
//
// 1. Allow for a dungeon config
// 2. Generate the rooms and layout
// 3. Generate the level map data itself
// 4. display the tilemap layer into the scene
// 5. Assign walls as colliders

interface Range {
  min: number;
  max: number;
}

// Use this data for the tile map
export interface MapData {
  layout: number[][];
  doors: Door[];
  rooms: Room[];
  width: number;
  height: number;
}

export interface DungeonConfig {
  roomCount: Range;
  emptyRoomConfig: RoomConfig,

  // amount of puzzles
  // amount of enemies
  // amount of chests
}

function paintCorner(top: boolean, left: boolean, corner: number[]): number {
  if (top) {
    return left ? corner[0] : corner[1];
  }
  return left ? corner[2] : corner[3];
}

function paintWall(top: boolean, bottom: boolean, left: boolean, wall: number[][]): number {
  if (top) {
    return wall[0][random(0, wall[0].length)];
  } else if (bottom) {
    return  wall[2][random(0, wall[2].length)];
  } else if (left) {
    return wall[3][random(0, wall[3].length)];
  }
  return wall[1][random(0, wall[1].length)];
}

function paintFloor(floor: number[]): number {
  return floor[random(0, floor.length)];
}

function layoutPaintRoom(layout: number[][], room: Room, tileMapping: TileMapping) {
  const min = room.aabb.min.clone().floor();
  const max = room.aabb.max.clone().floor();

  for (let y: number = min.y; y < max.y; ++y) {
    for (let x: number = min.x; x < max.x; ++x) {
      if (y == min.y && (x == min.x || x == max.x - 1) ||
        y == max.y - 1 && (x == min.x || x == max.x - 1)) {
        layout[y][x] = paintCorner(y == min.y, x == min.x, tileMapping.corner);
      } else if (y == min.y || y == max.y - 1 || x == min.x || x == max.x - 1) {
        layout[y][x] = paintWall(y == min.y, y == max.y - 1, x == min.x, tileMapping.wall);
      } else {
        layout[y][x] = paintFloor(tileMapping.floor);
      }
    }
  }
}

function layoutPaintDoor(layout: number[][], door: Door, tileMapping: TileMapping) {
  const [x, y] = door.position.clone().floor().unpack();

  layout[y][x] = paintFloor(tileMapping.floor);
  if (door.direction === Direction.Top || door.direction === Direction.Down) {
    layout[y][x + 1] = paintWall(false, false, false, tileMapping.wall);
    layout[y][x - 1] = paintWall(false, false, true, tileMapping.wall);

    layout[y - 1][x] = paintFloor(tileMapping.floor);
    layout[y + 1][x] = paintFloor(tileMapping.floor);
  } else {
    layout[y - 1][x] = paintWall(true, false, false, tileMapping.wall);
    layout[y + 1][x] = paintWall(false, true, false, tileMapping.wall);

    layout[y][x + 1] = paintFloor(tileMapping.floor);
    layout[y][x - 1] = paintFloor(tileMapping.floor);
  }
}

export function dungeonBuilder(config: DungeonConfig): MapData {
  console.assert(config.emptyRoomConfig.doorCount.min > 0);
  console.assert(config.emptyRoomConfig.doorCount.max < 5);
  console.assert(config.emptyRoomConfig.doorCount.max > config.emptyRoomConfig.doorCount.min);

  // Generated the rooms
  const roomConfig = config.emptyRoomConfig;
  const rooms: Room[] = generateRooms(random(config.roomCount.min, config.roomCount.max), roomConfig);
  const placedRooms: Room[] = [rooms.shift(),];
  const placedDoors: Door[] = [];

  // Randomize the room placement
  const directions = [0, 1, 2, 3];
  for (let i = 0; i < placedRooms.length && rooms.length > 0; ++i) {
    shuffle(directions);
    const doorCount = random(roomConfig.doorCount.min, Math.min(roomConfig.doorCount.max, rooms.length));
    for (let j = 0; j < doorCount; ++j) { // TODO:
      if (tryPlaceRoom(rooms[0], placedRooms[i], directions[j], placedRooms)) {
        placedDoors.push(placeDoorway(placedRooms[i], rooms[0], directions[j]))
        placedRooms.push(rooms.shift());
      }
    }
  }

  // construct the layout
  const [mapOffset, mapSize]: [Vector2, Vector2] = mapBounds(placedRooms);
  const layout: number[][] = Array.from({ length: mapSize.y }, () => Array(mapSize.x).fill(-1));

  for (const room of placedRooms) {
    translateRoom(room, mapOffset);
    layoutPaintRoom(layout, room, config.emptyRoomConfig.tileMapping);
  }

  for (const door of placedDoors) {
    door.position = Vector2.add(door.position, mapOffset);
    layoutPaintDoor(layout, door, config.emptyRoomConfig.tileMapping);
  }

  return {
    layout: layout,
    doors: placedDoors,
    rooms: placedRooms,
    width: mapSize.x,
    height: mapSize.y
  }
}
