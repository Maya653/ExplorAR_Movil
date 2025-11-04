const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración personalizada para resolver los problemas con three.js
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.alias = {
  ...config.resolver.alias,
  // Alias para los loaders de three.js que causan problemas
  'three/examples/jsm/loaders/ColladaLoader': 'three/examples/jsm/loaders/ColladaLoader.js',
  'three/examples/jsm/loaders/MTLLoader': 'three/examples/jsm/loaders/MTLLoader.js',
  'three/examples/jsm/loaders/OBJLoader': 'three/examples/jsm/loaders/OBJLoader.js',
  'three/examples/jsm/loaders/GLTFLoader': 'three/examples/jsm/loaders/GLTFLoader.js',
  'three/examples/jsm/loaders/FBXLoader': 'three/examples/jsm/loaders/FBXLoader.js',
};

// Ignorar archivos específicos que causan warnings
config.resolver.blacklistRE = /.*\/node_modules\/three\/examples\/jsm\/loaders\/(ColladaLoader|MTLLoader|OBJLoader)$/;

// Configuración adicional para React Native Web
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

module.exports = config;