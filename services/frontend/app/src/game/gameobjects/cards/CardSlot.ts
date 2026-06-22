import { Scene } from "phaser";
import CardBase from "./CardBase";
import CardStyle, { type CardStyleConfig } from "./CardStyle";


export const cardSlotStyleConfig: CardStyleConfig = {
    width: 70,
    height: 95,
    bgColorRed: 255,
    bgColorBlue: 255,
    bgColorGreen: 255,
    strokeColorRed: 0,
    strokeColorGreen: 0,
    strokeColorBlue: 0,
    strokeWidth: 1,
};

const cardFittingRatio = { x: 0.7, y: 0.7 };

export default class CardSlot extends CardStyle {

    private selectedCard: CardBase | null;
    private fittingRatioX!: number;
    private fittingRatioY!: number;

    constructor(scene: Scene, config: CardStyleConfig)  {
        
        super(scene, 0, 0, config);
        scene.add.existing(this);
        this.selectedCard = null;
        this.fittingRatioX = cardFittingRatio.x;
        this.fittingRatioY = cardFittingRatio.y;

    };

    setCard(card: CardBase) {

        this.selectedCard = card;
        this.selectedCard.displayWidth = this.width * this.fittingRatioX;
        this.selectedCard.displayHeight = this.height * this.fittingRatioY;

    }

    unsetCard() {
        if (!this.selectedCard)
            return ;

        this.selectedCard.setScale();
        this.selectedCard = null;

    }

    isCardSet() {

        if (this.selectedCard) {
            return true;
        } else {
            return false;
        }

    }

    isCardMatch(card: CardBase) {
        return this.selectedCard === card;
    }

    setCardPosition() {

        if (!this.selectedCard)
            return ;

        this.selectedCard.setPosition(this.x, this.y);

    }

}
