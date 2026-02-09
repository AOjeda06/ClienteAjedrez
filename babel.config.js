module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Plugin para soportar metadata de decoradores (necesario para reflect-metadata)
      'babel-plugin-transform-typescript-metadata',
      // Plugin para soportar decoradores de JavaScript (usado por MobX)
      // legacy: true es necesario para compatibilidad con la sintaxis de decoradores pre-estándar
      ['@babel/plugin-proposal-decorators', { 'legacy': true }],
      // Plugin para soportar campos privados (#campo)
      '@babel/plugin-proposal-private-methods',
    ],
  };
};


