$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

$root = Split-Path -Parent $PSScriptRoot
$fontDir = Join-Path $root 'assets\fonts'
New-Item -ItemType Directory -Force -Path $fontDir | Out-Null

$css = Get-Content (Join-Path $PSScriptRoot 'gf.css') -Raw -Encoding UTF8

$urls = [regex]::Matches($css, 'url\((https://[^)]+\.woff2)\)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
Write-Output "downloading $($urls.Count) woff2 files"

$map = @{}
$i = 0
foreach ($u in $urls) {
  $i++
  $name = [System.IO.Path]::GetFileName(([uri]$u).AbsolutePath)
  $dest = Join-Path $fontDir $name
  if (-not (Test-Path $dest)) {
    $ok = $false
    for ($try = 1; $try -le 3 -and -not $ok; $try++) {
      try {
        Invoke-WebRequest -Uri $u -OutFile $dest -TimeoutSec 60 -UseBasicParsing -UserAgent $ua
        $ok = $true
      } catch {
        Start-Sleep -Seconds 2
      }
    }
    if (-not $ok) { Write-Output "FAIL $name"; continue }
  }
  $map[$u] = "./$name"
  if ($i % 25 -eq 0) { Write-Output "  ...$i/$($urls.Count)" }
}

$out = $css
foreach ($k in $map.Keys) { $out = $out.Replace($k, $map[$k]) }
$out = "/* Self-hosted webfonts. Subsets fetched once from Google Fonts, then inlined locally. */`r`n" + $out
Set-Content -Path (Join-Path $root 'assets\fonts\fonts.css') -Value $out -Encoding UTF8

$total = (Get-ChildItem $fontDir -Filter *.woff2 | Measure-Object -Property Length -Sum).Sum
Write-Output ("DONE files={0} totalMB={1:N1}" -f (Get-ChildItem $fontDir -Filter *.woff2).Count, ($total/1MB))
