import { Scenes, Scene, Actions, GameObjects, Geom, Game } from "phaser";
import CardBase, { CardEvents } from "./CardBase";
import NumberCard from "./NumberCard";
import OperatorCard from "./OperatorCard";

interface CardHandConfig {
    firstCardCenterX: number;
    firstCardCenterY: number;
    handStartX: number;
    handStartY: number;
    handEndX: number;
    handEndY: number;
    selectionCardStartX: number,
    selectionCardStartY: number,
    selectionCardEndX: number,
    selectionCardEndY: number,
    selectionLimit: {
        number: number,
        operator: number,
    }
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
    selectionCardStartX: 800,
    selectionCardStartY: 100,
    selectionCardEndX: 900,
    selectionCardEndY: 100,
    selectionLimit: {
        number: 2,
        operator: 1,
    },
    focus: {
        diffX: 0,
        diffY: 30,
    }
}

export default class CardHand {

    private readonly cardHandConfig!: CardHandConfig;
    private readonly cards!: GameObjects.Container;
    private handLine!: Geom.Line;
    private selectionLine!: Geom.Line;

    constructor(scene: Scene) {

        this.cardHandConfig = cardHandConfig;

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

        this.selectionLine = new Geom.Line(
            this.cardHandConfig.selectionCardStartX,
            this.cardHandConfig.selectionCardStartY,
            this.cardHandConfig.selectionCardEndX,
            this.cardHandConfig.selectionCardEndY,
        )

    };

    update() {
        this.align();
    }


    addCard(card: CardBase) {

        card.on(CardEvents.FOCUSON, this.focusOn, this);
        card.on(CardEvents.FOCUSOFF, this.focusOff, this);
        card.on(CardEvents.SELECTION, this.select, this);

        this.cards.add(card);

    };

    suffle() {

		this.cards.shuffle();

	};

    align() {

        Actions.PlaceOnLine(this.cards.getAll('isSelected', false), this.handLine);

        Actions.PlaceOnLine(this.cards.getAll('isSelected', true), this.selectionLine);

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
            card.setIsSelected(false);
            return ;
        }

        const limits = this.cardHandConfig.selectionLimit;
        const isAlreadyFull = (children: CardBase[], limit: number): boolean => {

            let count = 0;
            for (let child of children) {
                if (child.getIsSelected())
                    ++count;
            }

            return count === limit;

        }

        if (card instanceof NumberCard) {

            const numberCards = this.cards.getAll().filter(
                (child): child is NumberCard => child instanceof NumberCard 
            );

            if (isAlreadyFull(numberCards, limits.number))
                return ;

        } else if (card instanceof OperatorCard) {

            const operatorCards = this.cards.getAll().filter(
                (child): child is OperatorCard => child instanceof OperatorCard
            );

            if (isAlreadyFull(operatorCards, limits.operator))
                return ;

        } else {
            return ;
        }

        card.setIsSelected(true);

    }
}