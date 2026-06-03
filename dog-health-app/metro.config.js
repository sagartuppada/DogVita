// metro.config.js — plain React Native (no Expo)

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;

const defaultConfig = getDefaultConfig(projectRoot);

const config = {
  watchFolders: [projectRoot],
  resolver: {
    extraNodeModules: {
      '@components': path.resolve(projectRoot, 'app/components'),
      '@screens': path.resolve(projectRoot, 'app/screens'),
      '@services': path.resolve(projectRoot, 'app/services'),
      '@hooks': path.resolve(projectRoot, 'app/hooks'),
      '@store': path.resolve(projectRoot, 'app/store'),
      '@types': path.resolve(projectRoot, 'app/types'),
      '@utils': path.resolve(projectRoot, 'app/utils'),
      '@theme': path.resolve(projectRoot, 'app/theme'),
      '@config': path.resolve(projectRoot, 'app/config'),
      '@assets': path.resolve(projectRoot, 'app/assets'),
      '@navigation': path.resolve(projectRoot, 'app/navigation'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
