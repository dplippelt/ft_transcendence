import { GameObjects } from "phaser";
import { TileNodeType, type RoomGraph } from "../../map/procedural";
import type { Dungeon } from "./Dungeon";

class ExitPoint extends GameObjects.Zone {
  // further setup required...
}

export class DungeonSpawner {
  players: Player[] = [];
  enemies: Enemy[] = [];
  exitPoint!: ExitPoint;

  // TODO: additional context about the type of player (local, online) and enemies (if multiple exists)
  apply(dungeon: Dungeon, graph: RoomGraph, context?: unknown) {
    for (const room of graph.keys()) {
      switch (room.tileNode!.type) {
        case TileNodeType.EnterPoint:
          this.spawnPlayers(dungeon, room);
          break;
        case TileNodeType.SpawnPoint:
          this.spawnEnemy(dungeon, room);
          break;
        case TileNodeType.ExitPoint:
          this.spawnExitNode(dungeon, room);
          break;
        default:
          throw new Error(`${room.tileNode} is not implemented`);
      }
    }
  }

  private spawnPlayers(dungeon: Dungeon, room: Room) {

  }

  private spawnEnemy(dungeon: Dungeon, room: Room) {

  }

  private spawnExitNode(dungeon: Dungeon, room: Room) {

  }
}
