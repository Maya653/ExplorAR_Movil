// scripts/create_indexes.js
// Ejecutar: node scripts/create_indexes.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI no está definido en el .env');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri, { maxPoolSize: 10 });
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    const db = client.db('ExplorAR');

    const tours = db.collection('tours');
    const testimonios = db.collection('testimonios');
    // Helper: verificar índices existentes para evitar IndexOptionsConflict
    const indexList = async (coll) => {
      const idx = await coll.indexes();
      // devolver mapa keyString -> index info
      const map = {};
      for (const i of idx) {
        map[JSON.stringify(i.key)] = i;
      }
      return map;
    };

    const ensureIndex = async (coll, spec, options = {}) => {
      const existing = await indexList(coll);
      const keyStr = JSON.stringify(spec);
      if (existing[keyStr]) {
        console.log(`Índice ya existe para keys ${keyStr} (nombre: ${existing[keyStr].name}) - saltando.`);
        return existing[keyStr];
      }

      try {
        console.log(`Creando índice ${options.name || JSON.stringify(spec)} para keys ${keyStr}...`);
        const name = await coll.createIndex(spec, options);
        console.log(`Índice creado: ${name}`);
        return { name, key: spec };
      } catch (err) {
        // Manejar conflicto si existe un índice con la misma key pero distinta opción/nombre
        if (err.codeName === 'IndexOptionsConflict' || /Index already exists/.test(err.message)) {
          console.warn(`Conflicto de índice detectado para keys ${keyStr}: ${err.message}`);
          // No eliminamos ni re-creamos automáticamente para evitar pérdida de datos; devolver null
          return null;
        }
        throw err;
      }
    };

    await ensureIndex(tours, { careerId: 1 }, { name: 'idx_tours_careerId' });
    await ensureIndex(tours, { type: 1, careerId: 1 }, { name: 'idx_type_career' });
    await ensureIndex(testimonios, { author: 'text', text: 'text' }, { name: 'idx_testimonios_text' });
    await ensureIndex(testimonios, { email: 1 }, { name: 'idx_testimonios_email' });

    console.log('Proceso de índices finalizado.');
  } catch (err) {
    console.error('Error creando índices:', err);
  } finally {
    await client.close();
    process.exit(0);
  }
}

run();
