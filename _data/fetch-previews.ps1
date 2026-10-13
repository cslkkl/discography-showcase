param([string]$Artist = 'jay-chou')
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$here = $PSScriptRoot
$rawPath = Join-Path $here "artists\$Artist\albums-raw.json"
if (-not (Test-Path $rawPath)) { throw "albums-raw.json not found for artist '$Artist': $rawPath" }
$raw = Get-Content $rawPath -Raw -Encoding UTF8 | ConvertFrom-Json

$totalTracks = 0
$withPreview = 0
$missing = @()

foreach ($a in $raw) {
  $id = $a.collectionId
  $r = $null
  for ($try = 1; $try -le 5 -and -not $r; $try++) {
    try {
      $r = Invoke-RestMethod -Uri "https://itunes.apple.com/lookup?id=$id&entity=song&limit=80&country=TW" -TimeoutSec 40
    } catch { Start-Sleep -Milliseconds (700 * $try) }
  }
  if (-not $r) { Write-Output "FAIL lookup $($a.key)"; continue }

  $map = @{}
  foreach ($t in ($r.results | Where-Object { $_.wrapperType -eq 'track' })) {
    $k = '{0}-{1}' -f ([int]$t.discNumber), ([int]$t.trackNumber)
    if ($t.previewUrl) { $map[$k] = $t.previewUrl }
  }

  $hit = 0
  foreach ($tr in $a.tracks) {
    $k = '{0}-{1}' -f ([int]$tr.disc), ([int]$tr.n)
    $totalTracks++
    if ($map.ContainsKey($k)) {
      $tr | Add-Member -NotePropertyName 'p' -NotePropertyValue $map[$k] -Force
      $hit++; $withPreview++
    } else {
      $tr | Add-Member -NotePropertyName 'p' -NotePropertyValue $null -Force
      $missing += ('{0} #{1} {2}' -f $a.key, $tr.n, $tr.name)
    }
  }
  Write-Output ("{0,-14} {1,2}/{2,2} previews" -f $a.key, $hit, $a.tracks.Count)
  Start-Sleep -Milliseconds 260
}

# NOTE: keep this file pure ASCII. This host uses ACP 936 (GBK), and Windows
# PowerShell 5.1 decodes a BOM-less UTF-8 .ps1 as GBK. A full-width character at
# the end of a comment makes the decoder swallow the following LF, which silently
# comments out the next line of code. That shipped once: the line below became
# part of this comment, $json stayed null, and albums-raw.json was written as
# 0 bytes with exit code 0. scripts/check-ps1-ascii.py guards against it.
# Write with .NET to control BOM and line endings explicitly (no BOM, LF).
$json = $raw | ConvertTo-Json -Depth 8
$json = $json -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($rawPath, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Output ""
Write-Output ("TOTAL tracks={0}  withPreview={1}  missing={2}" -f $totalTracks, $withPreview, $missing.Count)
if ($missing.Count) { $missing | Select-Object -First 20 | ForEach-Object { "  no preview: $_" } }
