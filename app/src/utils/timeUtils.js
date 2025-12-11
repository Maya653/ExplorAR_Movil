// src/utils/timeUtils.js

/**
 * Convierte una fecha ISO a texto legible de tiempo relativo
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} - Tiempo relativo (ej: "hace 2 horas", "hace 3 días")
 */
export const getTimeAgo = (isoDate) => {
  if (!isoDate) return 'Fecha desconocida';
  
  const now = new Date();
  const date = new Date(isoDate);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Si es inválido
  if (isNaN(diffInSeconds)) return 'Fecha inválida';
  
  // Menos de 1 minuto
  if (diffInSeconds < 60) {
    return 'Hace un momento';
  }
  
  // Menos de 1 hora
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  
  // Menos de 1 día
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
  }
  
  // Menos de 1 semana
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  }
  
  // Menos de 1 mes
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
  }
  
  // Más de 1 mes
  const months = Math.floor(diffInSeconds / 2592000);
  if (months < 12) {
    return `Hace ${months} mes${months !== 1 ? 'es' : ''}`;
  }
  
  // Más de 1 año
  const years = Math.floor(months / 12);
  return `Hace ${years} año${years !== 1 ? 's' : ''}`;
};

/**
 * Formatea una fecha para mostrar de forma amigable
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} - Fecha formateada
 */
export const formatDate = (isoDate) => {
  if (!isoDate) return 'Sin fecha';
  
  const date = new Date(isoDate);
  if (isNaN(date)) return 'Fecha inválida';
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Obtiene el color del indicador según el tiempo transcurrido
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} - Color hex
 */
export const getWatchIndicatorColor = (isoDate) => {
  if (!isoDate) return '#9CA3AF';
  
  const now = new Date();
  const date = new Date(isoDate);
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  // Menos de 1 hora = verde brillante
  if (diffInHours < 1) return '#10B981';
  
  // Menos de 24 horas = verde
  if (diffInHours < 24) return '#059669';
  
  // Menos de 7 días = amarillo
  if (diffInHours < 168) return '#F59E0B';
  
  // Más de 7 días = gris
  return '#6B7280';
};