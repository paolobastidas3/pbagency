# PB Agency — Dashboard de contenido (Instagram & Facebook)

Dashboard para revisar el rendimiento del contenido de Instagram y Facebook de
cada cliente de la agencia: alcance, impresiones, engagement, comparación por
plataforma y por formato, mejores publicaciones, y recomendaciones generadas
automáticamente sobre qué adaptar o mejorar.

## Estructura

```
backend/    API REST en Node/Express (Express 4, ESM)
frontend/   Dashboard en React + Vite, gráficos con Recharts
```

Actualmente el backend sirve **datos simulados** (deterministas, con
estacionalidad y diferencias reales entre formatos/plataformas) para que el
dashboard funcione de inmediato sin credenciales. Está organizado para que la
capa de datos (`backend/src/data/mockData.js`) se reemplace más adelante por
llamadas reales a la Graph API de Meta (Instagram/Facebook), manteniendo la
misma forma de datos que ya consumen las rutas e insights.

## Cómo ejecutar en local

Requiere Node 18+.

**1. Backend (puerto 4000)**

```bash
cd backend
npm install
npm run dev
```

**2. Frontend (puerto 5173)**

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El frontend usa el proxy de Vite (`/api`) hacia
`http://localhost:4000`, así que no hace falta configurar CORS ni variables de
entorno para desarrollo local.

## Funcionalidades

- **Selector de clientes** en la barra lateral (uno por cuenta gestionada).
- **Filtros** por plataforma (todas / Instagram / Facebook) y por rango de
  fechas (7 / 30 / 90 días).
- **Métricas generales**: publicaciones, alcance, impresiones, interacciones y
  engagement promedio.
- **Alcance y engagement en el tiempo** (series diarias).
- **Rendimiento por formato** (reel, carrusel, imagen, video, historia).
- **Comparación Instagram vs. Facebook**.
- **Mejores publicaciones**, ordenadas por tasa de engagement.
- **"Qué adaptar y mejorar"**: recomendaciones en lenguaje natural generadas
  comparando formatos, plataformas, tendencia reciente y día de la semana con
  mejor desempeño (`backend/src/services/insights.js`).

## Próximos pasos sugeridos

- Conectar `backend/src/data/mockData.js` a la Graph API de Meta (requiere
  registrar una app de Meta, permisos `instagram_basic`,
  `instagram_manage_insights`, `pages_read_engagement`, y tokens de acceso de
  larga duración por cliente).
- Persistir datos históricos en una base de datos en lugar de generarlos en
  memoria en cada arranque.
- Autenticación para que cada cliente solo vea su propia cuenta.
