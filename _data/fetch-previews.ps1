$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$here = $PSScriptRoot
$rawPath = Join-Path $here 'albums-raw.json'
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

$raw | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $rawPath
Write-Output ""
Write-Output ("TOTAL tracks={0}  withPreview={1}  missing={2}" -f $totalTracks, $withPreview, $missing.Count)
if ($missing.Count) { $missing | Select-Object -First 20 | ForEach-Object { "  no preview: $_" } }
