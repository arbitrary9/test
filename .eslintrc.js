module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Allow console logs for CLI tools and scripts
    'no-console': 'off',
    // Don't require explicit return types for all functions
    '@typescript-eslint/explicit-function-return-type': 'off',
    // Warn on 'any' type usage to encourage better typing
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow empty functions (useful for interface implementations)
    '@typescript-eslint/no-empty-function': 'warn',
    // Allow non-null assertions in specific cases
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // TestRail integration specific rules
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_' 
    }]
  },
  env: {
    node: true,
    es2021: true
  },
  ignorePatterns: ['dist/', 'node_modules/'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json'
  }
};
