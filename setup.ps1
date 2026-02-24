param(
    [switch]$SkipBackendCompile
)

$ErrorActionPreference = "Stop"

function Assert-Command($name, $hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Missing required command '$name'. $hint"
    }
}

Write-Host "Checking required tools..." -ForegroundColor Cyan
Assert-Command "java" "Install JDK 21 and ensure java is in PATH."
Assert-Command "npm" "Install Node.js (npm included) and ensure npm is in PATH."

if (-not (Test-Path ".\backend\mvnw.cmd")) {
    throw "Missing backend Maven wrapper at .\backend\mvnw.cmd"
}
if (-not (Test-Path ".\frontend\package.json")) {
    throw "Missing frontend package.json at .\frontend\package.json"
}

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
npm --prefix frontend install

Write-Host "Downloading backend Maven dependencies..." -ForegroundColor Cyan
.\backend\mvnw.cmd -f backend\pom.xml -DskipTests dependency:go-offline

if (-not $SkipBackendCompile) {
    Write-Host "Compiling backend (sanity check)..." -ForegroundColor Cyan
    .\backend\mvnw.cmd -f backend\pom.xml -DskipTests compile
}

Write-Host ""
Write-Host "Setup completed successfully." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1) Start backend: .\backend\mvnw.cmd -f backend\pom.xml spring-boot:run"
Write-Host "2) Start frontend: npm --prefix frontend run dev"
