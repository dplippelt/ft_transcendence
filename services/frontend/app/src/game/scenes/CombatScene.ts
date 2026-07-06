import Phaser, { GameObjects } from "phaser";
import { EventBus } from "../EventBus";
import CardHand from "../gameobjects/cards/CardHand";
import NumberCard from "../gameobjects/cards/NumberCard";
import OperatorCard, { Operator } from "../gameobjects/cards/OperatorCard";
import BoxedText from "../gameobjects/utils/BoxedText";
import { buttonContentConfig, buttonStyleConfig } from "../gameobjects/utils/buttonConfig";

export default class CombatScene extends Phaser.Scene {
	private cardHand!: CardHand;
    private executeButton!: BoxedText;

	constructor() {
		super("combat");
	}

	preload() {
		// load images for the combat scene
		// needs to know which enemy the player is going to fight
		// needs to know the status such as health point or the items (?) it has
		// temporarily set the background color for ths combat scene, needs to be replace by an image
		const backgroundColor = new Phaser.Display.Color(200, 200, 200);
		this.cameras.main.setBackgroundColor(backgroundColor.color);
	}

	create() {

		this.cardHand = new CardHand(this);
        this.createExecuteButton("Execute!");

        // test for creation and alignment of hand of cards
        this.sampleInitCardHand();

		EventBus.emit("current-scene-ready", this);

        // TODOs
		// const timer = initTimer();
		// const player = new PlayerCombat(this, 100, 100);
		// const enemy = new EnemyCombat(this, 900, 100);

        // this.input.once('pointerdown', () => {
        //     this.scene.stop().wake('game');
        // })
	}

	update() {


	}

    createExecuteButton(text: string) {

        let button = new BoxedText(
            this, text, buttonContentConfig, 
            buttonStyleConfig, 100, 50
        );

        button.setInteractive();
        button.on("pointerdown", this.execute, this);

        return button;
    }

    execute() {

        const cards = this.cardHand.getSelectedCards();

        if (!cards.length) {
            console.log("no cards");
            return ;
        }

        let hitPoint = this.cardHand.evaluateSelectedCards(cards);
        
        console.log(hitPoint);
        // Give the enemy damages or give the player penalty
        // Generate new card hands
        // Clear selected cards from slot
        // Reset timer

    }

    sampleInitCardHand() {

        for (let i = 1; i <= 5; ++i) {
            this.cardHand.addCard(new NumberCard(this, i));
        }

        this.cardHand.addCard(new OperatorCard(this, Operator.Plus));
        this.cardHand.addCard(new OperatorCard(this, Operator.Minus));
        this.cardHand.addCard(new OperatorCard(this, Operator.Multiply));

        this.cardHand.shuffle();
        // this.cardHand.align();

    }

}