import type { Action } from "./IGameSocket";

export interface INetworkScene {
  nextAction(): Action | null;
  onActionSent(action: Action, seq: number): void;
}
