-- ============================================================
-- LEXCONTROL - 00_crear_bd.sql (Azure SQL Database)
-- Crea la base de datos de pruebas DB_Lexcontrol_Test si no existe.
-- IMPORTANTE: ejecutar este archivo conectado al servidor (master),
-- porque CREATE DATABASE no esta disponible dentro de una base de
-- datos de usuario:
--   sqlcmd -S <servidor> -U <usuario> -P <clave> -d master -b -f 65001 -i 00_crear_bd.sql
-- Los demas scripts (01-04) se ejecutan ya contra DB_Lexcontrol_Test.
-- ============================================================

IF DB_ID(N'DB_Lexcontrol_Test') IS NULL
BEGIN
    EXEC (N'CREATE DATABASE DB_Lexcontrol_Test');
END
GO
