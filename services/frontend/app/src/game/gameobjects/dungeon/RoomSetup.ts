import { type RoomGraph, type Room, RoomType, TileNodeType } from "../../map/procedural";
import { Vector2, randomPoint, weightedRandom, type weight } from "../../map/math";

export class RoomSetup {
  apply(graph: RoomGraph) {
    const entrance = this.setupEntranceRoom(graph);
    this.setupExitRoom(entrance, graph);
    this.setupStandardRooms(graph);
  }

  private pickRandomRoomTile(room: Room): Vector2 {
    return randomPoint(room.aabb.min.clone().addXY(1, 1), room.aabb.max.clone().subXY(2, 2));
  }

  private calculateEntranceWeights(candidates: Room[], maxSize: number, maxDoorCount: number): weight[] {
    const sizeWeight: number = 0.3;
    const doorWeight: number = 0.7;

    for (const room of candidates) {
      room.score =
        sizeWeight * (1.0 - (room.aabb.size.x * room.aabb.size.y) / maxSize) +
        doorWeight * (1.0 - room.doors.length / maxDoorCount);
    }
    return candidates.map((value, index) => ({ index: index, weight: value.score }));
  }

  private setupEntranceRoom(graph: RoomGraph): Room {
    let maxDoorCount = 1;
    let maxSize = 1;
    const candidates: Room[] = [];
    for (const room of graph.keys()) {
      if (room.doors.length > maxDoorCount) {
        maxDoorCount = room.doors.length;
      }
      if (room.aabb.size.x * room.aabb.size.y > maxSize) {
        maxSize = room.aabb.size.x * room.aabb.size.y;
      }
      candidates.push(room);
    }

    const weights: weight[] = this.calculateEntranceWeights(candidates, maxSize, maxDoorCount);
    const entranceRoom = candidates[weightedRandom(weights).index];
    entranceRoom.type = RoomType.Entrance;
    entranceRoom.tileNode = {
      position: this.pickRandomRoomTile(entranceRoom), // TODO: Same constraint as with exit
      type: TileNodeType.EnterPoint,
    };
    return entranceRoom;
  }

  private calculateExitWeights(candidates: Room[], maxDepth: number, maxSize: number): weight[] {
    const depthWeight: number = 0.8;
    const sizeWeight: number = 0.2;

    for (const room of candidates) {
      room.score =
        depthWeight * Math.sqrt(room.score / maxDepth) +
        sizeWeight * (1.0 - (room.aabb.size.x * room.aabb.size.y) / maxSize);
    }
    return candidates.map((value, index) => ({ index: index, weight: value.score }));
  }

  private setupExitRoom(entrance: Room, graph: RoomGraph): Room {
    for (const room of graph.keys()) {
      room.visited = false;
      room.score = 0;
    }

    let maxDepth: number = 1;
    let maxSize: number = 1;
    const candidates: Room[] = [];
    const queue: Room[] = [entrance];
    entrance.visited = true;

    while (queue.length > 0) {
      const room: Room = queue.shift()!;
      const neighbors = graph.get(room)!.values();
      for (const neighbor of neighbors) {
        if (neighbor.visited) {
          continue;
        }

        neighbor.visited = true;
        neighbor.score = room.score + 1;
        if (graph.get(neighbor)!.size > 1) {
          queue.push(neighbor);
        } else {
          if (neighbor.score > maxDepth) {
            maxDepth = neighbor.score;
          }
          if (neighbor.aabb.size.x * neighbor.aabb.size.y > maxSize) {
            maxSize = neighbor.aabb.size.x * neighbor.aabb.size.y;
          }
          candidates.push(neighbor);
        }
      }
    }

    const exitWeights: weight[] = this.calculateExitWeights(candidates, maxDepth, maxSize);
    const exitRoom = candidates[weightedRandom(exitWeights).index];
    exitRoom.type = RoomType.Exit;
    exitRoom.tileNode = {
      position: this.pickRandomRoomTile(exitRoom), // TODO: Put the exit point in the center of the room instead
      type: TileNodeType.ExitPoint,
    };
    return exitRoom;
  }

  private setupStandardRooms(graph: RoomGraph) {
    for (const room of graph.keys()) {
      if (room.type === RoomType.Entrance || room.type === RoomType.Exit) {
        continue;
      }

      room.type = RoomType.Standard;
      room.tileNode = {
        position: this.pickRandomRoomTile(room),
        type: TileNodeType.SpawnPoint,
      };
    }
  }
}
