module.exports = {
  roots: ["<rootDir>/src/", "<rootDir>/test/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|cjs|mjs)$": "<rootDir>/test/jest/config/babelTransform.js",
  },
  transformIgnorePatterns: ["node_modules/(?!react-markdown)/"],
  // Long-running balance simulations only run on request (SIM_RUN=1, set by test/jest/Simulations/runParallel.js)
  testPathIgnorePatterns: [
    ".cypress",
    "node_modules",
    "dist",
    ...(process.env.SIM_RUN === "1" ? [] : ["/test/jest/Simulations/"]),
  ],
  testEnvironment: "./FixJSDOMEnvironment.ts",
  setupFiles: ["./jest.polyfills.js"],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/test/__mocks__/fileMock.js",
    "\\.(css|less)$": "<rootDir>/test/__mocks__/NullMock.js",
    ".*?raw$": "<rootDir>/test/__mocks__/fileMock.js",
    "@player": "<rootDir>/src/Player",
    "@enums": "<rootDir>/src/Enums",
    "@nsdefs": "<rootDir>/src/ScriptEditor/NetscriptDefinitions.d.ts",
    "^monaco-editor$": "<rootDir>/test/__mocks__/NullMock.js",
    "^monaco-vim$": "<rootDir>/test/__mocks__/NullMock.js",
    "/utils/Protections$": "<rootDir>/test/__mocks__/NullMock.js",
    "@swc/wasm-web": "@swc/core",
  },
  restoreMocks: true,
};
