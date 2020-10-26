module.exports = {
  root: true,

  extends: [
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'prettier',
    'prettier/react',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],

  env: {
    browser: true,
    es6: true,
    jest: true,
  },

  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },

  parser: '@typescript-eslint/parser',

  plugins: ['react', '@typescript-eslint', 'jest'],

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      typescript: {},
    },
  },

  ignorePatterns: [
    // Ignoring node_modules since generated code doesn't conform to our linting standards
    'node_modules',
    // Ignore build since generated code doesn't conform to our linting standards
    'build',
    // Eslint doesn't lint typing files well so we will just ignore them
    '*.d.ts',
    // Ignore eslint config
    '.eslintrc.js',
    // Ignore tailwind config
    'tailwind.config.js',
    // Ignore postcss config
    'postcss.config.js',
    // Ignore stylelint config
    'stylelint.config.js',
    // Ignore jest config
    'jest.config.js',
    // Ignore public
    'public',
  ],

  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
  },

  rules: {
    'no-console': 0,
    'react/prop-types': 'off',
    'react/jsx-props-no-spreading': 0,
  },
}
