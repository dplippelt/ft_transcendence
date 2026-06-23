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

  flip() {
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

  sub(other: Vector2): Vector2 {
    this.x -= other.x;
    this.y -= other.y;

    return this;
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
      this.position.x - this.halfSize.x > other.position.x + other.halfSize.x ||
      this.position.x + this.halfSize.x < other.position.x - other.halfSize.x ||
      this.position.y - this.halfSize.y > other.position.y + other.halfSize.y ||
      this.position.y + this.halfSize.y < other.position.y - other.halfSize.y
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
}

export function random(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min)); // (mx - mn + 1); random => [0..1)
}

export function randomPoint(min: Vector2, max: Vector2) {
  return new Vector2(
    random(min.x, max.x),
    random(min.y, max.y)
  );
}

// Fisher–Yates shuffle
export function shuffle(arr: Array<number>) {
  for (let i = arr.length - 1; i > 0; --i) {
    const pick = random(0, i + 1);
    [arr[pick], arr[i]] = [arr[i], arr[pick]]
  }
}
