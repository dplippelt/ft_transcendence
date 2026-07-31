import { Physics, Scene, type Types } from "phaser";
import { TileNodeType, type RoomGraph, type Room, Direction } from "../../map/procedural";
import { Dungeon } from "./Dungeon";
import Player from "../Player";
import { Enemy } from "../Enemy";
import { playerOne } from "../../components/KeyboardComponent";
import { ExitZone } from "./ExitZone";
import { Passage } from "../Passage";
import { AssetsKey } from "../../Assets";

type Vector2Like = Types.Math.Vector2Like;

export class DungeonSpawner {
  private players: Player[];
  private enemies: Enemy[];
  private playerGroup: Physics.Arcade.Group;
  private exitPoint: ExitZone | undefined;
  private passage: Passage | undefined;

  constructor(scene: Scene) {
    this.players = [];
    this.enemies = [];
    this.playerGroup = scene.physics.add.group();
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
  apply(dungeon: Dungeon, graph: RoomGraph): void {
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
          this.spawnPassage(dungeon, room);
          break;
        default:
          throw new Error(`${room.tileNode} is not implemented`);
      }
    }
  }

  clear(): void {
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];
    this.players.forEach((player) => player.destroy());
    this.players = [];
    this.playerGroup.clear();
    this.exitPoint?.destroy();
    this.passage?.destroy();
  }

  private tileToWorldPosition(dungeon: Dungeon, tilePosition: Vector2Like): Vector2Like {
    const worldPoint = dungeon.tileToWorldXY(tilePosition.x + 0.5, tilePosition.y + 0.5);
    if (worldPoint === null) {
      throw new Error(`Invalid tile position: ${tilePosition}`);
    }
    return worldPoint;
  }

  private spawnPlayers(dungeon: Dungeon, room: Room) {
    const player = new Player(dungeon.scene, playerOne, {
      dungeon: dungeon,
      startingRoom: room,
      spawnPoint: this.tileToWorldPosition(dungeon, room.tileNode!.position),
    });
    dungeon.addColliderWithMap(player);
    this.players.push(player);
    this.playerGroup.add(player);
  }

  private spawnEnemy(dungeon: Dungeon, room: Room) {
    const enemy = Enemy.createSkeletonEnemy(dungeon.scene, {
      dungeon: dungeon,
      startingRoom: room,
      spawnPoint: this.tileToWorldPosition(dungeon, room.tileNode!.position),
    });
    this.enemies.push(enemy);
  }

  private spawnExitNode(dungeon: Dungeon, room: Room) {
    const tileSize = dungeon.getTileSize();
    const exitPoint = new ExitZone(
      dungeon.scene,
      this.tileToWorldPosition(dungeon, room.tileNode!.position),
      { x: tileSize.size.x, y: tileSize.size.y },
      this.playerGroup,
    );
    this.exitPoint = exitPoint;
  }

  private spawnPassage(dungeon: Dungeon, room: Room) {
    const door = room.doors[0];
    const doorPosition = this.tileToWorldPosition(dungeon, door.position);

    // door side/front selection needed and change frame index
    const passage = new Passage(
      dungeon.scene,
      doorPosition.x,
      doorPosition.y,
      {
        direction: Direction.Top,
        frameIndex: {open: 59, close: 58 },
        scale: dungeon.getScale(),
        spriteKey: AssetsKey.TileSet,
      },
      this.playerGroup,
    );
    this.passage = passage;
  }
}
