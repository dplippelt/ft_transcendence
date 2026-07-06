import { Math } from "phaser";

export default interface IPlayerInput {
  getInputDirection: () => Math.Vector2;
  getInteraction: () => boolean;
}
