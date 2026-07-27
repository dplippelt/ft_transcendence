import type { Scene } from "phaser";
import BoxedText from "./BoxedText";
import type { StyledBoxConfig } from "./StyledBox";
import type { StyledTextConfig } from "./StyledText";

export interface ButtonConfig {
  styleConfig: StyledBoxConfig;
  textConfig: StyledTextConfig;
}

export default class Button extends BoxedText {
  constructor(scene: Scene, text: string, config: ButtonConfig, posX: number = 0, posY: number = 0) {
    super(scene, text, config.textConfig, config.styleConfig, posX, posY);
    scene.add.existing(this);

    this.setInteractive();
  }
}
