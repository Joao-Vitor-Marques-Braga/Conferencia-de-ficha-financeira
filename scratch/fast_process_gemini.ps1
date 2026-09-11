Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;

public class ImageProcessor {
    public static void Process(string inputPath, string outputPath, string thumbPath) {
        using (Bitmap src = new Bitmap(inputPath)) {
            int w = src.Width;
            int h = src.Height;
            
            Bitmap dest = new Bitmap(w, h, PixelFormat.Format32bppArgb);
            Rectangle rect = new Rectangle(0, 0, w, h);
            
            BitmapData srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            BitmapData destData = dest.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
            
            int byteCount = w * h * 4;
            byte[] pixels = new byte[byteCount];
            Marshal.Copy(srcData.Scan0, pixels, 0, byteCount);
            src.UnlockBits(srcData);
            
            bool[] visited = new bool[w * h];
            Queue<int> queue = new Queue<int>(100000);
            
            Action<int, int> enqueue = (x, y) => {
                int idx = y * w + x;
                if (!visited[idx]) {
                    visited[idx] = true;
                    queue.Enqueue(idx);
                }
            };
            
            for (int x = 0; x < w; x++) {
                enqueue(x, 0);
                enqueue(x, h - 1);
            }
            for (int y = 0; y < h; y++) {
                enqueue(0, y);
                enqueue(w - 1, y);
            }
            
            int cleared = 0;
            while (queue.Count > 0) {
                int idx = queue.Dequeue();
                int byteOffset = idx * 4;
                byte b = pixels[byteOffset];
                byte g = pixels[byteOffset + 1];
                byte r = pixels[byteOffset + 2];
                
                int diffRG = Math.Abs(r - g);
                int diffGB = Math.Abs(g - b);
                int diffRB = Math.Abs(r - b);
                int minVal = Math.Min(r, Math.Min(g, b));
                
                // Checkerboard pixels are grey (~222) or white (255), achromatic
                if (minVal >= 180 && diffRG <= 18 && diffGB <= 18 && diffRB <= 18) {
                    pixels[byteOffset + 3] = 0; // set alpha to 0
                    cleared++;
                    
                    int x = idx % w;
                    int y = idx / w;
                    
                    if (x > 0) enqueue(x - 1, y);
                    if (x < w - 1) enqueue(x + 1, y);
                    if (y > 0) enqueue(x, y - 1);
                    if (y < h - 1) enqueue(x, y + 1);
                }
            }
            
            Console.WriteLine("Cleared background pixels: " + cleared);
            
            // Second pass: soft edge feathering on pixels touching transparent
            // to remove any slight grey fringe from anti-aliasing against the checkerboard
            for (int y = 1; y < h - 1; y++) {
                for (int x = 1; x < w - 1; x++) {
                    int idx = y * w + x;
                    int off = idx * 4;
                    if (pixels[off + 3] == 0) continue;
                    
                    // Check if adjacent to transparent
                    bool adjTransparent = (pixels[(off - 4) + 3] == 0 ||
                                          pixels[(off + 4) + 3] == 0 ||
                                          pixels[(off - w * 4) + 3] == 0 ||
                                          pixels[(off + w * 4) + 3] == 0);
                    if (adjTransparent) {
                        byte b = pixels[off];
                        byte g = pixels[off + 1];
                        byte r = pixels[off + 2];
                        int minVal = Math.Min(r, Math.Min(g, b));
                        int diffRG = Math.Abs(r - g);
                        int diffGB = Math.Abs(g - b);
                        int diffRB = Math.Abs(r - b);
                        // If it's a fringe pixel of the checkerboard (brightness > 160, achromatic)
                        if (minVal >= 160 && diffRG <= 20 && diffGB <= 20 && diffRB <= 20) {
                            pixels[off + 3] = 0;
                        }
                    }
                }
            }
            
            Marshal.Copy(pixels, 0, destData.Scan0, byteCount);
            dest.UnlockBits(destData);
            
            dest.Save(outputPath, ImageFormat.Png);
            Console.WriteLine("Saved full PNG: " + outputPath);
            
            // Save preview thumbnail
            using (Bitmap thumb = new Bitmap(512, 512, PixelFormat.Format32bppArgb)) {
                using (Graphics g = Graphics.FromImage(thumb)) {
                    g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                    g.DrawImage(dest, 0, 0, 512, 512);
                }
                thumb.Save(thumbPath, ImageFormat.Png);
                Console.WriteLine("Saved thumb: " + thumbPath);
            }
            
            dest.Dispose();
        }
    }
}
"@ -ReferencedAssemblies System.Drawing

$baseDir = (Get-Location).Path
$jpgPath = Join-Path $baseDir "public\Gemini_Generated_Image_j8ujl5j8ujl5j8uj.jpg"
$outPngPath = Join-Path $baseDir "public\rio_verde_gemini_clean.png"
$thumbPath = Join-Path $baseDir "public\preview_thumb.png"

[ImageProcessor]::Process($jpgPath, $outPngPath, $thumbPath)
