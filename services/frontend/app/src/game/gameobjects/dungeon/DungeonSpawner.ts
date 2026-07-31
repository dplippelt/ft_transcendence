import { GameObjects, Physics, Scene } from "phaser";
import { TileNodeType, type RoomGraph, type Room } from "../../map/procedural";
import { Dungeon } from "./Dungeon";
import Player from "../Player";
import { Enemy } from "../Enemy";
import { playerOne } from "../../components/KeyboardComponent";

class ExitPoint extends GameObjects.Zone {
  // further setup required...
}

export class DungeonSpawner {
  private players: Player[];
  private enemies: Enemy[];
  private dynamics: Physics.Arcade.Group;
  private exitPoint: ExitPoint | undefined;

  constructor(scene: Scene) {
    this.players = [];
    this.enemies = [];
    this.dynamics = scene.physics.add.group();
    this.exitPoint = undefined;
  }

  getPlayer(index: number): Player | undefined {
    if (index < 0 || index > this.players.length) {
      return undefined;
    }
    return this.players[index];
  }

  // TODO: additional context about the type of player (local, online) and enemies (if multiple exists)
  // amount of enemies and players...
  apply(dungeon: Dungeon, graph: RoomGraph) {
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

  clear() {
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];
    this.players.forEach((player) => player.destroy());
    this.players = [];
    this.dynamics.clear();
    this.exitPoint?.destroy();
  }

  private spawnPlayers(dungeon: Dungeon, room: Room) {
    const tilePosition = room.tileNode?.position;
    console.assert(tilePosition !== undefined, "WHAT?");
    console.assert(dungeon !== undefined, "WHAT?");

    const worldPoint = dungeon.tileToWorldXY(tilePosition!.x + 0.5, tilePosition!.y + 0.5);
    if (worldPoint === null) {
      throw new Error(`Invalid tile position: ${tilePosition}`)
    }

    const player = new Player(dungeon.scene, playerOne, {
      dungeon: dungeon,
      startingRoom: room,
      spawnPoint: worldPoint
    });
    dungeon.addColliderWithMap(player);
    this.players.push(player);
    this.dynamics.add(player);
  }

  private spawnEnemy(dungeon: Dungeon, room: Room) {
    const tilePosition = room.tileNode?.position;
    const worldPoint = dungeon.tileToWorldXY(tilePosition!.x + 0.5, tilePosition!.y + 0.5);
    if (worldPoint === null) {
      throw new Error(`Invalid tile position: ${tilePosition}`)
    }

    const enemy = Enemy.createSkeletonEnemy(dungeon.scene, {
      dungeon: dungeon,
      startingRoom: room,
      spawnPoint: worldPoint
    });
    this.enemies.push(enemy);

    // TODO: exclude entrance and exit
    // for (let i: number = 0; i < count; ++i) {
    //   const spawn: SpawnLocation = this.getRandomWalkableTile();
    //   this.enemies.push(Enemy.createSkeletonEnemy(this.scene, spawn));
    // }
  }

  private spawnExitNode(dungeon: Dungeon, room: Room) {
    // do nothing...
  }
}
