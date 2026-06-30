$files = @(
  "src\app\admin\web3\dapps\page.tsx",
  "src\app\admin\security\firewall\page.tsx",
  "src\app\admin\openclaw\training\page.tsx",
  "src\app\admin\i18n\timezone\page.tsx",
  "src\app\admin\i18n\language-pack\page.tsx",
  "src\app\admin\i18n\currency\page.tsx",
  "src\app\admin\i18n\culture-adaptation\page.tsx",
  "src\app\admin\blockchain\smart-contract\page.tsx",
  "src\app\admin\blockchain\evidence-chain\page.tsx",
  "src\app\admin\ai-center\risk-prediction\page.tsx",
  "src\app\admin\ai-center\model-management\page.tsx",
  "src\app\admin\ai-center\knowledge-graph\page.tsx",
  "src\app\admin\ai-center\hazard-detection\page.tsx",
  "src\app\admin\ai-center\config\page.tsx",
  "src\app\admin\dashboard\page.tsx"
)

$loggerImport = "import { logger } from '@/lib/logger';"
$root = (Get-Location).Path

$count = 0
foreach ($f in $files) {
  $path = $root + '\' + $f
  if (-not (Test-Path $path)) {
    Write-Host "NOT FOUND: $f"
    continue
  }
  $content = Get-Content $path -Raw -Encoding UTF8
  if ($content -notmatch 'console\.error') {
    continue
  }
  $hasLogger = $content -match 'lib/logger'
  $newContent = $content -replace 'console\.error\(', 'logger.error('
  if (-not $hasLogger) {
    if ($newContent -match "'use client'") {
      $newContent = $newContent -replace "('use client';)", "`$1`r`n$loggerImport"
    } else {
      $newContent = $loggerImport + "`r`n" + $newContent
    }
  }
  Set-Content -Path $path -Value $newContent -Encoding UTF8 -NoNewline
  $count++
  Write-Host "OK: $f"
}
Write-Host ""
Write-Host "Done. Modified $count files."
