import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import json from "@eslint/json";


/** @type {import('eslint').Linter.Config[]} */
export default [  
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.node },
    ...js.configs.recommended
  },
  ...tseslint.configs.recommended,
  {
		files: ["**/*.json"],
		ignores: ["package-lock.json"],
		language: "json/json",
		...json.configs.recommended,
	}
];