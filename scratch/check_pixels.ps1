Add-Type -AssemblyName System.Drawing

$baseDir = (Get-Location).Path
$jpgPath = Join-Path $baseDir "public\Gemini_Generated_Image_j8ujl5j8ujl5j8uj.jpg"

$src = [System.Drawing.Bitmap]::FromFile($jpgPath)
$w = $src.Width
$h = $src.Height

Write-Host "Dimensions: $w x $h"

for ($x = 0; $x -lt 60; $x += 5) {
    $c = $src.GetPixel($x, 0)
    Write-Host "Pixel ($x, 0): R=$($c.R) G=$($c.G) B=$($c.B)"
}

$src.Dispose()
