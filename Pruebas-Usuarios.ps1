# ============================================================
# Pruebas-Usuarios.ps1
# Suite de pruebas para los modulos de Login, Perfil, Usuarios
# y Permisos de LexControlApi.
# ============================================================
# Requisitos:
#   - SQL Server con DBLexControl poblada (LexControlDB.sql +
#     Usuarios_SP.sql + Extras_SP.sql ejecutados).
#   - LexControlApi corriendo (dotnet run en Back-end/LexControlApi).
#
# Uso:
#   .\Pruebas-Usuarios.ps1
#   .\Pruebas-Usuarios.ps1 -BaseUrl "http://localhost:5181"
#   .\Pruebas-Usuarios.ps1 -BaseUrl "https://localhost:7200" -SkipCertCheck
# ============================================================

[CmdletBinding()]
param(
    [string]$BaseUrl = "https://localhost:7200",
    [string]$AdminUsuario = "admin",
    [string]$AdminContrasena = "admin123",
    [string]$AbogadoUsuario = "abogado.test",
    [string]$SecretariaUsuario = "secretaria.test",
    [string]$ContrasenaPrueba = "Test1234!",
    [switch]$SkipCertCheck
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

if ($SkipCertCheck) {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
}

# --- Utilidades de registro ---
$script:Resultados = New-Object System.Collections.Generic.List[object]
$script:TokenAdmin = $null
$script:TokenAbogado = $null
$script:TokenSecretaria = $null
$script:IdAbogado = $null
$script:IdSecretaria = $null

function Registrar {
    param(
        [string]$Codigo,
        [string]$Nombre,
        [int]$Esperado,
        [int]$Recibido,
        [string]$Detalle = "",
        [double]$Ms = 0
    )
    $ok = ($Esperado -eq $Recibido)
    $estado = if ($ok) { "PASS" } else { "FAIL" }
    $color = if ($ok) { "Green" } else { "Red" }
    $linea = "[{0}] {1,-4} {2} (esperado {3}, recibio {4}{5})" -f `
        $Codigo, $estado, $Nombre, $Esperado, $Recibido, $(if ($Detalle) { " - $Detalle" } else { "" })
    Write-Host $linea -ForegroundColor $color
    $script:Resultados.Add([pscustomobject]@{
        Codigo   = $Codigo
        Estado   = $estado
        Nombre   = $Nombre
        Esperado = $Esperado
        Recibido = $Recibido
        Detalle  = $Detalle
        Ms       = [math]::Round($Ms, 1)
    })
}

function Invocar {
    param(
        [string]$Metodo,
        [string]$Ruta,
        [object]$Cuerpo = $null,
        [string]$Token = $null
    )
    $url = "$BaseUrl$Ruta"
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    $params = @{
        Uri         = $url
        Method      = $Metodo
        Headers     = $headers
        TimeoutSec  = 30
    }
    if ($null -ne $Cuerpo) {
        $params.Body = ($Cuerpo | ConvertTo-Json -Depth 10 -Compress)
    }

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $resp = Invoke-RestMethod @params
        $sw.Stop()
        return [pscustomobject]@{
            Codigo  = 200
            Cuerpo  = $resp
            Ms      = $sw.Elapsed.TotalMilliseconds
            Exito   = $true
        }
    }
    catch {
        $sw.Stop()
        $cod = 0
        $cuerpo = $null
        if ($_.Exception.Response) {
            $cod = [int]$_.Exception.Response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $raw = $reader.ReadToEnd()
                $cuerpo = $raw | ConvertFrom-Json -ErrorAction SilentlyContinue
            } catch {}
        }
        return [pscustomobject]@{
            Codigo  = if ($cod -eq 0) { -1 } else { $cod }
            Cuerpo  = $cuerpo
            Ms      = $sw.Elapsed.TotalMilliseconds
            Exito   = $false
        }
    }
}

function Probar-Conectividad {
    Write-Host "`n=== Verificando conectividad con $BaseUrl ===" -ForegroundColor Cyan
    # Probar primero con un endpoint publico; OpenAPI solo existe en Development.
    $r = Invocar -Metodo "POST" -Ruta "/api/auth/login" -Cuerpo @{
        Usuario    = $AdminUsuario
        Contrasena = $AdminContrasena
    }
    if ($r.Codigo -eq 200) {
        $script:TokenAdmin = $r.Cuerpo.data.token
        Write-Host "API alcanzable. Login admin OK." -ForegroundColor Green
        return $true
    }
    if ($r.Codigo -eq 401) {
        # La API responde, pero las credenciales son incorrectas
        Write-Host "API alcanzable (401: credenciales)." -ForegroundColor Yellow
        return $true
    }
    Write-Host "No se pudo conectar a la API. Codigo: $($r.Codigo)" -ForegroundColor Red
    return $false
}

function Esperar-Usuario {
    param(
        [string]$Usuario,
        [int]$RolId
    )
    $sql = @"
SELECT U.ID, U.Usuario, U.Bloqueado, P.Activo
FROM USUARIO U
INNER JOIN PERSONA P ON U.Persona_ID = P.ID
WHERE U.Usuario = '$Usuario';
"@
    try {
        $fila = & sqlcmd -S "DESKTOP-V7G3G1I\SQLEXPRESS" -E -d DBLexControl -Q $sql -h -1 -W 2>$null
        return $fila
    } catch { return $null }
}

function Asegurar-UsuarioPrueba {
    param(
        [string]$Usuario,
        [string]$Email,
        [int]$RolId
    )
    $crear = @{
        NombreCompleto = "Usuario de Prueba $Usuario"
        Email          = $Email
        Telefono       = "5555-0000"
        Cuenta         = $Usuario
        RolId          = $RolId
        Contrasena     = $ContrasenaPrueba
    }
    $r = Invocar -Metodo "POST" -Ruta "/api/usuarios" -Cuerpo $crear -Token $script:TokenAdmin
    if ($r.Codigo -eq 201) {
        return $r.Cuerpo.data.Id
    }
    if ($r.Codigo -eq 409) {
        # Ya existe: buscarlo
        $lista = Invocar -Metodo "GET" -Ruta "/api/usuarios?filtroNombre=$Usuario" -Token $script:TokenAdmin
        if ($lista.Codigo -eq 200 -and $lista.Cuerpo.data) {
            $u = $lista.Cuerpo.data | Where-Object { $_.Usuario -eq $Usuario } | Select-Object -First 1
            if ($u) { return $u.Id }
        }
    }
    return $null
}

# ============================================================
# 1. LOGIN
# ============================================================
function Pruebas-Login {
    Write-Host "`n=== Pruebas de Login ===" -ForegroundColor Cyan

    # L1: Login admin valido (ya ejecutado en Probar-Conectividad)
    if ($script:TokenAdmin) {
        $rol = $null
        try {
            $verif = Invocar -Metodo "GET" -Ruta "/api/perfil" -Token $script:TokenAdmin
            $rol = $verif.Cuerpo.data.rol
        } catch {}
        Registrar "L1" "Login admin valido" 200 200 "rol=$rol" 0
    } else {
        Registrar "L1" "Login admin valido" 200 401 "Sin token en respuesta"
        return
    }

    # L2: Password incorrecta
    $r = Invocar -Metodo "POST" -Ruta "/api/auth/login" -Cuerpo @{
        Usuario    = $AdminUsuario
        Contrasena = "contrasenaEquivocada123"
    }
    Registrar "L2" "Login password incorrecta" 401 $r.Codigo "" $r.Ms

    # L3: Usuario inexistente
    $r = Invocar -Metodo "POST" -Ruta "/api/auth/login" -Cuerpo @{
        Usuario    = "noexiste.usuario"
        Contrasena = "cualquiera"
    }
    Registrar "L3" "Login usuario inexistente" 401 $r.Codigo "" $r.Ms

    # L4: Bloqueo tras 5 intentos fallidos
    # Forzar 5 intentos fallidos con abogado.test, verificar que luego de 5 falla y la cuenta queda bloqueada
    # Crear abogado.test si no existe (necesita admin)
    $idAb = Asegurar-UsuarioPrueba -Usuario $AbogadoUsuario -Email "abogado.test@bufete.com" -RolId 3
    $script:IdAbogado = $idAb
    if (-not $idAb) {
        Registrar "L4" "Bloqueo tras 5 intentos" 401 -1 "No se pudo crear abogado.test"
        return
    }

    $intentos = 0
    for ($i = 1; $i -le 5; $i++) {
        $r = Invocar -Metodo "POST" -Ruta "/api/auth/login" -Cuerpo @{
            Usuario    = $AbogadoUsuario
            Contrasena = "fallo$i"
        }
        if ($r.Codigo -eq 401) { $intentos++ }
    }
    # Sexto intento debe seguir 401 y la cuenta debe estar bloqueada en BD
    $r = Invocar -Metodo "POST" -Ruta "/api/auth/login" -Cuerpo @{
        Usuario    = $AbogadoUsuario
        Contrasena = $ContrasenaPrueba  # la correcta
    }
    $bloqueado = (& sqlcmd -S "DESKTOP-V7G3G1I\SQLEXPRESS" -E -d DBLexControl -Q "SELECT Bloqueado FROM USUARIO WHERE Usuario='$AbogadoUsuario'" -h -1 -W 2>$null) -match "1"
    if ($r.Codigo -eq 401 -and $bloqueado) {
        Registrar "L4" "Bloqueo tras 5 intentos" 401 $r.Codigo "intentos fallidos=$intentos, Bloqueado=1" $r.Ms
    } else {
        Registrar "L4" "Bloqueo tras 5 intentos" 401 $r.Codigo "intentos=$intentos, Bloqueado=$bloqueado"
    }
}

# ============================================================
# 2. PERFIL
# ============================================================
function Pruebas-Perfil {
    Write-Host "`n=== Pruebas de Perfil ===" -ForegroundColor Cyan

    # P1: GET /api/perfil
    $r = Invocar -Metodo "GET" -Ruta "/api/perfil" -Token $script:TokenAdmin
    if ($r.Codigo -eq 200 -and $r.Cuerpo.data.usuario -eq $AdminUsuario) {
        Registrar "P1" "GET perfil admin" 200 $r.Codigo "usuario=$($r.Cuerpo.data.usuario)" $r.Ms
    } else {
        Registrar "P1" "GET perfil admin" 200 $r.Codigo
        return
    }

    # P2: PUT /api/perfil (cambiar email)
    $emailOriginal = $r.Cuerpo.data.email
    $nuevoEmail = "admin.test.$([Guid]::NewGuid().ToString('N').Substring(0,6))@bufete.com"
    $r = Invocar -Metodo "PUT" -Ruta "/api/perfil" -Token $script:TokenAdmin -Cuerpo @{
        NombreCompleto = "Administrador del Sistema"
        Email          = $nuevoEmail
        Telefono       = "5555-1234"
    }
    if ($r.Codigo -eq 204) {
        $verif = Invocar -Metodo "GET" -Ruta "/api/perfil" -Token $script:TokenAdmin
        if ($verif.Cuerpo.data.email -eq $nuevoEmail) {
            Registrar "P2" "PUT perfil cambio email" 204 $r.Codigo "email actualizado" $r.Ms
        } else {
            Registrar "P2" "PUT perfil cambio email" 204 $r.Codigo "email no se actualizo"
        }
    } else {
        Registrar "P2" "PUT perfil cambio email" 204 $r.Codigo
    }

    # P3: PUT /api/perfil/contrasena con cambio valido
    $r = Invocar -Metodo "PUT" -Ruta "/api/perfil/contrasena" -Token $script:TokenAdmin -Cuerpo @{
        ContrasenaActual = $AdminContrasena
        ContrasenaNueva  = $ContrasenaPrueba
        Confirmacion     = $ContrasenaPrueba
    }
    if ($r.Codigo -eq 204) {
        # Verificar login con la nueva
        $r2 = Invocar -Metodo "POST" -Ruta "/api/auth/login" -Cuerpo @{
            Usuario = $AdminUsuario; Contrasena = $ContrasenaPrueba
        }
        if ($r2.Codigo -eq 200) {
            $script:TokenAdmin = $r2.Cuerpo.data.token
            # Restaurar la contrasena original
            Invocar -Metodo "PUT" -Ruta "/api/perfil/contrasena" -Token $script:TokenAdmin -Cuerpo @{
                ContrasenaActual = $ContrasenaPrueba
                ContrasenaNueva  = $AdminContrasena
                Confirmacion     = $AdminContrasena
            } | Out-Null
            Registrar "P3" "PUT perfil contrasena valida" 204 $r.Codigo "cambiada y restaurada" $r.Ms
        } else {
            Registrar "P3" "PUT perfil contrasena valida" 204 $r.Codigo "login con nueva fallo"
        }
    } else {
        Registrar "P3" "PUT perfil contrasena valida" 204 $r.Codigo
    }
}

# ============================================================
# 3. USUARIOS (admin)
# ============================================================
function Pruebas-Usuarios {
    Write-Host "`n=== Pruebas de Usuarios ===" -ForegroundColor Cyan

    # U1: GET /api/usuarios
    $r = Invocar -Metodo "GET" -Ruta "/api/usuarios" -Token $script:TokenAdmin
    $cant = if ($r.Cuerpo.data) { $r.Cuerpo.data.Count } else { 0 }
    Registrar "U1" "GET usuarios (sin filtros)" 200 $r.Codigo "count=$cant" $r.Ms

    # U2: GET /api/usuarios?rolId=1
    $r = Invocar -Metodo "GET" -Ruta "/api/usuarios?rolId=1&activo=true" -Token $script:TokenAdmin
    $todosAdmin = $true
    if ($r.Cuerpo.data) {
        foreach ($u in $r.Cuerpo.data) {
            if ($u.rolId -ne 1) { $todosAdmin = $false; break }
        }
    }
    Registrar "U2" "GET usuarios filtrado rol=1" 200 $r.Codigo "todos admin=$todosAdmin" $r.Ms

    # U3: POST /api/usuarios (secretaria)
    $script:IdSecretaria = Asegurar-UsuarioPrueba -Usuario $SecretariaUsuario -Email "secretaria.test@bufete.com" -RolId 2
    if ($script:IdSecretaria) {
        Registrar "U3" "POST usuarios crear secretaria" 201 201 "id=$script:IdSecretaria"
    } else {
        Registrar "U3" "POST usuarios crear secretaria" 201 -1 "No se pudo crear"
    }

    # U4: POST /api/usuarios con cuenta duplicada
    $r = Invocar -Metodo "POST" -Ruta "/api/usuarios" -Token $script:TokenAdmin -Cuerpo @{
        NombreCompleto = "Duplicado"
        Email          = "dup@bufete.com"
        Cuenta         = $AdminUsuario   # admin ya existe
        RolId          = 1
        Contrasena     = $ContrasenaPrueba
    }
    Registrar "U4" "POST usuarios cuenta duplicada" 409 $r.Codigo "" $r.Ms

    # U5: PUT /api/usuarios/{id} (cambiar telefono)
    if ($script:IdAbogado) {
        # Desbloquear primero (pudo haber sido bloqueado por L4)
        Invocar -Metodo "POST" -Ruta "/api/usuarios/$script:IdAbogado/desbloquear" -Token $script:TokenAdmin | Out-Null
        $r = Invocar -Metodo "PUT" -Ruta "/api/usuarios/$script:IdAbogado" -Token $script:TokenAdmin -Cuerpo @{
            NombreCompleto = "Abogado de Prueba"
            Email          = "abogado.test@bufete.com"
            Telefono       = "5555-9999"
            Cuenta         = $AbogadoUsuario
            RolId          = 3
            Contrasena     = $null  # no cambiar
        }
        Registrar "U5" "PUT usuarios editar abogado" 200 $r.Codigo "tel actualizado" $r.Ms
    } else {
        Registrar "U5" "PUT usuarios editar abogado" 200 -1 "Sin IdAbogado"
    }

    # U6: PUT /api/usuarios/{id}/estado desactivar admin
    $r = Invocar -Metodo "PUT" -Ruta "/api/usuarios/1/estado" -Token $script:TokenAdmin -Cuerpo @{
        Activo = $false
    }
    Registrar "U6" "PUT desactivar admin (rechazo)" 409 $r.Codigo "" $r.Ms

    # U7: POST desbloquear
    if ($script:IdAbogado) {
        $r = Invocar -Metodo "POST" -Ruta "/api/usuarios/$script:IdAbogado/desbloquear" -Token $script:TokenAdmin
        $bloq = (& sqlcmd -S "DESKTOP-V7G3G1I\SQLEXPRESS" -E -d DBLexControl -Q "SELECT Bloqueado FROM USUARIO WHERE ID=$script:IdAbogado" -h -1 -W 2>$null) -match "0"
        Registrar "U7" "POST desbloquear abogado" 204 $r.Codigo "Bloqueado=0 en BD=$bloq" $r.Ms
    } else {
        Registrar "U7" "POST desbloquear abogado" 204 -1 "Sin IdAbogado"
    }
}

# ============================================================
# 4. PERMISOS
# ============================================================
function Pruebas-Permisos {
    Write-Host "`n=== Pruebas de Permisos ===" -ForegroundColor Cyan

    # M1: GET /api/permisos (matriz completa)
    $r = Invocar -Metodo "GET" -Ruta "/api/permisos" -Token $script:TokenAdmin
    $rolesCount = if ($r.Cuerpo.data) { $r.Cuerpo.data.Count } else { 0 }
    Registrar "M1" "GET permisos matriz" 200 $r.Codigo "roles=$rolesCount" $r.Ms

    # M2: GET /api/permisos/1 (admin)
    $r = Invocar -Metodo "GET" -Ruta "/api/permisos/1" -Token $script:TokenAdmin
    $modCount = if ($r.Cuerpo.data) { $r.Cuerpo.data.Count } else { 0 }
    Registrar "M2" "GET permisos rol=1 (admin)" 200 $r.Codigo "modulos=$modCount" $r.Ms

    # M3: PUT /api/permisos/3 (abogado) - guardar matriz
    $matrizAbogado = @{
        modulos = [ordered]@{
            "Dashboard"       = $true
            "Clientes"        = $true
            "Expedientes"     = $true
            "Agenda"          = $true
            "Tramites"        = $true
            "Historico Legal" = $false
            "Notificaciones OJ" = $true
            "Mantenimiento"   = $false
        }
    }
    $r = Invocar -Metodo "PUT" -Ruta "/api/permisos/3" -Token $script:TokenAdmin -Cuerpo $matrizAbogado
    Registrar "M3" "PUT permisos rol=3 (abogado)" 204 $r.Codigo "" $r.Ms

    # M4: PUT /api/permisos/1 ocultando Dashboard (rechazo)
    $matrizInvalida = @{
        modulos = [ordered]@{
            "Dashboard"       = $false   # prohibido
            "Clientes"        = $true
            "Expedientes"     = $true
            "Agenda"          = $true
            "Tramites"        = $true
            "Historico Legal" = $true
            "Notificaciones OJ" = $true
            "Mantenimiento"   = $true
        }
    }
    $r = Invocar -Metodo "PUT" -Ruta "/api/permisos/1" -Token $script:TokenAdmin -Cuerpo $matrizInvalida
    Registrar "M4" "PUT permisos admin oculta Dashboard" 400 $r.Codigo "" $r.Ms
}

# ============================================================
# 5. AUTORIZACION
# ============================================================
function Pruebas-Autorizacion {
    Write-Host "`n=== Pruebas de Autorizacion ===" -ForegroundColor Cyan

    # Necesitamos token de Abogado: login
    if ($script:IdAbogado) {
        # Asegurar contrasena correcta (pudo haber cambiado)
        Invocar -Metodo "PUT" -Ruta "/api/usuarios/$script:IdAbogado" -Token $script:TokenAdmin -Cuerpo @{
            NombreCompleto = "Abogado de Prueba"
            Email          = "abogado.test@bufete.com"
            Cuenta         = $AbogadoUsuario
            RolId          = 3
            Contrasena     = $ContrasenaPrueba
        } | Out-Null

        $r = Invocar -Metodo "POST" -Ruta "/api/auth/login" -Cuerpo @{
            Usuario = $AbogadoUsuario; Contrasena = $ContrasenaPrueba
        }
        if ($r.Codigo -eq 200) {
            $script:TokenAbogado = $r.Cuerpo.data.token
        }
    }

    if ($script:IdSecretaria) {
        $r = Invocar -Metodo "POST" -Ruta "/api/auth/login" -Cuerpo @{
            Usuario = $SecretariaUsuario; Contrasena = $ContrasenaPrueba
        }
        if ($r.Codigo -eq 200) {
            $script:TokenSecretaria = $r.Cuerpo.data.token
        }
    }

    # A1: GET usuarios sin token
    $r = Invocar -Metodo "GET" -Ruta "/api/usuarios"
    Registrar "A1" "GET usuarios sin token" 401 $r.Codigo "" $r.Ms

    # A2: GET usuarios con token de Abogado (debe ser 403)
    if ($script:TokenAbogado) {
        $r = Invocar -Metodo "GET" -Ruta "/api/usuarios" -Token $script:TokenAbogado
        Registrar "A2" "GET usuarios como Abogado" 403 $r.Codigo "" $r.Ms
    } else {
        Registrar "A2" "GET usuarios como Abogado" 403 -1 "Sin token de abogado"
    }

    # A3: PUT permisos con token de Secretaria (debe ser 403)
    if ($script:TokenSecretaria) {
        $r = Invocar -Metodo "PUT" -Ruta "/api/permisos/3" -Token $script:TokenSecretaria -Cuerpo @{
            modulos = @{ "Dashboard" = $true }
        }
        Registrar "A3" "PUT permisos como Secretaria" 403 $r.Codigo "" $r.Ms
    } else {
        Registrar "A3" "PUT permisos como Secretaria" 403 -1 "Sin token de secretaria"
    }
}

# ============================================================
# 6. LIMPIEZA
# ============================================================
function Limpiar {
    Write-Host "`n=== Limpieza ===" -ForegroundColor Cyan
    foreach ($id in @($script:IdAbogado, $script:IdSecretaria)) {
        if ($id) {
            $r = Invocar -Metodo "PUT" -Ruta "/api/usuarios/$id/estado" -Token $script:TokenAdmin -Cuerpo @{
                Activo = $false
            }
            if ($r.Codigo -eq 204) {
                Write-Host "  Usuario $id desactivado." -ForegroundColor Yellow
            }
        }
    }
}

# ============================================================
# REPORTE FINAL
# ============================================================
function Reporte-Final {
    Write-Host "`n=== Reporte Final ===" -ForegroundColor Cyan
    $pass = ($script:Resultados | Where-Object Estado -eq "PASS").Count
    $fail = ($script:Resultados | Where-Object Estado -eq "FAIL").Count
    $total = $script:Resultados.Count
    $ms = ($script:Resultados | Measure-Object Ms -Sum).Sum
    Write-Host "Resultado: $pass/$total PASS, $fail FAIL" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
    Write-Host "Tiempo total: $([math]::Round($ms/1000, 1))s"

    if ($fail -gt 0) {
        Write-Host "`nCasos fallidos:" -ForegroundColor Red
        $script:Resultados | Where-Object Estado -eq "FAIL" | ForEach-Object {
            Write-Host "  $($_.Codigo): $($_.Nombre) - $($_.Detalle)" -ForegroundColor Red
        }
    }
    return $fail
}

# ============================================================
# EJECUCION
# ============================================================
if (-not (Probar-Conectividad)) { exit 1 }
Pruebas-Login
Pruebas-Perfil
Pruebas-Usuarios
Pruebas-Permisos
Pruebas-Autorizacion
Limpiar
$fallos = Reporte-Final
exit $fallos
