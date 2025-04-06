const { getDefaultConfig } = require("expo/metro-config");
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.extraNodeModules = {
    assert: require.resolve("assert"),
    buffer: require.resolve("buffer"),
    crypto: require.resolve("react-native-crypto"),
    process: require.resolve("process"),
    stream: require.resolve("stream-browserify"),
    util: require.resolve("util"),
    events: require.resolve("events"),
};

module.exports = defaultConfig;







