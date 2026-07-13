export enum AssetsKey {
  Player = "player",
  Skeleton = "skeleton",
  TileSet = "tileset"
}

interface IAssetIndex {
  readonly [index: string]: string;
}

export const Assets: IAssetIndex = {
  [AssetsKey.Player]: new URL("./assets/knight_spritesheet.png", import.meta.url).href,
  [AssetsKey.Skeleton]: new URL("./assets/skeleton_spritesheet.png", import.meta.url).href,
  [AssetsKey.TileSet]: new URL("./assets/Tileset.png", import.meta.url).href
};
