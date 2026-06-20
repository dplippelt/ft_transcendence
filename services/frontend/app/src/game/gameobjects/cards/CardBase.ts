import Phaser, { Scene } from "phaser";
import CardStyle, { cardStyleConfig, type CardStyleConfig } from "./CardStyle";
import CardContent, {cardContentConfig, type CardContentConfig} from "./CardContent";

interface CardBaseConfig {
    cardStyleConfig: CardStyleConfig,
    cardContentConfig: CardContentConfig,
    focusDiff: number;
};

const cardBaseConfig: CardBaseConfig = {
    cardStyleConfig: cardStyleConfig,
    cardContentConfig: cardContentConfig,
    focusDiff: 30,
}

export default class CardBase extends Phaser.GameObjects.Container {

    readonly cardBaseConfig!: CardBaseConfig;
    readonly content!: CardContent;
    readonly style!: CardStyle;
    private isFocused!: boolean;
    private isSelected!: boolean;
    private focusDiff!: number;

    constructor(scene: Scene, text: string) {

        super(scene);
        scene.add.existing(this);

        this.cardBaseConfig = cardBaseConfig;
        this.content = new CardContent(
            scene, 0, 0, text, this.cardBaseConfig.cardContentConfig
        );
        const {x, y} = this.content.getCenter();

        this.style = new CardStyle(
            scene, x, y, this.cardBaseConfig.cardStyleConfig
        );

        this.add([ this.style, this.content ]);

        this.setSize(this.style.width, this.style.height);

        this.isFocused = false;
        this.isSelected = false;
        this.focusDiff = this.cardBaseConfig.focusDiff;

        this.setInteractive()
        .on("pointerover", this.focusOn, this)
        .on("pointerout", this.focusOff, this)
        .on("pointerdown", this.setIsSelect, this);

    }

    focusOn() {

        if (this.isFocused)
            return ;

        this.isFocused = true;

        if (this.input?.hitArea instanceof Phaser.Geom.Rectangle) {
            
            this.input.hitArea.height += this.focusDiff;
            this.setY(this.y - this.focusDiff);

        }
    }

    focusOff() {

        if (!this.isFocused)
            return ;

        this.isFocused = false;

        if (this.input?.hitArea instanceof Phaser.Geom.Rectangle) {

            this.input.hitArea.height -= this.focusDiff;
            this.setY(this.y + this.focusDiff);

        }
    }

    setIsSelect() {

        if (!this.isSelected)
            this.isSelected = true;
        else
            this.isSelected = false;

        console.log(this.isSelected);

    }

}
