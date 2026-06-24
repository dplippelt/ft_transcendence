// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default"],
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./test/game/setup/setupPhaser.ts"],
  },
});
