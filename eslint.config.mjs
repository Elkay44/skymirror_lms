import nextPlugin from "@next/eslint-plugin-next";

const eslintConfig = [
  {
    plugins: {
      next: nextPlugin,
    },
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
    ],
    rules: {
      "next/no-html-link-for-pages": "off",
    },
  }
];

export default eslintConfig;
