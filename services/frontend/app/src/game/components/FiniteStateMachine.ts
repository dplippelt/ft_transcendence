import Component from "./Component";
import { GameObjects } from "phaser";

export interface IFiniteState<T> {
  onEnter?(enity: T): void;
  onUpdate(enity: T, time: number, delta: number): IFiniteState<T> | null;
  onExit?(enity: T): void;
}

export class FiniteStateMachine<T> extends Component {
  currentState: IFiniteState<T>;
  enity: T;

  constructor(gameObject: GameObjects.GameObject, startState: IFiniteState<T>) {
    super(gameObject);

    this.enity = gameObject as T;
    this.currentState = startState;
    this.currentState.onEnter?.(this.enity);
  }

  update(time: number, delta: number) {
    const nextState: IFiniteState<T> | null = this.currentState.onUpdate(this.enity, time, delta);
    if (nextState !== null) {
      this.currentState.onExit?.(this.enity);
      this.currentState = nextState;
      this.currentState.onEnter?.(this.enity);
    }
  }
}
