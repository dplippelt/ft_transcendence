import Component from "./Component";
import { GameObjects } from "phaser";

export interface IFiniteState {
  onEnter?(): void;
  onUpdate(): IFiniteState | null;
  onExit?(): void;
}

export class FiniteStateMachine extends Component {
  currentState: IFiniteState;

  constructor(gameObject: GameObjects.GameObject, startState: IFiniteState) {
    super(gameObject);

    this.currentState = startState;
    this.currentState.onEnter?.();
  }

  update() {
    const nextState: IFiniteState | null = this.currentState.onUpdate();
    if (nextState !== null) {
      this.currentState.onExit?.();
      nextState.onEnter?.();
      this.currentState = nextState;
    }
  }
}
