interface IAsset {
  key: string;
  url: string;
}

interface IAssetIndex {
  readonly [index: string]: IAsset;
}

export const Assets: IAssetIndex = {
  player: {
    key: "player",
    url: new URL("./assets/knight_spritesheet.png", import.meta.url).href,
  },
  skeleton: {
    key: "skeleton",
    url: new URL("./assets/skeleton_spritesheet.png", import.meta.url).href,
  },
};
