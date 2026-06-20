import Phaser, { Scene } from "phaser";

export interface CardStyleConfig {
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

export const cardStyleConfig: CardStyleConfig = {
    width: 140,
    height: 190,
    bgColorRed: 50,
    bgColorGreen: 80,
    bgColorBlue: 80,
    strokeColorRed: 30,
    strokeColorGreen: 40,
    strokeColorBlue: 40,
    strokeWidth: 10,
};

export default class CardStyle extends Phaser.GameObjects.Rectangle {

    readonly backGroundColor!: Phaser.Display.Color;
    readonly stroke!: Phaser.Display.Color;

    constructor(scene: Scene, x: number, y: number, config: CardStyleConfig) {

        super(scene, x, y, config.width, config.height);

        this.backGroundColor = new Phaser.Display.Color(
            config.bgColorRed, config.bgColorGreen, config.bgColorBlue
        );
        this.stroke = new Phaser.Display.Color(
            config.strokeColorRed, config.strokeColorGreen, config.strokeColorBlue
        );

        this.setFillStyle(this.backGroundColor.color);
        this.setStrokeStyle(config.strokeWidth, this.stroke.color);

        this.setRounded();

    };
}
