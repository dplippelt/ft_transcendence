import { Scene, Actions, GameObjects, Geom } from "phaser";
import type CardBase from "./CardBase";

export default class CardHand {

    private readonly cards!: GameObjects.Container;

    constructor(scene: Scene) {

		this.cards = scene.add.container(100, 400);

    };

    addCard(card: CardBase) {

        this.cards.add(card);

    };

    suffle() {

		this.cards.shuffle();

	};

    align() {

        const line = new Geom.Line(100, 400, 800, 400);
        Actions.PlaceOnLine(this.cards.getAll(), line);

        // Actions.AlignTo(this.cardHand.getChildren(), Display.Align.RIGHT_CENTER, 10, 30);
        // const ellipse = new Geom.Ellipse(400, 300, 400, 200);
        // Actions.PlaceOnEllipse(this.cardHand.getChildren(), ellipse, Math.PI, 0);

    };
}