// craco.config.js
module.exports = {
    jest: {
      configure: {
        transformIgnorePatterns: [
          "node_modules/(?!(react-markdown|remark-gfm)/)",
        ],
      },
    },
  };
  