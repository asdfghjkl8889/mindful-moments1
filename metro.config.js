const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];

const defaultBlockList = config.resolver.blockList
  ? Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList]
  : [];

config.resolver = {
  ...config.resolver,
  blockList: [
    ...defaultBlockList,
    /[/\\]\.local[/\\]/,
  ],
  resolveRequest: (context, moduleName, platform) => {
    if (platform === "web" && moduleName === "expo-router/unstable-native-tabs") {
      return { type: "empty" };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
