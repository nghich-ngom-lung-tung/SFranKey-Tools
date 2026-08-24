import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import typescriptEslint from "typescript-eslint";

const webFiles = ["apps/web/**/*.{js,jsx,mjs,ts,tsx,mts,cts}"];
const scopedNext = [...nextCoreWebVitals, ...nextTypeScript].map((config) =>
  config.ignores ? config : { ...config, files: webFiles },
);
const legacyReactRules = Object.fromEntries(
  [...nextCoreWebVitals, ...nextTypeScript]
    .flatMap((config) => Object.keys(config.rules ?? {}))
    .filter((rule) => rule.startsWith("react/"))
    .map((rule) => [rule, "off"]),
);

export default [
  {
    ignores: [
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/generated/**",
    ],
  },
  ...typescriptEslint.configs.recommended,
  ...scopedNext,
  {
    rules: {
      ...legacyReactRules,
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "react-hooks/set-state-in-effect": "off",
      "import/no-anonymous-default-export": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
