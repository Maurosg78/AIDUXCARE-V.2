param(
  [string]$AllowedPrefix = "feature/",
  [string[]]$BlockedBranches = @("clean","main","master")
)

$branch = (git branch --show-current).Trim()

if ([string]::IsNullOrWhiteSpace($branch)) {
  Write-Host "âŒ No branch detected (detached HEAD). Abort." -ForegroundColor Red
  exit 1
}

if ($BlockedBranches -contains $branch) {
  Write-Host "ðŸš« PELIGRO: estÃ¡s en '$branch'." -ForegroundColor Red
  Write-Host "Crea una rama segura:" -ForegroundColor Yellow
  Write-Host "  git checkout -b feature/<nombre>" -ForegroundColor Cyan
  exit 1
}

if (-not $branch.StartsWith($AllowedPrefix)) {
  Write-Host "âš ï¸ Rama '$branch' no empieza con '$AllowedPrefix'." -ForegroundColor Yellow
  Write-Host "Si es intencional, continÃºa; si no, crea feature/*." -ForegroundColor Yellow
} else {
  Write-Host "âœ… Rama segura: $branch" -ForegroundColor Green
}
