@echo off
title Iniciando RH Admin

echo *****************************************************
echo *             INICIANDO RH ADMIN                    *
echo *****************************************************
echo.
echo [+] Verificando instalacion de dependencias...
echo.

cd /d C:\Users\bdc-usr\Downloads\proyectos\rh_admin

:: Verificar si node_modules existe, si no instalar dependencias
if not exist node_modules (
    echo [!] node_modules no encontrado. Instalando dependencias...
    call npm install
    echo [+] Dependencias instaladas correctamente.
) else (
    echo [+] node_modules encontrado. Continuando...
)

echo.
echo [+] Iniciando el servidor backend...
echo.

:: Iniciar el servidor en una nueva ventana CMD
start cmd /k "cd /d C:\Users\bdc-usr\Downloads\proyectos\rh_admin\src\server && node server.js"

:: Esperar 3 segundos para que el servidor se inicie
timeout /t 3 /nobreak > nul

echo.
echo [+] Iniciando el frontend...
echo.

:: Iniciar el frontend
cd /d C:\Users\bdc-usr\Downloads\proyectos\rh_admin
call npm run dev

echo.
echo [+] Aplicación cerrada.
echo.

pause