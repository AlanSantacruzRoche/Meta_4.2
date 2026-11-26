# Refactorización del frontend

- Se eliminó la carpeta `composables/`: su lógica ahora vive dentro de cada componente.
- `App.vue`: navegación, estado global, carga de catálogos, snackbar y autenticación.
- `PlayersPage.vue`: filtros, guardado y eliminación de jugadores, y su diálogo.
- `RostersPage.vue`: filtros, CRUD de rosters, integrantes y sus diálogos.
- Se eliminó `DashboardView.vue` (no se usaba) y su estilo `.dashboard`.

La protección real de permisos continúa en el backend.
