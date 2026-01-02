const path = require("node:path");

/** @type {import('vitest/config').UserConfig} */
module.exports = {
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
