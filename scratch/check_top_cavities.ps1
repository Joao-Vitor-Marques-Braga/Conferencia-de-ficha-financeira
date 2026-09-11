Add-Type -AssemblyName System.Drawing

$baseDir = (Get-Location).Path
$jpgPath = Join-Path $baseDir "public\Gemini_Generated_Image_j8ujl5j8ujl5j8uj.jpg"

$src = [System.Drawing.Bitmap]::FromFile($jpgPath)

$points = @(
    @{ Name="Top-left cavity"; X=600; Y=490 },
    @{ Name="Top-right cavity"; X=1450; Y=490 },
    @{ Name="Between crown and left wheat"; X=550; Y=440 },
    @{ Name="Between crown and right wheat"; X=1500; Y=440 }
)

foreach ($p in $points) {
    $c = $src.GetPixel($p.X, $p.Y)
    Write-Host "$($p.Name) ($($p.X), $($p.Y)): R=$($c.R) G=$($c.G) B=$($c.B)"
}

$src.Dispose()
