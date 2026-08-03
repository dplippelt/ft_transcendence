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

  private setupEntranceRoom(graph: RoomGraph): Room {
    const candidates: Room[] = [...graph.keys()];
    for (const room of candidates) {
      room.cost = 5 + 10 - room.doors.length * 4; // TODO: hard-coded values
    }

    const weights: weight[] = candidates.map((room, index) => ({ index: index, weight: room.cost }));
    const entranceRoom = candidates[weightedRandom(weights).index];
    entranceRoom.type = RoomType.Entrance;
    entranceRoom.tileNode = {
      position: this.pickRandomRoomTile(entranceRoom), // TODO: Same constraint as with exit
      type: TileNodeType.EnterPoint
    };
    return entranceRoom;
  }

  private setupExitRoom(entrance: Room, graph: RoomGraph): Room {
    for (const room of graph.keys()) {
      room.visited = false;
      room.cost = 0;
    }

    const candidates: Room[] = [];
    const queue: Room[] = [entrance, ];
    entrance.visited = true;

    while (queue.length > 0) {
      const room: Room = queue.shift()!;
      const neighbors = graph.get(room)!.values();
      for (const neighbor of neighbors) {
        if (neighbor.visited) {
          continue;
        }

        neighbor.visited = true;
        neighbor.cost = room.cost + 2;
        if (graph.get(neighbor)!.size > 1) {
          queue.push(neighbor);
        } else {
          neighbor.cost += room.cost === 0 ? 2 : 10; // TODO other considerations: room size
          candidates.push(neighbor);
        }
      }
    }

    const exitWeights: weight[] = candidates.map((value, index) => ({ index: index, weight: value.cost }));
    const exitRoom = candidates[weightedRandom(exitWeights).index];
    exitRoom.type = RoomType.Exit;
    exitRoom.tileNode = {
      position: this.pickRandomRoomTile(exitRoom), // TODO: Put the exit point in the center of the room instead
      type: TileNodeType.ExitPoint
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
        type: TileNodeType.SpawnPoint
      };
    }
  }
}
