# 11 – Visor de Archivos (Vista Previa en Modal)

## Objetivo

Crear un componente compartido `VisorArchivosComponent` que muestre una vista previa de archivos subidos (PDF, imagen, DOC, TXT) dentro de un modal, con un botón para abrir el archivo en una nueva pestaña.

## Problema actual

- No existe vista previa in-app. Todos los archivos se abren con `window.open()` en nueva pestaña.
- El endpoint de descarga (`GET /api/documentos/download/{ruta}`) usa `Content-Disposition: attachment`, lo que fuerza descarga en vez de mostrar inline en el navegador.

## Solución

### 1. Backend: Endpoint de preview inline

**Archivo:** `Back-end/LexControlApi/Controllers/DocumentosController.cs`

Agregar `GET /api/documentos/preview/{ruta}` que sirve el archivo con `Content-Disposition: inline` (sin filename), permitiendo que el navegador lo muestre en un `<iframe>` o `<img>`.

```csharp
[HttpGet("preview/{ruta}")]
public async Task<IActionResult> Preview(string ruta)
{
    var rutaAbsoluta = _fileStorageService.ObtenerRutaAbsoluta(ruta);
    if (!System.IO.File.Exists(rutaAbsoluta))
        return NotFound();

    var ext = Path.GetExtension(rutaAbsoluta).ToLowerInvariant();
    var contentType = ext switch
    {
        ".pdf"  => "application/pdf",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png"  => "image/png",
        ".txt"  => "text/plain",
        ".doc"  => "application/msword",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        _       => "application/octet-stream"
    };

    var stream = new FileStream(rutaAbsoluta, FileMode.Open, FileAccess.Read, FileShare.Read);
    Response.Headers.Append("Content-Disposition", "inline");
    return File(stream, contentType);
}
```

**Roles:** Los mismos que `Descargar` (Admin, Abogado, Secretaria).

### 2. Frontend: Servicio — agregar método `ver()`

**Archivo:** `Front-end/LexControlFornt/src/app/core/services/documentos-service.ts`

```typescript
ver(rutaArchivo: string): string {
    const ruta = encodeURIComponent(rutaArchivo);
    return `${environment.apiBaseUrl}/api/documentos/preview/${ruta}`;
}
```

Método existente `descargar()` retorna `/api/documentos/download/...` (descarga).
Nuevo `ver()` retorna `/api/documentos/preview/...` (inline).

### 3. Frontend: Componente `VisorArchivosComponent`

**Archivos nuevos:**
- `Front-end/.../shared/components/visor-archivos/visor-archivos.ts`
- `Front-end/.../shared/components/visor-archivos/visor-archivos.html`
- `Front-end/.../styles/modules/visor-archivos.css`

**API del componente:**

| Miembro | Tipo | Descripción |
|---------|------|-------------|
| `abierto` | `input<boolean>` | Controla visibilidad del modal |
| `archivo` | `input<{nombreArchivo, rutaArchivo, tipoArchivo}>` | Archivo a previsualizar |
| `cerrado` | `output<void>` | Emite cuando se cierra |

**Lógica de renderizado por tipo de archivo:**

| Tipo | Render | Ejemplo |
|------|--------|---------|
| PDF | `<iframe [src]="previewUrl()">` | Vista inline del PDF |
| IMAGEN (JPG/PNG) | `<img [src]="previewUrl()">` | Imagen centrada con scroll |
| TXT | `<iframe [src]="previewUrl()">` | Texto plano en iframe |
| DOC/DOCX/OTRO | Placeholder + botón | "Vista previa no disponible" |

**Template HTML:**

```html
<app-modal [titulo]="archivo().nombreArchivo" [abierto]="abierto()"
           ancho="min(800px,96vw)" (cerrado)="cerrado.emit()">

    <div class="visor-contenido">
        @if (esPdf()) {
            <iframe class="visor-iframe" [src]="previewUrl()"
                    frameborder="0" allowfullscreen></iframe>
        } @else if (esImagen()) {
            <div class="visor-imagen-wrap">
                <img class="visor-imagen" [src]="previewUrl()"
                     [alt]="archivo().nombreArchivo">
            </div>
        } @else if (esTexto()) {
            <iframe class="visor-iframe" [src]="previewUrl()"
                    frameborder="0"></iframe>
        } @else {
            <div class="visor-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12
                             a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>Vista previa no disponible para este tipo de archivo.</p>
                <p class="visor-placeholder-sub">Use el botón de abajo para abrirlo en una nueva pestaña.</p>
            </div>
        }
    </div>

    <footer class="modal-footer">
        <button type="button" class="btn-secondary" (click)="cerrado.emit()">Cerrar</button>
        <button type="button" class="btn-primary" (click)="abrirEnNuevaVentana()">
            Abrir en nueva ventana
        </button>
    </footer>
</app-modal>
```

**Estilos CSS:**

```css
.visor-contenido { padding: 0 22px; }

.visor-iframe {
    width: 100%;
    height: 65vh;
    border: 1px solid var(--panel-line, #e5e8ea);
    border-radius: 8px;
}

.visor-imagen-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    max-height: 65vh;
    overflow: auto;
    background: #f8f8fa;
    border-radius: 8px;
    padding: 8px;
}

.visor-imagen {
    max-width: 100%;
    max-height: 63vh;
    object-fit: contain;
    border-radius: 4px;
}

.visor-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 65vh;
    background: #f8f8fa;
    border-radius: 8px;
    color: var(--subtle, #8b9aa0);
}

.visor-placeholder svg { width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5; }
.visor-placeholder p { margin: 0; font-size: 15px; }
.visor-placeholder-sub { font-size: 13px; margin-top: 4px !important; }
```

### 4. Integración en Expediente Detalle

**`expediente-detalle-page.ts`:**
- Importar `VisorArchivosComponent`
- Agregar signal: `archivoPreview = signal<{nombreArchivo: string; rutaArchivo: string; tipoArchivo: string} | null>(null)`
- Métodos: `abrirPreview(doc: DocExpediente)`, `cerrarPreview()`

**`expediente-detalle-page.html`:**
- Botón "Vista previa" (icono ojo) en cada `doc-file`, junto a descargar y eliminar
- `<app-visor-archivos>` al final del template

```html
<!-- Botón en cada item de documento -->
<button type="button" class="btn-icon" title="Vista previa"
    (click)="abrirPreview(doc)">
    <!-- icono ojo -->
</button>

<!-- Al final del template -->
@if (archivoPreview()) {
    <app-visor-archivos [abierto]="true" [archivo]="archivoPreview()!"
        (cerrado)="cerrarPreview()" />
}
```

### 5. Integración en Notificación Detalle

**`notificacion-detalle-page.ts`:**
- Importar `VisorArchivosComponent`
- Signal: `mostrarVisor = signal(false)`
- Métodos: `abrirVisor()`, `cerrarVisor()`
- Getter para construir el objeto archivo desde `notificacion()`

**`notificacion-detalle-page.html`:**
- Cambiar "Ver PDF adjunto" para abrir el visor en vez de `window.open`
- `<app-visor-archivos>` al final

### 6. Integración en Histórico Detalle

**`historico-detalle-page.ts` + `.html`:**
- Agregar botón de vista previa en la lista de documentos
- `<app-visor-archivos>` al final

## Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| **Modificar** | `Back-end/LexControlApi/Controllers/DocumentosController.cs` — endpoint `GET /api/documentos/preview/{ruta}` |
| **Modificar** | `Front-end/.../core/services/documentos-service.ts` — método `ver()` |
| **Crear** | `Front-end/.../shared/components/visor-archivos/visor-archivos.ts` |
| **Crear** | `Front-end/.../shared/components/visor-archivos/visor-archivos.html` |
| **Crear** | `Front-end/.../styles/modules/visor-archivos.css` |
| **Modificar** | `Front-end/.../expedientes/expediente-detalle-page.ts` — import + signal + métodos |
| **Modificar** | `Front-end/.../expedientes/expediente-detalle-page.html` — botón preview + `<app-visor-archivos>` |
| **Modificar** | `Front-end/.../notificaciones-oj/notificacion-detalle-page.ts` — import + signal + métodos |
| **Modificar** | `Front-end/.../notificaciones-oj/notificacion-detalle-page.html` — usar visor |
| **Modificar** | `Front-end/.../historico/historico-detalle-page.ts` — import + signal + métodos |
| **Modificar** | `Front-end/.../historico/historico-detalle-page.html` — botón preview + `<app-visor-archivos>` |

## Flujo del usuario

1. Usuario sube un archivo en un expediente → se muestra en la lista de documentos
2. Usuario hace click en "Vista previa" (icono ojo) → se abre el modal
3. En el modal:
   - **PDF**: se muestra inline en un iframe
   - **Imagen (JPG/PNG)**: se muestra inline en un `<img>`
   - **DOC/DOCX**: se muestra placeholder + botón "Abrir en nueva ventana"
   - **TXT**: se muestra inline en un iframe
4. Botón "Abrir en nueva ventana" → `window.open()` con la URL de descarga
5. Botón "Cerrar" o Escape o click en backdrop → cierra el modal

## Verificación

1. `dotnet build -p:OutDir="...\temp"` → 0 errores
2. `npx ng build --configuration development` → build exitoso
3. Probar manualmente: subir un PDF, hacer click en vista previa, verificar que se muestra inline
4. Probar imagen JPG/PNG: se muestra en el modal
5. Probar "Abrir en nueva ventana": se abre en nueva pestaña con descarga
6. Escape y backdrop cierran el modal
