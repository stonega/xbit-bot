// eslint.config.mjs
import antfu from "@antfu/eslint-config";

export default antfu(
  {
    type: "lib",
    stylistic: {
      semi: true,
      indent: 2, // 4, or 'tab'
      quotes: "double", // or 'double'
    },
  },
  {
    files: ["**/*.ts"],
    rules: { "no-console": "off", "ts/explicit-function-return-type": "off" },
  },
);
