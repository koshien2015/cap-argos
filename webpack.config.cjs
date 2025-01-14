module.exports = {
  mode: "production",
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: "all",
    },
  },
  externals: {
    // 不要な依存関係を除外
    "electron": 'require("electron")',
    "python-shell": 'require("python-shell")',
  },
};
