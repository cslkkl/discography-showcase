$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ver  = '2.15.0'
$slug = 'nextlevelbuilder/ui-ux-pro-max-skill'
$base = 'https://cdn.jsdelivr.net/gh/' + $slug + '@' + $ver + '/.claude/skills/ui-ux-pro-max'
$dest = Join-Path $env:USERPROFILE '.agents\skills\ui-ux-pro-max'
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$indexUrl = 'https://data.jsdelivr.com/v1/packages/gh/' + $slug + '@' + $ver + '?structure=flat'
$listing = Invoke-RestMethod -Uri $indexUrl -TimeoutSec 60
$prefix = '/.claude/skills/ui-ux-pro-max/'

# the three multi-hundred-KB catalogue dumps are not needed for searching
$skip = @('google-fonts.csv', 'google-font-licenses.json', 'phosphor-icons-upstream.json')

$files = $listing.files | Where-Object {
  $_.name.StartsWith($prefix) -and
  $_.name -notmatch '/tests/' -and
  ($skip -notcontains (Split-Path $_.name -Leaf))
}

Write-Output "target files: $($files.Count)"
$ok = 0; $fail = @()
foreach ($f in $files) {
  $rel = $f.name.Substring($prefix.Length)
  $out = Join-Path $dest ($rel -replace '/', '\')
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $out) | Out-Null
  if ((Test-Path $out) -and (Get-Item $out).Length -eq $f.size) { $ok++; continue }

  $done = $false
  for ($i = 1; $i -le 6 -and -not $done; $i++) {
    try {
      Invoke-WebRequest -Uri "$base/$rel" -OutFile $out -TimeoutSec 60 -UseBasicParsing -ErrorAction Stop
      if ((Get-Item $out).Length -eq $f.size) { $done = $true } else { Start-Sleep -Milliseconds 400 }
    } catch {
      Start-Sleep -Milliseconds (900 * $i)
    }
  }
  if ($done) { $ok++ } else { $fail += $rel }
  Start-Sleep -Milliseconds 220
}

$all = Get-ChildItem $dest -Recurse -File
Write-Output ("DONE ok={0} fail={1} files={2} sizeMB={3:N1}" -f $ok, $fail.Count, $all.Count, (($all | Measure-Object Length -Sum).Sum / 1MB))
if ($fail.Count) { Write-Output ("FAILED: " + ($fail -join ', ')) }
