/* Entorno de desarrollo: se usa proxy.conf.json para reenviar /api al backend.
   apiBaseUrl vacío → las peticiones van a http://localhost:4200/api/...
   que el proxy reenvía a https://localhost:7276 (sin problemas de CORS ni cert). */
export const environment = {
    apiBaseUrl: ''
};
