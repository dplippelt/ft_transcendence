export class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toString(): string {
    return `<${this.x}, ${this.y}>`;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  flip(): Vector2 {
    this.x *= -1;
    this.y *= -1;
    return this;
  }

  scalef(scalar: number): Vector2 {
    this.x = Math.floor(this.x * scalar);
    this.y = Math.floor(this.y * scalar);

    return this;
  }

  abs(): Vector2 {
    this.x = Math.abs(this.x);
    this.y = Math.abs(this.y);

    return this;
  }

  floor(): Vector2 {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);

    return this;
  }

  scale(scalar: number): Vector2 {
    this.x *= scalar;
    this.y *= scalar;

    return this;
  }

  add(other: Vector2): Vector2 {
    this.x += other.x;
    this.y += other.y;

    return this;
  }

  addXY(x: number, y: number): Vector2 {
    this.x += x;
    this.y += y;

    return this;
  }

  sub(other: Vector2): Vector2 {
    this.x -= other.x;
    this.y -= other.y;

    return this;
  }

  subXY(x: number, y: number): Vector2 {
    this.x -= x;
    this.y -= y;

    return this;
  }

  mul(other: Vector2): Vector2 {
    this.x *= other.x;
    this.y *= other.y;

    return this;
  }

  mulXY(x: number, y: number): Vector2 {
    this.x *= x;
    this.y *= y

    return this;
  }

  equals(other: Vector2) {
    return this.x === other.x && this.y === other.y;
  }

  unpack(): [number, number] {
    return [this.x, this.y];
  }

  static max(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(Math.max(a.x, b.x), Math.max(a.y, b.y));
  }

  static min(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(Math.min(a.x, b.x), Math.min(a.y, b.y));
  }

  static add(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  static sub(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  static mul(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x * b.x, a.y * b.y);
  }
}

export class BoundingBox {
  position: Vector2;
  min: Vector2;
  max: Vector2;
  halfSize: Vector2;
  size: Vector2;

  constructor(position: Vector2, size: Vector2) {
    this.size = size.clone();
    this.halfSize = size.clone().scale(0.5);
    this.position = Vector2.add(position, this.halfSize);
    this.min = Vector2.sub(this.position, this.halfSize);
    this.max = Vector2.add(this.position, this.halfSize);
  }

  isOverlap(other: BoundingBox): boolean {
    return !(
      this.min.x > other.max.x ||
      this.max.x < other.min.x ||
      this.min.y > other.max.y ||
      this.max.y < other.min.y
    );
  }

  isPointWithin(point: Vector2) {
    return !(
      point.x < this.min.x ||
      point.x > this.max.x ||
      point.y < this.min.y ||
      point.y > this.max.y
    );
  }

  place(position: Vector2): BoundingBox {
    this.position = position.clone();
    this.min = Vector2.sub(this.position, this.halfSize);
    this.max = Vector2.add(this.position, this.halfSize);

    return this;
  }

  move(offset: Vector2): BoundingBox {
    this.position.add(offset);
    this.min = Vector2.sub(this.position, this.halfSize);
    this.max = Vector2.add(this.position, this.halfSize);

    return this;
  }

  floor(): BoundingBox {
    this.min.floor();
    this.max.floor();
    this.position = Vector2.add(this.min, this.max).scale(0.5);
    this.size = Vector2.sub(this.max, this.min);
    this.halfSize = this.size.clone().scale(0.5);

    return this;
  }
}

// min inclusive and max exclusive integer => [min, max)
export function random(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

// random integer point between two values => [min, max)
export function randomPoint(min: Vector2, max: Vector2): Vector2 {
  return new Vector2(random(min.x, max.x), random(min.y, max.y));
}

export function randomPointOnEdge(rect: BoundingBox): Vector2 {
  const width = rect.size.x;
  const height = rect.size.y;
  const perimeter = 2 * width + 2 * height;
  const distance = random(0, perimeter);

  // TODO: Why is the -1 needed?
  if (distance < width) {
    return new Vector2(rect.min.x + distance, rect.min.y);
  } else if (distance < width + height) {
    return new Vector2(rect.max.x - 1, rect.min.y + (distance - width));
  } else if (distance < 2 * width + height) {
    return new Vector2(rect.min.x + (distance - width - height), rect.max.y - 1);
  }
  return new Vector2(rect.min.x, rect.min.y + (distance - 2 * width - height));
}

export interface weight {
  index: number;
  weight: number;
}

/// source: https://blog.bruce-hill.com/a-faster-weighted-random-choice
export function weightedRandom(weights: weight[]): weight {
  let remaining: number = Math.random() * weights.reduce((sum: number, curr: weight) => sum + curr.weight, 0);

  for (const element of weights) {
    remaining -= element.weight;
    if (remaining < 0) {
      return element;
    }
  }
  throw new Error("Unreachable code reached");
}

// Fisher–Yates shuffle
export function shuffle(arr: Array<number>): void {
  for (let i = arr.length - 1; i > 0; --i) {
    const pick = random(0, i + 1);
    [arr[pick], arr[i]] = [arr[i], arr[pick]];
  }
}
