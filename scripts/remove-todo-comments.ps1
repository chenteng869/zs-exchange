$files = Get-ChildItem -Path "src\app\admin" -Recurse -Filter "page.tsx" -File | Where-Object {
  $c = Get-Content $_.FullName -Raw -Encoding UTF8
  $c -match 'TODO:\s*\u63a5\u5165\u5b9e\u9645 API \u6570\u636e'
}
# Also check non-admin files
$root = (Get-Location).Path
$patterns = @(
  "license\governance", "license\audit", "license\jurisdictions", "license\portfolio",
  "dsales\compliance", "dsales\training", "dsales\commission", "dsales\products", "dsales\network",
  "aiopc\global-replication", "aiopc\spv-link", "aiopc\tools", "aiopc\members", "aiopc\park",
  "listing\post-listing", "listing\pipeline", "listing\hk", "listing\samoa",
  "token\compliance", "token\listing", "token\deployment", "token\design", "token\projects",
  "enterprise\compliance", "enterprise\customers", "enterprise\services", "enterprise\spv", "enterprise\registration"
)

$count = 0
foreach ($p in $patterns) {
  $path = Join-Path $root "src\app\admin\$p\page.tsx"
  if (Test-Path $path) {
    $lines = Get-Content $path -Encoding UTF8
    $newLines = @()
    $skipNext = $false
    foreach ($i in 0..($lines.Count - 1)) {
      $line = $lines[$i]
      if ($line -match 'TODO:\s*\u63a5\u5165\u5b9e\u9645 API \u6570\u636e') {
        # Skip this line
        $count++
        continue
      }
      $newLines += $line
    }
    if ($newLines.Count -ne $lines.Count) {
      Set-Content -Path $path -Value $newLines -Encoding UTF8
      Write-Host "OK: src\app\admin\$p\page.tsx"
    }
  } else {
    Write-Host "NOT FOUND: src\app\admin\$p\page.tsx"
  }
}
Write-Host ""
Write-Host "Done. Removed $count TODO comments."
