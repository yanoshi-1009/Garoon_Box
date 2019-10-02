module.exports = {
  extends: "@cybozu/eslint-config/presets/prettier",
  globals: {
    kintone: true,
    garoon: true,
    jQuery: true,
    OAuth: true
  },
  env: {},
  rules: {
    "vars-on-top": ["off"]
  }
};
