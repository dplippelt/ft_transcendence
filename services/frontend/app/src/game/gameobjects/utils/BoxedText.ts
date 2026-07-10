import Phaser, { Scene } from "phaser";
import StyledText, { type StyledTextConfig } from "../cards/CardContent";
import StyledBox, { type StyledBoxConfig } from "../cards/CardStyle";

export default class BoxedText extends Phaser.GameObjects.Container {
  readonly content!: StyledText;
  readonly style!: StyledBox;

  constructor(
    scene: Scene,
    text: string,
    contentConfig: StyledTextConfig,
    styleConfig: StyledBoxConfig,
    posX: number = 0,
    posY: number = 0,
  ) {
    super(scene);
    scene.add.existing(this);

    this.content = new StyledText(scene, 0, 0, text, contentConfig);

    const { x, y } = this.content.getCenter();
    this.content.setOrigin(x / this.content.width, y / this.content.height);

    this.style = new StyledBox(scene, 0, 0, styleConfig);

    this.add([this.style, this.content]);

    this.setSize(this.style.width, this.style.height);

    this.setX(posX);
    this.setY(posY);
  }
}
