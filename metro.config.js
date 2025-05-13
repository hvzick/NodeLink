const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  };
<<<<<<< HEAD

=======
>>>>>>> 8c7332c0677505a6fe7f1db6eed73bc0726d5462
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
<<<<<<< HEAD
    extraNodeModules: {
      crypto: require.resolve("react-native-polyfill-globals"),
      stream: require.resolve("stream-browserify"),
      'web-streams-polyfill': require.resolve('web-streams-polyfill'),  // Use the main entry point
    },
=======
>>>>>>> 8c7332c0677505a6fe7f1db6eed73bc0726d5462
  };

  return config;
})();
