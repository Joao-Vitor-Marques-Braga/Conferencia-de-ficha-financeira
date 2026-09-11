Add-Type -AssemblyName System.Drawing

$baseDir = (Get-Location).Path
$jpgPath = Join-Path $baseDir "public\Gemini_Generated_Image_j8ujl5j8ujl5j8uj.jpg"

$src = [System.Drawing.Bitmap]::FromFile($jpgPath)
$w = $src.Width
$h = $src.Height

# Check center of shield: x = 1024, y = 800-1000
for ($y = 800; $y -le 900; $y += 20) {
    $c = $src.GetPixel(1024, $y)
    Write-Host "Shield ($1024, $y): R=$($c.R) G=$($c.G) B=$($c.B)"
}

$src.Dispose()
