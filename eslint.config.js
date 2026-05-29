import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    // Apply to all JS and JSX source files
    files: ['src/**/*.{js,jsx}'],

    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,   // required for ESLint to parse JSX syntax
        },
      },
      globals: {
        // Browser globals: document, window, localStorage, fetch, URL, Blob, etc.
        ...globals.browser,
        // Node/test globals: global, process
        ...globals.node,
      },
    },

    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',   // not needed with React 17+ JSX transform
      'react/prop-types': 'warn',           // prop-types missing is a warning, not a blocker
      'no-unused-vars': 'warn',
    },

    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
