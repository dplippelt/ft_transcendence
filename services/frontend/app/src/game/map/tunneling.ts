// pre-place elements
// builders (leave walls or tunnels)
//  - crawlers - build walls in open spaces (spawn crawlers)
//  - tunnelers - build tunnels in closed spaces (spawn roomies)
//  - roomies - build rooms
//
// builder generations => wait for generation to die
// builder dies because ran out of space or reached maximum age
//
// actions:
//  - stretch a wall
//  - dig a tunnel
//  - change direction
//  - spawn a 1-2 baby builder(s)

enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
  NONE
}

enum Tile {
  CLOSED = 0,
  OPEN = 1,
  ANTEROOM = 2,
  ROOM = 3,
}

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toString() {
    return `<${this.x}, ${this.y}>`;
  }

  scalef(scalar: number): Vector2 {
    this.x = Math.floor(this.x * scalar);
    this.y = Math.floor(this.y * scalar);

    return this;
  }

  static add(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  static sub(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }
}

class Map {
  map: number[][];
  width: number;
  height: number;
  builders: Builder[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.map = Array.from({ length: height }, () => Array(width).fill(0));
    this.builders = new Array<Builder>();
  }

  isBounded(pos: Vector2): boolean {
    return !(pos.x < 0 || pos.y < 0 || pos.x >= this.width || pos.y >= this.height);
  }

  isFree(min: Vector2, max: Vector2): boolean {
    if (!this.isBounded(min) || !this.isBounded(max)) {
      return false;
    }

    for (let y = min.y; y < max.y; ++y) {
      for (let x = min.x; x < max.x; ++x) {
        if (this.map[y][x] !== Tile.CLOSED) {
          return false;
        }
      }
    }

    return true;
  }

  insertTile(pos: Vector2, tile: Tile): void {
    if (!this.isBounded(pos)) {
      return;
    }
    this.map[pos.y][pos.x] = tile;
  }

  insertTiles(min: Vector2, max: Vector2, tile: Tile): boolean {
    if (!this.isFree(min, max)) {
      return false;
    }

    for (let y = min.y; y < max.y; ++y) {
      for (let x = min.x; x < max.x; ++x) {
        this.map[y][x] = tile;
      }
    }
    return true;
  }

  generate() {
    let buildersAlive = true;
    while (buildersAlive) {
      buildersAlive = false;

      const count = this.builders.length;
      for (let i = 0; i < count; ++i) {
        if (this.builders[i].isAlive() && this.builders[i].action(this)) {
          buildersAlive = true;
        }
      }
      buildersAlive = this.builders.length > count ? true : buildersAlive;
    }
  }

  print(): void {
    for (const row of this.map) {
      for (const column of row) {
        process.stdout.write(`${column}`);
      }
      process.stdout.write("\n");
    }
  }
}

abstract class Builder {
  pos: Vector2;
  dir: Vector2;
  age: number;

  constructor(pos: Vector2, maxAge: number, dir: Vector2) {
    this.pos = structuredClone(pos);
    this.age = maxAge;
    this.dir = structuredClone(dir);

    console.assert(!isNaN(this.pos.x) && !isNaN(this.pos.y), this.pos, "Builder with invalid position");
    console.assert(!isNaN(this.dir.x) && !isNaN(this.dir.y), this.pos, "Builder with invalid direction");
  }

  isAlive(): boolean {
    return this.age > 0;
  }

  abstract action(map: Map): boolean;
}

class Roomie extends Builder {
  min: number = 2;
  max: number = 10;

  action(map: Map): boolean {
    const size:number = Math.floor(this.min + Math.random() * (this.max - this.min));
    const halfSize = new Vector2(size, size).scalef(0.5);

    let center: Vector2;
    for (let dir: Direction = Direction.NORTH; dir < Direction.NONE; ++dir) {
      center = this.pos;
      switch (vec2ToDirection(this.dir)) {
        case Direction.NORTH:
          center.y -= halfSize.y + 1;
          break;
        case Direction.EAST:
          center.x += halfSize.x + 1;
          break;
        case Direction.SOUTH:
          center.y += halfSize.y + 1;
          break;
        case Direction.WEST:
          center.x -= halfSize.x + 1;
          break;
      }

      if (map.insertTiles(Vector2.sub(center, halfSize), Vector2.add(center, halfSize), Tile.ROOM)) {
        console.log("Room built!");
        break;
      }
    }
    --this.age;
    return false;
  }
}

class Tunneler extends Builder {
  randomDirection(): Vector2 {
    const direction: Direction = Math.floor(Math.random() * 4);

    switch (direction) {
      case Direction.NORTH:
        return new Vector2(0, -1);
      case Direction.EAST:
        return new Vector2(1, 0);
      case Direction.SOUTH:
        return new Vector2(0, 1);
      case Direction.WEST:
        return new Vector2(1, 0);
    }
    console.assert(false, "invalid random direction");
    return new Vector2(0, 0);
  }

  action(map: Map): boolean {
    const prob = Math.random();
    if (prob < .65) { // Tunnel
      console.assert(!isNaN(this.pos.x) && !isNaN(this.pos.y), this.pos, "invalid position for insertion");
      map.insertTile(this.pos, Tile.OPEN);
      const nextPos = Vector2.add(this.pos, this.dir);
      if (map.isBounded(nextPos)) {
        this.pos = nextPos;
        console.assert(!isNaN(this.pos.x) && !isNaN(this.pos.y), this.pos, "invalid position assigned");
      }
    } else if (prob >= .65 && prob < .95) { // Change direction
      this.dir = this.randomDirection();
      console.assert(!isNaN(this.dir.x) && !isNaN(this.dir.y), this.dir, "invalid direction assigned");
    } else if (prob >= .95) { // Spawn roomie
      console.log("Spawn builder");
      map.builders.push(new Roomie(this.pos, 1, this.dir));
    }

    --this.age;
    return this.isAlive();
  }

  isAlive() {
    return this.age > 0;
  }
}

function vec2ToDirection(v: Vector2): Direction {
  if (v.x === 0 && v.y === -1) {
    return Direction.NORTH;
  } else if (v.x === 1 && v.y === 0) {
    return Direction.EAST;
  } else if (v.x === 0 && v.y === 1) {
    return Direction.SOUTH;
  } else {
    return Direction.WEST;
  }
}

/* ======================================================================================== */

const map: Map = new Map(32, 32);
map.builders.push(new Tunneler(new Vector2(8, 0), 128, new Vector2(0, 1)));
console.assert(map.builders !== undefined, "Builders undefined");
console.assert(map.map !== undefined, "Map undefined");
map.generate();
map.print();
