# ============================================================
# HELM Portal - سكريبت الإعداد الكامل على الويندوز
# شغّله بالضغط كليك يمين → Run with PowerShell
# أو في PowerShell: .\SETUP.ps1
# ============================================================

param(
    [switch]$SkipNodeInstall,
    [switch]$SkipNpmInstall,
    [switch]$Dev
)

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "HELM Portal Setup"

# ── ألوان للطباعة ────────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n>>> $msg" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "    ✓  $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "    ⚠  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "    ✗  $msg" -ForegroundColor Red }
function Write-Info  { param($msg) Write-Host "    →  $msg" -ForegroundColor White }

# ── لوجو البرنامج ────────────────────────────────────────────────────────────
Clear-Host
Write-Host @"

  ██╗  ██╗███████╗██╗     ███╗   ███╗
  ██║  ██║██╔════╝██║     ████╗ ████║
  ███████║█████╗  ██║     ██╔████╔██║
  ██╔══██║██╔══╝  ██║     ██║╚██╔╝██║
  ██║  ██║███████╗███████╗██║ ╚═╝ ██║
  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚═╝

  إعداد بيئة تشغيل منظومة حلم القانونية
  ==========================================
"@ -ForegroundColor Blue

# ── التحقق من صلاحيات المدير ─────────────────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warn "يُفضَّل تشغيل السكريبت كمدير (Administrator) لتفادي مشاكل الصلاحيات."
    Write-Warn "كليك يمين على PowerShell → Run as Administrator"
    $continue = Read-Host "    الاستمرار بدون صلاحيات مدير؟ (y/n)"
    if ($continue -ne "y") { exit 0 }
}

# ── مسار المشروع ─────────────────────────────────────────────────────────────
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path "$ProjectRoot\package.json")) {
    Write-Fail "لم يتم العثور على package.json في: $ProjectRoot"
    Write-Info "تأكد أن السكريبت داخل مجلد المشروع"
    Read-Host "اضغط Enter للخروج"; exit 1
}
Write-OK "مجلد المشروع: $ProjectRoot"

# ════════════════════════════════════════════════════════════════════════════
# 1. Node.js
# ════════════════════════════════════════════════════════════════════════════
Write-Step "فحص Node.js"

$nodeVersion = $null
try { $nodeVersion = (node --version 2>$null) } catch {}

$NODE_REQUIRED = 18
$nodeOK = $false

if ($nodeVersion) {
    $major = [int]($nodeVersion -replace 'v','').Split('.')[0]
    if ($major -ge $NODE_REQUIRED) {
        Write-OK "Node.js $nodeVersion مثبّت ومناسب (المطلوب v$NODE_REQUIRED+)"
        $nodeOK = $true
    } else {
        Write-Warn "Node.js $nodeVersion قديم — سيتم التحديث (المطلوب v$NODE_REQUIRED+)"
    }
} else {
    Write-Warn "Node.js غير مثبّت"
}

if (-not $nodeOK -and -not $SkipNodeInstall) {

    # ── محاولة التثبيت عبر winget (ويندوز 10/11 الحديث) ────────────────────
    $wingetOK = $false
    try {
        $wg = winget --version 2>$null
        if ($wg) { $wingetOK = $true }
    } catch {}

    if ($wingetOK) {
        Write-Step "تثبيت Node.js 20 LTS عبر winget..."
        try {
            winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
            # تحديث PATH في الجلسة الحالية
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            $nodeVersion = (node --version 2>$null)
            Write-OK "تم تثبيت Node.js $nodeVersion"
        } catch {
            Write-Warn "فشل winget: $_"
            $wingetOK = $false
        }
    }

    # ── تحميل مباشر إذا فشل winget ──────────────────────────────────────────
    if (-not $wingetOK) {
        Write-Step "تحميل Node.js 20 LTS مباشرة من nodejs.org ..."
        $nodeUrl      = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi"
        $nodeInstaller = "$env:TEMP\node-installer.msi"

        Write-Info "جارٍ التحميل (~32 MB)..."
        try {
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
            $ProgressPreference = 'Continue'
        } catch {
            Write-Fail "فشل التحميل: $_"
            Write-Info "يرجى تحميل Node.js يدوياً من: https://nodejs.org"
            Read-Host "بعد التثبيت، أعد تشغيل السكريبت. اضغط Enter للخروج"; exit 1
        }

        Write-Info "جارٍ التثبيت..."
        Start-Process msiexec.exe -ArgumentList "/i `"$nodeInstaller`" /qn ADDLOCAL=ALL" -Wait
        Remove-Item $nodeInstaller -Force -ErrorAction SilentlyContinue

        # تحديث PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Start-Sleep -Seconds 2
        $nodeVersion = (node --version 2>$null)
        if ($nodeVersion) {
            Write-OK "تم تثبيت Node.js $nodeVersion"
        } else {
            Write-Warn "قد تحتاج لإعادة تشغيل PowerShell لتطبيق التغييرات"
        }
    }
}

# ── فحص npm ──────────────────────────────────────────────────────────────────
Write-Step "فحص npm"
try {
    $npmVersion = npm --version 2>$null
    Write-OK "npm v$npmVersion"
} catch {
    Write-Fail "npm غير متاح — أعد تثبيت Node.js"
    exit 1
}

# ════════════════════════════════════════════════════════════════════════════
# 2. Git (اختياري لكن مفيد)
# ════════════════════════════════════════════════════════════════════════════
Write-Step "فحص Git"
try {
    $gitV = git --version 2>$null
    Write-OK "$gitV"
} catch {
    Write-Warn "Git غير مثبّت (اختياري — يمكن تثبيته من https://git-scm.com)"
}

# ════════════════════════════════════════════════════════════════════════════
# 3. Supabase CLI (للـ Edge Functions)
# ════════════════════════════════════════════════════════════════════════════
Write-Step "فحص Supabase CLI"
try {
    $sbV = supabase --version 2>$null
    Write-OK "Supabase CLI $sbV"
} catch {
    Write-Warn "Supabase CLI غير مثبّت (مطلوب فقط لنشر Edge Functions)"
    $installSB = Read-Host "    تثبيته الآن؟ (y/n)"
    if ($installSB -eq "y") {
        try {
            # عبر npm (الأسهل)
            npm install -g supabase --silent
            Write-OK "تم تثبيت Supabase CLI"
        } catch {
            Write-Warn "فشل — يمكن تثبيته لاحقاً من: https://supabase.com/docs/guides/cli"
        }
    }
}

# ════════════════════════════════════════════════════════════════════════════
# 4. تثبيت حزم المشروع
# ════════════════════════════════════════════════════════════════════════════
Write-Step "تثبيت حزم المشروع (npm install)"

Set-Location $ProjectRoot

if (-not $SkipNpmInstall) {
    Write-Info "جارٍ التحميل — قد يستغرق 2-5 دقائق..."
    try {
        npm install --legacy-peer-deps 2>&1 | ForEach-Object {
            if ($_ -match "added|updated|packages") { Write-Info $_ }
        }
        Write-OK "تم تثبيت جميع الحزم"
    } catch {
        Write-Warn "حاول npm install --force ..."
        npm install --force
        Write-OK "تم التثبيت بالقوة"
    }
} else {
    Write-Info "تم تخطي npm install (--SkipNpmInstall)"
}

# ════════════════════════════════════════════════════════════════════════════
# 5. إنشاء ملف .env
# ════════════════════════════════════════════════════════════════════════════
Write-Step "إعداد متغيرات البيئة (.env)"

$envFile = "$ProjectRoot\.env"

if (Test-Path $envFile) {
    Write-OK "ملف .env موجود بالفعل"
    $overwrite = Read-Host "    هل تريد إعادة إنشائه؟ (y/n)"
    if ($overwrite -ne "y") {
        Write-Info "تم الاحتفاظ بالملف الحالي"
    } else {
        Remove-Item $envFile -Force
    }
}

if (-not (Test-Path $envFile)) {
    Write-Host ""
    Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  أدخل بيانات Supabase الخاصة بك" -ForegroundColor Yellow
    Write-Host "  (من: supabase.com/dashboard → Settings → API)" -ForegroundColor DarkGray
    Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""

    $supabaseUrl  = Read-Host "  SUPABASE_URL (مثال: https://abc.supabase.co)"
    $supabaseKey  = Read-Host "  SUPABASE_ANON_KEY (المفتاح العام)"
    $stripeKey    = Read-Host "  STRIPE_PUBLISHABLE_KEY (اختياري — اضغط Enter للتخطي)"
    $googleRedirect = "http://localhost:5173"

    $envContent = @"
# ── Supabase ──────────────────────────────────────────────────
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey
VITE_SUPABASE_STORAGE_BUCKET=uploads
VITE_SUPABASE_GOOGLE_REDIRECT_URL=$googleRedirect

# ── الميزات ──────────────────────────────────────────────────
VITE_OCR_EDGE_FUNCTION=extract-ocr
VITE_APP_NAME=HELM

# ── الدفع الإلكتروني (Stripe) ─────────────────────────────────
VITE_STRIPE_PUBLISHABLE_KEY=$stripeKey
"@

    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-OK "تم إنشاء ملف .env"
}

# ════════════════════════════════════════════════════════════════════════════
# 6. فحص السكريبت run-local
# ════════════════════════════════════════════════════════════════════════════
Write-Step "فحص ملف run-local.ps1"
$runLocal = "$ProjectRoot\run-local.ps1"
if (-not (Test-Path $runLocal)) {
    # إنشاؤه إذا لم يكن موجوداً
    Set-Content -Path $runLocal -Value @"
# تشغيل HELM Portal محلياً
Set-Location "`$PSScriptRoot"
Write-Host "جارٍ تشغيل HELM Portal على http://localhost:5173" -ForegroundColor Cyan
npm run dev
"@ -Encoding UTF8
    Write-OK "تم إنشاء run-local.ps1"
} else {
    Write-OK "run-local.ps1 موجود"
}

# ════════════════════════════════════════════════════════════════════════════
# 7. اختبار سريع (vite --version)
# ════════════════════════════════════════════════════════════════════════════
Write-Step "اختبار Vite"
try {
    $viteV = npx vite --version 2>$null
    Write-OK "Vite v$viteV"
} catch {
    Write-Warn "لم يتم التحقق من Vite — سيعمل عند npm run dev"
}

# ════════════════════════════════════════════════════════════════════════════
# 8. ملخص وتعليمات التشغيل
# ════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "  ════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅  الإعداد اكتمل بنجاح!" -ForegroundColor Green
Write-Host "  ════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  لتشغيل البرنامج:" -ForegroundColor Cyan
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  الطريقة ١: انقر مرتين على  run-local.ps1" -ForegroundColor White
Write-Host "  الطريقة ٢: في PowerShell:" -ForegroundColor White
Write-Host "              cd '$ProjectRoot'" -ForegroundColor Yellow
Write-Host "              npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "  البرنامج سيفتح على:" -ForegroundColor Cyan
Write-Host "  http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  لنشر Edge Functions على Supabase:" -ForegroundColor Cyan
Write-Host "  supabase functions deploy create-payment-intent" -ForegroundColor Yellow
Write-Host "  ────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── سؤال التشغيل الفوري ──────────────────────────────────────────────────────
if ($Dev) {
    Write-Step "تشغيل البرنامج الآن..."
    npm run dev
} else {
    $runNow = Read-Host "  تشغيل البرنامج الآن؟ (y/n)"
    if ($runNow -eq "y") {
        Write-Step "جارٍ التشغيل على http://localhost:5173 ..."
        Start-Process "http://localhost:5173"
        npm run dev
    } else {
        Write-Host ""
        Write-OK "كل شيء جاهز. شغّل 'npm run dev' في أي وقت."
    }
}
