const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  };

  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
    extraNodeModules: {
      crypto: require.resolve("react-native-polyfill-globals"),
      stream: require.resolve("stream-browserify"),
      "web-streams-polyfill": require.resolve("web-streams-polyfill"), // Use the main entry point
    },
  };

  // Add resolver configuration
  config.resolver.alias = {
    ...config.resolver.alias,
    "web-streams-polyfill/ponyfill/es6": require.resolve(
      "web-streams-polyfill/ponyfill/es6"
    ),
  };

  // Add resolver platforms
  config.resolver.platforms = ["native", "ios", "android", "web"];

  // Add node modules extensions
  config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs", "mjs"];

  return config;
})();
