import Player from "../Player";
import { Enemy, skeletonData } from "../Enemy";
import { ExitZone } from "./ExitZone";
import { Passage } from "./Passage";
import type { SpawnLocation } from "./Dungeon";
import { playerOne, playerTwo } from "../../components/KeyboardComponent";
import { Direction } from "../../map/procedural";
import { AssetsKey } from "../../Assets";

export class PlayerFactory {
  createPlayer(index: number, spawnLocation: SpawnLocation): Player {
    if ( index === 0 )
      return new Player(spawnLocation.dungeon.scene, playerOne, spawnLocation);
    return new Player(spawnLocation.dungeon.scene, playerTwo, spawnLocation);
  }
}

export class EnemyFactory {
  createEnemy(spawnLocation: SpawnLocation): Enemy {
    return new Enemy(spawnLocation.dungeon.scene, spawnLocation, skeletonData);
  }
}

export class PassageFactory {
  createFrontDoor(spawnLocation: SpawnLocation): Passage {
    return new Passage(
      spawnLocation.dungeon.scene,
      spawnLocation.spawnPoint,
      {
        frame: {
          open: 58,
          close: 59
        },
        scale: spawnLocation.dungeon.getScale(),
        spriteKey: AssetsKey.TileSet
      }
    );
  }

  createSideDoor(spawnLocation: SpawnLocation): Passage {
    return new Passage(
      spawnLocation.dungeon.scene,
      spawnLocation.spawnPoint,
      {
        frame: {
          open: 60,
          close: 61
        },
        scale: spawnLocation.dungeon.getScale(),
        spriteKey: AssetsKey.TileSet
      }
    ).setFlipX(spawnLocation.startingRoom.doors[0].direction === Direction.Right);
  }

  createExit(spawnLocation: SpawnLocation): ExitZone {
    return new ExitZone(
      spawnLocation.dungeon.scene,
      spawnLocation.spawnPoint,
      spawnLocation.dungeon.getTileSize()
    );
  }
}
