import { Scenes, Scene, Actions, GameObjects, Geom, Game } from "phaser";
import CardBase from "./CardBase";

interface CardHandConfig {
    firstCardCenterX: number;
    firstCardCenterY: number;
    handStartX: number;
    handStartY: number;
    handEndX: number;
    handEndY: number;
    focusDiff: number;
    selectionCardStartX: number,
    selectionCardStartY: number,
    selectionCardEndX: number,
    selectionCardEndY: number,
}

const cardHandConfig: CardHandConfig = {
    firstCardCenterX: 0,
    firstCardCenterY: 0,
    handStartX: 100,
    handStartY: 400,
    handEndX: 800,
    handEndY: 400,
    focusDiff: 30,
    selectionCardStartX: 800,
    selectionCardStartY: 100,
    selectionCardEndX: 900,
    selectionCardEndY: 100,
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

        this.cards.add(card);

    };

    suffle() {

		this.cards.shuffle();

	};

    align() {

        // Actions.PlaceOnLine(this.cards.getAll(), line);
        Actions.PlaceOnLine(this.cards.getAll('isSelected', false), this.handLine);
        Actions.PlaceOnLine(this.cards.getAll('isSelected', true), this.selectionLine);

        // Actions.AlignTo(this.cardHand.getChildren(), Display.Align.RIGHT_CENTER, 10, 30);
        // const ellipse = new Geom.Ellipse(400, 300, 400, 200);
        // Actions.PlaceOnEllipse(this.cardHand.getChildren(), ellipse, Math.PI, 0);

    };
}