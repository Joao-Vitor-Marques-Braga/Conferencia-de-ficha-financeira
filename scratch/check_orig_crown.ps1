Add-Type -AssemblyName System.Drawing

$baseDir = (Get-Location).Path
$jpgPath = Join-Path $baseDir "public\images (1).jpg"

$src = [System.Drawing.Bitmap]::FromFile($jpgPath)
Write-Host "Original images (1).jpg size: $($src.Width) x $($src.Height)"

for ($y = 20; $y -le 50; $y += 5) {
    $c = $src.GetPixel(150, $y)
    Write-Host "y=${y} R=$($c.R) G=$($c.G) B=$($c.B)"
}

$src.Dispose()
