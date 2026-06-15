import Phaser, { Scene } from "phaser";

class CardStyle extends Phaser.GameObjects.Rectangle {

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


class CardContent extends Phaser.GameObjects.Text {

    readonly textColor!: Phaser.Display.Color;
    readonly textConfig!: Object;

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


export default class CardBase extends Phaser.GameObjects.Container {

    readonly style!: CardStyle;
    readonly content!: CardContent;

    constructor(scene: Scene, text: string) {

        super(scene);
        scene.add.existing(this);

        this.content = new CardContent(scene, 0, 0, text);
        const {x, y} = this.content.getCenter();

        this.style = new CardStyle(scene, x, y);

        this.add([ this.style, this.content ]);
        this.setSize(this.style.width, this.style.height);

    }

}
