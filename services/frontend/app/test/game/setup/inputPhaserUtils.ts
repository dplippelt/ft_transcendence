interface IKey {
  key: string;
  code: string;
  keyCode: number;
}

interface IKeys {
  [key: string]: IKey;
}

export const Keys: IKeys = {
  W: { key: "w", code: "KeyW", keyCode: 87 },
  S: { key: "s", code: "KeyS", keyCode: 83 },
  A: { key: "a", code: "KeyA", keyCode: 65 },
  D: { key: "d", code: "KeyD", keyCode: 68 },
  E: { key: "e", code: "KeyE", keyCode: 69 },
};

export function onKeyPress(key: IKey) {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      ...key,
      bubbles: true,
    }),
  );
}

export function onKeyRelease(key: IKey) {
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      ...key,
      bubbles: true,
    }),
  );
}
