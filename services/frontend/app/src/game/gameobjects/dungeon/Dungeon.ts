import { Physics, Scene, Tilemaps, Math as pMath, type Types } from "phaser";
import { AssetsKey } from "../../Assets";
import { Direction, dungeonBuilder, RoomType, TileNodeType, type DungeonConfig, type MapData, type Room, type RoomGraph } from "../../map/procedural";
import { Enemy } from "../Enemy";
import { BoundingBox, random, randomPoint, randomPointOnEdge, Vector2, weightedRandom, type weight } from "../../map/math";
import Player from "../Player";
import { playerOne } from "../../components/KeyboardComponent";
import { FloorType, PassageType, type TileSetMap } from "../../map/TileSetMap";
import { Passage } from "../Passage";
import { RoomSetup } from "./RoomSetup";

export interface SpawnLocation {
  spawnPoint: Types.Math.Vector2Like;
  startingRoom: Room;
  dungeon: Dungeon;
}

interface TileSize {
  size: Vector2;
  invSize: Vector2;
}

// TODO: Create/insert the doorway to the exit of the level
export class Dungeon extends Tilemaps.Tilemap {
  origin: Vector2;
  scale: number;
  mapData!: MapData;
  tileSetMap: TileSetMap;
  tileSet: Tilemaps.Tileset;
  tileSize: TileSize;
  mapColliders: Physics.Arcade.Collider[];
  enemies: Enemy[];
  players: Player[];
  dynamics: Physics.Arcade.Group;
  passage: Passage | undefined;
  entrance: Room | undefined;
  exit: Room | undefined;
  roomSetup: RoomSetup;

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
    this.enemies = [];
    this.players = [];
    this.tileSize = {
      size: new Vector2(this.tileWidth * this.scale, this.tileHeight * this.scale),
      invSize: new Vector2(1.0 / (this.tileWidth * this.scale), 1.0 / (this.tileHeight * this.scale)),
    };
    this.dynamics = scene.physics.add.group();
    this.entrance = undefined;
    this.exit = undefined;
    this.roomSetup = new RoomSetup();

    this.build(dungeonConfig);
  }

  private clear() {
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];
    this.players.forEach((player) => player.destroy());
    this.players = [];
    this.passage?.destroy(); // stack overflow...
    this.passage = undefined;
    this.mapColliders.forEach((col) => col.destroy());
    this.mapColliders = [];
    this.dynamics.clear();
    this.removeAllLayers();
  }

  build(dungeonConfig: DungeonConfig) {
    this.clear();
    this.mapData = dungeonBuilder(dungeonConfig);
    if (this.mapData.rooms.length < 3) {
      throw new Error("Invalid Dungeon layout. Not Enough rooms");
    }
    [this.entrance, this.exit] = this.roomSetup.apply(this.mapData.graph);
    // spawn entities


    this.createLevelLayer();
    // decorate rooms

    this.spawnPlayers(1); // TODO: Hard-coded...
    // this.spawnEnemies(this.mapData.rooms.length - 2); // excluding the entrance and exit room
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

  getRandomWalkableTile(room?: Room): SpawnLocation {
    if (room === undefined) {
      room = pMath.RND.pick(this.mapData.rooms); // cannot be entrance/exit
    }
    const point = randomPoint(room.aabb.min.clone().addXY(1, 1), room.aabb.max.clone().subXY(2, 2));

    return {
      spawnPoint: this.transformPointToWorld(point.addXY(0.5, 0.5)),
      startingRoom: room,
      dungeon: this,
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

  spawnPlayers(count: number) {
    // TODO: Only spawn within the entrance room
    for (let i: number = 0; i < count; ++i) {
      const spawn: SpawnLocation = this.getRandomWalkableTile(this.entrance);
      const player = new Player(this.scene, playerOne, spawn);
      this.addColliderWithMap(player, 5);
      this.players.push(player);
      this.dynamics.add(player);
    }
  }

  spawnEnemies(count: number): void {
    // TODO: exclude entrance and exit
    for (let i: number = 0; i < count; ++i) {
      const spawn: SpawnLocation = this.getRandomWalkableTile();
      this.enemies.push(Enemy.createSkeletonEnemy(this.scene, spawn));
    }
  }

  findRoom(localPoint: Vector2): Room | undefined {
    return this.mapData.rooms.find((room) => room.aabb.isPointWithin(localPoint));
  }

  // TODO: MOVE THIS
  isCorner(edge: Vector2, box: BoundingBox): boolean {
    return !(
      edge.x > box.min.x &&
      edge.x < box.max.x ||
      edge.y > box.min.y &&
      edge.y < box.max.y);
  }

  getValidEdgePointOnRoom(room: Room): Vector2 {
    let point = randomPointOnEdge(room.aabb);
    while (this.isCorner(point, room.aabb)) { // needs to be closed..............
      point = randomPointOnEdge(room.aabb);
    }
    return point;
  }

  edgeDirection(edge: Vector2, box: BoundingBox): Direction {
    let direction: Direction = Direction.None;
    if (edge.x === box.min.x) {
      direction |= Direction.Left;
    } else if (edge.x === box.max.x) {
      direction |= Direction.Right;
    }

    if (edge.y === box.min.y) {
      direction |= Direction.Top;
    } else if (edge.y === box.max.y) {
      direction |= Direction.Down;
    }

    return direction;
  }
  // TODO: END MOVE THIS
  //
  // pick an exit room; block the passage off with an door; put an template inside the room
  // Graph of rooms - leaf nodes are potentional exit rooms, distance from entrance; dict<roomId, set<roomId>>
  //
  // challange: there can be multiple leaf rooms; we need to pick the most suitable...
  // challange: we must grade them with an score and pick the best one
  // score: isLeaf + 10; distance away from entrance (+1 per room);

  insertPassage() {
    this.entrance = this.getEntranceRoom(this.mapData.graph);
    this.exit = this.getExitRoom(this.entrance, this.mapData.graph);

    const door = this.exit.doors[0];
    const worldPoint = this.tileToWorldXY(door.position.x + .5, door.position.y + .5);

    if (worldPoint === null) {
      throw new Error(`Unable to translate tile to world point`);
    }

    // create a exit room object that applies a the template V specialized function
    this.passage = new Passage(
      this.scene,
      worldPoint.x,
      worldPoint.y,
      {
        spriteKey: AssetsKey.TileSet,
        direction: Direction.Top,
        scale: this.scale,
        frameIndex: this.tileSetMap.passages[PassageType.DoorFrontOpen],
      },
      this.dynamics,
    );
    this.passage.setDepth(5); // TODO need correct depth
  }
}
