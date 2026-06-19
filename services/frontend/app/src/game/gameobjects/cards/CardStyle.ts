import Phaser, { Scene } from "phaser";


export default class CardStyle extends Phaser.GameObjects.Rectangle {

    readonly backGroundColor!: Phaser.Display.Color;
    readonly stroke!: Phaser.Display.Color;

    constructor(scene: Scene, x: number, y: number) {

        super(scene, x, y, 140, 190);

        this.backGroundColor = new Phaser.Display.Color(50, 80, 80);
        this.stroke = new Phaser.Display.Color(30, 40, 40);

        this.setFillStyle(this.backGroundColor.color);
        this.setStrokeStyle(10, this.stroke.color);

        this.setRounded();

    };
}
