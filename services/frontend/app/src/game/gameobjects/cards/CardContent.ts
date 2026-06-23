import Phaser, { Scene } from "phaser";


export default class CardContent extends Phaser.GameObjects.Text {

    readonly textColor!: Phaser.Display.Color;
    readonly textConfig!: Phaser.Types.GameObjects.Text.TextStyle;

    constructor(scene: Scene, x: number, y: number, content: string) {

        const textColor = new Phaser.Display.Color(200, 230, 20);

        const textConfig = {
            fontFamily: 'Arial Black',
            fontSize: '50px',
            color: textColor.rgba,
            align: 'center',
        }

        super(scene, x, y, content, textConfig);

        this.textColor = textColor;
        this.textConfig = textConfig;

    };
}


