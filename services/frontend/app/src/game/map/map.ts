// source https://eskerda.com/bsp-dungeon-generation/

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class Room {
  x: number;
  y: number;
  width: number;
  height: number;
  center: Vector2;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.center = new Vector2(x + width / 2, y + height / 2)
  }
}

export class TreeNode<T> {
  val: T;
  left: TreeNode<T>;
  right: TreeNode<T>;

  constructor(val: T) {
    this.val = val;
    this.left = null;
    this.right = null;
  }

  getLeafs(): TreeNode<T>[] {
    if (this.left === null && this.right === null) {
      return [this];
    }

    return [].concat(this.left?.getLeafs(), this.right?.getLeafs());
  }
}

export function random(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function divideRoom(room: Room, splitHorizontal: number, iteration: number = 100): Room[] {
  if (iteration == 0) {
    return null;
  }

  const ratio: number = 0.45;
  const rooms: Room[] = [null, null];

  if (splitHorizontal === 0) {
    const yPlane = random(1, room.height);
    if (yPlane / room.width <= ratio || (room.height - yPlane) / room.width <= ratio) {
      return divideRoom(room, 1, iteration - 1);
    }

    rooms[0] = new Room(room.x, room.y, room.width, yPlane);
    rooms[1] = new Room(room.x, room.y + yPlane, room.width, room.height - yPlane);
  } else {
    const xPlane = random(1, room.width);
    if (xPlane / room.height <= ratio || (room.width - xPlane) / room.height <= ratio) {
      return divideRoom(room, 0, iteration - 1);
    }

    rooms[0] = new Room(room.x, room.y, xPlane, room.height);
    rooms[1] = new Room(room.x + xPlane, room.y, room.width - xPlane, room.height);
  }
  return rooms;
}

export function BSP(room: Room, iteration: number): TreeNode<Room> {
  if (iteration == 0) {
    return null;
  }

  const node = new TreeNode<Room>(room);
  const split: Room[] = divideRoom(room, random(0, 1));
  if (split) {
    node.left = BSP(split[0], iteration - 1);
    node.right = BSP(split[1], iteration - 1);
  }
  return node;
}

// const tree: TreeNode<Room> = BSP(new Room(0, 0, 30, 30), 4);

// console.log(JSON.stringify(tree));
