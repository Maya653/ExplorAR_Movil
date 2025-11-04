// Configuración para suprimir warnings específicos de three.js
const originalWarn = console.warn;
console.warn = function(message) {
  // Suprimir warnings específicos de three.js loaders
  if (
    typeof message === 'string' && 
    (
      message.includes('three contains an invalid package.json configuration') ||
      message.includes('ColladaLoader') ||
      message.includes('MTLLoader') ||
      message.includes('OBJLoader') ||
      message.includes('file does not exist. Falling back to file-based resolution')
    )
  ) {
    // No mostrar estos warnings específicos
    return;
  }
  // Mostrar otros warnings normalmente
  originalWarn.apply(console, arguments);
};

export default {};