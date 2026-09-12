# ============================================================
# Configurar JWT_SECRET para LexControl
# Ejecutar una sola vez por máquina (guarda en User scope)
# ============================================================

param(
    [string]$Secret
)

if (-not $Secret) {
    # Generar secret aleatorio de 48 bytes (64 chars en base64)
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $Secret = [Convert]::ToBase64String($bytes)
}

if ($Secret.Length -lt 32) {
    Write-Error "El secret debe tener al menos 32 caracteres. Longitud actual: $($Secret.Length)"
    exit 1
}

# Guardar como variable de entorno del usuario (persiste entre sesiones)
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", $Secret, "User")

Write-Host "JWT_SECRET configurado correctamente." -ForegroundColor Green
Write-Host "Secret: $Secret" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para verificar en una nueva terminal:" -ForegroundColor Cyan
Write-Host '  [System.Environment]::GetEnvironmentVariable("JWT_SECRET", "User")'
Write-Host ""
Write-Host "Nota: Reiniciar la terminal o Visual Studio para que el cambio surta efecto." -ForegroundColor DarkGray
