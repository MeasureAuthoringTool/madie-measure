module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
    "postcss-preset-env": {
      features: {
        "cascade-layers": false,
      },
    },
  },
};
