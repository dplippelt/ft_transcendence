import { Scenes, Scene, Actions, GameObjects, Geom } from "phaser";
import CardBase, { CardEvents } from "./CardBase";
import CardSelection from "./CardSelection";

interface CardHandConfig {
  firstCardCenterX: number;
  firstCardCenterY: number;
  handStartX: number;
  handStartY: number;
  handEndX: number;
  handEndY: number;
  focus: {
    diffX: number;
    diffY: number;
  };
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
  },
};

export default class CardHand {
  private readonly cardHandConfig!: CardHandConfig;
  private readonly cards!: GameObjects.Container;
  private handLine!: Geom.Line;
  private readonly cardSelection!: CardSelection;

  constructor(scene: Scene) {
    this.cardHandConfig = cardHandConfig;

    this.cardSelection = new CardSelection(scene, 7);

    this.cards = scene.add.container(this.cardHandConfig.firstCardCenterX, this.cardHandConfig.firstCardCenterY);

    this.cards.addToUpdateList();
    scene.events.on(Scenes.Events.UPDATE, this.update, this);
    this.cards.once(
      GameObjects.Events.DESTROY,
      () => {
        scene.events.off(Scenes.Events.UPDATE, this.update, this);
      },
      this,
    );

    scene.input.setTopOnly(true);

    this.handLine = new Geom.Line(
      this.cardHandConfig.handStartX,
      this.cardHandConfig.handStartY,
      this.cardHandConfig.handEndX,
      this.cardHandConfig.handEndY,
    );
  }

  update() {
    this.cardSelection.align();
    this.align();
  }

  addCard(card: CardBase) {
    card.on(CardEvents.FOCUSON, this.focusOn, this);
    card.on(CardEvents.FOCUSOFF, this.focusOff, this);
    card.on(CardEvents.SELECTION, this.select, this);

    this.cards.add(card);
  }

  shuffle() {
    this.cards.shuffle();
  }

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
  }

  focusOn(card: CardBase) {
    if (card.getIsSelected()) return;

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
      return;
    }

    if (this.cardSelection.setCardToSlot(card)) {
      card.setIsSelected(true);
      return;
    }
  }

  evaluateSelectedCards(): number | null {
    if (!this.cardSelection.isValidSelection()) return null;

    // needs to calculate
    return 42;
  }
}
