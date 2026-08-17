export enum AssetsKey {
  Player = "player",
  Skeleton = "skeleton",
  TileSet = "tileset",
  CombatPlayer = "combatPlayer",
  CombatPlayerJSON = "combatPlayerJSON",
  CombatEnemy = "combatEnemy",
  Cards = "cards",
}

interface IAssetIndex {
  readonly [index: string]: string;
}

export const Assets: IAssetIndex = {
  [AssetsKey.Player]: new URL("./assets/knight_spritesheet.png", import.meta.url).href,
  [AssetsKey.Skeleton]: new URL("./assets/skeleton_spritesheet.png", import.meta.url).href,
  [AssetsKey.TileSet]: new URL("./assets/Tileset.png", import.meta.url).href,
  [AssetsKey.CombatPlayer]: new URL("./assets/combat_knight.png", import.meta.url).href,
  [AssetsKey.CombatPlayerJSON]: new URL("./assets/combat_knight.json", import.meta.url).href,
  [AssetsKey.CombatEnemy]: new URL("./assets/combat_enemy37x45.png", import.meta.url).href,
  [AssetsKey.Cards]: new URL("./assets/cards64x96.png", import.meta.url).href,
};
