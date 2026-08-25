import { Math as PhaserMath, type Types } from "phaser";
import { TileNodeType, type RoomGraph, type Room, Direction } from "../../map/procedural";
import { Dungeon } from "./Dungeon";
import { PlayerFactory, EnemyFactory, PassageFactory } from "./factories";
import type { Passage } from "./Passage";
import { GameMode, RegistryKey } from "../../../utils/utils";

type Vector2Like = Types.Math.Vector2Like;

export class DungeonSpawner {
  private _dungeon: Dungeon;
  private _playerFactory: PlayerFactory;
  private _enemyFactory: EnemyFactory;
  private _passageFactory: PassageFactory;

  constructor(
    dungeon: Dungeon,
    playerFactory: PlayerFactory,
    enemyFactory: EnemyFactory,
    passageFactory: PassageFactory,
  ) {
    this._dungeon = dungeon;
    this._playerFactory = playerFactory;
    this._enemyFactory = enemyFactory;
    this._passageFactory = passageFactory;
  }

  apply(graph: RoomGraph): void {
    for (const room of graph.keys()) {
      switch (room.tileNode!.type) {
        case TileNodeType.EnterPoint:
          this.spawnPlayers(room);
          break;
        case TileNodeType.SpawnPoint:
          this.spawnEnemy(room);
          break;
        case TileNodeType.ExitPoint:
          this.spawnExitNode(room);
          this.spawnDoor(room);
          break;
        default:
          throw new Error(`${room.tileNode} is not implemented`);
      }
    }
  }

  private tileToWorldPosition(tilePosition: Vector2Like): Vector2Like {
    const worldPoint = this._dungeon.tileToWorldXY(tilePosition.x + 0.5, tilePosition.y + 0.5);
    if (worldPoint === null) {
      throw new Error(`Invalid tile position: ${tilePosition}`);
    }
    return worldPoint;
  }

  private spawnPlayers(room: Room) {
    const gameMode = this._dungeon.scene.registry.get(RegistryKey.mode);
    const spawnLocation = {
      dungeon: this._dungeon,
      startingRoom: room,
      spawnPoint: this.tileToWorldPosition(room.tileNode!.position),
    }

    const player_1 = this._playerFactory.createPlayer(0, spawnLocation);
    this._dungeon.addPlayer(player_1);

    if ( gameMode === GameMode.coop ) {
      const player_2 = this._playerFactory.createPlayer(1, spawnLocation);
      this._dungeon.addPlayer(player_2);
      player_1.movement.setTetherTarget(() => new PhaserMath.Vector2(player_2.x, player_2.y));
      player_2.movement.setTetherTarget(() => new PhaserMath.Vector2(player_1.x, player_1.y));
    }
  }

  private spawnEnemy(room: Room) {
    const enemy = this._enemyFactory.createEnemy({
      dungeon: this._dungeon,
      startingRoom: room,
      spawnPoint: this.tileToWorldPosition(room.tileNode!.position),
    });
    this._dungeon.addEnemy(enemy);
  }

  private spawnExitNode(room: Room) {
    const exitPoint = this._passageFactory.createExit({
      dungeon: this._dungeon,
      startingRoom: room,
      spawnPoint: this.tileToWorldPosition(room.tileNode!.position),
    });
    this._dungeon.addExit(exitPoint);
  }

  private spawnDoor(room: Room) {
    const roomDoor = room.doors[0];
    let door: Passage;
    if (roomDoor.direction & (Direction.Top | Direction.Down)) {
      door = this._passageFactory.createFrontDoor({
        dungeon: this._dungeon,
        startingRoom: room,
        spawnPoint: this.tileToWorldPosition(roomDoor.position),
      });
    } else {
      door = this._passageFactory.createSideDoor({
        dungeon: this._dungeon,
        startingRoom: room,
        spawnPoint: this.tileToWorldPosition(roomDoor.position),
      });
    }
    this._dungeon.addDoor(door);
  }
}
