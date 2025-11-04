# Backend ExplorAR (Node.js + Express)

Servidor API para la app móvil ExplorAR. Expone endpoints REST para carreras, tours, testimonios y analytics.

## Requisitos
- Node.js 16+ (recomendado 18+)
- Acceso a MongoDB Atlas (o una URI válida de MongoDB)

## Configuración
Crea un archivo `.env` en esta carpeta con el siguiente contenido (puedes copiar desde `.env.example`):

```
MONGODB_URI="mongodb+srv://<usuario>:<password>@<cluster>/<db>?retryWrites=true&w=majority"
PORT=5000
```

Notas:
- La app móvil asume el puerto `5000` por defecto. Puedes cambiarlo, pero recuerda ajustar el front (ver `app/src/utils/constants.js`).
- CORS está habilitado para desarrollo.

## Scripts
```powershell
# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

El servidor queda escuchando en `http://localhost:5000`.

## Endpoints principales
- GET /api/carreras
- GET /api/tours
- GET /api/tours/:id
- GET /api/testimonios
- POST /api/analytics
- GET /health

## Solución de problemas
- Si el server no arranca por error de MongoDB, revisa la cadena de conexión en `.env` y permisos de tu IP en Atlas.
- Para usar la app en un emulador Android, el front usará `http://10.0.2.2:5000` automáticamente.
