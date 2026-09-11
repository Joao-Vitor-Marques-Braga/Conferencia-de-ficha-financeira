Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;

public class ComponentChecker {
    public static void Check(string inputPath) {
        using (Bitmap src = new Bitmap(inputPath)) {
            int w = src.Width;
            int h = src.Height;
            Rectangle rect = new Rectangle(0, 0, w, h);
            BitmapData srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int byteCount = w * h * 4;
            byte[] pixels = new byte[byteCount];
            Marshal.Copy(srcData.Scan0, pixels, 0, byteCount);
            src.UnlockBits(srcData);

            bool[] visited = new bool[w * h];

            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int idx = y * w + x;
                    if (visited[idx]) continue;

                    int off = idx * 4;
                    byte b = pixels[off];
                    byte g = pixels[off + 1];
                    byte r = pixels[off + 2];
                    int diffRG = Math.Abs(r - g);
                    int diffGB = Math.Abs(g - b);
                    int diffRB = Math.Abs(r - b);
                    int minVal = Math.Min(r, Math.Min(g, b));

                    if (minVal >= 180 && diffRG <= 18 && diffGB <= 18 && diffRB <= 18) {
                        // BFS this component
                        List<int> comp = new List<int>();
                        Queue<int> q = new Queue<int>();
                        visited[idx] = true;
                        q.Enqueue(idx);

                        bool touchesEdge = false;
                        int minR = 255;
                        int maxR = 0;
                        int minX = x, maxX = x, minY = y, maxY = y;

                        while (q.Count > 0) {
                            int curr = q.Dequeue();
                            comp.Add(curr);
                            int cx = curr % w;
                            int cy = curr / w;

                            if (cx < minX) minX = cx;
                            if (cx > maxX) maxX = cx;
                            if (cy < minY) minY = cy;
                            if (cy > maxY) maxY = cy;

                            if (cx == 0 || cx == w - 1 || cy == 0 || cy == h - 1) touchesEdge = true;

                            int coff = curr * 4;
                            byte cr = pixels[coff + 2];
                            if (cr < minR) minR = cr;
                            if (cr > maxR) maxR = cr;

                            int[] dx = { -1, 1, 0, 0 };
                            int[] dy = { 0, 0, -1, 1 };
                            for (int i = 0; i < 4; i++) {
                                int nx = cx + dx[i];
                                int ny = cy + dy[i];
                                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                    int nidx = ny * w + nx;
                                    if (!visited[nidx]) {
                                        int noff = nidx * 4;
                                        byte nb = pixels[noff];
                                        byte ng = pixels[noff + 1];
                                        byte nr = pixels[noff + 2];
                                        int ndiffRG = Math.Abs(nr - ng);
                                        int ndiffGB = Math.Abs(ng - nb);
                                        int ndiffRB = Math.Abs(nr - nb);
                                        int nminVal = Math.Min(nr, Math.Min(ng, nb));
                                        if (nminVal >= 180 && ndiffRG <= 18 && ndiffGB <= 18 && ndiffRB <= 18) {
                                            visited[nidx] = true;
                                            q.Enqueue(nidx);
                                        }
                                    }
                                }
                            }
                        }

                        if (!touchesEdge && comp.Count > 50) {
                            Console.WriteLine(string.Format("Enclosed comp size={0}, X=[{1}..{2}], Y=[{3}..{4}], R=[{5}..{6}]",
                                comp.Count, minX, maxX, minY, maxY, minR, maxR));
                        }
                    }
                }
            }
        }
    }
}
"@ -ReferencedAssemblies System.Drawing

$baseDir = (Get-Location).Path
$jpgPath = Join-Path $baseDir "public\Gemini_Generated_Image_j8ujl5j8ujl5j8uj.jpg"
[ComponentChecker]::Check($jpgPath)
