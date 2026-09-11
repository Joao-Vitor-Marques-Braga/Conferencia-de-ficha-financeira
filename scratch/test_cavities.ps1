Add-Type -AssemblyName System.Drawing

$baseDir = (Get-Location).Path
$jpgPath = Join-Path $baseDir "public\Gemini_Generated_Image_j8ujl5j8ujl5j8uj.jpg"

$src = [System.Drawing.Bitmap]::FromFile($jpgPath)

$points = @(
    @{ Name="Under shield center"; X=1024; Y=1370 },
    @{ Name="Below ribbon center"; X=1024; Y=1720 },
    @{ Name="Between stems bottom"; X=1024; Y=1835 },
    @{ Name="Below ribbon left"; X=770; Y=1720 },
    @{ Name="Below ribbon right"; X=1250; Y=1720 },
    @{ Name="Above ribbon left"; X=550; Y=1330 },
    @{ Name="Above ribbon right"; X=1460; Y=1330 }
)

foreach ($p in $points) {
    $c = $src.GetPixel($p.X, $p.Y)
    Write-Host "$($p.Name) ($($p.X), $($p.Y)): R=$($c.R) G=$($c.G) B=$($c.B)"
}

$src.Dispose()
