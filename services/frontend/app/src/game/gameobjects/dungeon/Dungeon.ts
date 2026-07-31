import { Physics, Scene, Tilemaps, type Types } from "phaser";
import { AssetsKey } from "../../Assets";
import { dungeonBuilder, type DungeonConfig, type MapData, type Room} from "../../map/procedural";
import { Vector2 } from "../../map/math";
import Player from "../Player";
import { type TileSetMap } from "../../map/TileSetMap";
import { RoomSetup } from "./RoomSetup";
import { DungeonSpawner } from "./DungeonSpawner";

export interface SpawnLocation {
  spawnPoint: Types.Math.Vector2Like;
  startingRoom: Room;
  dungeon: Dungeon;
}

interface TileSize {
  size: Vector2;
  invSize: Vector2;
}

export class Dungeon extends Tilemaps.Tilemap {
  private origin: Vector2;
  private scale: number;
  private mapData!: MapData;
  private tileSetMap: TileSetMap;
  private tileSet: Tilemaps.Tileset;
  private tileSize: TileSize;
  private mapColliders: Physics.Arcade.Collider[];
  private roomSetup: RoomSetup;
  private spawner: DungeonSpawner;

  constructor(scene: Scene, dungeonConfig: DungeonConfig, scale: number = 1.0, tileSize: number = 16) {
    super(scene, new Tilemaps.MapData({ tileWidth: tileSize, tileHeight: tileSize }));

    const tileSet = this.addTilesetImage(AssetsKey.TileSet);
    if (tileSet === null) {
      throw new TypeError(`Failed to set ${AssetsKey.TileSet} as Tileset image`);
    }

    this.origin = new Vector2(0, 0);
    this.scale = scale;
    this.tileSet = tileSet;
    this.tileSetMap = dungeonConfig.emptyRoomConfig.tileSetMap;
    this.mapColliders = [];
    this.tileSize = {
      size: new Vector2(this.tileWidth * this.scale, this.tileHeight * this.scale),
      invSize: new Vector2(1.0 / (this.tileWidth * this.scale), 1.0 / (this.tileHeight * this.scale)),
    };
    this.roomSetup = new RoomSetup();
    this.spawner = new DungeonSpawner(scene);

    this.build(dungeonConfig);
  }

  getTileSize(): TileSize {
    return this.tileSize;
  }

  getScale(): number {
    return this.scale;
  }

  private clear() {
    this.mapColliders.forEach((col) => col.destroy());
    this.mapColliders = [];
    this.spawner.clear();
    this.removeAllLayers();
  }

  build(dungeonConfig: DungeonConfig) {
    this.clear();
    this.mapData = dungeonBuilder(dungeonConfig);
    if (this.mapData.rooms.length < 3) {
      throw new Error("Invalid Dungeon layout. Not Enough rooms");
    }

    this.roomSetup.apply(this.mapData.graph);
    this.createLevelLayer();
    // eslint-disable-next-line prefer-spread
    this.spawner.apply(this, this.mapData.graph);
  }

  private createLevelLayer() {
    this.origin.x = this.mapData.width * this.tileWidth * this.scale * 0.5;
    this.origin.y = this.mapData.height * this.tileHeight * this.scale * 0.5;

    const layer = this.createBlankLayer(
      "map",
      this.tileSet,
      -this.origin.x,
      -this.origin.y,
      this.mapData.width,
      this.mapData.height,
    );
    if (layer === null) {
      throw new TypeError("Failed to create blank layer");
    }
    layer.putTilesAt(this.mapData.map, 0, 0);
    layer.setDepth(-1);
    layer.setScale(this.scale);

    this.setCollisionBetween(2, 5);
    this.setCollisionBetween(15, 18);
    this.setCollisionBetween(28, 31);
    this.setCollisionBetween(41, 44);
  }

  transformPointToLocal(point: Vector2) {
    return point.clone().add(this.origin).mul(this.tileSize.invSize).floor();
  }

  transformPointToWorld(point: Vector2) {
    return point.clone().mul(this.tileSize.size).sub(this.origin);
  }

  addColliderWithMap(object: Physics.Arcade.Sprite, depthOffset: number = 0) {
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
    return this.spawner.getPlayer(index);
  }
}
