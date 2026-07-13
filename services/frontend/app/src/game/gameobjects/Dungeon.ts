import { Physics, Scene, Tilemaps, Math as pMath } from "phaser";
import { AssetsKey } from "../Assets";
import { dungeonBuilder, type DungeonConfig, type MapData, type Room } from "../map/procedural";

export class Dungeon extends Tilemaps.Tilemap {
  origin!: pMath.Vector2;
  scale: number;
  mapData!: MapData;
  tileSet: Tilemaps.Tileset;
  mapColliders: Physics.Arcade.Collider[];

  constructor(scene: Scene, dungeonConfig: DungeonConfig, scale: number = 1.0) {
    super(scene, new Tilemaps.MapData({ tileWidth: 16, tileHeight: 16 }));

    const tileSet = this.addTilesetImage(AssetsKey.TileSet);
    if (tileSet === null) {
      throw new TypeError(`Failed to set ${AssetsKey.TileSet} as Tileset image`);
    }

    this.scale = scale;
    this.tileSet = tileSet;
    this.mapColliders = [];
    this.generate(dungeonConfig);
  }

  generate(dungeonConfig: DungeonConfig) {
    this.mapColliders.forEach((col) => col.destroy());
    this.mapColliders = [];
    this.removeAllLayers();
    this.mapData = dungeonBuilder(dungeonConfig);
    this.origin = new pMath.Vector2(
      (this.scene.scale.width - this.mapData.width * this.tileWidth * this.scale) * 0.5,
      (this.scene.scale.height - this.mapData.height * this.tileHeight * this.scale) * 0.5,
    );
    const layer = this.createBlankLayer(
      "map",
      this.tileSet,
      this.origin.x,
      this.origin.y,
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

  insertSprite(object: Physics.Arcade.Sprite, hasLayerCollision: boolean = false, depthOffset: number = 0) {
    const room: Room = pMath.RND.pick(this.mapData.rooms);
    const [x, y] = room.aabb.min
      .clone()
      .addXY(1.5, 1.5)
      .scale(16 * this.scale)
      .addXY(this.origin.x, this.origin.y)
      .unpack();
    object.setPosition(x, y);

    const layer = this.getLayer(0)?.tilemapLayer;
    if (layer === undefined) {
      return;
    }
    object.setDepth(layer.depth + 1 + depthOffset);

    if (hasLayerCollision) {
      this.mapColliders.push(this.scene.physics.add.collider(object, layer));
    }
  }
}
