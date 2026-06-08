import { afterEach, beforeEach, describe, expect, test } from "vitest";
import PlayerTestScene from "./scenes/PlayerTestScene";
import { IRefPhaserGame, startAndLoadGame, destroyGame, gameTick } from "./setup/corePhaserGame";
import { onKeyPress, Keys } from "./setup/inputPhaserUtils";
import Player from "../../src/game/gameobjects/Player";

describe("player behaviour", () => {
  let gameRef: IRefPhaserGame<PlayerTestScene>;

  beforeEach(async () => {
    gameRef = await startAndLoadGame("player-test-scene", PlayerTestScene);
  });

  afterEach(() => {
    destroyGame(gameRef);
  });

  test("that player is able to move upwards", () => {
    // Arrange
    const player: Player = gameRef.scene.player;

    // Act
    onKeyPress(Keys.W);
    gameTick(gameRef);

    // Assert
    expect(player.body?.velocity.y).lessThan(0);
  });

  test("that player is able to move downwards", () => {
    // Arrange
    const player: Player = gameRef.scene.player;

    // Act
    onKeyPress(Keys.S);
    gameTick(gameRef);

    // Assert
    expect(player.body?.velocity.y).greaterThan(0);
  });

  test("that player is able to move left", () => {
    // Arrange
    const player: Player = gameRef.scene.player;

    // Act
    onKeyPress(Keys.A);
    gameTick(gameRef);

    // Assert
    expect(player.body?.velocity.x).lessThan(0);
  });

  test("that player is able to move right", () => {
    // Arrange
    const player: Player = gameRef.scene.player;

    // Act
    onKeyPress(Keys.D);
    gameTick(gameRef);

    // Assert
    expect(player.body?.velocity.x).greaterThan(0);
  });

  test("that player is able to move diagonally (Top-Right)", () => {
    // Arrange
    const player: Player = gameRef.scene.player;

    // Act
    onKeyPress(Keys.W);
    onKeyPress(Keys.D);
    gameTick(gameRef);

    // Assert
    expect(player.body?.velocity.x).greaterThan(0);
    expect(player.body?.velocity.y).lessThan(0);
  });
});
