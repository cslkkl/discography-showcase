param([string]$Artist = 'jay-chou')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$coverDir = Join-Path $root 'assets\covers'
$rawPath = Join-Path $PSScriptRoot "artists\$Artist\albums-raw.json"
if (-not (Test-Path $rawPath)) { throw "albums-raw.json not found for artist '$Artist': $rawPath" }
$keys = (Get-Content $rawPath -Raw -Encoding UTF8 | ConvertFrom-Json) | ForEach-Object { $_.key }
$outPath = Join-Path $PSScriptRoot "artists\$Artist\colors.json"

function Get-HueStats([string]$path) {
  $src = [System.Drawing.Image]::FromFile($path)
  $n = 48
  $bmp = New-Object System.Drawing.Bitmap $n, $n
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, 0, 0, $n, $n)
  $g.Dispose(); $src.Dispose()

  $bins = New-Object 'double[]' 36
  $sumR = 0.0; $sumG = 0.0; $sumB = 0.0; $nAll = 0
  $wR = 0.0; $wG = 0.0; $wB = 0.0; $wTot = 0.0
  $lum = 0.0

  for ($y = 0; $y -lt $n; $y++) {
    for ($x = 0; $x -lt $n; $x++) {
      $c = $bmp.GetPixel($x, $y)
      $R = [double]$c.R / 255.0; $G = [double]$c.G / 255.0; $B = [double]$c.B / 255.0
      $sumR += $R; $sumG += $G; $sumB += $B; $nAll++
      $lum += (0.2126 * $R + 0.7152 * $G + 0.0722 * $B)
      $max = [Math]::Max($R, [Math]::Max($G, $B)); $min = [Math]::Min($R, [Math]::Min($G, $B))
      $d = $max - $min
      $l = ($max + $min) / 2.0
      $s = 0.0
      if ($d -ne 0) { if ($l -gt 0.5) { $s = $d / (2.0 - $max - $min) } else { $s = $d / ($max + $min) } }
      if ($l -lt 0.10 -or $l -gt 0.92 -or $s -lt 0.10 -or $d -eq 0) { continue }
      $h = 0.0
      if ($max -eq $R) { $h = 60.0 * ((($G - $B) / $d) % 6.0) }
      elseif ($max -eq $G) { $h = 60.0 * ((($B - $R) / $d) + 2.0) }
      else { $h = 60.0 * ((($R - $G) / $d) + 4.0) }
      if ($h -lt 0) { $h += 360.0 }
      $w = $s * $s * ($l * 2.0)
      $bins[[int]([Math]::Floor($h / 10.0)) % 36] += $w
      $wR += $R * $w; $wG += $G * $w; $wB += $B * $w; $wTot += $w
    }
  }
  $bmp.Dispose()

  $avg = @([int]($sumR / $nAll * 255), [int]($sumG / $nAll * 255), [int]($sumB / $nAll * 255))
  $hue1 = $null; $hue2 = $null
  if ($wTot -gt 0.05) {
    $idx = 0..35 | Sort-Object { -$bins[$_] }
    $hue1 = [int]($idx[0] * 10 + 5)
    foreach ($i in $idx) {
      $cand = $i * 10 + 5
      $dd = [Math]::Abs($cand - $hue1); if ($dd -gt 180) { $dd = 360 - $dd }
      if ($dd -ge 50) { $hue2 = [int]$cand; break }
    }
    if ($null -eq $hue2) { $hue2 = ($hue1 + 150) % 360 }
  }
  $wAvg = @(0, 0, 0)
  if ($wTot -gt 0) { $wAvg = @([int]($wR / $wTot * 255), [int]($wG / $wTot * 255), [int]($wB / $wTot * 255)) }

  return [ordered]@{
    avg   = ('#{0:X2}{1:X2}{2:X2}' -f $avg[0], $avg[1], $avg[2])
    vivid = ('#{0:X2}{1:X2}{2:X2}' -f $wAvg[0], $wAvg[1], $wAvg[2])
    lum   = [Math]::Round($lum / $nAll, 3)
    hue1  = $hue1
    hue2  = $hue2
  }
}

$out = [ordered]@{}
Get-ChildItem $coverDir -Filter *.jpg | Sort-Object Name | ForEach-Object {
  $k = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
  if ($keys -notcontains $k) { return }
  $out[$k] = Get-HueStats $_.FullName
  Write-Output ("{0,-14} avg={1} vivid={2} lum={3} hue1={4} hue2={5}" -f $k, $out[$k].avg, $out[$k].vivid, $out[$k].lum, $out[$k].hue1, $out[$k].hue2)
}
if ($out.Count -eq 0) { throw "no covers matched the album keys of artist '$Artist'" }
# PowerShell 5.1 的 `-Encoding UTF8` 會寫入 BOM，Set-Content 又預設 CRLF；
# 兩者都會污染事實層的 json（BOM 還讓 build.mjs 的 JSON.parse 失敗）。
# 明確寫無 BOM 的 UTF-8 與 LF 行尾。
$json = $out | ConvertTo-Json -Depth 5
$json = $json -replace "`r`n", "`n"
[System.IO.File]::WriteAllText($outPath, $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "SAVED $outPath ($($out.Count) covers)"
