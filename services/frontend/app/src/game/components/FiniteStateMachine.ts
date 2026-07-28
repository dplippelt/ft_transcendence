import Component from "./Component";
import { GameObjects } from "phaser";

export type NextState<T> = IFiniteState<T> | null;

export interface IFiniteState<T> {
  onEnter?(enity: T): void;
  onUpdate(enity: T, time: number, delta: number): NextState<T>;
  onExit?(enity: T): void;
}

export class FiniteStateMachine<T> extends Component {
  currentState: IFiniteState<T>;
  entity: T;

  constructor(gameObject: GameObjects.GameObject, startState: IFiniteState<T>) {
    super(gameObject);

    this.entity = gameObject as T;
    this.currentState = startState;
    this.currentState.onEnter?.(this.entity);
  }

  update(time: number, delta: number) {
    const nextState: NextState<T> = this.currentState.onUpdate(this.entity, time, delta);
    if (nextState !== null) {
      this.currentState.onExit?.(this.entity);
      this.currentState = nextState;
      this.currentState.onEnter?.(this.entity);
    }
  }
}
