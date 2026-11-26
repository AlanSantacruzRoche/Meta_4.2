# Arena Manager — Frontend Vue 3 + Backend Express

Aplicación full-stack para administrar jugadores y rosters de eSports. El frontend y el backend ahora son proyectos separados dentro de un monorepo npm.

## Arquitectura

```text
arena-manager/
├── backend/              # API REST Node.js + Express + Sequelize + MySQL
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.js
│   ├── openapi.yaml
│   └── package.json
├── frontend/             # SPA Vue 3 + Vuetify 3 + Vite
│   ├── src/
│   │   ├── components/       # Vistas, tablas y diálogos
│   │   ├── services/         # Comunicación con la API
│   │   ├── App.vue           # Une los componentes
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   └── vite.config.js
├── tests/e2e/            # Playwright
├── .env                  # Configuración local compartida (no subir a Git)
├── package.json          # Workspaces y scripts del proyecto
└── playwright.config.js
```

## Requisitos
- Node.js 20 o superior.
- MySQL 8 o compatible.

## Instalación en Windows PowerShell

1. Crea la base de datos: 

```sql
CREATE DATABASE esports_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. En la carpeta raíz `arena-manager`, copia `.env.example` a `.env` y configura `DB_PASSWORD` y `JWT_SECRET`. Puedes hacerlo con PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Instala todas las dependencias de ambos workspaces desde la raíz:

```powershell
npm install
npx playwright install chromium
```

4. Inicia frontend y backend simultáneamente:

```powershell
npm run dev
```

5. Abre Vue en `http://localhost:5173`. La API corre en `http://localhost:3000` y Swagger en `http://localhost:3000/api-docs`.

## Ejecutar por separado
En dos terminales, ambas desde la raíz:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

## Comunicación frontend-backend
Vite ejecuta el frontend en el puerto 5173 y tiene un proxy `/api` hacia `http://localhost:3000`. Por eso Vue solicita `/api/v1/...` y el navegador mantiene las cookies de sesión en el mismo origen del frontend. La comunicación con el servidor está en `frontend/src/services/api.js`. Ahí se centralizan las peticiones, las cookies y el encabezado `X-CSRF-Token`.

Para apuntar el frontend a otra API, crea `frontend/.env` con `VITE_API_URL=https://tu-api.example.com/api/v1` y ajusta `CLIENT_URL` en el `.env` raíz para incluir el origen del frontend. En ese caso el navegador se comunica directamente con la API y CORS debe permitir el origen. En producción se recomienda servir ambos bajo HTTPS y configurar correctamente `SameSite`/`Secure` y dominios de cookies.

## Organización del frontend

El frontend está dividido por responsabilidad para que sea más sencillo ubicar y modificar cada parte:

- `components/AuthView.vue`: inicio de sesión y registro.
- `components/LandingPage.vue`: página pública que se muestra al entrar sin iniciar sesión.
- `components/PlayerTable.vue` y `components/RosterList.vue`: muestran jugadores y rosters.
- `components/PlayerDialog.vue`, `RosterDialog.vue` y `RosterMembersDialog.vue`: formularios y administración de integrantes.
- `components/AppHeader.vue`: barra superior y cierre de sesión.
- `App.vue`: sesión, navegación, carga de catálogos y snackbar.
- `pages/PlayersPage.vue` y `pages/RostersPage.vue`: filtros, operaciones y diálogos de cada dominio.
- `services/api.js`: peticiones HTTP a la API.
- `App.vue`: conecta los componentes y sus eventos.

La idea es mantener los componentes enfocados en mostrar la interfaz. El estado global vive en `App.vue` y la lógica de cada dominio en su página, y las peticiones se mantienen en el servicio de API.

## Funcionalidades
- Registro e inicio de sesión local.
- Inicio de sesión y registro con Google OAuth 2.0.
- JWT en cookie HttpOnly y protección CSRF.
- Roles Admin y Public.
- CRUD de jugadores y rosters.
- Asignación de jugadores como Titular/Suplente, cambio de rol y retiro.
- Swagger en `/api-docs`.

Las cuentas nuevas reciben rol `Public`. El Admin inicial se crea si no existe, usando `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.


## Configurar inicio de sesión con Google

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) y crea o selecciona un proyecto.
2. Configura la pantalla de consentimiento OAuth. Para pruebas, selecciona el tipo de usuario adecuado y agrega tu cuenta como usuario de prueba si Google lo solicita.
3. En **APIs y servicios → Credenciales**, crea un **ID de cliente OAuth 2.0** de tipo **Aplicación web**.
4. En **Orígenes autorizados de JavaScript**, agrega:
   - `http://localhost:5173`
5. En **URI de redireccionamiento autorizados**, agrega exactamente:
   - `http://localhost:3000/api/v1/auth/google/callback`
6. Copia el ID de cliente y el secreto al `.env` de la raíz del proyecto:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

7. Guarda el archivo y reinicia el backend con `npm run dev`.
8. En la pantalla de acceso aparecerá **Continuar con Google**. Google regresará a la API y esta abrirá la sesión y redirigirá a Vue.

La primera vez que una persona entra con Google se crea una cuenta con rol `Public`. Si ya existe una cuenta local con el mismo correo verificado, se vincula a esa cuenta. El rol existente se conserva; Google no puede convertir una cuenta en administrador. Las sesiones siguen usando las cookies JWT HttpOnly y CSRF que utiliza el inicio de sesión normal.

**Importante:** el `GOOGLE_REDIRECT_URI` debe coincidir carácter por carácter con el URI registrado en Google Cloud. Para producción debes usar HTTPS y registrar el dominio/URI real de tu aplicación. No compartas ni subas `GOOGLE_CLIENT_SECRET` al repositorio.

### Cambio de base de datos

Al arrancar, el backend agrega `google_id` a `usuarios_locales` y permite que `password_hash` sea nulo para las cuentas creadas exclusivamente con Google. La actualización conserva las cuentas y datos existentes. Aun así, realiza una copia de seguridad antes de actualizar una base de datos importante.

## Pruebas E2E
Las pruebas se ejecutan desde la raíz. Requieren MySQL activo y `.env` configurado. Usa una base exclusiva de pruebas (`DB_NAME=esports_api_test`) porque las pruebas crean y eliminan registros.

```powershell
npm run test:e2e
```

Playwright levanta el backend y Vite mediante `npm run dev` y espera a que `http://localhost:5173/api/v1/health` responda a través del proxy.

## Variables importantes
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: conexión MySQL.
- `JWT_SECRET`: secreto aleatorio de al menos 32 caracteres.
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: cuenta inicial.
- `PORT`: puerto de la API (por defecto 3000).
- `CLIENT_URL`: origen permitido por CORS (por defecto `http://localhost:5173`).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: credenciales del cliente OAuth de Google.
- `GOOGLE_REDIRECT_URI`: callback registrado en Google Cloud.
- `FRONTEND_URL`: dirección del frontend a la que regresa el callback.
- `VITE_API_URL`: base URL de la API en frontend; normalmente `/api/v1`.

No subas `.env` al repositorio.

## Navegación por páginas

El frontend utiliza rutas independientes en lugar de pestañas para cambiar entre secciones:

- `/`: página de inicio pública.
- `/login`: inicio de sesión y registro.
- `/panel`: resumen de la cuenta autenticada.
- `/jugadores`: directorio de jugadores.
- `/rosters`: administración y consulta de rosters.

El panel autenticado utiliza un menú lateral. Las páginas de jugadores y rosters también son accesibles sin iniciar sesión en modo de solo lectura. La navegación se sincroniza con el historial del navegador, por lo que funcionan los botones Atrás y Adelante.

La lógica global (navegación, autenticación y carga de datos) está en `frontend/src/App.vue`; la de jugadores y rosters, en sus páginas. Las vistas están separadas en `frontend/src/pages/` y el menú autenticado en `frontend/src/layouts/AppLayout.vue`.

## Página pública y acceso de administrador

Al abrir la aplicación se muestra la página principal con consulta pública de jugadores y rosters. No es necesario iniciar sesión para consultar esa información. El botón **Acceso administrador** abre el formulario de autenticación.

Las cuentas registradas y las cuentas nuevas creadas mediante Google OAuth reciben el rol `Public`. El rol `Admin` se asigna únicamente desde el backend mediante la cuenta administrativa inicial configurada con `ADMIN_EMAIL` y `ADMIN_PASSWORD` (o mediante una modificación autorizada de la base de datos). La interfaz oculta las acciones de escritura a los usuarios sin rol Admin y el backend también protege esas operaciones con `authenticateJWT` y `requireAdmin`; ocultar botones no es la única medida de seguridad.
