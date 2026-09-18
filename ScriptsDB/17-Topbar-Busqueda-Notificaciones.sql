-- ============================================================
-- 17. TOPBAR: campana de notificaciones + busqueda global
--     SP_Notificacion_ContarPendientes: cuenta pendientes.
--     SP_Buscar_Global: busca cross-entidad por texto libre.
-- ============================================================
USE DBLexControl;
GO

-- 17.1 Conteo de notificaciones pendientes (para badge del topbar)
CREATE OR ALTER PROCEDURE SP_Notificacion_ContarPendientes
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EstadoAtendida INT = (
        SELECT ID FROM ESTADO_NOTIFICACION_OJ WHERE Nombre = N'Atendida'
    );

    SELECT COUNT(*) AS Total
    FROM NOTIFICACION_OJ
    WHERE Estado_ID <> @EstadoAtendida;
END
GO

-- 17.2 Busqueda global cross-entidad (para input del topbar)
CREATE OR ALTER PROCEDURE SP_Buscar_Global
    @Busqueda NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Patron NVARCHAR(210) = N'%' + @Busqueda + N'%';

    -- Expedientes
    SELECT 'Expediente' AS Tipo, E.ID AS Id,
           E.NoExpediente AS Titulo,
           P.NombreCompleto AS Subtitulo,
           '/expedientes/' + CAST(E.ID AS NVARCHAR(10)) AS Ruta
    FROM EXPEDIENTE E
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    WHERE E.NoExpediente LIKE @Patron
       OR P.NombreCompleto LIKE @Patron

    UNION ALL

    -- Clientes
    SELECT 'Cliente' AS Tipo, C.ID AS Id,
           P.NombreCompleto AS Titulo,
           P.DPI AS Subtitulo,
           '/clientes/' + CAST(C.ID AS NVARCHAR(10)) AS Ruta
    FROM CLIENTE C
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    WHERE C.Activo = 1
      AND (P.NombreCompleto LIKE @Patron OR P.DPI LIKE @Patron)

    UNION ALL

    -- Audiencias
    SELECT 'Audiencia' AS Tipo, A.ID AS Id,
           E.NoExpediente AS Titulo,
           TA.Nombre + ' - ' + P.NombreCompleto AS Subtitulo,
           '/agenda/' + CAST(A.ID AS NVARCHAR(10)) AS Ruta
    FROM AUDIENCIA A
    INNER JOIN EXPEDIENTE E ON A.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_AUDIENCIA TA ON A.Tipo_ID = TA.ID
    WHERE E.NoExpediente LIKE @Patron
       OR P.NombreCompleto LIKE @Patron

    UNION ALL

    -- Tramites
    SELECT 'Tramite' AS Tipo, T.ID AS Id,
           E.NoExpediente AS Titulo,
           TT.Nombre + ' - ' + ISNULL(T.Institucion, '') AS Subtitulo,
           '/tramites/' + CAST(T.ID AS NVARCHAR(10)) AS Ruta
    FROM TRAMITE T
    INNER JOIN EXPEDIENTE E ON T.Expediente_ID = E.ID
    INNER JOIN TIPO_TRAMITE TT ON T.Tipo_ID = TT.ID
    WHERE E.NoExpediente LIKE @Patron
       OR T.Institucion LIKE @Patron
       OR T.OficioReferencia LIKE @Patron

    UNION ALL

    -- Notificaciones OJ
    SELECT 'Notificacion' AS Tipo, N.ID AS Id,
           ISNULL(N.NumeroResolucion, E.NoExpediente) AS Titulo,
           EN.Nombre + ' - ' + P.NombreCompleto AS Subtitulo,
           '/notificaciones-oj/' + CAST(N.ID AS NVARCHAR(10)) AS Ruta
    FROM NOTIFICACION_OJ N
    INNER JOIN EXPEDIENTE E ON N.Expediente_ID = E.ID
    INNER JOIN CLIENTE C ON E.Cliente_ID = C.ID
    INNER JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN ESTADO_NOTIFICACION_OJ EN ON N.Estado_ID = EN.ID
    WHERE N.NumeroResolucion LIKE @Patron
       OR E.NoExpediente LIKE @Patron

    UNION ALL

    -- Diligencias
    SELECT 'Diligencia' AS Tipo, D.ID AS Id,
           D.Titulo AS Titulo,
           TD.Nombre + ' - ' + ISNULL(P.NombreCompleto, '') AS Subtitulo,
           '/agenda/' + CAST(D.ID AS NVARCHAR(10)) AS Ruta
    FROM DILIGENCIA D
    LEFT JOIN EXPEDIENTE E ON D.Expediente_ID = E.ID
    LEFT JOIN CLIENTE C ON D.Cliente_ID = C.ID
    LEFT JOIN PERSONA P ON C.Persona_ID = P.ID
    INNER JOIN TIPO_DILIGENCIA TD ON D.Tipo_ID = TD.ID
    WHERE D.Titulo LIKE @Patron
       OR P.NombreCompleto LIKE @Patron
       OR D.Ubicacion LIKE @Patron

    ORDER BY Tipo, Titulo;
END
GO

PRINT 'OK SP_Notificacion_ContarPendientes y SP_Buscar_Global creados.';
GO
