import Component from "./Component";
import { GameObjects } from "phaser";

export interface IFiniteState {
  onEnter?(): void;
  onUpdate(time: number, delta: number): IFiniteState | null;
  onExit?(): void;
}

export class FiniteStateMachine extends Component {
  currentState: IFiniteState;

  constructor(gameObject: GameObjects.GameObject, startState: IFiniteState) {
    super(gameObject);

    this.currentState = startState;
    this.currentState.onEnter?.();
  }

  update(time: number, delta: number) {
    const nextState: IFiniteState | null = this.currentState.onUpdate(time, delta);
    if (nextState !== null) {
      this.currentState.onExit?.();
      nextState.onEnter?.();
      this.currentState = nextState;
    }
  }
}
