$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path .env.local) -and (Test-Path .env.example)) {
    Copy-Item .env.example .env.local
}
if (-not (Test-Path node_modules)) {
    npm install
}
npm run dev
