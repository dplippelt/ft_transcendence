import { Scene, Tilemaps } from "phaser";
import { AssetsKey } from "../Assets";
import { EventBus } from "../EventBus";
import Player from "../gameobjects/Player";
import { playerOne } from "../components/KeyboardComponent";
import { dungeonBuilder, type MapData } from "../map/procedural";

export default class GameScene extends Scene {
  constructor() {
    super("game");
  }

  preload() {
    // load in scene specific assets
  }

  create() {
    const skeleton = this.add.image(400, 300, AssetsKey.Skeleton);
    const player = new Player(this, 40, 40, playerOne);
    this.add.existing(player);
    this.physics.add.existing(player);

    this.tweens.add({
      targets: [skeleton],
      x: "random(0, 600)",
      y: "random(0, 500)",
      ease: "Cubic.easeIn",
      repeat: -1,
      yoyo: true,
      duration: 2000,
    });

    // Wall indices
    // const level: number[][] = [
    //   [2, 3, 4, 5],
    //   [15, 0, 1, 18],
    //   [28, 1, 0, 31],
    //   [41, 42, 43, 44]
    // ];
    // Corners: TL, TR, BR, BL
    // Wall: [TOP, TOP], [RIGHT, RIGHT], [BOT, BOT], [LEFT, LEFT]
    // Floor: [common, common, common, uncommon]

    const mapData: MapData = dungeonBuilder({
      emptyRoomConfig: {
        doorCount: { min: 2, max: 4 },
        width: { min: 4, max: 7 },
        height: { min: 4, max: 7 },
        tileMapping: {
          corner: [2, 5, 41, 44],
          wall: [[3, 4], [18, 18, 31], [42, 43], [15, 15, 28]],
          floor: [0, 1, 0, 1, 0, 1, 0, 0, 0, 13, 14, 13, 14, 26, 27, 39, 40]
        }
      },
      roomCount: { min: 8, max: 32 },
    });

    const centerX = Math.floor((this.scale.width - mapData.width * 16) * 0.5);
    const centerY = Math.floor((this.scale.height - mapData.height * 16) * 0.5);

    const rect = this.add.rectangle(centerX, centerY, mapData.width * 16, mapData.height * 16, 0x0F0F0F);
    rect.setDepth(-2);
    rect.setOrigin(0, 0);

    const map = this.make.tilemap({ data: mapData.layout, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage(AssetsKey.TileSet);
    const layer = map.createLayer(0, tiles, centerX, centerY);

    layer.setDepth(-1);

    // map.getTileAt(1, 0).setCollision(false, false, true, false);
    // map.setCollision([2, 3, 4, 5, 15, 18, 28, 31, 41, 42, 43, 44]);
    map.setCollisionBetween(2, 5);
    map.setCollisionBetween(15, 18);
    map.setCollisionBetween(28, 31);
    map.setCollisionBetween(41, 44);

    // layer.setCollision(indexes)

    this.physics.add.collider(player, layer);

    // TODO: offsetsssssssss
    const [x, y] = mapData.rooms[0].aabb.position.clone().addXY(1, 1).unpack();
    player.setPosition(x + centerX, y + centerY);

    EventBus.emit('current-scene-ready', this);

    // Temporarily added to launch the combat scene by clicking the screen
    this.input.on('pointerdown', () => {
      // this.scene.sleep().launch('combat');
      this.scene.restart();
    })
  }
}
