import { Physics, Scene, Tilemaps, Math as pMath } from "phaser";
import { AssetsKey } from "../Assets";
import { dungeonBuilder, type DungeonConfig, type MapData, type Room } from "../map/procedural";
import { Enemy } from "./Enemy";
import { randomPoint, Vector2 } from "../map/math";
import Player from "./Player";
import { playerOne } from "../components/KeyboardComponent";

interface ITileLocation {
  position: Vector2;
  room: Room;
}

interface TileSize {
  size: Vector2;
  invSize: Vector2;
}

export class Dungeon extends Tilemaps.Tilemap {
  origin: Vector2;
  scale: number;
  mapData!: MapData;
  tileSet: Tilemaps.Tileset;
  tileSize: TileSize;
  mapColliders: Physics.Arcade.Collider[];
  enemies: Enemy[];
  players: Player[];

  constructor(scene: Scene, dungeonConfig: DungeonConfig, scale: number = 1.0, tileSize: number = 16) {
    super(scene, new Tilemaps.MapData({ tileWidth: tileSize, tileHeight: tileSize }));

    const tileSet = this.addTilesetImage(AssetsKey.TileSet);
    if (tileSet === null) {
      throw new TypeError(`Failed to set ${AssetsKey.TileSet} as Tileset image`);
    }

    this.origin = new Vector2(0, 0);
    this.scale = scale;
    this.tileSet = tileSet;
    this.mapColliders = [];
    this.enemies = [];
    this.players = [];
    this.tileSize = {
      size: new Vector2(this.tileWidth * this.scale, this.tileHeight * this.scale),
      invSize: new Vector2(1.0 / (this.tileWidth * this.scale), 1.0 / (this.tileWidth * this.scale)),
    };

    this.build(dungeonConfig);
    if (this.mapData.rooms.length < 3) {
      throw new Error("Invalid Dungeon layout. Not Enough rooms");
    }

    // DEBUG
    const rect = scene.add.rectangle(
      0,
      0,
      this.mapData.width * this.tileWidth * this.scale,
      this.mapData.height * this.tileHeight * this.scale,
      0x55111111,
    );
    rect.setDepth(-10);
    const circ = scene.add.circle(0, 0, 8, 0x00ff00);
    circ.setDepth(50);
    // END DEBUG
  }

  build(dungeonConfig: DungeonConfig) {
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];
    this.players.forEach((player) => player.destroy());
    this.players = [];
    this.mapColliders.forEach((col) => col.destroy());
    this.mapColliders = [];
    this.removeAllLayers();

    this.generate(dungeonConfig);
    this.spawnPlayers(1); // TODO: Hard-coded...
    this.spawnEnemies(this.mapData.rooms.length - 2);
  }

  generate(dungeonConfig: DungeonConfig) {
    this.mapData = dungeonBuilder(dungeonConfig);
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

  getRandomWalkableTile(): ITileLocation {
    const room: Room = pMath.RND.pick(this.mapData.rooms);
    const point = randomPoint(room.aabb.min.clone().addXY(1, 1), room.aabb.max.clone().subXY(2, 2));

    return {
      position: this.transformPointToWorld(point.addXY(0.5, 0.5)),
      room: room,
    };
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

  spawnPlayers(count: number) { // TODO: Only spawn within the entrance room
    for (let i: number = 0; i < count; ++i) {
      const spawn: ITileLocation = this.getRandomWalkableTile();
      const player = new Player(this.scene, spawn.position.x, spawn.position.y, playerOne, spawn.room, this);
      this.addColliderWithMap(player, 5);
      this.players.push(player);
    }
  }

  spawnEnemies(count: number): void { // TODO: exclude entrance and exit
    // TODO: enemies should not spawn on the same tile...
    for (let i: number = 0; i < count; ++i) {
      const spawn: ITileLocation = this.getRandomWalkableTile();
      this.enemies.push(new Enemy(this.scene, spawn.position.x, spawn.position.y, spawn.room, this));
    }
  }

  findRoom(localPoint: Vector2): Room | undefined {
    return this.mapData.rooms.find((room) => room.aabb.isPointWithin(localPoint));
  }
}
