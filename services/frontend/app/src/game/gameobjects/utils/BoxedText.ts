import Phaser, { Scene } from "phaser";
import CardContent, { type CardContentConfig } from "../cards/CardContent";
import CardStyle, { type CardStyleConfig } from "../cards/CardStyle";


export default class BoxedText extends Phaser.GameObjects.Container {

    readonly content!: CardContent;
    readonly style!: CardStyle;

    constructor(
        scene: Scene, 
        text: string, 
        contentConfig: CardContentConfig, 
        styleConfig: CardStyleConfig,
        posX: number = 0,
        posY: number = 0,
    ) {

        super(scene);
        scene.add.existing(this);

        this.content = new CardContent(
            scene, 0, 0, text, contentConfig
        );

        const {x, y} = this.content.getCenter();
        this.content.setOrigin(
            x / this.content.width, y / this.content.height
        );

        this.style = new CardStyle(
            scene, 0, 0, styleConfig
        )

        this.add([ this.style, this.content ]);

        this.setSize(this.style.width, this.style.height);

        this.setX(posX);
        this.setY(posY);

    }
}