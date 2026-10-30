import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    js.configs.recommended,
    // This turns off ESLint rules that conflict with Prettier
    eslintConfigPrettier,
    {
        files: ['src/**/*.ts'],
        rules: {
            // Add your own custom linting rules here
            "no-unused-vars": "warn",
            "no-console": "off",
            "semi": ["error", "always"],
            "quotes": ["error", "double"],
            "eqeqeq": ["error", "always"],
            // "no-console": "warn",
            "indent": ["error", 2],
            "no-var": "error",
        }
    }
];
