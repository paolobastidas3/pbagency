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

Cada cliente puede funcionar en dos modos, sin necesidad de tocar código:

- **Datos de ejemplo**: mientras un cliente no tenga una cuenta de Meta
  conectada (o mientras el proyecto no tenga credenciales de Meta
  configuradas), el dashboard muestra datos simulados deterministas.
- **Datos en vivo**: una vez que conectas la Página de Facebook / cuenta de
  Instagram profesional de un cliente (botón "Conectar con Meta" en el
  dashboard), sus métricas se traen en tiempo real desde la Graph API de Meta.

El badge junto al nombre del cliente indica cuál de los dos modos está activo
("datos de ejemplo" / "datos en vivo").

## Cómo ejecutar en local

Requiere Node 18+.

**1. Backend (puerto 4000)**

```bash
cd backend
npm install
cp .env.example .env   # y completa las credenciales de Meta (ver abajo)
npm run dev
```

**2. Frontend (puerto 5173)**

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El frontend usa el proxy de Vite (`/api`) hacia
`http://localhost:4000`.

Si `backend/.env` no tiene `META_APP_ID`/`META_APP_SECRET`, la app funciona
igual, solo que todos los clientes quedan en modo "datos de ejemplo" y el
dashboard lo indica con un aviso ("Meta no configurado").

## Funcionalidades

- **Selector de clientes** en la barra lateral (uno por cuenta gestionada).
- **Conexión de cuentas reales** por cliente vía OAuth de Meta (Facebook
  Login), sin salir del dashboard.
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
  mejor desempeño (`backend/src/services/insights.js`), calculadas igual sobre
  datos de ejemplo o datos en vivo.

## Conectar cuentas reales de Instagram y Facebook

Esto requiere pasos que **solo tú puedes hacer** (dan acceso a cuentas reales,
así que Meta exige que los haga el dueño de la cuenta/app):

### 1. Requisito por cliente

Cada Instagram del cliente debe ser una cuenta **profesional (Business o
Creator)** vinculada a una **Página de Facebook** que administres. Instagram
"personal" no es compatible con la Graph API. Si un cliente todavía no lo
tiene: Instagram app → Configuración → Cuenta → cambiar a cuenta profesional →
vincular/crear la Página de Facebook asociada.

### 2. Crear la app en Meta for Developers

1. Entra a [developers.facebook.com/apps](https://developers.facebook.com/apps)
   con la cuenta de Facebook de la agencia y crea una app de tipo **"Business"**.
2. Dentro de la app, agrega el producto **"Facebook Login"**.
3. En Facebook Login → Configuración, agrega este **URI de redirección OAuth
   válido** (ajusta el dominio cuando despliegues a producción):
   ```
   http://localhost:4000/api/auth/facebook/callback
   ```
4. En Configuración → Básica, copia el **ID de la app** y el **Secreto de la
   app**.

### 3. Configurar el backend

En `backend/.env` (crear a partir de `backend/.env.example`):

```
META_APP_ID=tu_app_id
META_APP_SECRET=tu_app_secret
META_REDIRECT_URI=http://localhost:4000/api/auth/facebook/callback
FRONTEND_URL=http://localhost:5173
```

Reinicia el backend. El aviso "Meta no configurado" debe desaparecer y en su
lugar cada cliente mostrará el botón **"Conectar con Meta"**.

### 4. Modo Desarrollo vs. App Review (importante)

Mientras la app esté en **modo Desarrollo** (el estado inicial), Meta solo
permite traer datos de cuentas de **administradores, desarrolladores o
probadores de la app** — es decir, solo funcionará con Páginas/Instagram que
tú mismo administras, o cuentas de clientes que agregues como "Probador" en
Configuración → Roles de la app.

Para usarlo con clientes que administran sus propias Páginas (sin agregarlos
como probadores), Meta exige pasar **App Review** solicitando acceso avanzado
a los permisos `pages_show_list`, `pages_read_engagement`, `read_insights`,
`instagram_basic` e `instagram_manage_insights`, más **verificación de
negocio** de la app. Este proceso lo gestiona Meta directamente desde el panel
de la app (Revisión de la app → Permisos y funciones) y suele tardar días.

### 5. Conectar un cliente desde el dashboard

1. Selecciona el cliente en la barra lateral.
2. Haz clic en **"Conectar con Meta"** → te lleva al diálogo de autorización
   de Facebook.
3. Si administras varias Páginas, el dashboard te pedirá elegir cuál
   corresponde a ese cliente.
4. Listo: el badge cambia a "Conectado" y las métricas pasan a ser en vivo.
   Puedes desconectar en cualquier momento con el botón "Desconectar".

### Notas técnicas de la integración (`backend/src/services/metaApi.js`)

- Usa Graph API `v21.0`. El token de usuario se intercambia por uno de **larga
  duración** (~60 días) automáticamente al conectar.
- Los tokens y el ID de página/cuenta de Instagram de cada cliente se guardan
  en `backend/data/connections.json` (no se versiona; ver `.gitignore`). Para
  producción real, esto debería moverse a una base de datos con los tokens
  cifrados.
- Las métricas de Instagram varían según el tipo de publicación (los reels ya
  no reportan `impressions`, las historias no reportan `saved`, etc.); el
  servicio ajusta qué métricas pide según `media_product_type` y responde con
  `0` si Meta rechaza una métrica en vez de romper el dashboard.
- Las respuestas se cachean en memoria 15 minutos por cliente para no chocar
  con los límites de tasa de la Graph API.
- Si conectar falla o el token expira, el dashboard cae automáticamente de
  vuelta a datos de ejemplo en lugar de mostrar un error en blanco.

## Próximos pasos sugeridos

- Mover el almacenamiento de tokens (`backend/data/connections.json`) a una
  base de datos con cifrado, antes de usar esto en producción con datos
  reales de clientes.
- Renovar automáticamente el token de larga duración antes de que expire
  (Meta permite refrescarlo mientras siga siendo válido).
- Autenticación de usuarios de la agencia (hoy cualquiera con acceso al
  dashboard puede conectar/desconectar cualquier cliente).
