Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Desplegando el Sistema Integrado de Gestión de la Calidad" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Verificando requisitos..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker no está instalado o no está en el PATH." -ForegroundColor Red
    Write-Host "Por favor, instala Docker Desktop e inténtalo nuevamente." -ForegroundColor Red
    Read-Host -Prompt "Presiona Enter para salir..."
    exit 1
}

Write-Host ""
Write-Host "[2/3] Construyendo e iniciando los contenedores..." -ForegroundColor Yellow
docker compose -f 03_docker-compose.yml up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Ocurrió un error al levantar los contenedores." -ForegroundColor Red
    Read-Host -Prompt "Presiona Enter para salir..."
    exit 1
}

Write-Host ""
Write-Host "[3/3] ¡Aplicación desplegada con éxito!" -ForegroundColor Green
Write-Host ""
Write-Host "Los servicios estarán disponibles en:"
Write-Host "- Aplicación Web: http://localhost" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost/api" -ForegroundColor Cyan
Write-Host "- MinIO Console: http://localhost:9001" -ForegroundColor Cyan
Write-Host ""
Read-Host -Prompt "Presiona Enter para finalizar..."
