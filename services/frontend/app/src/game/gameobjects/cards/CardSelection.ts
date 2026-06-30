import Phaser, { Actions, Scene } from "phaser";
import CardBase from "./CardBase";
import NumberCard from "./NumberCard";
import OperatorCard from "./OperatorCard";
import CardSlot, { cardSlotStyleConfig } from "./CardSlot";
import { type CardStyleConfig } from "./CardStyle";


interface SelectedCardAlignConfig {
    firstSlotCenter: {
        x: number,
        y: number,
    },
    gridOptions: Phaser.Types.Actions.GridAlignConfig,
}

const selectedCardAlignConfig: SelectedCardAlignConfig = {
    firstSlotCenter: {
        x: 0,
        y: 0,
    },
    gridOptions: {
        width: -1,
        cellWidth: 100,
        x: 100,
        y: 100,
    }
}

export default class CardSelection {

    // define and set slots for selected cards 
    // define the maximum number of number cards to set (the number of operator is minus 1)
    // add number and operator cards into slots when there is an available slot
    // unset cards from the slots when they are selected again but remain the positions of the rest cards

    private readonly cardSlotStyleConfig!: CardStyleConfig;
    private readonly selectedCardAlignConfig!: SelectedCardAlignConfig;
    private readonly slots!: Phaser.GameObjects.Container;
    private numSlots!: number;

    constructor(scene: Scene, numSlots: number) {
        
        this.cardSlotStyleConfig = cardSlotStyleConfig;
        this.selectedCardAlignConfig = selectedCardAlignConfig;

        this.slots = scene.add.container(
            this.selectedCardAlignConfig.firstSlotCenter.x,
            this.selectedCardAlignConfig.firstSlotCenter.y,
        );

        this.numSlots = numSlots;

        for (let i = 0; i < this.numSlots; ++i) {
            this.slots.add(
                new CardSlot(scene, this.cardSlotStyleConfig)
            );
        }
    };

    setCardToSlot(card: CardBase): boolean {

        const slots = this.slots.getAll() as CardSlot[];

        for (let i = 0; i < this.numSlots; ++i) {

            let slot = slots[i];

            if (slot.isCardSet())
                continue ;

            slot.setCard(card);

            return true;
        }

        return false;

    };

    unsetCardFromSlot(card: CardBase): boolean {

        const slots = this.slots.getAll() as CardSlot[];

        for (let i = 0; i < this.numSlots; ++i) {

            let slot = slots[i];

            if (!slot.isCardMatch(card))
                continue ;

            slot.unsetCard();

            return true;
        }

        return false;

    };

    isValidSelection(): boolean {

        const selectedCards = this.getSelectedCards();

        if (selectedCards.length % 2 === 0)
            return false;

        for (let i = 0; i < selectedCards.length; ++i) {

            let card = selectedCards[i];

            if (i % 2 === 0) {

                if (!(card instanceof NumberCard))
                    return false;

            } else {

                if (!(card instanceof OperatorCard))
                    return false;

            }
        }

        return true;

    }

    getSelectedCards(): CardBase[] {

        const slots = this.slots.getAll() as CardSlot[];
        const selectedCards: CardBase[] = [];

        for (let i = 0; i < this.numSlots; ++i) {

            let slot = slots[i];

            if (!slot.isCardSet())
                continue ;

            let card = slot.getCard() as CardBase;

            selectedCards.push(card);

        }

        return selectedCards;
    }

    align(): void {

        const slots = this.slots.getAll() as CardSlot[];

        Actions.GridAlign(
            slots, 
            this.selectedCardAlignConfig.gridOptions
        );

        for (let slot of slots) {

            slot.setCardPosition();

        }
    }
}