import { Scene, Actions, GameObjects, Geom } from "phaser";
import type CardBase from "./CardBase";

export default class CardHand {

    private readonly cards: CardBase[] = [];
    // private readonly scene!: Scene;
    private readonly displayList!: GameObjects.DisplayList;

    constructor(scene: Scene) {

        // this.scene = scene;
        this.displayList = scene.children;

    };

    addCard(card: CardBase) {

        this.cards.push(card);

    };

    suffle() {
        Actions.Shuffle(this.cards);
    };

    align() {

        const line = new Geom.Line(100, 400, 800, 400);
        Actions.PlaceOnLine(this.cards, line);
        this.cards.forEach((card: CardBase) => {
            this.displayList.bringToTop(card);
        });

        // Actions.AlignTo(this.cardHand.getChildren(), Display.Align.RIGHT_CENTER, 10, 30);
        // const ellipse = new Geom.Ellipse(400, 300, 400, 200);
        // Actions.PlaceOnEllipse(this.cardHand.getChildren(), ellipse, Math.PI, 0);

    };
}