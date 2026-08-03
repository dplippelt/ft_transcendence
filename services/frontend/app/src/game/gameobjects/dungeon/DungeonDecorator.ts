import { Tilemaps } from "phaser";
import { RoomType, type RoomGraph, type Room } from "../../map/procedural";
import { PassageType, type TileSetMap } from "../../map/TileSetMap";
import { Dungeon } from "./Dungeon";
import { random, randomPoint, Vector2, weightedRandom, type weight } from "../../map/math";

export class DungeonDecorator {
  static layerIndex: number = 0;

  apply(dungeon: Dungeon, roomGraph: RoomGraph, tileSet: Tilemaps.Tileset, tileSetMap: TileSetMap) {
    const baseLayer = dungeon.getLayer("map");
    if (baseLayer === null) {
      throw new Error("Missing base layer 'map'");
    }

    const layer = dungeon.createBlankLayer(
      `layer-${DungeonDecorator.layerIndex++}`,
      tileSet,
      -dungeon.getOrigin().x,
      -dungeon.getOrigin().y,
      baseLayer.width,
      baseLayer.height,
      baseLayer.tileWidth,
      baseLayer.tileHeight,
    );
    if (layer === null) {
      throw new Error("Unable to create a new black layer");
    }
    layer.setDepth(DungeonDecorator.layerIndex);
    layer.setScale(baseLayer.tilemapLayer.scale);

    for (const room of roomGraph.keys()) {
      switch (room.type) {
        case RoomType.Entrance:
          this.entranceRoom(layer, tileSetMap, room);
          break;
        case RoomType.Exit:
          this.exitRoom(layer, tileSetMap, room);
          break;
        case RoomType.Standard:
          this.standardRoom(layer, tileSetMap, room);
          break;
        default:
          throw new Error("DungeonDecorator: Unknown room type");
      }
    }

    dungeon.setLayer("map");
  }

  private pickRandomRoomTile(room: Room): Vector2 {
    return randomPoint(room.aabb.min.clone().addXY(1, 1), room.aabb.max.clone().subXY(2, 2));
  }

  private entranceRoom(layer: Tilemaps.TilemapLayer, tileSetMap: TileSetMap, room: Room) {
    const position = room.tileNode?.position;
    layer.putTileAt(tileSetMap.passages[PassageType.StairwayUp], position!.x, position!.y);
  }

  private exitRoom(layer: Tilemaps.TilemapLayer, tileSetMap: TileSetMap, room: Room) {
    const position = room.tileNode?.position;
    layer.putTileAt(tileSetMap.passages[PassageType.StairwayDown], position!.x, position!.y);
  }

  private standardRoom(layer: Tilemaps.TilemapLayer, tileSetMap: TileSetMap, room: Room) {
    if (Math.random() < .6) {
      return;
    }

    const weights: weight[] = Object.values(tileSetMap.foilage);
    let count: number = random(1, 5);
    while (count-- > 0) {
      let tileXY = this.pickRandomRoomTile(room);
      while (layer.getTileAt(tileXY.x, tileXY.y, true).index !== -1) {
        tileXY = this.pickRandomRoomTile(room);
      }

      layer.putTileAt(weightedRandom(weights).index, tileXY.x, tileXY.y)
    }
  }
}
