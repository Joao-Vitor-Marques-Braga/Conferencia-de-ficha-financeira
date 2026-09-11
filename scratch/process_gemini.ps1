Add-Type -AssemblyName System.Drawing

$baseDir = (Get-Location).Path
$jpgPath = Join-Path $baseDir "public\Gemini_Generated_Image_j8ujl5j8ujl5j8uj.jpg"
$testOut = Join-Path $baseDir "public\test_processed_preview.png"

$src = [System.Drawing.Bitmap]::FromFile($jpgPath)
$w = $src.Width
$h = $src.Height

Write-Host "Image size: $w x $h"

# Create ARGB bitmap
$dest = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Fill dest initially with full copy
$rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$srcData = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$destData = $dest.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$byteCount = $w * $h * 4
$pixels = New-Object byte[] $byteCount
[System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $pixels, 0, $byteCount)

$src.UnlockBits($srcData)

# BFS flood fill from edges
# Condition to be part of the background grid:
# Achromatic (|R-G| <= 15, |G-B| <= 15, |R-B| <= 15) AND brightness > 185
$visited = New-Object 'bool[]' ($w * $h)
$queue = New-Object System.Collections.Generic.Queue[int]

# Helper to enqueue
function Enqueue-Pixel($x, $y) {
    $idx = $y * $w + $x
    if (-not $visited[$idx]) {
        $visited[$idx] = $true
        $queue.Enqueue($idx)
    }
}

for ($x = 0; $x -lt $w; $x++) {
    Enqueue-Pixel $x 0
    Enqueue-Pixel $x ($h - 1)
}
for ($y = 0; $y -lt $h; $y++) {
    Enqueue-Pixel 0 $y
    Enqueue-Pixel ($w - 1) $y
}

$clearedCount = 0

while ($queue.Count -gt 0) {
    $idx = $queue.Dequeue()
    $byteOffset = $idx * 4
    $b = $pixels[$byteOffset]
    $g = $pixels[$byteOffset + 1]
    $r = $pixels[$byteOffset + 2]

    # Is it background checkerboard?
    # Grey squares: ~222, White squares: ~255.
    $diffRG = [Math]::Abs($r - $g)
    $diffGB = [Math]::Abs($g - $b)
    $diffRB = [Math]::Abs($r - $b)
    $minVal = [Math]::Min($r, [Math]::Min($g, $b))

    if ($minVal -ge 185 -and $diffRG -le 15 -and $diffGB -le 15 -and $diffRB -le 15) {
        # Transparent
        $pixels[$byteOffset + 3] = 0
        $clearedCount++

        $x = $idx % $w
        $y = [Math]::Floor($idx / $w)

        if ($x -gt 0) { Enqueue-Pixel ($x - 1) $y }
        if ($x -lt ($w - 1)) { Enqueue-Pixel ($x + 1) $y }
        if ($y -gt 0) { Enqueue-Pixel $x ($y - 1) }
        if ($y -lt ($h - 1)) { Enqueue-Pixel $x ($y + 1) }
    }
}

Write-Host "Cleared $clearedCount pixels"

[System.Runtime.InteropServices.Marshal]::Copy($pixels, 0, $destData.Scan0, $byteCount)
$dest.UnlockBits($destData)

# Save thumbnail preview (512x512) to inspect
$thumb = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($thumb)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($dest, 0, 0, 512, 512)
$g.Dispose()

$thumb.Save($testOut, [System.Drawing.Imaging.ImageFormat]::Png)

$src.Dispose()
$dest.Dispose()
$thumb.Dispose()

Write-Host "Saved preview to $testOut"
