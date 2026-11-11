// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // The board drives pinch and pan through Reanimated shared values and gesture
    // callbacks. Writing `.value` and reading refs there is how those APIs work, but
    // the React Compiler rules flag it, so they are off for this one file.
    files: ['src/components/board.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
