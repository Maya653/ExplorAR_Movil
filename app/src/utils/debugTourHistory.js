// src/utils/debugTourHistory.js
// Utilidad para depurar y corregir problemas con el historial de tours

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 🔍 Ver el historial actual almacenado
 */
export const debugViewHistory = async () => {
  try {
    const data = await AsyncStorage.getItem('explorar-tour-history');
    if (data) {
      const parsed = JSON.parse(data);
      console.log('📊 HISTORIAL ACTUAL:', JSON.stringify(parsed, null, 2));
      
      if (parsed.state?.watchedTours) {
        console.log(`\n📈 ESTADÍSTICAS:`);
        console.log(`Total de tours: ${parsed.state.watchedTours.length}`);
        
        parsed.state.watchedTours.forEach((tour, index) => {
          console.log(`\n${index + 1}. ${tour.tourTitle}`);
          console.log(`   - ID: ${tour.tourId}`);
          console.log(`   - Tipo: ${tour.tourType}`);
          console.log(`   - Visto: ${tour.watchCount} veces`);
          console.log(`   - Última vez: ${tour.watchedAt}`);
        });
      }
    } else {
      console.log('❌ No hay historial almacenado');
    }
  } catch (error) {
    console.error('Error al leer historial:', error);
  }
};

/**
 * 🔧 Corregir contador específico de un tour
 */
export const fixTourWatchCount = async (tourId, newCount = 1) => {
  try {
    const data = await AsyncStorage.getItem('explorar-tour-history');
    if (!data) {
      console.log('❌ No hay historial para corregir');
      return;
    }

    const parsed = JSON.parse(data);
    if (!parsed.state?.watchedTours) {
      console.log('❌ Formato de historial inválido');
      return;
    }

    const tourIndex = parsed.state.watchedTours.findIndex(t => t.tourId === tourId);
    if (tourIndex === -1) {
      console.log(`❌ Tour ${tourId} no encontrado`);
      return;
    }

    // Corregir el contador
    parsed.state.watchedTours[tourIndex].watchCount = newCount;
    parsed.state.watchedTours[tourIndex].watchedAt = new Date().toISOString();

    await AsyncStorage.setItem('explorar-tour-history', JSON.stringify(parsed));
    console.log(`✅ Contador del tour ${tourId} corregido a ${newCount}`);
  } catch (error) {
    console.error('Error al corregir contador:', error);
  }
};

/**
 * 🧹 Limpiar todo el historial
 */
export const clearAllHistory = async () => {
  try {
    await AsyncStorage.removeItem('explorar-tour-history');
    console.log('✅ Historial completamente limpiado');
  } catch (error) {
    console.error('Error al limpiar historial:', error);
  }
};

/**
 * 🔄 Resetear contadores de todos los tours a 1
 */
export const resetAllWatchCounts = async () => {
  try {
    const data = await AsyncStorage.getItem('explorar-tour-history');
    if (!data) {
      console.log('❌ No hay historial para resetear');
      return;
    }

    const parsed = JSON.parse(data);
    if (!parsed.state?.watchedTours) {
      console.log('❌ Formato de historial inválido');
      return;
    }

    // Resetear todos los contadores a 1
    parsed.state.watchedTours = parsed.state.watchedTours.map(tour => ({
      ...tour,
      watchCount: 1,
      watchedAt: new Date().toISOString()
    }));

    await AsyncStorage.setItem('explorar-tour-history', JSON.stringify(parsed));
    console.log(`✅ ${parsed.state.watchedTours.length} contadores reseteados a 1`);
  } catch (error) {
    console.error('Error al resetear contadores:', error);
  }
};

/**
 * 📊 Exportar historial como JSON (para debugging)
 */
export const exportHistory = async () => {
  try {
    const data = await AsyncStorage.getItem('explorar-tour-history');
    if (data) {
      const parsed = JSON.parse(data);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Error al exportar historial:', error);
    return null;
  }
};

// 🎯 Comandos rápidos para usar en la consola de desarrollo
export const tourHistoryDebug = {
  view: debugViewHistory,
  fix: fixTourWatchCount,
  clear: clearAllHistory,
  reset: resetAllWatchCounts,
  export: exportHistory,
};

export default tourHistoryDebug;