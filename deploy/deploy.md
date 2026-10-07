# Guía de despliegue — LexControl

Guía de instalación limpia del sistema (base de datos + API + SPA) usando los
scripts consolidados de `deploy/desarrollo/`.

| Contenido | Ruta |
|---|---|
| Esquema (tablas, índices, FKs) | `deploy/desarrollo/01_schema.sql` |
| SP de una tabla (escritura simple) | `deploy/desarrollo/02_sp_escritura_simple.sql` |
| SP multi-tabla (transaccionales) | `deploy/desarrollo/03_sp_transaccionales.sql` |
| Datos iniciales de configuración | `deploy/desarrollo/04_seed.sql` |

> Los cuatro archivos son **UTF-8 sin BOM**: ejecutarlos siempre con
> `sqlcmd -f 65001` para que los acentos se lean bien.

---

## 1. Requisitos

| Componente | Versión / nota |
|---|---|
| Windows + PowerShell | 5.1 o superior |
| SQL Server | 2019 o superior (en desarrollo: `DESKTOP-V7G3G1I\SQLEXPRESS`) |
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

### 2.3 Almacenamiento de documentos

La API guarda los archivos adjuntos en `Back-end\LexControlApi\wwwroot\documentos`
(`FileStorage:BasePath`). Crear la carpeta si no existe en la máquina destino.

---

## 3. Base de datos (orden obligatorio: 01 → 04)

```powershell
$S = "DESKTOP-V7G3G1I\SQLEXPRESS"     # instancia objetivo
$i = "deploy\desarrollo"

sqlcmd -S $S -E -b -f 65001 -i "$i\01_schema.sql"               # crea DBLexControl desde cero
sqlcmd -S $S -E -b -f 65001 -i "$i\02_sp_escritura_simple.sql"  # 48 SP
sqlcmd -S $S -E -b -f 65001 -i "$i\03_sp_transaccionales.sql"   # 72 SP
sqlcmd -S $S -E -b -f 65001 -i "$i\04_seed.sql"                 # datos mínimos
```

- `-b` detiene la ejecución y devuelve código de error si algún lote falla.
- **`01_schema.sql` ELIMINA la base `DBLexControl` si ya existe**
  (`DROP DATABASE … SINGLE_USER WITH ROLLBACK IMMEDIATE`). No ejecutarlo sobre
  una BD con datos que se quieran conservar.
- Los scripts 02/03/04 arrancan con `USE DBLexControl;` y fijan
  `SET ANSI_NULLS ON` / `SET QUOTED_IDENTIFIER ON` (necesario porque `PERSONA`
  tiene el índice filtrado `UX_PERSONA_DPI`; sin eso falla el INSERT del
  usuario admin).

### 3.1 Verificación

```powershell
sqlcmd -S $S -E -d DBLexControl -Q "SET NOCOUNT ON;
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
| `sys.procedures` | 120 |
| `sys.foreign_keys` | 79 |
| `USUARIO` | 1 (admin) |
| `ROL` / `MODULO` / `PERMISO_ROL` | 3 / 10 / 30 |
| `CONFIGURACION` | 5 |
| `DEPARTAMENTO` / `MUNICIPIO` / `JUZGADO` | 22 / 35 / 8 |
| Clientes, expedientes, audiencias, trámites | 0 (no se siembran datos de demo) |

Los cuatro scripts son **idempotentes** excepto `01_schema.sql`: re-ejecutar
02/03/04 no duplica datos.

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
# Unitarias (xUnit, 140 tests)
dotnet test Back-end\LexControlApi.Tests\LexControlApi.Tests.csproj

# Unitarias frontend (Jasmine/Karma)
cd Front-end\LexControlFornt; npm test

# E2E (Playwright, 109 tests / 16 specs)
cd Front-end\LexControlFornt; npm run e2e
# un spec: npx playwright test e2e/tests/10-tramites.spec.ts
```

> **Rate limit de autenticación**: después de ~6 logins seguidos la API responde
> 429 y `waitForURL('**/dashboard')` falla (la cuenta **no** queda bloqueada).
> Esperar 80–90 s y re-ejecutar con `-g "TC-…"`.

---

## 8. Cómo regenerar los scripts

Los cuatro archivos de `deploy/desarrollo/` son una **instantánea consolidada**
de `ScriptsDB/` (fuente histórica). Si se modifica un SP o una tabla:

1. Editar el script correspondiente de `ScriptsDB/`.
2. Regenerar con el generador de extracción (lee los 24 `.sql` en orden
   numérico, parte por `GO` y clasifica):
   - **DDL** (`CREATE TABLE/INDEX`, `ALTER TABLE`) → `01_schema.sql`
   - **SP que referencia 1 tabla** (o `SP_Catalogo_*` con SQL dinámico) → `02`
   - **SP que referencia 2+ tablas** (joins/DML múltiple/`BEGIN TRAN`) → `03`
   - **INSERT/MERGE de configuración** → `04`
3. Cuando un SP aparece en varios scripts se conserva la **última definición**
   por orden numérico (13 SP redefinidos: reportes → `10`/`14`, permisos → `99`,
   autenticación → `02`, diligencias → `19`, etc.). Total: **120 SP únicos**.
4. Re-validar en una BD temporal (ver §9).

Los `.sql` están ignorados por `.gitignore` (`*.sql`): versionarlos con
`git add -f deploy/desarrollo/*.sql`.

---

## 9. Validación en una BD temporal (recomendado antes de publicar)

```powershell
$S = "DESKTOP-V7G3G1I\SQLEXPRESS"
$T = "DBLexControl_DeployTest"
$tmp = "$env:TEMP\deploytest"; New-Item -ItemType Directory -Force $tmp | Out-Null

foreach ($f in Get-ChildItem deploy\desarrollo\*.sql) {
    $t = [System.IO.File]::ReadAllText($f.FullName) -replace 'DBLexControl', $T
    [System.IO.File]::WriteAllText("$tmp\$($f.Name)", $t, (New-Object System.Text.UTF8Encoding($false)))
}

foreach ($n in '01_schema.sql','02_sp_escritura_simple.sql','03_sp_transaccionales.sql','04_seed.sql') {
    sqlcmd -S $S -E -b -f 65001 -i "$tmp\$n"
}

# Smoke test
sqlcmd -S $S -E -d $T -Q "SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON;
DECLARE @t TABLE (ID INT, NombreCompleto NVARCHAR(100), Usuario NVARCHAR(50),
                  Rol_ID INT, RolNombre NVARCHAR(50), Bloqueado BIT, HashLegacy BIT);
INSERT INTO @t EXEC SP_Usuario_Autenticar N'admin',
  N'240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
SELECT COUNT(*) AS login_ok FROM @t;" -W

# Limpieza
sqlcmd -S $S -E -Q "IF DB_ID('$T') IS NOT NULL BEGIN ALTER DATABASE $T SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE $T; END"
```

La BD real `DBLexControl` no se toca en esta validación.

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
| Los scripts no aparecen en `git status` | `.gitignore` contiene `*.sql`: usar `git add -f deploy/desarrollo/*.sql`. |

---

## 11. Reset completo

```powershell
# 1. BD (borra y recrea todo)
sqlcmd -S $S -E -b -f 65001 -i deploy\desarrollo\01_schema.sql
sqlcmd -S $S -E -b -f 65001 -i deploy\desarrollo\02_sp_escritura_simple.sql
sqlcmd -S $S -E -b -f 65001 -i deploy\desarrollo\03_sp_transaccionales.sql
sqlcmd -S $S -E -b -f 65001 -i deploy\desarrollo\04_seed.sql

# 2. API + SPA (ver §4 y §5)
# 3. Login: admin / admin123
```
