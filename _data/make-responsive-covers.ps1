$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root 'assets\covers'
$dst = Join-Path $root 'assets\covers\responsive'
New-Item -ItemType Directory -Force -Path $dst | Out-Null

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save-Jpeg($bmp, $path, $quality) {
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([int64]$quality)
  $bmp.Save($path, $jpegCodec, $ep)
  $ep.Dispose()
}

$widths = @(480, 960)
$total = 0
Get-ChildItem $src -Filter *.jpg | Sort-Object Name | ForEach-Object {
  $key = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
  $image = [System.Drawing.Image]::FromFile($_.FullName)
  foreach ($w in $widths) {
    $bmp = New-Object System.Drawing.Bitmap $w, $w
    $bmp.SetResolution(72, 72)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($image, 0, 0, $w, $w)
    $g.Dispose()
    $out = Join-Path $dst "$key-$w.jpg"
    Save-Jpeg $bmp ($out) 84
    $bmp.Dispose()
    $total += (Get-Item $out).Length
  }
  $image.Dispose()
  Write-Output ("{0,-14} 480w+960w" -f $key)
}
$mb = [Math]::Round($total / 1MB, 1)
Write-Output "variants written: $((Get-ChildItem $dst -Filter *.jpg).Count) files, $mb MB"
$orig = (Get-ChildItem $src -Filter *.jpg | Measure-Object -Property Length -Sum).Sum
Write-Output ("originals: {0:N1} MB  -> saving {1:N0}%" -f ($orig/1MB), ((1 - $total/$orig) * 100))
