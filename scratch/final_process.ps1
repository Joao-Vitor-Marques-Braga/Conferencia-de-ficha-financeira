Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.IO;

public class ImageProcessorFinal {
    public static void Process(string inputPath, string outputPath, string tsPath) {
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
            Queue<int> queue = new Queue<int>(300000);
            
            Action<int, int> enqueue = (x, y) => {
                if (x < 0 || x >= w || y < 0 || y >= h) return;
                int idx = y * w + x;
                if (!visited[idx]) {
                    visited[idx] = true;
                    queue.Enqueue(idx);
                }
            };
            
            // 1. Outer borders
            for (int x = 0; x < w; x++) {
                enqueue(x, 0);
                enqueue(x, h - 1);
            }
            for (int y = 0; y < h; y++) {
                enqueue(0, y);
                enqueue(w - 1, y);
            }

            // 2. All cavities of the checkerboard background
            int[] seedsX = { 
                1024, 750, 1280, 850, 1180, 650, 1380, 1024, // bottom stems
                550, 1460, 600, 1420, 900, 1150, 720, 1310, 800, 1240, // mid cavities
                550, 1500, 520, 1530 // top wheat/crown cavities
            };
            int[] seedsY = { 
                1720, 1720, 1720, 1680, 1680, 1720, 1720, 1835,
                1330, 1330, 1360, 1360, 1430, 1430, 1380, 1380, 1400, 1400,
                440, 440, 400, 400
            };
            for (int i = 0; i < seedsX.Length; i++) {
                enqueue(seedsX[i], seedsY[i]);
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
                
                if (minVal >= 175 && diffRG <= 18 && diffGB <= 18 && diffRB <= 18) {
                    pixels[byteOffset + 3] = 0; // alpha = 0
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
            
            // Feather edge pixels adjacent to transparent
            for (int y = 1; y < h - 1; y++) {
                for (int x = 1; x < w - 1; x++) {
                    int idx = y * w + x;
                    int off = idx * 4;
                    if (pixels[off + 3] == 0) continue;
                    
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
                        if (minVal >= 160 && diffRG <= 20 && diffGB <= 20 && diffRB <= 20) {
                            pixels[off + 3] = 0;
                        }
                    }
                }
            }
            
            Marshal.Copy(pixels, 0, destData.Scan0, byteCount);
            dest.UnlockBits(destData);
            
            dest.Save(outputPath, ImageFormat.Png);
            Console.WriteLine("Saved clean PNG: " + outputPath);
            
            // Save base64
            using (MemoryStream ms = new MemoryStream()) {
                // Resize to 800x800 for optimal PDF embedding size and sharp crisp vector-like quality
                using (Bitmap resized = new Bitmap(800, 800, PixelFormat.Format32bppArgb)) {
                    using (Graphics g = Graphics.FromImage(resized)) {
                        g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                        g.DrawImage(dest, 0, 0, 800, 800);
                    }
                    resized.Save(ms, ImageFormat.Png);
                }
                string b64 = Convert.ToBase64String(ms.ToArray());
                string tsContent = "export const RIO_VERDE_LOGO_BASE64 = 'data:image/png;base64," + b64 + "';\n";
                File.WriteAllText(tsPath, tsContent);
                Console.WriteLine("Saved base64 to: " + tsPath);
            }
            
            dest.Dispose();
        }
    }
}
"@ -ReferencedAssemblies System.Drawing

$baseDir = (Get-Location).Path
$jpgPath = Join-Path $baseDir "public\Gemini_Generated_Image_j8ujl5j8ujl5j8uj.jpg"
$outPngPath = Join-Path $baseDir "public\rio_verde_brasao_clean.png"
$tsPath = Join-Path $baseDir "src\features\pdf-exporter\rioVerdeLogoBase64.ts"

[ImageProcessorFinal]::Process($jpgPath, $outPngPath, $tsPath)
