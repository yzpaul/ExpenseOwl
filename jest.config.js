// jest.config.js
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  transform: {
    '^.+\\.mts$': ['ts-jest', { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.mts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.mjs$': '$1', // Optional: if you're importing `.mjs` in test files
  },
};