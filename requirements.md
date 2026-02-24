# Project Requirements And One-Command Setup

## Prerequisites
- Java 21 (JDK)
- Node.js 20+ (npm included)
- PostgreSQL 14+ (local or remote)

## Environment
Backend reads DB config from:
- `SPRING_DATASOURCE_URL` (default: `jdbc:postgresql://localhost:5432/smartims`)
- `SPRING_DATASOURCE_USERNAME` (default: `postgres`)
- `SPRING_DATASOURCE_PASSWORD` (default: `postgres`)

Optional:
- `APP_DB_AUTO_CREATE_ENABLED=true` to auto-create DB if missing

## Install all project dependencies automatically
Run from repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

This command will:
1. Install frontend npm packages.
2. Download backend Maven dependencies.
3. Compile backend (sanity check).

## Start the project
Backend:

```powershell
.\backend\mvnw.cmd -f backend\pom.xml spring-boot:run
```

Frontend:

```powershell
npm --prefix frontend run dev
```
