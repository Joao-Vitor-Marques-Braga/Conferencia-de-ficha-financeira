Add-Type -AssemblyName System.Drawing

$baseDir = (Get-Location).Path
$jpgPath = Join-Path $baseDir "public\Gemini_Generated_Image_j8ujl5j8ujl5j8uj.jpg"

$src = [System.Drawing.Bitmap]::FromFile($jpgPath)

$points = @(
    @{ Name="Left gate"; X=770; Y=270 },
    @{ Name="Center gate"; X=1024; Y=270 },
    @{ Name="Right gate"; X=1280; Y=270 }
)

foreach ($p in $points) {
    $c = $src.GetPixel($p.X, $p.Y)
    Write-Host "$($p.Name) ($($p.X), $($p.Y)): R=$($c.R) G=$($c.G) B=$($c.B)"
}

$src.Dispose()
