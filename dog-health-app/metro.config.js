const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Empty module stub — used for Node.js builtins that ws/realtime-js need but RN doesn't provide
const empty = path.resolve(__dirname, 'empty-module.js');

const nodeBuiltinAliases = [
  'http', 'https', 'net', 'tls', 'crypto', 'dns', 'fs', 'path',
  'stream', 'zlib', 'buffer', 'events', 'util', 'url', 'os',
];

const extraNodeModules = {};
nodeBuiltinAliases.forEach(mod => { extraNodeModules[mod] = empty; });

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    extraNodeModules: new Proxy(extraNodeModules, {
      get: (target, name) => {
        if (name in target) return target[name];
        return path.join(__dirname, 'node_modules', String(name));
      },
    }),
  },
});
