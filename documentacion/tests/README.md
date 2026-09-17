# Documentación de Tests — LexControl API

## Resumen Ejecutivo

| Métrica | Valor |
|---|---|
| **Total de tests** | 117 |
| **Tests pasando** | 117 (100%) |
| **Archivos de test** | 15 controladores + 2 fixtures |
| **Framework** | xUnit 2.9.3 + FluentAssertions 8.3.0 |
| **HTTP Client** | Microsoft.AspNetCore.Mvc.Testing 10.0.5 |
| **Base de datos** | SQL Server (DBLexControl) |

---

## Documentación por Tipo de Test

| Archivo | Descripción | Tests |
|---|---|---|
| [Tests-01-Autenticacion-Seguridad.md](./tests/Tests-01-Autenticacion-Seguridad.md) | Login, logout, tokens JWT, control de acceso por roles, endpoints sin autenticación | 31 |
| [Tests-02-CRUD-OperacionesBasicas.md](./tests/Tests-02-CRUD-OperacionesBasicas.md) | Listar, obtener por ID, crear, actualizar registros en todos los controladores | 53 |
| [Tests-03-ValidacionesNegocio.md](./tests/Tests-03-ValidacionesNegocio.md) | Duplicidad de datos, integridad referencial, campos obligatorios, rate limiting | 13 |
| [Tests-04-Reportes.md](./tests/Tests-04-Reportes.md) | Los 13 endpoints de reportes, filtrado por fechas, disponibilidad masiva | 17 |
| [Tests-05-Filtrado-Paginacion-Busqueda.md](./tests/Tests-05-Filtrado-Paginacion-Busqueda.md) | Parámetros de filtro, paginación, búsqueda de texto, filtrado por fechas | 18 |
| [Tests-06-InfraestructuraPruebas.md](./tests/Tests-06-InfraestructuraPruebas.md) | Configuración del servidor de prueba, helper de auth, patrones de respuesta | — |

---

## Archivos de Prueba

```
Back-end/LexControlApi.Tests/
├── Fixtures/
│   ├── TestWebApplicationFactory.cs    # Configuración del servidor de prueba
│   └── AuthHelper.cs                   # Generación de tokens y login
├── GlobalUsings.cs                     # Imports globales
├── AuthControllerTests.cs              # 7 tests
├── ClientesControllerTests.cs          # 11 tests
├── ExpedientesControllerTests.cs       # 12 tests
├── AudienciasControllerTests.cs        # 7 tests
├── TramitesControllerTests.cs          # 7 tests
├── DiligenciasControllerTests.cs       # 7 tests
├── NotificacionesControllerTests.cs    # 12 tests
├── EventosControllerTests.cs           # 5 tests
├── HistoricoControllerTests.cs         # 5 tests
├── ReportesControllerTests.cs          # 17 tests
├── CatalogosControllerTests.cs         # 10 tests
├── UsuariosControllerTests.cs          # 7 tests
├── PermisosControllerTests.cs          # 6 tests
└── PerfilControllerTests.cs            # 4 tests
```

---

## Matriz de Cobertura por Controlador

| Controlador | Auth | Listar | Por ID | Crear | Filtros | Total |
|---|---|---|---|---|---|---|
| **Auth** | 5 | — | — | — | — | 7 |
| **Clientes** | 1 | 1 | 3 | 3 | 2 | 11 |
| **Expedientes** | 1 | 1 | 3 | 2 | 1 | 12 |
| **Audiencias** | 1 | 1 | 2 | 1 | 1 | 7 |
| **Trámites** | 1 | 1 | 2 | 1 | 1 | 7 |
| **Diligencias** | 1 | 1 | 2 | 1 | 1 | 7 |
| **Notificaciones** | 1 | 1 | 2 | 1 | 1 | 7 |
| **Eventos** | 1 | — | — | 2 | — | 5 |
| **Histórico** | 1 | 1 | — | — | 3 | 5 |
| **Reportes** | 1 | — | — | — | 13 | 14 |
| **Catálogos** | 1 | 1 | 2 | 1 | 2 | 10 |
| **Usuarios** | 2 | 1 | 2 | — | 1 | 7 |
| **Permisos** | 2 | 1 | 2 | — | — | 6 |
| **Perfil** | 1 | — | — | — | — | 4* |

*Incluye test de actualización PUT*

---

## Comandos Útiles

```bash
# Ejecutar todos los tests
dotnet test Back-end/LexControlApi.Tests/LexControlApi.Tests.csproj

# Ejecutar tests de un controlador específico
dotnet test --filter "FullyQualifiedName~ClientesControllerTests"

# Ejecutar tests de un tipo específico
dotnet test --filter "FullyQualifiedName~Auth"

# Ver verbose
dotnet test --logger "console;verbosity=detailed"
```
