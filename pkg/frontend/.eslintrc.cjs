module.exports = {
    env: {browser: true, es2020: true},
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {ecmaVersion: 'latest', sourceType: 'module'},
    plugins: ['react-refresh'],
    rules: {
        "no-console": ["error", { allow: ["warn"] }],
        "no-alert": "error",
        "no-debugger": "error",
        'react-refresh/only-export-components': 'warn',
    },
}
