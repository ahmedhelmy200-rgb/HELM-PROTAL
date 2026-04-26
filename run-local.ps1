# ── تشغيل HELM Portal محلياً ─────────────────────────────────────────────────
Set-Location "$PSScriptRoot"
$Host.UI.RawUI.WindowTitle = "HELM Portal — localhost:5173"

Write-Host ""
Write-Host "  ██╗  ██╗███████╗██╗     ███╗   ███╗" -ForegroundColor Blue
Write-Host "  ██║  ██║██╔════╝██║     ████╗ ████║" -ForegroundColor Blue
Write-Host "  ███████║█████╗  ██║     ██╔████╔██║" -ForegroundColor Blue
Write-Host "  ██╔══██║██╔══╝  ██║     ██║╚██╔╝██║" -ForegroundColor Blue
Write-Host "  ██║  ██║███████╗███████╗██║ ╚═╝ ██║" -ForegroundColor Blue
Write-Host "  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚═╝" -ForegroundColor Blue
Write-Host ""
Write-Host "  جارٍ التشغيل على: http://localhost:5173" -ForegroundColor Green
Write-Host "  اضغط Ctrl+C لإيقاف البرنامج" -ForegroundColor Yellow
Write-Host ""

# فتح المتصفح بعد ثانيتين
Start-Job { Start-Sleep 2; Start-Process "http://localhost:5173" } | Out-Null

npm run dev
