import Phaser, { Scene } from "phaser";
import CardStyle from "./CardStyle";
import CardContent from "./CardContent";


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
