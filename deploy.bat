@echo off
echo =========================================================
echo  Desplegando el Sistema Integrado de Gestión de la Calidad
echo =========================================================

echo.
echo [1/3] Verificando requisitos...
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado o no esta en el PATH.
    echo Por favor, instala Docker Desktop e intentalo nuevamente.
    pause
    exit /b 1
)

echo.
echo [2/3] Construyendo e iniciando los contenedores...
docker compose -f 03_docker-compose.yml up -d --build

if %errorlevel% neq 0 (
    echo [ERROR] Ocurrio un error al levantar los contenedores.
    pause
    exit /b 1
)

echo.
echo [3/3] Aplicacion desplegada con exito!
echo.
echo Los servicios estaran disponibles en:
echo - Aplicacion Web: http://localhost
echo - Backend API: http://localhost/api
echo - MinIO Console: http://localhost:9001
echo.
pause
