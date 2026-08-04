import { Physics, Scene, Tilemaps, type Types } from "phaser";
import { AssetsKey } from "../../Assets";
import { dungeonBuilder, type DungeonConfig, type MapData, type Room } from "../../map/procedural";
import { Vector2 } from "../../map/math";
import Player from "../Player";
import { type TileSetMap } from "../../map/TileSetMap";
import { RoomSetup } from "./RoomSetup";
import { DungeonSpawner } from "./DungeonSpawner";
import type { Enemy } from "../Enemy";
import { Passage } from "../Passage";
import type { ExitZone } from "./ExitZone";
import { EnemyFactory, PassageFactory, PlayerFactory } from "./factories";
import { DungeonDecorator } from "./DungeonDecorator";

type Vector2Like = Types.Math.Vector2Like;

export interface SpawnLocation {
  spawnPoint: Vector2Like;
  startingRoom: Room;
  dungeon: Dungeon;
}

interface TileSize {
  size: Vector2;
  invSize: Vector2;
}

interface MapTransform {
  origin: Vector2;
  tileSize: TileSize;
  tileWidth: number;
  tileHeight: number;
  scale: number;
}

export class Dungeon extends Tilemaps.Tilemap {
  private _mapTransform!: MapTransform;
  private mapData!: MapData;
  private tileSetMap: TileSetMap;
  private tileSet: Tilemaps.Tileset;
  private mapColliders: Physics.Arcade.Collider[];
  private roomSetup: RoomSetup;
  private spawner: DungeonSpawner;
  private decorator: DungeonDecorator;

  private enemies: Enemy[];
  private playerGroup: Physics.Arcade.Group;
  private exitPoint: ExitZone | undefined;
  private passage: Passage | undefined;

  constructor(scene: Scene, dungeonConfig: DungeonConfig, scale: number = 1.0, tileSize: number = 16) {
    super(scene, new Tilemaps.MapData({ tileWidth: tileSize, tileHeight: tileSize }));

    const tileSet = this.addTilesetImage(AssetsKey.TileSet);
    if (tileSet === null) {
      throw new TypeError(`Failed to set ${AssetsKey.TileSet} as Tileset image`);
    }
    this.tileSet = tileSet;

    this.roomSetup = new RoomSetup();
    this.spawner = new DungeonSpawner(this, new PlayerFactory(), new EnemyFactory(), new PassageFactory());
    this.decorator = new DungeonDecorator();

    this.tileSetMap = dungeonConfig.emptyRoomConfig.tileSetMap;
    this.mapColliders = [];
    this.enemies = [];
    this.playerGroup = scene.physics.add.group();
    this.exitPoint = undefined;
    this.passage = undefined;

    this.build(dungeonConfig, scale);
  }

  getTileSize(): Readonly<Vector2Like> {
    return this._mapTransform.tileSize.size;
  }

  getScale(): number {
    return this._mapTransform.scale;
  }

  getOrigin(): Readonly<Vector2Like> {
    return this._mapTransform.origin;
  }

  getTileWidth(): number {
    return this._mapTransform.tileWidth;
  }

  getTileHeight(): number {
    return this._mapTransform.tileHeight;
  }

  getTileSet(): Tilemaps.Tileset {
    return this.tileSet;
  }

  build(dungeonConfig: DungeonConfig, scale: number = 1.0) {
    this.clear();

    this.constructMap(dungeonConfig);
    this.constuctMapTransform(scale);
    this.roomSetup.apply(this.mapData.graph);
    this.decorator.apply(this, this.mapData, this.tileSetMap);
    this.spawner.apply(this.mapData.graph);
  }

  private clear() {
    this.mapColliders.forEach((col) => col.destroy());
    this.mapColliders = [];
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];
    this.playerGroup.clear(true, true);

    this.exitPoint?.destroy();
    this.exitPoint = undefined;
    this.passage?.destroy();
    this.passage = undefined;

    this.removeAllLayers();
  }

  private constructMap(dungeonConfig: DungeonConfig) {
    this.mapData = dungeonBuilder(dungeonConfig);
    if (this.mapData.rooms.length < 3) {
      throw new Error("Invalid Dungeon layout. Not Enough rooms");
    }
  }

  private constuctMapTransform(scale: number) {
    this._mapTransform = {
      origin: new Vector2(
        this.mapData.width * this.tileWidth * scale * 0.5,
        this.mapData.height * this.tileHeight * scale * 0.5,
      ),
      tileSize: {
        size: new Vector2(this.tileWidth * scale, this.tileHeight * scale),
        invSize: new Vector2(1.0 / (this.tileWidth * scale), 1.0 / (this.tileHeight * scale)),
      },
      scale: scale,
      tileWidth: this.mapData.width,
      tileHeight: this.mapData.height,
    };
  }

  transformPointToLocal(point: Vector2) {
    return point.clone().add(this._mapTransform.origin).mul(this._mapTransform.tileSize.invSize).floor();
  }

  transformPointToWorld(point: Vector2) {
    return point.clone().mul(this._mapTransform.tileSize.size).sub(this._mapTransform.origin);
  }

  private addColliderWithMap(object: Physics.Arcade.Sprite, depthOffset: number = 0) {
    const layer = this.getLayer(0)?.tilemapLayer;
    if (layer === undefined) {
      return;
    }
    object.setDepth(layer.depth + 1 + depthOffset);
    this.mapColliders.push(this.scene.physics.add.collider(object, layer));
  }

  findRoom(localPoint: Vector2): Room | undefined {
    return this.mapData.rooms.find((room) => room.aabb.isPointWithin(localPoint));
  }

  getPlayer(index: number): Player | undefined {
    return this.playerGroup.getFirstNth(index, true, false);
  }

  getAlivePlayerCount(): number {
    return (this.playerGroup.getChildren() as Player[]).reduce((aliveCount, player) => {
      return player.isAlive ? aliveCount + 1 : aliveCount;
    }, 0);
  }

  getEnemyCount(): number {
    return this.enemies.reduce((aliveCount, enemy) => {
      if (enemy.isAlive) {
        ++aliveCount;
      }
      return aliveCount;
    }, 0);
  }

  addPlayer(player: Player): void {
    this.addColliderWithMap(player, 5);
    this.playerGroup.add(player);
  }

  addEnemy(enemy: Enemy): void {
    enemy.setDepth(5);
    this.enemies.push(enemy);
  }

  addDoor(door: Passage): void {
    if (this.passage !== undefined) {
      throw new Error("There can only be one door per dungeon");
    }

    door.collideWithGroup(this.playerGroup);
    this.passage = door;
  }

  addExit(exit: ExitZone): void {
    if (this.exitPoint !== undefined) {
      throw new Error("There can only be one exit per dungeon");
    }

    exit.overlapWithGroup(this.playerGroup);
    this.exitPoint = exit;
  }
}
