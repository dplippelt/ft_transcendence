import { Scenes, Scene, Actions, GameObjects, Geom } from "phaser";
import CardBase, { CardEvents } from "./CardBase";
import CardSelection from "./CardSelection";
import NumberCard from "./NumberCard";
import OperatorCard, { Operator } from "./OperatorCard";

interface CardHandConfig {
    firstCardCenterX: number;
    firstCardCenterY: number;
    handStartX: number;
    handStartY: number;
    handEndX: number;
    handEndY: number;
    focus: {
        diffX: number,
        diffY: number,
    }
}

const cardHandConfig: CardHandConfig = {
    firstCardCenterX: 0,
    firstCardCenterY: 0,
    handStartX: 100,
    handStartY: 400,
    handEndX: 800,
    handEndY: 400,
    focus: {
        diffX: 0,
        diffY: 30,
    }
}

export default class CardHand {

    private readonly cardHandConfig!: CardHandConfig;
    private readonly cards!: GameObjects.Container;
    private handLine!: Geom.Line;
    private readonly cardSelection!: CardSelection;

    constructor(scene: Scene) {

        this.cardHandConfig = cardHandConfig;

        this.cardSelection = new CardSelection(scene, 7);

        this.cards = scene.add.container(
            this.cardHandConfig.firstCardCenterX, 
            this.cardHandConfig.firstCardCenterY,
        );

        this.cards.addToUpdateList();
        scene.events.on(Scenes.Events.UPDATE, this.update, this);
        this.cards.once(GameObjects.Events.DESTROY, () => {
            scene.events.off(Scenes.Events.UPDATE, this.update, this);
        }, this);

        scene.input.setTopOnly(true);

        this.handLine = new Geom.Line(
            this.cardHandConfig.handStartX,
            this.cardHandConfig.handStartY,
            this.cardHandConfig.handEndX,
            this.cardHandConfig.handEndY,
        );

    };

    update() {
        this.cardSelection.align();
        this.align();
    }


    addCard(card: CardBase) {

        card.on(CardEvents.FOCUSON, this.focusOn, this);
        card.on(CardEvents.FOCUSOFF, this.focusOff, this);
        card.on(CardEvents.SELECTION, this.select, this);

        this.cards.add(card);

    };

    shuffle() {

		this.cards.shuffle();

	};

    align() {

        Actions.PlaceOnLine(this.cards.getAll("isSelected", false), this.handLine);

        const focusedCard = this.cards.getFirst("isFocused", true) as CardBase;
        if (focusedCard?.input?.hitArea instanceof Geom.Rectangle) {

            const focus = this.cardHandConfig.focus;
            focusedCard.x -= focus.diffX;
            focusedCard.y -= focus.diffY;

        }

        // Actions.AlignTo(this.cardHand.getChildren(), Display.Align.RIGHT_CENTER, 10, 30);
        // const ellipse = new Geom.Ellipse(400, 300, 400, 200);
        // Actions.PlaceOnEllipse(this.cardHand.getChildren(), ellipse, Math.PI, 0);

    };

    focusOn(card: CardBase) {

        if (card.getIsSelected())
            return ;

        card.setIsFocused(true);

        const focus = this.cardHandConfig.focus;
        if (card.input?.hitArea instanceof Geom.Rectangle) {
            card.input.hitArea.right += focus.diffX;
            card.input.hitArea.bottom += focus.diffY;            
        }

    }

    focusOff(card: CardBase) {

        card.setIsFocused(false);

        const focus = this.cardHandConfig.focus;
        if (card.input?.hitArea instanceof Geom.Rectangle) {
            card.input.hitArea.right -= focus.diffX;
            card.input.hitArea.bottom -= focus.diffY;            
        }

    }

    select(card: CardBase) {

        if (card.getIsFocused()) {
            this.focusOff(card);
        }

        if (card.getIsSelected()) {

            this.cardSelection.unsetCardFromSlot(card);

            card.setIsSelected(false);
            return ;

        }

        if (this.cardSelection.setCardToSlot(card)) {

            card.setIsSelected(true);
            return ;

        }

    }

    getSelectedCards() {
        return this.cardSelection.getSelectedCards();
    }

    evaluateSelectedCards(selectedCards: CardBase[]) {

        const isValidSelection = (cards: CardBase[]) => {

            if (cards.length % 2 === 0)
                return false;
        
            for (let i = 0; i < cards.length; ++i) {
                let card = cards[i];
        
                if (i % 2 === 0) {
                    if (!(card instanceof NumberCard))
                        return false;
                } else {        
                    if (!(card instanceof OperatorCard))
                        return false;
                }
            }
            return true;

        };
        
        if (!isValidSelection(selectedCards))
            return null;

        let nums: Array<number | Operator> = [];

        for (let i = 0; i < selectedCards.length; ++i) {

            let card = selectedCards[i];

            if (i % 2 === 0) {

                let value = card.getValue() as number;

                if (!nums.length) {

                    nums.push(value);

                } else {

                    let operator = nums.pop() as Operator;
                    let prevValue = nums.pop() as number;

                    switch (operator) {
                        case Operator.Multiply:
                            nums.push(prevValue * value);
                            break;

                        case Operator.Divide:
                            if (value === 0)
                                return null;
                            nums.push(prevValue / value);
                            break;

                        default:
                            nums.push(prevValue);
                            nums.push(operator);
                            nums.push(value);
                            break;
                    }
                }
            } else {

                let value = card.getValue() as Operator;

                nums.push(value);

            }

        }

        let num = nums[0] as number;

        for (let i = 1; i < nums.length; i += 2) {

            let operator = nums[i] as Operator;
            let value = nums[i + 1] as number;

            switch (operator) {
                case Operator.Plus:
                    num += value;
                    break;
                
                case Operator.Minus:
                    num -= value;
                    break;

                default:
                    break;
            }
        }

        return num;

    }
}