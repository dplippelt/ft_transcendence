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
  None = 0x0,
  Top = 0x01,
  Right = 0x02,
  Down = 0x04,
  Left = 0x08,
  TopLeft = Top | Left,
  TopRight = Top | Right,
  DownLeft = Down | Left,
  DownRight = Down | Right,
}

interface TileMapping {
  corner: number[],
  innerCorner: number[],
  wall: number[][],
  floor: number[]
}

interface Door {
  position: Vector2;
  direction: Direction
}

export interface Room {
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

interface Range {
  min: number;
  max: number;
}

export interface MapData {
  map: number[][];
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

// Translate the room position into the map's local space
function translateRoom(room: Room, offset: Vector2): void {
  room.aabb.move(offset);
  for (let i = 0; i < room.doorways.length; ++i) {
    room.doorways[i] = Vector2.add(room.doorways[i], offset);
  }
}

// Calculate the map bounds based on the bounding box of the rooms
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

// Generate a set of rooms based on the given configuration
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

// Randomly place the room in the direction of the current room. If it overlaps will return false
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
    "roomToPlace is overlapping currentRoom",
  );

  const overlapBoxes: BoundingBox[] = [];
  for (const room of placedRooms) {
    if (roomToPlace.aabb.isOverlap(room.aabb)) {
      overlapBoxes.push(room.aabb);
    }
  }
  return overlapBoxes.length === 0;
}

// Randomly place a doorway between two rooms
function placeDoorway(
  pivotRoom: Room,
  neighborRoom: Room,
  direction: Direction
): Door {
  const topLeft = Vector2.max(pivotRoom.aabb.min, neighborRoom.aabb.min);
  const bottomRight = Vector2.min(pivotRoom.aabb.max, neighborRoom.aabb.max);
  const shrink = 2; // wall + corner

  const door: Door = { position: new Vector2(0, 0), direction: direction };
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

// Get the door corner tile based on whether the connecting wall tile is a corner or not
function getDoorCornerTile(tile: number, wall: Direction, corner: Direction, tileMapping: TileMapping): number {
  if (tileMapping.corner.includes(tile)) {
    return getWallTile(wall, tileMapping.wall);
  }
  return getCornerTile(corner, tileMapping.innerCorner);
}

// Get the corner tile based on the corner direction
function getCornerTile(direction: Direction, corner: number[]): number {
  if (direction == Direction.TopLeft) {
    return corner[0];
  } else if (direction == Direction.TopRight) {
    return corner[1];
  } else if (direction == Direction.DownLeft) {
    return corner[2]
  }
  return corner[3];
}

// Get the wall tile based on the wall direction
function getWallTile(direction: Direction, wall: number[][]): number {
  if (direction == Direction.Top) {
    return wall[0][random(0, wall[0].length)];
  } else if (direction == Direction.Right) {
    return wall[1][random(0, wall[1].length)];
  } else if (direction == Direction.Down) {
    return  wall[2][random(0, wall[2].length)];
  }
  return wall[3][random(0, wall[3].length)];
}

function getFloorTile(floor: number[]): number {
  return floor[random(0, floor.length)];
}

// Put the room tiles into the dungeon map
function layoutPutRoom(map: number[][], room: Room, tileMapping: TileMapping): void {
  const min = room.aabb.min.clone().floor();
  const max = room.aabb.max.clone().floor();

  for (let y: number = min.y; y < max.y; ++y) {
    for (let x: number = min.x; x < max.x; ++x) {
      let direction = y === min.y ? Direction.Top : y === max.y - 1 ? Direction.Down : Direction.None;
      direction |= x === min.x ? Direction.Left : x === max.x - 1 ? Direction.Right : Direction.None;

      if (direction === Direction.TopLeft || direction === Direction.TopRight
        || direction === Direction.DownLeft || direction === Direction.DownRight) {
        map[y][x] = getCornerTile(direction, tileMapping.corner);
      } else if (direction === Direction.Top || direction === Direction.Right
        || direction === Direction.Down || direction === Direction.Left) {
        map[y][x] = getWallTile(direction, tileMapping.wall);
      } else {
        map[y][x] = getFloorTile(tileMapping.floor);
      }
    }
  }
}

// Put the door tiles into dungeon map
function layoutPutDoor(map: number[][], door: Door, tileMapping: TileMapping): void {
  const [x, y] = door.position.clone().floor().unpack();
  map[y][x] = getFloorTile(tileMapping.floor);
  if (door.direction === Direction.Top || door.direction === Direction.Down) {
    map[y][x + 1] = getWallTile(Direction.Right, tileMapping.wall);
    map[y][x - 1] = getWallTile(Direction.Left, tileMapping.wall);
    map[y - 1][x - 1] = getDoorCornerTile(map[y - 1][x - 1], Direction.Left, Direction.TopRight, tileMapping);
    map[y - 1][x + 1] = getDoorCornerTile(map[y - 1][x + 1], Direction.Right, Direction.TopLeft, tileMapping);
    map[y + 1][x - 1] = getDoorCornerTile(map[y + 1][x - 1], Direction.Left, Direction.DownRight, tileMapping);
    map[y + 1][x + 1] = getDoorCornerTile(map[y + 1][x + 1], Direction.Right, Direction.DownLeft, tileMapping);
    map[y - 1][x] = getFloorTile(tileMapping.floor);
    map[y + 1][x] = getFloorTile(tileMapping.floor);
  } else {
    map[y - 1][x] = getWallTile(Direction.Top, tileMapping.wall);
    map[y + 1][x] = getWallTile(Direction.Down, tileMapping.wall);
    map[y - 1][x - 1] = getDoorCornerTile(map[y - 1][x - 1], Direction.Top, Direction.DownLeft, tileMapping);
    map[y - 1][x + 1] = getDoorCornerTile(map[y - 1][x + 1], Direction.Top, Direction.DownRight, tileMapping);
    map[y + 1][x - 1] = getDoorCornerTile(map[y + 1][x - 1], Direction.Down, Direction.TopLeft, tileMapping);
    map[y + 1][x + 1] = getDoorCornerTile(map[y + 1][x + 1], Direction.Down, Direction.TopRight, tileMapping);
    map[y][x + 1] = getFloorTile(tileMapping.floor);
    map[y][x - 1] = getFloorTile(tileMapping.floor);
  }
}

// Procedurally generate a dungeon layout based on the dungeon config
export function dungeonBuilder(config: DungeonConfig): MapData {
  console.assert(config.emptyRoomConfig.doorCount.min > 0);
  console.assert(config.emptyRoomConfig.doorCount.max < 5);
  console.assert(config.emptyRoomConfig.doorCount.max > config.emptyRoomConfig.doorCount.min);

  // Generated the rooms
  const roomConfig = config.emptyRoomConfig;
  const rooms: Room[] = generateRooms(random(config.roomCount.min, config.roomCount.max), roomConfig);
  const placedRooms: Room[] = [rooms.shift()!,];
  const placedDoors: Door[] = [];

  // Randomize the room placement
  const directions:Direction[] = [Direction.Top, Direction.Right, Direction.Down, Direction.Left];
  for (let i = 0; i < placedRooms.length && rooms.length > 0; ++i) {
    shuffle(directions);
    const doorCount = random(roomConfig.doorCount.min, Math.min(roomConfig.doorCount.max, rooms.length));
    for (let j = 0; j < doorCount; ++j) {
      if (tryPlaceRoom(rooms[0], placedRooms[i], directions[j], placedRooms)) {
        placedDoors.push(placeDoorway(placedRooms[i], rooms[0], directions[j]))
        placedRooms.push(rooms.shift()!);
      }
    }
  }

  // construct the layout
  const [mapOffset, mapSize]: [Vector2, Vector2] = mapBounds(placedRooms);
  const map: number[][] = Array.from({ length: mapSize.y }, () => Array(mapSize.x).fill(-1));

  for (const room of placedRooms) {
    translateRoom(room, mapOffset);
    layoutPutRoom(map, room, config.emptyRoomConfig.tileMapping);
  }

  for (const door of placedDoors) {
    door.position = Vector2.add(door.position, mapOffset);
    layoutPutDoor(map, door, config.emptyRoomConfig.tileMapping);
  }

  return {
    map: map,
    doors: placedDoors,
    rooms: placedRooms,
    width: mapSize.x,
    height: mapSize.y
  }
}
