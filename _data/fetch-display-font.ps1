#  fetch-display-font.ps1 -- self-host the display (English heading) face.
#
#  Downloads the latin and latin-ext subsets of Cormorant Garamond at weights
#  400 and 500 from the Google Fonts CSS2 API, stores the woff2 files next to
#  the other subsets in assets/fonts/, and appends the matching @font-face
#  rules to assets/fonts/fonts.css with relative url(./<file>.woff2) sources.
#
#  Idempotent: an already present woff2 is not re-downloaded, and the block is
#  appended only once (guarded by the marker comment below). Safe to re-run.
#
#  Repo constraints, why this looks the way it does:
#  - Keep this file pure ASCII (see _data/AGENTS.md). Windows PowerShell 5.1
#    decodes BOM-less UTF-8 as GBK (ACP 936) on this machine, and a CJK comment
#    tail swallows the following newline, merging the next code line into the
#    comment. Enforced by `npm run check:ps1`.
#  - Write files with [System.IO.File]::WriteAllText + UTF8Encoding($false).
#    Set-Content / Add-Content emit CRLF and the 5.1 -Encoding UTF8 switch
#    prepends a BOM; both break the LF/no-BOM contract of this repo.
#
#  Usage: powershell -File _data/fetch-display-font.ps1

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

$family = 'Cormorant Garamond'
$familyParam = 'Cormorant+Garamond'
$weightsParam = '400;500'
$subsetNames = @('latin', 'latin-ext')
$api = "https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weightsParam}&display=swap"

$root = Split-Path -Parent $PSScriptRoot
$fontDir = Join-Path $root 'assets\fonts'
$cssPath = Join-Path $fontDir 'fonts.css'
$marker = "/* display face: ${family} (latin, latin-ext; 400, 500) */"
$utf8 = New-Object System.Text.UTF8Encoding($false)

New-Item -ItemType Directory -Force -Path $fontDir | Out-Null

function Get-RemoteText([string]$url) {
  for ($try = 1; $try -le 3; $try++) {
    try {
      return (Invoke-WebRequest -Uri $url -TimeoutSec 60 -UseBasicParsing -UserAgent $ua).Content
    } catch {
      if ($try -eq 3) { throw }
      Start-Sleep -Seconds 2
    }
  }
}

Write-Output "fetching $api"
$css = Get-RemoteText $api

# Each @font-face in the CSS2 payload is preceded by a `/* subset */` comment.
$rx = [regex]'(?s)/\*\s*([a-z\-]+)\s*\*/\s*(@font-face\s*\{.*?\})'
$picked = @()
foreach ($m in $rx.Matches($css)) {
  $subset = $m.Groups[1].Value
  if ($subsetNames -notcontains $subset) { continue }
  $rule = $m.Groups[2].Value
  $w = [regex]::Match($rule, 'font-weight:\s*(\d+)').Groups[1].Value
  $u = [regex]::Match($rule, 'url\((https://[^)]+\.woff2)\)').Groups[1].Value
  if (-not $w -or -not $u) { continue }
  $name = [System.IO.Path]::GetFileName(([uri]$u).AbsolutePath)
  $picked += [pscustomobject]@{ Subset = $subset; Weight = $w; Url = $u; File = $name; Rule = $rule.Trim() }
}

if ($picked.Count -eq 0) {
  throw "no latin/latin-ext @font-face found in the CSS2 response for $family"
}

$downloaded = 0
$reused = 0
foreach ($p in $picked) {
  $dest = Join-Path $fontDir $p.File
  if (Test-Path $dest) { $reused++; continue }
  $ok = $false
  for ($try = 1; $try -le 3 -and -not $ok; $try++) {
    try {
      Invoke-WebRequest -Uri $p.Url -OutFile $dest -TimeoutSec 60 -UseBasicParsing -UserAgent $ua
      $ok = $true
    } catch {
      if (Test-Path $dest) { Remove-Item -Force $dest }
      Start-Sleep -Seconds 2
    }
  }
  if (-not $ok) { throw "download failed after 3 attempts: $($p.File)" }
  $downloaded++
}

$lines = @($marker)
foreach ($p in $picked) {
  $lines += "/* $($p.Subset) */"
  $lines += $p.Rule.Replace($p.Url, "./$($p.File)")
}
$block = (($lines -join "`n") + "`n").Replace("`r`n", "`n")

$bytes = [System.IO.File]::ReadAllBytes($cssPath)
if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
  throw 'assets/fonts/fonts.css starts with a UTF-8 BOM; refusing to touch it'
}
$existing = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($existing.Contains("`r`n")) {
  throw 'assets/fonts/fonts.css contains CRLF; refusing to touch it'
}

if ($existing.Contains($marker)) {
  Write-Output 'fonts.css already carries the display @font-face block; not appended again'
} else {
  $out = $existing
  if (-not $out.EndsWith("`n")) { $out += "`n" }
  $out += $block
  if ($out.Contains("`r`n")) { throw 'refusing to write CRLF into fonts.css' }
  [System.IO.File]::WriteAllText($cssPath, $out, $utf8)
  Write-Output 'appended the display @font-face block to assets/fonts/fonts.css'
}

$files = @($picked | Select-Object -ExpandProperty File -Unique)
$total = 0
foreach ($f in $files) {
  $len = (Get-Item (Join-Path $fontDir $f)).Length
  $total += $len
  Write-Output ("  {0}  {1} bytes" -f $f, $len)
}

$after = [System.IO.File]::ReadAllBytes($cssPath)
$crlf = 0
for ($i = 0; $i -lt $after.Length - 1; $i++) {
  if ($after[$i] -eq 13 -and $after[$i + 1] -eq 10) { $crlf++ }
}
Write-Output ("DONE family={0} faces={1} files={2} downloaded={3} reused={4} bytes={5}" -f `
  $family, $picked.Count, $files.Count, $downloaded, $reused, $total)
Write-Output ("fonts.css bytes={0} crlf={1} bom={2} sha256={3}" -f `
  $after.Length, $crlf, ($after[0] -eq 0xEF), (Get-FileHash $cssPath -Algorithm SHA256).Hash)
