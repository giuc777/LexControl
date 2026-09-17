-- ============================================================
-- 15. FIX: ruta del modulo Notificaciones OJ
-- El modulo quedo sembrado con Ruta = '/notificaciones' pero la
-- ruta real del SPA es '/notificaciones-oj'. El seed original solo
-- insertaba si MODULO estaba vacio, por lo que el valor no se
-- actualizaba en bases ya creadas. Esto hacia que el sidebar
-- navegara a /notificaciones (inexistente) y redirigiera a dashboard.
-- ============================================================

UPDATE MODULO
SET Ruta = '/notificaciones-oj'
WHERE Clave = 'notificaciones';

-- Verificacion
SELECT Clave, Ruta
FROM MODULO
ORDER BY Orden;
GO