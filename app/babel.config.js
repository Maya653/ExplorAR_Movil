module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
        'react-native-reanimated/plugin', // siempre al final
        '@babel/plugin-proposal-optional-chaining', // agrega esta línea
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-transform-template-literals', // <-- agrega esta línea

    ],
  };
};
