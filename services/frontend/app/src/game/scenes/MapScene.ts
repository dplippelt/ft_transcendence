import Phaser, { GameObjects } from "phaser";
import { EventBus } from "../EventBus";
import { TreeNode, Room, BSP, random } from "../map/map";

export default class GameScene extends Phaser.Scene {
  map: GameObjects.Graphics;
  rooms: TreeNode<Room>[];

  tileSize: number;

  constructor() {
    super("game");

    this.tileSize = 1;
  }

  preload() {
    // load in scene specific assets
  }

  drawBSP(room: Room) {
    this.map.lineStyle(2, 0x00FF00, 1.0);
    this.map.strokeRect(
      room.x * this.tileSize, room.y * this.tileSize,
      room.width * this.tileSize,
      room.height * this.tileSize);
  }

  drawRoom(room: Room) {
    const x = room.x + random(0, room.width * .5);
    const y = room.y + random(0, room.height * .5);
    const width = room.width - (x - room.x);
    const height = room.height - (y - room.y);

    this.map.lineStyle(2, 0x00F0F0, 1);
    this.map.fillStyle(0xFF0000);
    this.map.fillRect(
      x * this.tileSize,
      y * this.tileSize,
      width * this.tileSize,
      height * this.tileSize
    );
  }

  generate() {
    const root = BSP(new Room(0, 0, 500, 500), 5);
    this.rooms = root.getLeafs();

    this.map.clear();
    for (const room of this.rooms) {
      this.drawBSP(room.val);
      this.drawRoom(room.val);
    }

    this.drawPaths(root);
  }

  drawPaths(parent: TreeNode<Room>) {
    if (parent.left === null || parent.right === null) {
      return;
    }

    this.map.lineStyle(1, 0x0000FF, 1.0);
    this.map.beginPath();
    this.map.moveTo(parent.left.val.center.x * this.tileSize, parent.left.val.center.y * this.tileSize);
    this.map.lineTo(parent.right.val.center.x * this.tileSize, parent.right.val.center.y * this.tileSize)
    this.map.closePath();
    this.map.stroke();

    this.drawPaths(parent.left);
    this.drawPaths(parent.right);
  }

  create() {
    this.map = this.add.graphics();
    this.generate();

    const spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spacebar.emitOnRepeat = false;
    spacebar.on("down", () => {
      this.generate();
    });

    EventBus.emit('current-scene-ready', this);
  }

  update(): void {

  }
}
