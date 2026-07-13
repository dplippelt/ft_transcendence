import { Vector2, BoundingBox, random, shuffle, weightedRandom, type weight } from "./math";

export enum Direction {
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

export enum WallType {
	Moss,
	MoreMoss,
	ThinA,
	ThinB,
	Thick,
}

export enum FloorType {
 	Clean,
	SmallCracksA,
	SmallCracksB,
	Cracked,
	Damaged,
	Broken,
}

type CornerDirection = Direction.TopLeft | Direction.TopRight | Direction.DownLeft | Direction.DownRight;
type WallDirection = Direction.Top | Direction.Right | Direction.Down | Direction.Left;

interface TileMapping {
  corners: Record<CornerDirection, number>;
  innerCorners: Record<CornerDirection, number>;
  walls: Record<WallDirection, Partial<Record<WallType, number>>>;
  floor: Record<FloorType, weight>;
}

interface Door {
  position: Vector2;
  direction: Direction;
}

interface RoomConfig {
  width: Range;
  height: Range;
  doorCount: Range;
  tileMapping: TileMapping;
}

interface Range {
  min: number;
  max: number;
}

export interface Room {
  aabb: BoundingBox;
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
  emptyRoomConfig: RoomConfig;

  // amount of puzzles
  // amount of enemies
  // amount of chests
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
    });
  }

  return rooms;
}

// Randomly place the room in the direction of the current room. If it overlaps will return false
function tryPlaceRoom(roomToPlace: Room, currentRoom: Room, direction: Direction, placedRooms: Room[]): boolean {
  const roomSize: Vector2 = roomToPlace.aabb.halfSize;
  const otherRoomSize: Vector2 = currentRoom.aabb.halfSize;
  const offset: Vector2 = new Vector2(0, 0);
  const shrink: number = 1;

  switch (direction) {
    case Direction.Top:
      offset.y = -(roomSize.y + otherRoomSize.y + 1);
      offset.x = random(-roomSize.x + shrink, otherRoomSize.x);
      break;
    case Direction.Right:
      offset.x = roomSize.x + otherRoomSize.x + 1;
      offset.y = random(-roomSize.y + shrink, otherRoomSize.y);
      break;
    case Direction.Down:
      offset.y = roomSize.y + otherRoomSize.y + 1;
      offset.x = random(-roomSize.x + shrink, otherRoomSize.x);
      break;
    case Direction.Left:
      offset.x = -(roomSize.x + otherRoomSize.x + 1);
      offset.y = random(-roomSize.y + shrink, otherRoomSize.y);
      break;
    default:
      throw new Error(`Invalid Direction value ${direction} for room placement`);
  }

  roomToPlace.aabb.place(Vector2.add(currentRoom.aabb.position, offset));
  console.assert(roomToPlace.aabb.isOverlap(currentRoom.aabb) === false, "roomToPlace is overlapping currentRoom");

  return placedRooms.every(room => roomToPlace.aabb.isOverlap(room.aabb) === false);
}

// Randomly place a doorway between two rooms
function placeDoorway(pivotRoom: Room, neighborRoom: Room, direction: Direction): Door {
  const topLeft: Vector2 = Vector2.max(pivotRoom.aabb.min, neighborRoom.aabb.min);
  const bottomRight: Vector2 = Vector2.min(pivotRoom.aabb.max, neighborRoom.aabb.max);
  const shrink: number = 2;

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
    case Direction.Left:
      door.position = new Vector2(
        pivotRoom.aabb.position.x - pivotRoom.aabb.halfSize.x - 1,
        random(topLeft.y + shrink, bottomRight.y - shrink),
      );
      break;
    default:
      throw new Error(`Invalid Direction value ${direction} for door placement`);
  }
  return door;
}

// Get the door corner tile based on whether the connecting wall tile is a corner or not
function getDoorCornerTile(tile: number, wall: WallDirection, corner: CornerDirection, tileMapping: TileMapping): number {
  if (Object.values(tileMapping.corners).includes(tile)) {
    return getWallTile(wall, tileMapping.walls);
  }
  return getCornerTile(corner, tileMapping.innerCorners);
}

// Get the corner tile based on the corner direction
function getCornerTile(direction: CornerDirection, corner: Record<CornerDirection, number>): number {
  return corner[direction];
}

// Get the wall tile based on the wall direction
function getWallTile(direction: WallDirection, wall: Record<WallDirection, Partial<Record<WallType, number>>>): number {
  const walls = Object.values(wall[direction]);
  return walls[random(0, walls.length)];
}

function getFloorTile(floor: Record<FloorType, weight>): number {
  return weightedRandom(Object.values(floor)).index;
}

// Put the room tiles into the dungeon map
function layoutPutRoom(map: number[][], room: Room, tileMapping: TileMapping): void {
  const min = room.aabb.min.clone().floor();
  const max = room.aabb.max.clone().floor();

  for (let y: number = min.y; y < max.y; ++y) {
    for (let x: number = min.x; x < max.x; ++x) {
      let direction = y === min.y ? Direction.Top : y === max.y - 1 ? Direction.Down : Direction.None;
      direction |= x === min.x ? Direction.Left : x === max.x - 1 ? Direction.Right : Direction.None;

      if (direction === Direction.TopLeft ||
        direction === Direction.TopRight ||
        direction === Direction.DownLeft ||
        direction === Direction.DownRight) {
        map[y][x] = getCornerTile(direction, tileMapping.corners);
      } else if (direction === Direction.Top ||
        direction === Direction.Right ||
        direction === Direction.Down ||
        direction === Direction.Left) {
        map[y][x] = getWallTile(direction, tileMapping.walls);
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
    map[y][x + 1] = getWallTile(Direction.Right, tileMapping.walls);
    map[y][x - 1] = getWallTile(Direction.Left, tileMapping.walls);
    map[y - 1][x - 1] = getDoorCornerTile(map[y - 1][x - 1], Direction.Left, Direction.TopRight, tileMapping);
    map[y - 1][x + 1] = getDoorCornerTile(map[y - 1][x + 1], Direction.Right, Direction.TopLeft, tileMapping);
    map[y + 1][x - 1] = getDoorCornerTile(map[y + 1][x - 1], Direction.Left, Direction.DownRight, tileMapping);
    map[y + 1][x + 1] = getDoorCornerTile(map[y + 1][x + 1], Direction.Right, Direction.DownLeft, tileMapping);
    map[y - 1][x] = getFloorTile(tileMapping.floor);
    map[y + 1][x] = getFloorTile(tileMapping.floor);
  } else {
    map[y - 1][x] = getWallTile(Direction.Top, tileMapping.walls);
    map[y + 1][x] = getWallTile(Direction.Down, tileMapping.walls);
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
  console.assert(config.emptyRoomConfig.doorCount.max > config.emptyRoomConfig.doorCount.min);

  // Generated the rooms
  const roomConfig = config.emptyRoomConfig;
  const rooms: Room[] = generateRooms(random(config.roomCount.min, config.roomCount.max), roomConfig);
  const placedRooms: Room[] = [rooms.shift()!];
  const placedDoors: Door[] = [];

  // Randomize the room placement
  const directions: Direction[] = [Direction.Top, Direction.Right, Direction.Down, Direction.Left];
  for (let i = 0; i < placedRooms.length && rooms.length > 0; ++i) {
    shuffle(directions);
    const doorCount = Math.min(rooms.length, random(roomConfig.doorCount.min, roomConfig.doorCount.max + 1));
    for (let j = 0; j < doorCount; ++j) {
      const direction: Direction = directions[j % directions.length];
      if (tryPlaceRoom(rooms[0], placedRooms[i], direction, placedRooms)) {
        placedDoors.push(placeDoorway(placedRooms[i], rooms[0], direction));
        placedRooms.push(rooms.shift()!);
      }
    }
  }

  // construct the layout
  const [mapOffset, mapSize]: [Vector2, Vector2] = mapBounds(placedRooms);
  const map: number[][] = Array.from({ length: mapSize.y }, () => Array(mapSize.x).fill(-1));

  for (const room of placedRooms) {
    room.aabb.move(mapOffset);
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
    height: mapSize.y,
  };
}
