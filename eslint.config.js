import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
  { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/*.{js,mjs,ts}"],
    rules: {
      semi: ["error", "always"],
      indent: ["error", 2],
      "no-prototype-builtins": "off",
      "spaced-comment": "error",
      "no-multi-spaces": "error"
    }
  }
];