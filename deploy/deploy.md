# Guía de despliegue — LexControl

Guía de instalación limpia del sistema (base de datos + API + SPA).

| Carpeta | Uso |
|---|---|
| `deploy/produccion/` | Scripts SQL para la BD de **producción** `DB_Lexcontrol` (Azure SQL Database) |
| `deploy/Desarrollo/` | Scripts SQL para la BD de **pruebas** `DB_Lexcontrol_Test` (misma estructura; probar la web sin tocar producción) |
| `deploy/migraciones/` | Reservada para futuras migraciones (por ahora vacía) |

| Contenido | Ruta (igual en `produccion/` y `Desarrollo/`) |
|---|---|
| Esquema (tablas, índices, FKs) | `01_schema.sql` |
| SP de una tabla (escritura simple) | `02_sp_escritura_simple.sql` |
| SP multi-tabla (transaccionales) | `03_sp_transaccionales.sql` |
| Datos iniciales de configuración | `04_seed.sql` |

> Los ocho archivos son **UTF-8 sin BOM**: ejecutarlos siempre con
> `sqlcmd -f 65001` para que los acentos se lean bien.

---

## 1. Requisitos

| Componente | Versión / nota |
|---|---|
| Windows + PowerShell | 5.1 o superior |
| Azure SQL Database | BD de producción `DB_Lexcontrol` y pruebas `DB_Lexcontrol_Test` |
| `sqlcmd` | 16.x (viene con SSMS/Command Line Utilities) |
| .NET SDK | 10.x (`dotnet --version` → `10.0.201`) |
| Node.js + npm | 20+ (Angular 20) |
| Playwright | solo para E2E (`npx playwright install`) |

Comprobación rápida:

```powershell
dotnet --version
node --version
sqlcmd -? | Select-Object -First 1
```

---

## 2. Configuración previa

### 2.1 Secreto JWT (obligatorio)

La API **no arranca** si no hay un secreto de ≥32 caracteres
(`Program.cs` lanza `InvalidOperationException`). Se configura una sola vez por
máquina, en ámbito de usuario:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\set-jwt-secret.ps1
```

Verificar en una terminal nueva:

```powershell
[System.Environment]::GetEnvironmentVariable("JWT_SECRET", "User")
```

Alternativa: rellenar `Back-end\LexControlApi\appsettings.json` →
`Jwt:Secret` (mínimo 32 caracteres). **No versionar el secreto.**

### 2.2 Cadena de conexión

`Back-end\LexControlApi\appsettings.json` → `ConnectionStrings:DefaultConnection`:

```
Server=DESKTOP-V7G3G1I\SQLEXPRESS;Database=DBLexControl;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true
```

Cambiar el servidor/instanciación si la BD vive en otra máquina. Autenticación
integrada de Windows (`-E` en los ejemplos de `sqlcmd`); si usa SQL
Authentication, reemplazar `-E` por `-U <usuario> -P <contraseña>`.

Para **Azure SQL Database** (producción `DB_Lexcontrol` o pruebas
`DB_Lexcontrol_Test`) la cadena es:

```
Server=tcp:<servidor>.database.windows.net,1433;Initial Catalog=DB_Lexcontrol;User ID=<usuario>;Password=<clave>;Encrypt=True;TrustServerCertificate=False
```

Azure **no admite** autenticación de Windows: usar `-U/-P` (SQL auth) o `-G`
(Microsoft Entra). Ver §3.

### 2.3 Almacenamiento de documentos

La API guarda los archivos adjuntos en **Cloudinary** (sección `Cloudinary` de
`appsettings.json`; credenciales vía user-secrets/variables de entorno, nunca en
el repo). En versiones previas se usaba
`Back-end\LexControlApi\wwwroot\documentos` (`FileStorage:BasePath`).

---

## 3. Base de datos — Azure SQL Database (orden obligatorio: 01 → 04)

Los scripts de `deploy/` están adaptados a **Azure SQL Database**: no contienen
`USE`, `CREATE DATABASE` ni `DROP DATABASE` (Azure los rechaza con error 40508 /
no soporta `SINGLE_USER`). La BD destino debe **ya existir** y estar **vacía**;
el nombre se elige en la conexión (`-d`).

| Entorno | BD | Carpeta |
|---|---|---|
| Producción | `DB_Lexcontrol` | `deploy/produccion/` |
| Pruebas | `DB_Lexcontrol_Test` | `deploy/Desarrollo/` |

`-b` detiene la ejecución y devuelve código de error si algún lote falla.

### 3.1 Producción (`DB_Lexcontrol`)

```powershell
$S  = "tcp:<servidor>.database.windows.net,1433"
$U  = "<usuario-sql>"        # o -G para Microsoft Entra
$P  = "<clave>"
$i  = "deploy\produccion"

sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol -b -f 65001 -i "$i\01_schema.sql"
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol -b -f 65001 -i "$i\02_sp_escritura_simple.sql"  # 50 SP
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol -b -f 65001 -i "$i\03_sp_transaccionales.sql"   # 68 SP
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol -b -f 65001 -i "$i\04_seed.sql"                 # datos mínimos
```

### 3.2 Pruebas (`DB_Lexcontrol_Test`)

Paso 0: crear la BD de pruebas si no existe (se ejecuta contra `master`,
porque `CREATE DATABASE` no corre dentro de una BD de usuario):

```powershell
sqlcmd -S $S -U $U -P $P -d master -b -f 65001 -i deploy\Desarrollo\00_crear_bd.sql
```

Luego los mismos comandos de producción contra la BD de pruebas usando
`deploy\Desarrollo\` (misma estructura; sirve para probar la aplicación sin
tocar producción):

```powershell
$i = "deploy\Desarrollo"

sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol_Test -b -f 65001 -i "$i\01_schema.sql"
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol_Test -b -f 65001 -i "$i\02_sp_escritura_simple.sql"
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol_Test -b -f 65001 -i "$i\03_sp_transaccionales.sql"
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol_Test -b -f 65001 -i "$i\04_seed.sql"
```

### 3.3 Verificación

```powershell
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol -Q "SET NOCOUNT ON;
SELECT 'tablas' q, COUNT(*) n FROM sys.tables
UNION ALL SELECT 'procedures', COUNT(*) FROM sys.procedures
UNION ALL SELECT 'fk', COUNT(*) FROM sys.foreign_keys
UNION ALL SELECT 'usuarios', COUNT(*) FROM USUARIO
UNION ALL SELECT 'modulos', COUNT(*) FROM MODULO
UNION ALL SELECT 'permisos_rol', COUNT(*) FROM PERMISO_ROL
UNION ALL SELECT 'config', COUNT(*) FROM CONFIGURACION;" -W -s"|"
```

Resultado esperado en una instalación limpia:

| Métrica | Valor |
|---|---|
| `sys.tables` | 53 |
| `sys.procedures` | 118 |
| `sys.foreign_keys` | 79 |
| `USUARIO` | 1 (admin) |
| `ROL` / `MODULO` / `PERMISO_ROL` | 3 / 10 / 30 |
| `CONFIGURACION` | 5 |
| `DEPARTAMENTO` / `MUNICIPIO` / `JUZGADO` | 22 / 35 / 8 |
| Clientes, expedientes, audiencias, trámites | 0 (no se siembran datos de demo) |

Los cuatro scripts son **idempotentes** excepto `01_schema.sql`: re-ejecutar
02/03/04 no duplica datos.

### 3.4 Advertencias

| Tema | Detalle |
|---|---|
| Sin `USE` | Conectar siempre con `-d <BD>`; ejecutar desde el portal de Azure no funciona porque no soporta el separador de lotes `GO` (usar `sqlcmd`, SSMS o Azure Data Studio) |
| Sin autenticación Windows | `-E` no sirve; usar `-U/-P` o `-G` |
| Collation | BD nueva usa `SQL_Latin1_General_CP1_CI_AS` (la local es `Modern_Spanish_CI_AS`). Ambos son CI_AS: los nombres acentuados del seed casan igual, pero cambia el orden de `ORDER BY`. Para paridad total, crear la BD con `COLLATION = Modern_Spanish_CI_AS` |
| `GETDATE()` = UTC | Las marcas de tiempo quedarán 6 h por detrás de la hora de Guatemala; considerarlo en reportes/orden por fechas |
| `01_schema.sql` no idempotente | Los `CREATE TABLE` no llevan guard: la BD destino debe estar vacía. Si falla a mitad, dropear y recrear la BD antes de reintentar |
| Permisos | El login debe ser server admin o miembro de `dbmanager`/`db_owner` para crear tablas y SPs |

---

## 4. API (.NET 10)

```powershell
dotnet run --project Back-end\LexControlApi --launch-profile http
```

- URL: `http://localhost:5181` (perfil `https` → `https://localhost:7276`).
- En caliente (evita reconstruir): `Start-Process -FilePath dotnet -ArgumentList 'run --project "<ruta>\LexControlApi.csproj" --launch-profile http' -RedirectStandardOutput api.out.log -RedirectStandardError api.err.log`.
- CORS permite orígenes `http(s)://localhost:4200`, `:5173`, `:3000`, `:8080`
  (`Program.cs`).

---

## 5. SPA (Angular 20)

### Desarrollo

```powershell
cd Front-end\LexControlFornt
npm install
npm start          # ng serve → http://localhost:4200
```

`proxy.conf.json` reenvía `/api` → `http://localhost:5181` (sin CORS):
`environment.development.ts` deja `apiBaseUrl: ''`.

### Producción

```powershell
cd Front-end\LexControlFornt
npm run build      # dist/lex-control-fornt
```

`environment.ts` apunta a `https://localhost:7276`. Para servir el SPA desde la
misma API, copiar el build al `wwwroot` de `LexControlApi` (la API ya llama a
`app.UseStaticFiles()`).

---

## 6. Acceso inicial y permisos

| Campo | Valor |
|---|---|
| Usuario | `admin` |
| Contraseña | `admin123` |
| Hash | SHA-256 (`240be518…720a9`), marcado `HashLegacy = 1` |

`04_seed.sql` siembra la matriz de permisos por rol igual a
`PERMISOS_DEFECTO` del frontend (`core/permisos/permisos.ts`):

| Rol | Módulos desactivados |
|---|---|
| Administrador | — (los 10) |
| Secretaria | `historico`, `notificaciones` |
| Abogado | `mantenimiento` |

Sin esas filas en `PERMISO_ROL` el sidebar del rol queda vacío. Los permisos se
editan después desde **Ajustes → Permisos**.

---

## 7. Pruebas

```powershell
# Unitarias (xUnit, 149 tests)
dotnet test Back-end\LexControlApi.Tests\LexControlApi.Tests.csproj

# Unitarias frontend (Jasmine/Karma)
cd Front-end\LexControlFornt; npm test

# E2E (Playwright, 110 tests / 16 specs)
cd Front-end\LexControlFornt; npm run e2e
# un spec: npx playwright test e2e/tests/10-tramites.spec.ts
```

> **Rate limit de autenticación**: después de ~6 logins seguidos la API responde
> 429 y `waitForURL('**/dashboard')` falla (la cuenta **no** queda bloqueada).
> Esperar 80–90 s y re-ejecutar con `-g "TC-…"`.

---

## 8. Cómo regenerar los scripts

Los scripts versionados en `deploy/produccion/` y `deploy/Desarrollo/` son una
**instantánea consolidada** de `ScriptsDB/` (fuente histórica), en variante
Azure (sin `USE`/`CREATE DATABASE`). Si se modifica un SP o una tabla:

1. Editar el script correspondiente de `ScriptsDB/`.
2. Regenerar con el generador de extracción (lee los 24 `.sql` en orden
   numérico, parte por `GO` y clasifica):
   - **DDL** (`CREATE TABLE/INDEX`, `ALTER TABLE`) → `01_schema.sql`
   - **SP que referencia 1 tabla** (o `SP_Catalogo_*` con SQL dinámico) → `02`
   - **SP que referencia 2+ tablas** (joins/DML múltiple/`BEGIN TRAN`) → `03`
   - **INSERT/MERGE de configuración** → `04`
3. Cuando un SP aparece en varios scripts se conserva la **última definición**
   por orden numérico (13 SP redefinidos: reportes → `10`/`14`, permisos → `99`,
   autenticación → `02`, diligencias → `19`, etc.). Total: **118 SP únicos**.
4. **Dejar en variante Azure**: quitar el preámbulo — en `01` se eliminan las
   líneas `USE master;` … `USE DBLexControl;` (bloque `DROP`/`CREATE DATABASE`)
   y en `02/03/04` la línea `USE DBLexControl;` (ver nota AZURE en cada
   archivo).
5. Copiar el resultado a **ambas** carpetas (`deploy/produccion/` y
   `deploy/Desarrollo/`; son idénticas, solo cambia la BD a la que apuntas).
6. Re-validar en la BD de pruebas antes de producción (ver §9).

Los `.sql` están ignorados por `.gitignore` (`*.sql`): versionarlos con
`git add -f deploy/produccion/*.sql deploy/Desarrollo/*.sql`.

---

## 9. Validación antes de publicar (BD de pruebas)

Antes de ejecutar en producción, correr los scripts de `deploy/Desarrollo/`
contra `DB_Lexcontrol_Test` (§3.2) y hacer el smoke test de login:

```powershell
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol_Test -Q "SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON;
DECLARE @t TABLE (ID INT, NombreCompleto NVARCHAR(100), Usuario NVARCHAR(50),
                  Rol_ID INT, RolNombre NVARCHAR(50), Bloqueado BIT, HashLegacy BIT);
INSERT INTO @t EXEC SP_Usuario_Autenticar N'admin',
  N'240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
SELECT COUNT(*) AS login_ok FROM @t;" -W
```

La BD de producción `DB_Lexcontrol` no se toca en esta validación.

---

## 10. Solución de problemas

| Síntoma | Causa / solución |
|---|---|
| `La clave 'Jwt:Secret' es obligatoria (mínimo 32 caracteres)` | Falta `JWT_SECRET`: ejecutar `scripts\set-jwt-secret.ps1` y abrir una terminal nueva. |
| `INSERT failed … 'QUOTED_IDENTIFIER'` | El `SET QUOTED_IDENTIFIER ON` falta en la sesión (índice filtrado `UX_PERSONA_DPI`). Los scripts 01–04 ya lo fijan; si se ejecuta un bloque suelto, añadirlo. |
| `Invalid column name 'Activo'` en `SP_RefreshToken_Validar` | Corregido: `USUARIO` no tiene `Activo`; se usa `U.Bloqueado = 0` (`ScriptsDB/02-Seguridad.sql`). |
| Caracteres rotos (`Cat⭢logo`) al ejecutar | Falta `-f 65001` en `sqlcmd` (los scripts son UTF-8 sin BOM). |
| Sidebar vacío tras crear un usuario | No hay filas en `PERMISO_ROL` para ese rol: sembrar con `04_seed.sql` o guardar la matriz en **Ajustes → Permisos**. |
| El API responde 429 en los tests E2E | Rate limit de login: esperar 80–90 s y re-ejecutar el spec. |
| `401` o CORS desde el navegador | En desarrollo usar `npm start` (proxy `/api` → 5181); en producción el origen debe estar en la lista CORS de `Program.cs`. |
| Los scripts no aparecen en `git status` | `.gitignore` contiene `*.sql`: usar `git add -f deploy/produccion/*.sql deploy/Desarrollo/*.sql`. |

---

## 11. Reset completo (producción)

```powershell
# 1. BD (la BD debe existir y estar vacía; si tiene datos, dropearla y
#    recrearla desde el portal de Azure o SSMS antes de re-ejecutar)
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol -b -f 65001 -i deploy\produccion\01_schema.sql
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol -b -f 65001 -i deploy\produccion\02_sp_escritura_simple.sql
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol -b -f 65001 -i deploy\produccion\03_sp_transaccionales.sql
sqlcmd -S $S -U $U -P $P -d DB_Lexcontrol -b -f 65001 -i deploy\produccion\04_seed.sql

# 2. API + SPA (ver §4 y §5)
# 3. Login: admin / admin123
```
