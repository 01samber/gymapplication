# SweatBox Gym - Deploy All Supabase Components
# Run from project root: .\supabase\deploy-all.ps1

$ErrorActionPreference = "Continue"  # Don't stop on Docker warning
# Ensure we run from project root (parent of supabase folder)
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {

Write-Host "=== SweatBox Gym - Supabase Full Deployment ===" -ForegroundColor Cyan
Write-Host ""

# 1. Push migrations
Write-Host "[1/2] Pushing database migrations..." -ForegroundColor Yellow
& npx supabase db push --yes
if ($LASTEXITCODE -eq 0) {
    Write-Host "Migrations applied." -ForegroundColor Green
} else {
    Write-Host "Skipped (run 'npx supabase link' first if needed)." -ForegroundColor Gray
}
Write-Host ""

# 2. Deploy all Edge Functions
Write-Host "[2/2] Deploying Edge Functions..." -ForegroundColor Yellow
$functions = @(
    @{ name = "login"; noJwt = $true },
    @{ name = "register"; noJwt = $true },
    @{ name = "approve-registration"; noJwt = $false },
    @{ name = "admin-action"; noJwt = $false },
    @{ name = "dietitian-action"; noJwt = $false },
    @{ name = "diet-plan"; noJwt = $false },
    @{ name = "body-composition"; noJwt = $false },
    @{ name = "meal-log"; noJwt = $false }
)

foreach ($fn in $functions) {
    Write-Host "  Deploying $($fn.name)..." -NoNewline
    if ($fn.noJwt) {
        npx supabase functions deploy $fn.name --no-verify-jwt 2>&1 | Out-Null
    } else {
        npx supabase functions deploy $fn.name 2>&1 | Out-Null
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " FAILED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "Functions: https://supabase.com/dashboard/project/jucjlxepcfhhlzieovmh/functions" -ForegroundColor Gray
} finally {
    Pop-Location
}
