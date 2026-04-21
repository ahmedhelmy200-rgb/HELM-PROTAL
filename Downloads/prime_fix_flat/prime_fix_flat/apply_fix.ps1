param(
  [Parameter(Mandatory=$true)]
  [string]$ProjectPath
)

$ErrorActionPreference = 'Stop'
$FixRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Copy-Item "$FixRoot\package.json" "$ProjectPath\package.json" -Force
Copy-Item "$FixRoot\vite.config.ts" "$ProjectPath\vite.config.ts" -Force
Copy-Item "$FixRoot\vercel.json" "$ProjectPath\vercel.json" -Force
New-Item -ItemType Directory -Force -Path "$ProjectPath\src\data" | Out-Null
Copy-Item "$FixRoot\src\data\products.ts" "$ProjectPath\src\data\products.ts" -Force

if (Test-Path "$ProjectPath\package-lock.json") {
  Remove-Item "$ProjectPath\package-lock.json" -Force
}

Write-Host "DONE: files replaced successfully" -ForegroundColor Green
