// server/index.js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

// Helper
const formatRating = (rating) => parseFloat(rating || 0).toFixed(1);

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

// Si no hay URI, no abortamos: habilitamos un modo fallback en memoria
if (!uri) {
  console.warn('⚠️  MONGODB_URI no está definido en .env. Iniciando en modo fallback en memoria.');
}

const client = uri ? new MongoClient(uri) : null;

// ✅ CACHE PARA TOURS
let toursCache = null;
let toursCacheTime = null;

// ✅ CACHE PARA TESTIMONIOS
let testimoniosCache = null;
let testimoniosCacheTime = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// ========== MANEJO GLOBAL DE ERRORES ==========
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:');
  console.error('Razón:', reason);
  console.error('Stack:', reason?.stack);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
});

process.on('warning', (warning) => {
  console.warn('⚠️  Warning:', warning.name, warning.message);
});

async function startServer() {
  let connected = false;
  let db, coll, toursColl, testimoniosColl, analyticsColl;
  
  if (client) {
    try {
      console.log('🔄 Intentando conectar a MongoDB...');
      await client.connect();
      console.log('✅ Conectado a MongoDB Atlas');
      connected = true;

      db = client.db('ExplorAR');
      coll = db.collection('carreras');
      toursColl = db.collection('tours');
      testimoniosColl = db.collection('testimonios');
      analyticsColl = db.collection('analytics');
    } catch (err) {
      console.error('❌ No se pudo conectar a MongoDB. Se iniciará el servidor en modo fallback:', err.message);
      connected = false;
    }
  }

  // Función de mapeo común para testimonios
  const mapTestimonio = (t) => ({
    id: (t._id || t.id || '').toString(),
    author: t.author || t.autor || t.name || t.title || 'Anónimo',
    authorImage: t.authorImage || t.autorimagen || t.imageUrl || null,
    role: t.role || t.position || t.authorRole || '',
    year: t.year || t.date || t.graduationYear || '',
    text: t.text || t.testimonio || t.content || '',
    _raw: t,
  });

  // Datos de ejemplo para modo fallback (en memoria)
  const sampleTestimonios = [
    {
      _id: 'sample-1',
      author: 'Ana Pérez',
      authorImage: 'https://i.pravatar.cc/300?img=5',
      role: 'Egresada de Mecatrónica',
      year: '2022',
      text: 'ExplorAR me ayudó a decidir mi carrera con una experiencia inmersiva y práctica.',
    },
    {
      _id: 'sample-2',
      autor: 'Carlos López',
      autorimagen: 'https://i.pravatar.cc/300?img=12',
      position: 'Estudiante de Sistemas',
      date: '2024',
      testimonio: 'Los tours en AR son increíbles para entender los laboratorios del campus.',
    },
  ];

  if (!connected) {
    // Solo rutas mínimas necesarias para que la app funcione
    app.get('/api/testimonios', async (req, res) => {
      try {
        console.log('📥 GET /api/testimonios (fallback)');
        const mapped = sampleTestimonios.map(mapTestimonio);
        console.log(`✅ Enviando ${mapped.length} testimonios (fallback)`);
        return res.json(mapped);
      } catch (err) {
        console.error('❌ Error en GET /api/testimonios (fallback):', err);
        return res.status(500).json({ error: 'Error interno del servidor (fallback)' });
      }
    });

    // Health check
    app.get('/health', (req, res) => {
      console.log('💚 Health check (fallback)');
      res.json({ ok: true, mode: 'fallback', timestamp: new Date().toISOString() });
    });

    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Servidor (fallback) corriendo en http://0.0.0.0:${port}`);
      console.log(`📱 Para emulador Android: http://10.0.2.2:${port}`);
      console.log(`📡 Endpoints disponibles (fallback):`);
      console.log(`   - GET  /api/testimonios`);
      console.log(`   - GET  /health`);
    });
    return;
  }

  try {
    // Logs de verificación
    try {
      const carrerasCount = await coll.countDocuments();
      const toursCount = await toursColl.countDocuments();
      const testimoniosCount = await testimoniosColl.countDocuments();
      
      console.log(`📊 Base de datos ExplorAR:`);
      console.log(`   📚 Carreras: ${carrerasCount}`);
      console.log(`   🎬 Tours: ${toursCount}`);
      console.log(`   💬 Testimonios: ${testimoniosCount}`);
    } catch (e) {
      console.warn('⚠️  No se pudo contar documentos:', e.message);
    }

    // ========== ENDPOINT: Carreras ==========
    app.get('/api/carreras', async (req, res) => {
      try {
        console.log('📥 GET /api/carreras');
        const docs = await coll.find({}).toArray();
        
        if (docs.length === 0) {
          console.log('⚠️  No se encontraron carreras en la base de datos');
          return res.json([]);
        }

        const mapped = docs.map(d => ({
          id: d._id.toString(),
          _id: d._id.toString(),
          title: d.name,
          tours: d.tourCount ? `${d.tourCount} tours disponibles` : '0 tours disponibles',
          rating: d.averageRating ? formatRating(d.averageRating) : '0.0',
          reviews: '0 reseñas',
          description: d.description || '',
          category: d.category || 'Sin categoría',
          isHighlighted: !!d.isHighlighted
        }));

        console.log(`✅ Enviando ${mapped.length} carreras`);
        return res.json(mapped);
      } catch (err) {
        console.error('❌ Error en GET /api/carreras:', err);
        return res.status(500).json({ 
          error: 'Error interno del servidor',
          details: err.message 
        });
      }
    });

    // ========== ENDPOINT: Tours CON CACHE ==========
    app.get('/api/tours', async (req, res) => {
      console.log('📥 GET /api/tours - INICIO');
      
      try {
        // ✅ VERIFICAR SI HAY CACHE VÁLIDO
        const now = Date.now();
        if (toursCache && toursCacheTime && (now - toursCacheTime < CACHE_DURATION)) {
          const cacheAge = Math.floor((now - toursCacheTime) / 1000);
          console.log(`✅ Usando cache de tours (${cacheAge}s de antigüedad)`);
          return res.json(toursCache);
        }
        
        // Cache vacío o expirado, consultar MongoDB
        console.log('🔄 Cache vacío o expirado, consultando MongoDB...');
        
        // ✅ CONSULTA A MONGODB (solo metadatos)
        const docs = await toursColl.aggregate([
          {
            $project: {
              _id: 1,
              title: 1,
              name: 1,
              duration: 1,
              progress: 1,
              image: 1,
              imageUrl: 1,
              description: 1,
              careerId: 1,
              career: 1,
              type: 1
            }
          },
          { $limit: 50 }
        ])
        .maxTimeMS(180000) // 3 minutos timeout
        .toArray();
        
        console.log(`📦 ${docs.length} tours obtenidos de MongoDB`);
        
        // ✅ MAPEAR DATOS
        const mapped = docs.map(t => ({
          id: t._id?.toString() || '',
          _id: t._id?.toString() || '',
          title: t.title || t.name || 'Sin título',
          duration: t.duration || '0 min',
          progress: t.progress || 0,
          image: t.imageUrl || t.image || null,
          description: t.description || '',
          careerId: t.careerId?.toString() || t.career?.toString() || null,
          type: t.type || 'AR',
          multimedia: [] // Se carga en /api/tours/:id
        }));
        
        // ✅ GUARDAR EN CACHE
        toursCache = mapped;
        toursCacheTime = now;
        
        const cacheExpiry = Math.floor(CACHE_DURATION / 1000);
        console.log(`✅ ${mapped.length} tours guardados en cache (válido por ${cacheExpiry} segundos)`);
        res.json(mapped);
        
      } catch (err) {
        console.error('❌ Error en /api/tours:', err.message);
        console.error('Stack:', err.stack);
        
        // ✅ FALLBACK: Si hay cache viejo, usarlo
        if (toursCache) {
          console.warn('⚠️ Error en MongoDB, usando cache antiguo de tours');
          return res.json(toursCache);
        }
        
        res.status(500).json({ 
          error: 'Error al obtener tours',
          message: err.message 
        });
      }
    });

    // ========== ENDPOINT: Tour individual ==========
    app.get('/api/tours/:id', async (req, res) => {
      try {
        const { id } = req.params;
        console.log(`📥 GET /api/tours/${id}`);
        
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'ID inválido' });
        }

        const tour = await toursColl.findOne({ _id: new ObjectId(id) });
        
        if (!tour) {
          return res.status(404).json({ error: 'Tour no encontrado' });
        }

        const mapped = {
          id: tour._id.toString(),
          _id: tour._id.toString(),
          title: tour.title || tour.name || 'Sin título',
          description: tour.description || '',
          duration: tour.duration || '0 min',
          type: tour.type || 'AR',
          careerId: tour.careerId || tour.career || null,
          multimedia: tour.multimedia || [],
          hotspots: tour.hotspots || [],
          arConfig: tour.arConfig || {},
        };

        console.log(`✅ Tour encontrado: ${mapped.title}`);
        return res.json(mapped);
      } catch (err) {
        console.error('❌ Error en GET /api/tours/:id:', err);
        return res.status(500).json({ error: 'Error interno', details: err.message });
      }
    });

    // ========== ENDPOINT: Modelo del tour ==========
    app.get('/api/tours/:id/model', async (req, res) => {
      try {
        const { id } = req.params;
        console.log(`📥 GET /api/tours/${id}/model`);

        const fallbackGlb = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
        return res.redirect(302, fallbackGlb);
      } catch (err) {
        console.error('❌ Error en GET /api/tours/:id/model:', err);
        return res.status(500).json({ error: 'Error interno' });
      }
    });

    // ========== ENDPOINT: Testimonios CON CACHE ==========
    app.get('/api/testimonios', async (req, res) => {
      console.log('📥 GET /api/testimonios - INICIO');
      
      try {
        // ✅ VERIFICAR CACHE
        const now = Date.now();
        if (testimoniosCache && testimoniosCacheTime && (now - testimoniosCacheTime < CACHE_DURATION)) {
          const cacheAge = Math.floor((now - testimoniosCacheTime) / 1000);
          console.log(`✅ Usando cache de testimonios (${cacheAge}s de antigüedad)`);
          return res.json(testimoniosCache);
        }
        
        console.log('🔄 Consultando MongoDB...');
        const docs = await testimoniosColl.find({})
          .maxTimeMS(60000)
          .toArray();
        
        console.log(`📦 ${docs.length} testimonios obtenidos`);
        
        const mapped = docs.map(mapTestimonio);
        
        // ✅ GUARDAR EN CACHE
        testimoniosCache = mapped;
        testimoniosCacheTime = now;
        
        console.log(`✅ ${mapped.length} testimonios guardados en cache`);
        res.json(mapped);
        
      } catch (err) {
        console.error('❌ Error en /api/testimonios:', err.message);
        console.error('Stack:', err.stack);
        
        // ✅ FALLBACK: Cache viejo
        if (testimoniosCache) {
          console.warn('⚠️ Usando cache antiguo de testimonios');
          return res.json(testimoniosCache);
        }
        
        res.status(500).json({ 
          error: 'Error interno del servidor', 
          details: err.message 
        });
      }
    });

    // ========== ENDPOINT: Analytics (POST) ==========
    app.post('/api/analytics', async (req, res) => {
      try {
        const { events, batchTimestamp } = req.body;

        if (!Array.isArray(events) || events.length === 0) {
          return res.status(400).json({ error: 'Se requiere un array de eventos' });
        }

        console.log(`📊 Recibiendo ${events.length} eventos de analytics...`);

        const docs = events.map(event => ({
          ...event,
          batchTimestamp: batchTimestamp || new Date().toISOString(),
          createdAt: new Date(),
        }));

        const result = await analyticsColl.insertMany(docs);

        console.log(`✅ ${result.insertedCount} eventos guardados en MongoDB`);

        res.json({
          success: true,
          insertedCount: result.insertedCount,
          message: 'Eventos registrados exitosamente',
        });
      } catch (err) {
        console.error('❌ Error en POST /api/analytics:', err);
        res.status(500).json({
          error: 'Error al guardar eventos',
          details: err.message,
        });
      }
    });

    // ========== ENDPOINT: Métricas de usuario ==========
    app.get('/api/analytics/user/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        console.log(`📥 GET /api/analytics/user/${userId}`);

        const metrics = await analyticsColl.aggregate([
          { $match: { userId: userId } },
          {
            $group: {
              _id: '$eventType',
              count: { $sum: 1 },
            },
          },
        ]).toArray();

        res.json({
          userId,
          metrics,
        });
      } catch (err) {
        console.error('❌ Error obteniendo métricas:', err);
        res.status(500).json({ error: 'Error al obtener métricas' });
      }
    });

    // ========== ENDPOINT: Eliminar carrera ==========
    app.delete('/api/carreras/:id', async (req, res) => {
      try {
        const { id } = req.params;
        console.log(`🗑️  DELETE /api/carreras/${id}`);
        
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'ID inválido' });
        }
        
        const result = await coll.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Carrera no encontrada' });
        }
        
        console.log(`✅ Carrera eliminada`);
        return res.json({ success: true });
      } catch (err) {
        console.error('❌ Error en DELETE /api/carreras/:id:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
    });

    // ========== ENDPOINT: Limpiar cache de tours ==========
    app.post('/api/tours/clear-cache', (req, res) => {
      toursCache = null;
      toursCacheTime = null;
      console.log('🗑️ Cache de tours limpiado manualmente');
      res.json({ success: true, message: 'Cache de tours limpiado' });
    });

    // ========== ENDPOINT: Limpiar cache de testimonios ==========
    app.post('/api/testimonios/clear-cache', (req, res) => {
      testimoniosCache = null;
      testimoniosCacheTime = null;
      console.log('🗑️ Cache de testimonios limpiado manualmente');
      res.json({ success: true, message: 'Cache de testimonios limpiado' });
    });

    // ========== ENDPOINT: Limpiar todo el cache ==========
    app.post('/api/clear-all-cache', (req, res) => {
      toursCache = null;
      toursCacheTime = null;
      testimoniosCache = null;
      testimoniosCacheTime = null;
      console.log('🗑️ TODO el cache limpiado manualmente');
      res.json({ success: true, message: 'Todo el cache limpiado' });
    });

    // ========== Health check ==========
    app.get('/health', (req, res) => {
      console.log('💚 Health check');
      res.json({ 
        ok: true, 
        timestamp: new Date().toISOString(),
        cache: {
          tours: {
            count: toursCache ? toursCache.length : 0,
            age: toursCacheTime ? Math.floor((Date.now() - toursCacheTime) / 1000) : null
          },
          testimonios: {
            count: testimoniosCache ? testimoniosCache.length : 0,
            age: testimoniosCacheTime ? Math.floor((Date.now() - testimoniosCacheTime) / 1000) : null
          }
        }
      });
    });

  } catch (err) {
    console.error('❌ Error configurando endpoints:', err);
  }

  // ========== INICIAR SERVIDOR ==========
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${port}`);
    console.log(`📱 Para emulador Android: http://10.0.2.2:${port}`);
    console.log(`📡 Endpoints disponibles:`);
    console.log(`   - GET  /api/carreras`);
    console.log(`   - GET  /api/tours`);
    console.log(`   - GET  /api/tours/:id`);
    console.log(`   - GET  /api/testimonios`);
    console.log(`   - POST /api/analytics`);
    console.log(`   - POST /api/tours/clear-cache`);
    console.log(`   - POST /api/testimonios/clear-cache`);
    console.log(`   - POST /api/clear-all-cache`);
    console.log(`   - GET  /health`);
  });
}

// Cerrar cliente al terminar el proceso
process.on('SIGINT', async () => {
  try {
    if (client) {
      await client.close();
      console.log('👋 Conexión a MongoDB cerrada');
    }
  } catch (e) {
    // ignore
  }
  process.exit(0);
});

startServer();