import { BoundingBox, Vector2, randomPoint, weightedRandom, type weight } from "./math";
import { RoomType, Tile, TileNodeType, type Room, type TileNode } from "./DungeonModels";
import type { RoomNode } from "./RoomGraph";
import type { Map } from "./MapBuilder";

export class RoomSetup {
  apply(map: Map): void {
    const entrance = this.setupEntranceRoom(map);
    this.setupExitRoom(entrance, map);
    this.setupStandardRooms(map);
  }

  private isInFrontDoor(tile: Vector2, room: Room): boolean {
    for (const door of room.doors) {
      if ((door.position.x === tile.x && Math.abs(tile.y - door.position.y) < 2)
        || (door.position.y === tile.y && Math.abs(tile.x - door.position.x) < 2)) {
        return true;
      }
    }
    return false;
  }

  private pickRandomRoomTile(room: Room): Vector2 {
    const innerRoom: BoundingBox = room.aabb.clone().shrink();
    const hasFreeSpot = Boolean(Math.max(0, innerRoom.area() - room.doors.length));

    let tile = randomPoint(innerRoom.min, innerRoom.max);
    while (this.isInFrontDoor(tile, room) && hasFreeSpot) {
      tile = randomPoint(innerRoom.min, innerRoom.max);
    }
    return tile;
  }

  private calculateEntranceWeights(candidates: RoomNode[], maxSize: number, maxDoorCount: number): weight[] {
    const sizeWeight: number = 0.3;
    const doorWeight: number = 0.7;

    for (const node of candidates) {
      node.score =
        sizeWeight * (1.0 - node.room.aabb.area() / maxSize) +
        doorWeight * (1.0 - node.room.doors.length / maxDoorCount);
    }
    return candidates.map((value, index) => ({ index: index, weight: value.score }));
  }

  private insertTileNode(map: number[][], tileNode: TileNode): void {
    const [x, y] = tileNode.position.unpack();
    switch (tileNode.type) {
      case TileNodeType.EnterPoint:
        map[y][x] = Tile.ENTER;
        break;
      case TileNodeType.ExitPoint:
        map[y][x] = Tile.EXIT;
        break;
      case TileNodeType.SpawnPoint:
        map[y][x] = Tile.SPAWN;
        break;
      default:
        break;
    }
  }

  private setupEntranceRoom(map: Map): RoomNode {
    let maxDoorCount = 1;
    let maxSize = 1;
    const candidates: RoomNode[] = [];

    for (const node of map.roomGraph.graph.keys()) {
      maxDoorCount = Math.max(maxDoorCount, node.room.doors.length);
      maxSize = Math.max(maxSize, node.room.aabb.area());
      candidates.push(node);
    }

    const weights: weight[] = this.calculateEntranceWeights(candidates, maxSize, maxDoorCount);
    const entranceRoomNode = candidates[weightedRandom(weights).index];
    entranceRoomNode.room.type = RoomType.Entrance;
    entranceRoomNode.room.tileNode = {
      position: this.pickRandomRoomTile(entranceRoomNode.room),
      type: TileNodeType.EnterPoint,
    };

    this.insertTileNode(map.map, entranceRoomNode.room.tileNode)
    return entranceRoomNode;
  }

  private calculateExitWeights(candidates: RoomNode[], maxDepth: number, maxSize: number): weight[] {
    const depthWeight: number = 0.8;
    const sizeWeight: number = 0.2;

    for (const node of candidates) {
      node.score =
        depthWeight * Math.sqrt(node.score / maxDepth) +
        sizeWeight * (1.0 - node.room.aabb.area() / maxSize);
    }
    return candidates.map((value, index) => ({ index: index, weight: value.score }));
  }

  private setupExitRoom(entrance: RoomNode, map: Map): RoomNode {
    map.roomGraph.resetNodes();
    entrance.visited = true;

    let maxDepth: number = 1;
    let maxSize: number = 1;
    const candidates: RoomNode[] = [];

    const queue: RoomNode[] = [entrance];
    while (queue.length > 0) {
      const currentNode: RoomNode = queue.shift()!;
      const neighbors = map.roomGraph.get(currentNode)!.values();
      for (const neighbor of neighbors) {
        if (neighbor.visited) {
          continue;
        }

        neighbor.visited = true;
        neighbor.score = currentNode.score + 1;
        if (map.roomGraph.get(neighbor)!.size > 1) {
          queue.push(neighbor);
          continue;
        }

        maxDepth = Math.max(maxDepth, neighbor.score);
        maxSize = Math.max(maxSize, neighbor.room.aabb.area());
        candidates.push(neighbor);
      }
    }

    const exitWeights: weight[] = this.calculateExitWeights(candidates, maxDepth, maxSize);
    const exitRoomNode = candidates[weightedRandom(exitWeights).index];
    exitRoomNode.room.type = RoomType.Exit;
    exitRoomNode.room.tileNode = {
      position: this.pickRandomRoomTile(exitRoomNode.room),
      type: TileNodeType.ExitPoint,
    };

    this.insertTileNode(map.map, exitRoomNode.room.tileNode)
    return exitRoomNode;
  }

  private setupStandardRooms(map: Map): void {
    for (const node of map.roomGraph.graph.keys()) {
      const room = node.room;
      if (room.type !== RoomType.None) {
        continue;
      }

      room.type = RoomType.Standard;
      room.tileNode = {
        position: this.pickRandomRoomTile(room),
        type: TileNodeType.SpawnPoint,
      };
      this.insertTileNode(map.map, room.tileNode);
    }
  }
}
