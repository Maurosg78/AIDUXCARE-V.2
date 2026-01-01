param(
  [string]$AllowedPrefix = "feature/",
  [string[]]$BlockedBranches = @("clean","main","master","develop")
)

$branch = (git branch --show-current).Trim()

if ([string]::IsNullOrWhiteSpace($branch)) {
  Write-Host "❌ No branch detected (detached HEAD). Abort." -ForegroundColor Red
  exit 1
}

if ($BlockedBranches -contains $branch) {
  Write-Host "🚫 PELIGRO: estás en '$branch'." -ForegroundColor Red
  Write-Host "Crea una rama segura:" -ForegroundColor Yellow
  Write-Host "  git checkout -b feature/<nombre>" -ForegroundColor Cyan
  exit 1
}

if (-not $branch.StartsWith($AllowedPrefix)) {
  Write-Host "⚠️ Rama '$branch' no empieza con '$AllowedPrefix'." -ForegroundColor Yellow
  Write-Host "Si es intencional, continúa; si no, crea feature/*." -ForegroundColor Yellow
} else {
  Write-Host "✅ Rama segura: $branch" -ForegroundColor Green
}

