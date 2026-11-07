import type { Map } from "./MapBuilder";
import { Direction, Tile } from "./DungeonModels";
import { random, weightedRandom, type weight } from "./math";
import type { CornerDirection, FloorType, TileSetMap, WallDirection, WallType } from "./TileSetMap";

export class TileMapper {
  create(map: Map, tileSetMap: TileSetMap): number[][] {
    const tiledMap: number[][] = Array.from({ length: map.height }, () => Array(map.width).fill(Tile.NONE));
    this.tileMapper(map, tiledMap, tileSetMap);
    return tiledMap;
  }

  private tileMapper(map: Map, tiledMap: number[][], tileSetMap: TileSetMap): void {
    for (let y = 0; y < map.height; ++y) {
      for (let x = 0; x < map.width; ++x) {
        if (map.map[y][x] === Tile.NONE) {
          tiledMap[y][x] = -1;
        } else if (map.map[y][x] === Tile.OPEN || this.isSecondLayerTile(map.map[y][x])) {
          tiledMap[y][x] = this.getFloorTile(tileSetMap.floor);
        } else if (this.isWallTile(map.map[y][x])) {
          tiledMap[y][x] = this.getWallTile(map, x, y, tileSetMap);
        }
      }
    }
  }

  private getWallTile(map: Map, x: number, y: number, tileSetMap: TileSetMap): number {
    const wallBitMask: Direction = this.createWallBitmask(map, x, y);

    if ((wallBitMask & (Direction.Top | Direction.TopLeft | Direction.Left)) === 0) {
      return this.getInnerCornerTile(Direction.TopLeft, tileSetMap);
    }

    if ((wallBitMask & (Direction.Top | Direction.TopRight | Direction.Right)) === 0) {
      return this.getInnerCornerTile(Direction.TopRight, tileSetMap);
    }

    if ((wallBitMask & (Direction.Down | Direction.DownLeft | Direction.Left)) === 0) {
      return this.getInnerCornerTile(Direction.DownLeft, tileSetMap);
    }

    if ((wallBitMask & (Direction.Down | Direction.DownRight | Direction.Right)) === 0) {
      return this.getInnerCornerTile(Direction.DownRight, tileSetMap);
    }

    if ((wallBitMask & Direction.Top) === 0) {
      return this.getStraightWallTile(Direction.Down, tileSetMap.walls);
    }

    if ((wallBitMask & Direction.Down) === 0) {
      return this.getStraightWallTile(Direction.Top, tileSetMap.walls);
    }

    if ((wallBitMask & Direction.Left) === 0) {
      return this.getStraightWallTile(Direction.Right, tileSetMap.walls);
    }

    if ((wallBitMask & Direction.Right) === 0) {
      return this.getStraightWallTile(Direction.Left, tileSetMap.walls);
    }

    if ((wallBitMask & Direction.TopLeft) === 0) {
      return this.getCornerTile(Direction.DownRight, tileSetMap.corners)
    }

    if ((wallBitMask & Direction.TopRight) === 0) {
      return this.getCornerTile(Direction.DownLeft, tileSetMap.corners)
    }

    if ((wallBitMask & Direction.DownLeft) === 0) {
      return this.getCornerTile(Direction.TopRight, tileSetMap.corners)
    }

    if ((wallBitMask & Direction.DownRight) === 0) {
      return this.getCornerTile(Direction.TopLeft, tileSetMap.corners)
    }


//     if ((wallBitMask & (Direction.Top | Direction.Down)) == (Direction.Top | Direction.Down)) {
//       if (wallBitMask & Direction.Left) {
//         return this.getStraightWallTile(Direction.Right, tileSetMap.walls);
//       }
//       return this.getStraightWallTile(Direction.Left, tileSetMap.walls);
//     }
//
//     if ((wallBitMask & (Direction.Left | Direction.Right)) == (Direction.Left | Direction.Right)) {
//       if (wallBitMask & Direction.Top) {
//         return this.getStraightWallTile(Direction.Top, tileSetMap.walls);
//       }
//       return this.getStraightWallTile(Direction.Down, tileSetMap.walls);
//     }
//
//     if ((wallBitMask & (Direction.Top | Direction.Left)) == (Direction.Top | Direction.Left)) {
//       if (wallBitMask & Direction.DownRight) {
//         return this.getCornerTile(Direction.DownRight, tileSetMap.corners);
//       }
//       return this.getInnerCornerTile(Direction.DownRight, tileSetMap);
//     }
//
//     if ((wallBitMask & (Direction.Top | Direction.Right)) == (Direction.Top | Direction.Right)) {
//       if (wallBitMask & Direction.DownLeft) {
//         return this.getCornerTile(Direction.DownLeft, tileSetMap.corners);
//       }
//       return this.getInnerCornerTile(Direction.DownLeft, tileSetMap);
//     }
//
//     if ((wallBitMask & (Direction.Down | Direction.Left)) == (Direction.Down | Direction.Left)) {
//       if (wallBitMask & Direction.TopRight) {
//         return this.getCornerTile(Direction.TopRight, tileSetMap.corners);
//       }
//       return this.getInnerCornerTile(Direction.TopRight, tileSetMap);
//     }
//
//     if ((wallBitMask & (Direction.Down | Direction.Right)) == (Direction.Down | Direction.Right)) {
//       if (wallBitMask & Direction.TopLeft) {
//         return this.getCornerTile(Direction.TopLeft, tileSetMap.corners);
//       }
//       return this.getInnerCornerTile(Direction.TopLeft, tileSetMap);
//     }

    return -1;
  }

  private createWallBitmask(map: Map, x: number, y: number): Direction {
    const offsets: number[][] = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];

    let shift = 0;
    let wallBitMask: Direction = Direction.None;
    for (const offset of offsets) {
      const [dx, dy] = offset;
      if (this.isOutOfBounds(x + dx, y + dy, map.width, map.height)
        || this.isWallNeighbor(map.map[y + dy][x + dx])) {
        wallBitMask |= 1 << shift;
      }
      shift += 1;
    }

    return wallBitMask;
  }

  private isOutOfBounds(x: number, y: number, width: number, height: number) {
    return x < 0 || x >= width || y < 0 || y >= height;
  }

  private isWallNeighbor(tile: Tile) {
    return this.isWallTile(tile) || tile === Tile.NONE;
  }

  private isWallTile(tile: Tile): boolean {
    return tile === Tile.CORNER || tile === Tile.WALL;
  }

  private isSecondLayerTile(tile: Tile): boolean {
    return tile === Tile.SPAWN || tile === Tile.DOOR || tile === Tile.ENTER || tile === Tile.EXIT;
  }

  // TODO: Extract these function into TileSetMap
  // Get the door corner tile based on whether the connecting wall tile is a corner or not
  private getInnerCornerTile(corner: CornerDirection, tileSetMap: TileSetMap): number {
    return this.getCornerTile(corner, tileSetMap.innerCorners);
  }

  // Get the corner tile based on the corner direction
  private getCornerTile(direction: CornerDirection, corner: Record<CornerDirection, number>): number {
    return corner[direction];
  }

  // Get the wall tile based on the wall direction
  private getStraightWallTile(direction: WallDirection, wall: Record<WallDirection, Partial<Record<WallType, number>>>): number {
    const walls = Object.values(wall[direction]);
    return walls[random(0, walls.length)];
  }

  private getFloorTile(floor: Record<FloorType, weight>): number {
    return weightedRandom(Object.values(floor)).index;
  }
}
