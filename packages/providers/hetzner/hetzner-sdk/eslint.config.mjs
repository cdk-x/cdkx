import baseConfig from '../../../../eslint.config.mjs';

export default [
  ...baseConfig,
  // Desactivar reglas solo para configuration.ts
  // Desactivar reglas solo para configuration.ts (prueba con varias rutas)
  {
    files: ['configuration.ts', '**/configuration.ts'],
    rules: {
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-control-regex': 'off',
      'no-useless-escape': 'off',
    },
  },
  // Configuración para archivos JSON (mantener si es necesario)
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['eslint.config.{js,cjs,mjs,ts,cts,mts}'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    ignores: ['**/out-tsc'],
  },
];
