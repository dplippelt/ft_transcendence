import { Tilemaps } from "phaser";
import { RoomType, type RoomGraph, type Room, type MapData } from "../../map/procedural";
import { PassageType, type TileSetMap } from "../../map/TileSetMap";
import { Dungeon } from "./Dungeon";
import { random, randomPoint, Vector2, weightedRandom, type weight } from "../../map/math";
import { DepthOrder } from "../../Assets";

export class DungeonDecorator {
  apply(dungeon: Dungeon, mapData: MapData, tileSetMap: TileSetMap) {
    this.createLevelLayer(dungeon, mapData);
    this.createRoomLayer(dungeon, mapData.graph, tileSetMap);
    dungeon.setLayer("map");
  }

  private createBlankLayer(name: string, depth: number, dungeon: Dungeon): Tilemaps.TilemapLayer {
    const layer = dungeon.createBlankLayer(
      name,
      dungeon.getTileSet(),
      -dungeon.getOrigin().x,
      -dungeon.getOrigin().y,
      dungeon.getTileWidth(),
      dungeon.getTileHeight(),
    );

    if (layer === null) {
      throw new TypeError("Failed to create blank layer");
    }

    layer.setDepth(depth);
    layer.setScale(dungeon.getScale());
    return layer;
  }

  private createLevelLayer(dungeon: Dungeon, mapData: MapData) {
    const layer = this.createBlankLayer("map", DepthOrder.background, dungeon);
    layer.putTilesAt(mapData.map, 0, 0);
    layer.setCollisionBetween(2, 5);
    layer.setCollisionBetween(15, 18);
    layer.setCollisionBetween(28, 31);
    layer.setCollisionBetween(41, 44);
  }

  private createRoomLayer(dungeon: Dungeon, roomGraph: RoomGraph, tileSetMap: TileSetMap) {
    const baseLayer = dungeon.getLayer("map");
    if (baseLayer === null) {
      throw new Error("Missing base layer 'map'");
    }

    const layer = this.createBlankLayer(`layer-0`, DepthOrder.layer0, dungeon);
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
    if (Math.random() < 0.6) {
      return;
    }

    const weights: weight[] = Object.values(tileSetMap.foilage);
    let count: number = random(1, 5);
    while (count-- > 0) {
      let tileXY = this.pickRandomRoomTile(room);
      while (layer.getTileAt(tileXY.x, tileXY.y, true).index !== -1) {
        tileXY = this.pickRandomRoomTile(room);
      }

      layer.putTileAt(weightedRandom(weights).index, tileXY.x, tileXY.y);
    }
  }
}
