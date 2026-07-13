import Phaser, { Scene } from "phaser";

export interface StyledTextConfig {
  textColorRed: number;
  textColorGreen: number;
  textColorBlue: number;
  textStyle: Phaser.Types.GameObjects.Text.TextStyle;
}

export default class StyledText extends Phaser.GameObjects.Text {
  readonly textColor!: Phaser.Display.Color;
  readonly textStyle!: Phaser.Types.GameObjects.Text.TextStyle;

  constructor(scene: Scene, x: number, y: number, content: string, config: StyledTextConfig) {
    const textColor = new Phaser.Display.Color(config.textColorRed, config.textColorGreen, config.textColorBlue);

    if (!config.textStyle.color) config.textStyle.color = textColor.rgba;

    super(scene, x, y, content, config.textStyle);

    this.textColor = textColor;
    this.textStyle = config.textStyle;
  }
}
