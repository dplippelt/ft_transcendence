import Phaser, { Scene } from "phaser";

export interface StyledBoxConfig {
  width: number;
  height: number;
  bgColorRed: number;
  bgColorGreen: number;
  bgColorBlue: number;
  strokeColorRed: number;
  strokeColorGreen: number;
  strokeColorBlue: number;
  strokeWidth: number;
}

export default class StyledBox extends Phaser.GameObjects.Rectangle {
  readonly backGroundColor!: Phaser.Display.Color;
  readonly stroke!: Phaser.Display.Color;

  constructor(scene: Scene, x: number, y: number, config: StyledBoxConfig) {
    super(scene, x, y, config.width, config.height);

    this.backGroundColor = new Phaser.Display.Color(config.bgColorRed, config.bgColorGreen, config.bgColorBlue);
    this.stroke = new Phaser.Display.Color(config.strokeColorRed, config.strokeColorGreen, config.strokeColorBlue);

    this.setFillStyle(this.backGroundColor.color);
    this.setStrokeStyle(config.strokeWidth, this.stroke.color);

    this.setRounded();
  }
}
