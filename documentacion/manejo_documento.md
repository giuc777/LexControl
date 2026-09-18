# Manejo de Documentos en LexControl

## 1. Visión General

LexControl gestiona documentos asociados a expedientes y notificaciones. Los archivos se almacenan
en disco bajo `wwwroot/documentos/{expedienteId}/` y se sirven por ID (nunca por ruta desde el
cliente). La validación de archivos se ejecuta en **3 capas**: HTML, frontend TypeScript y backend C#.

---

## 2. Almacenamiento en Disco

**Servicio**: `Back-end/LexControlApi/Services/FileStorageService.cs`

| Propiedad | Valor |
|---|---|
| Directorio base | `wwwroot/documentos/` (relativo a `ContentRootPath`) |
| Estructura | `wwwroot/documentos/{expedienteId}/{NombreUnico}.{ext}` |
| Nombre único | `{NombreLimpio}_{yyyyMMddHHmmss}.{ext}` |
| Límite de tamaño | 50 MB por archivo |

**Ruta base anclada a `ContentRootPath`** (no al working directory), lo que garantiza que el
almacenamiento sea determinista sin importar cómo se inicie la aplicación (`dotnet run`,
ejecutable directo, publicado).

---

## 3. Tipos de Archivo Permitidos

| Extensión | Tipo | Magic Bytes |
|---|---|---|
| `.pdf` | PDF | `25 50 44 46` (%PDF) |
| `.doc` | Word 97-2003 (OLE2) | `D0 CF 11 E0` |
| `.docx` | Word OOXML (ZIP) | `50 4B 03 04` (PK) |
| `.jpg` / `.jpeg` | JPEG | `FF D8 FF` |
| `.png` | PNG | `89 50 4E 47` (‰PNG) |
| `.txt` | Texto plano | Sin magic bytes (solo extensión) |

---

## 4. Validación de Archivos (3 Capas)

### Capa 1 — HTML

Atributo `accept` en `<input type="file">` (filtro UX, bypasseable).

### Capa 2 — Frontend TypeScript

En `expediente-detalle-page.ts`, el método `alSubirArchivo()`:

1. Valida extensión contra la lista de permitidos → toast si no coincide.
2. Lee los primeros 8 bytes con `FileReader.readAsArrayBuffer(archivo.slice(0, 8))`.
3. Compara magic bytes contra firma conocida (`validarMagicBytes()`) → toast si no coincide.
4. Si pasa ambas validaciones → envía al backend via `DocumentosService.subir()`.

### Capa 3 — Backend C#

En `FileStorageService.GuardarAsync()`:

1. Obtiene extensión del nombre del archivo.
2. Si la extensión está vacía, busca en `MimeToExtension` por `ContentType`.
3. Lee los primeros 8 bytes del stream del archivo.
4. Llama `MagicBytes.Validar(buffer, bytesRead, extension)`.
5. Si no es válido → `ExcepcionNegocio` con HTTP 400.

> **Importante**: La validación frontend es UX (error inmediato). La validación backend es la
> seguridad obligatoria. Nunca confiar solo en la capa de UI.

---

## 5. Upload de Documentos

### Endpoint

```
POST /api/documentos/upload
Content-Type: multipart/form-data
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `file` | IFormFile | Sí | Archivo a subir |
| `expedienteId` | int | Sí | ID del expediente al que pertenece |
| `descripcion` | string | No | Descripción del archivo |

**Autorización**: Administrador, Abogado, Secretaria

**Respuesta** (201):
```json
{
  "id": 10,
  "nombreArchivo": "Demanda_Inicial.pdf",
  "rutaArchivo": "23/Demanda_Inicial_20260918120746.pdf",
  "tipoArchivo": "PDF",
  "tamano": 2457600,
  "descripcion": "Demanda inicial del caso",
  "fechaSubida": "2026-09-18T12:07:46"
}
```

### Flujo backend

1. `DocumentosController.Subir()` valida extensión y tamaño.
2. `FileStorageService.GuardarAsync()` valida magic bytes y escribe a disco.
3. `ExpedienteService.CrearDocumentoAsync()` ejecuta `SP_DocExpediente_Insertar` en la BD.
4. Retorna 201 con el DTO del documento creado.

---

## 6. Vista Previa y Descarga (por ID)

Los endpoints de vista previa y descarga **nunca aceptan una ruta desde el cliente**. La ruta se
resuelve en el servidor a partir del ID del documento en la BD.

### Endpoints de Documentos

| Método | Endpoint | Descripción | Content-Disposition |
|---|---|---|---|
| GET | `/api/documentos/{id}/preview` | Vista previa inline | `inline` |
| GET | `/api/documentos/{id}/download` | Descarga | `attachment` |

### Endpoints de Notificaciones (PDF adjunto)

| Método | Endpoint | Descripción | Content-Disposition |
|---|---|---|---|
| GET | `/api/notificaciones/{id}/pdf/preview` | Vista previa del PDF | `inline` |
| GET | `/api/notificaciones/{id}/pdf/download` | Descarga del PDF | `attachment` |

### Por qué se usa ID en vez de ruta

ASP.NET Core **no decodifica `%2F`** en valores de ruta. Si se usaba `/download/{ruta}`, el
controlador recibía `24%2Farchivo.pdf` literal (con `%2F` sin decodificar), y `File.Exists`
fallaba con 404. Al usar ID, el backend resuelve la ruta desde la BD y nunca se expone la ruta
relativa en la URL.

### Flujo backend (DocumentosController)

1. Recibe `documentoId` (int).
2. Ejecuta `ExpedienteService.ObtenerDocumentoPorIdAsync(documentoId)` → llama `SP_DocExpediente_ObtenerPorID`.
3. Si no existe → 404.
4. Llama `FileStorageService.ResolverRutaSegura(rutaRelativa)` → valida que la ruta permanezca dentro del directorio base.
5. Si la ruta es inválida o el archivo no existe → 404.
6. Sirve el archivo como `FileStream` con el `Content-Type` correcto (usando `ArchivoContentType.Obtener()`).

### Flujo backend (NotificacionesController)

1. Recibe `id` (int) de la notificación.
2. Ejecuta `NotificacionService.ObtenerPorIdAsync(id)` → llama `SP_Notificacion_ObtenerPorID`.
3. Si no tiene `PdfRuta` → 404.
4. Resuelve y valida la ruta con `ResolverRutaSegura()`.
5. Sirve el PDF.

---

## 7. Seguridad

### 7.1 Path Traversal Guard

`FileStorageService.ResolverRutaSegura()`:

```csharp
public string? ResolverRutaSegura(string rutaRelativa)
{
    var baseCompleta = Path.GetFullPath(_basePath);
    var candidata = Path.GetFullPath(Path.Combine(baseCompleta, normalizada));

    // Debe permanecer dentro del directorio base
    if (!candidata.StartsWith(prefijo, StringComparison.OrdinalIgnoreCase))
        return null;  // Bloquea ../, rutas absolutas, path traversal

    return candidata;
}
```

- Normaliza separadores (`/` → `\` en Windows).
- Resuelve la ruta completa y verifica que comience con el directorio base.
- Devuelve `null` si la ruta es inválida.

### 7.2 Autenticación

Todos los endpoints de documentos requieren JWT (`[Authorize]`). Los endpoints de upload/preview/
download están restringidos a Administrador, Abogado y Secretaria.

### 7.3 Resolución de Ruta por ID

El cliente solo conoce el ID del documento. La ruta en disco se obtiene desde la BD
(`DOC_EXPEDIENTE.RutaArchivo`), nunca se transmite en la URL.

### 7.4 Frontend: Obtención vía Blob

El frontend obtiene el archivo vía `HttpClient` (`responseType: 'blob'`) para que el interceptor
de autenticación adjunte el JWT. Nunca se usa `window.open()` directamente con la URL del
endpoint protegido.

```typescript
// DocumentosService
descargarBlob(documentoId: number): Observable<Blob> {
    return this.http.get(this.descargarUrl(documentoId), { responseType: 'blob' });
}
```

---

## 8. Frontend — Servicios

### DocumentosService (`core/services/documentos-service.ts`)

| Método | Descripción |
|---|---|
| `listar(expedienteId)` | Lista documentos de un expediente |
| `subir(expedienteId, archivo, descripcion)` | Sube un archivo (multipart) |
| `ver(documentoId)` | Retorna URL de vista previa inline |
| `descargarUrl(documentoId)` | Retorna URL de descarga |
| `descargarBlob(documentoId)` | Obtiene el archivo como `Observable<Blob>` |
| `descargar(documentoId, nombre)` | Descarga y guarda el archivo vía navegador |
| `eliminar(documentoId)` | Elimina un documento |

### NotificacionesService (`core/services/notificaciones-service.ts`)

| Método | Descripción |
|---|---|
| `verPdf(id)` | Retorna URL de vista previa del PDF adjunto |
| `descargarPdfUrl(id)` | Retorna URL de descarga del PDF |
| `descargarPdfBlob(id)` | Obtiene el PDF como `Observable<Blob>` |
| `descargarPdf(id, nombre)` | Descarga y guarda el PDF vía navegador |

---

## 9. Componente Visor de Archivos (Modal)

**Archivo**: `Front-end/LexControlFornt/src/app/shared/components/visor-archivos/visor-archivos.ts`

Componente compartido que muestra una vista previa de archivos dentro de un modal. Se usa en:

- **Expediente detalle**: vista previa de documentos adjuntos.
- **Histórico detalle**: vista previa de documentos.
- **Notificación detalle**: vista previa del PDF adjunto.

### Interface ArchivoVisor

```typescript
interface ArchivoVisor {
    previewUrl: string;   // URL de vista previa (inline)
    downloadUrl: string;  // URL de descarga
    nombre?: string;      // Nombre del archivo (opcional)
}
```

### Flujo de apertura

1. El componente recibe `archivo` (`ArchivoVisor`) y `visible` (boolean).
2. Obtiene el archivo vía `HttpClient` (`responseType: 'blob'`) → pasa por el interceptor con JWT.
3. Crea un `Blob URL` con `DomSanitizer.bypassSecurityTrustResourceUrl()`.
4. Renderiza en `<iframe>` (PDF), `<img>` (imagen) o `<embed>` (otros).
5. Botón "Abrir en nueva pestaña" obtiene otro blob y abre con `window.open()`.

---

## 10. SPs Relacionados

### SP_DocExpediente_Insertar

Inserta un registro en `DOC_EXPEDIENTE` con los datos del archivo subido.

### SP_DocExpediente_ObtenerPorID (`ScriptsDB/18-Documentos-PorID.sql`)

Resuelve la ruta de un documento a partir de su ID. Usado por los endpoints de preview/download.

```sql
CREATE OR ALTER PROCEDURE SP_DocExpediente_ObtenerPorID
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DE.ID, DE.Expediente_ID, DE.NombreArchivo, DE.RutaArchivo,
           DE.TipoArchivo, DE.Tamano, DE.Descripcion, DE.Usuario_ID,
           UP.NombreCompleto AS UsuarioNombre, DE.FechaSubida
    FROM DOC_EXPEDIENTE DE
    INNER JOIN USUARIO U ON DE.Usuario_ID = U.ID
    INNER JOIN PERSONA UP ON U.Persona_ID = UP.ID
    WHERE DE.ID = @ID;
END
```

### SP_NotificacionOJ_AdjuntarPDF

Registra la ruta del PDF adjunto en la notificación.

---

## 11. Tablas Involucradas

| Tabla | Descripción |
|---|---|
| `DOC_EXPEDIENTE` | Registros de documentos asociados a expedientes |
| `NOTIFICACION_OJ` | Notificaciones con campo `PDF_Ruta` para el adjunto |

### Columnas clave de DOC_EXPEDIENTE

| Columna | Tipo | Descripción |
|---|---|---|
| `ID` | INT | Identificador único |
| `Expediente_ID` | INT | FK al expediente |
| `NombreArchivo` | NVARCHAR | Nombre original del archivo |
| `RutaArchivo` | NVARCHAR | Ruta relativa en disco (ej: `23/archivo_20260918.pdf`) |
| `TipoArchivo` | NVARCHAR | PDF, WORD, IMAGEN, OTRO |
| `Tamano` | BIGINT | Tamaño en bytes |
| `Descripcion` | NVARCHAR | Descripción opcional |
| `Usuario_ID` | INT | FK al usuario que subió el archivo |
| `FechaSubida` | DATETIME | Fecha y hora de subida |

---

## 12. Resumen de Endpoints

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| POST | `/api/documentos/upload` | Admin, Abogado, Secretaria | Subir archivo |
| GET | `/api/documentos/{id}/preview` | Admin, Abogado, Secretaria | Vista previa inline |
| GET | `/api/documentos/{id}/download` | Admin, Abogado, Secretaria | Descarga |
| DELETE | `/api/documentos/{id}` | Admin, Abogado | Eliminar documento |
| POST | `/api/notificaciones/{id}/pdf` | Admin, Abogado, Secretaria | Adjuntar PDF a notificación |
| GET | `/api/notificaciones/{id}/pdf/preview` | Admin, Abogado, Secretaria | Vista previa del PDF |
| GET | `/api/notificaciones/{id}/pdf/download` | Admin, Abogado, Secretaria | Descarga del PDF |

---

## 13. Archivos del Proyecto

| Archivo | Descripción |
|---|---|
| `Back-end/LexControlApi/Services/IFileStorageService.cs` | Interfaz del servicio de almacenamiento |
| `Back-end/LexControlApi/Services/FileStorageService.cs` | Implementación: guardar, eliminar, resolver ruta segura, magic bytes |
| `Back-end/LexControlApi/Services/ExpedienteService.cs` | `ObtenerDocumentoPorIdAsync()` |
| `Back-end/LexControlApi/Helpers/ArchivoContentType.cs` | Resolución de Content-Type por extensión |
| `Back-end/LexControlApi/Controllers/DocumentosController.cs` | Upload, preview, download, delete |
| `Back-end/LexControlApi/Controllers/NotificacionesController.cs` | Adjuntar PDF, preview, download |
| `ScriptsDB/18-Documentos-PorID.sql` | SP `SP_DocExpediente_ObtenerPorID` |
| `Front-end/LexControlFornt/src/app/core/services/documentos-service.ts` | Servicio HTTP de documentos |
| `Front-end/LexControlFornt/src/app/core/services/notificaciones-service.ts` | Servicio HTTP de notificaciones |
| `Front-end/LexControlFornt/src/app/shared/components/visor-archivos/visor-archivos.ts` | Modal de vista previa |
| `Front-end/LexControlFornt/src/styles/modules/visor-archivos.css` | Estilos del modal |
