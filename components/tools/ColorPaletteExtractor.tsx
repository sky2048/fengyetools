import React, { useState, useRef, useEffect } from 'react';
import { Palette, Download, Trash2, Copy } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
}

type ExtractMode = 'kmeans' | 'sample';

const ColorPaletteExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [colorCount, setColorCount] = useState(8);
  const [extractMode, setExtractMode] = useState<ExtractMode>('kmeans');
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (!files[0].type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      if (imgSrc) URL.revokeObjectURL(imgSrc);
      const url = URL.createObjectURL(files[0]);
      setImgSrc(url);
      setFile(files[0]);
      setColors([]);
    }
  };

  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');

  const simpleKMeans = (pixels: number[][], k: number, maxIter = 20): number[][] => {
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
    }

    for (let iter = 0; iter < maxIter; iter++) {
      const clusters: number[][][] = Array.from({ length: k }, () => []);

      for (const p of pixels) {
        let minDist = Infinity;
        let best = 0;
        for (let i = 0; i < k; i++) {
          const d =
            Math.pow(p[0] - centroids[i][0], 2) +
            Math.pow(p[1] - centroids[i][1], 2) +
            Math.pow(p[2] - centroids[i][2], 2);
          if (d < minDist) {
            minDist = d;
            best = i;
          }
        }
        clusters[best].push(p);
      }

      for (let i = 0; i < k; i++) {
        if (clusters[i].length === 0) continue;
        const sum = clusters[i].reduce(
          (a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]],
          [0, 0, 0]
        );
        centroids[i] = sum.map((v) => Math.round(v / clusters[i].length));
      }
    }

    return centroids;
  };

  const handleExtract = async () => {
    if (!imgRef.current || !file) return;

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法创建 Canvas');

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const pixels: number[][] = [];
      const step = extractMode === 'sample' ? 20 : 4;

      for (let i = 0; i < data.length; i += step * 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 128) {
          pixels.push([r, g, b]);
        }
      }

      let result: number[][];

      if (extractMode === 'kmeans') {
        const k = Math.min(colorCount, Math.min(16, pixels.length));
        result = simpleKMeans(pixels, k);
      } else {
        const step2 = Math.max(1, Math.floor(pixels.length / colorCount));
        result = [];
        for (let i = 0; i < colorCount && i * step2 < pixels.length; i++) {
          result.push(pixels[i * step2]);
        }
      }

      const colorInfos: ColorInfo[] = result.map(([r, g, b]) => ({
        hex: rgbToHex(r, g, b),
        rgb: { r, g, b },
      }));

      setColors(colorInfos);
    } catch (e) {
      console.error(e);
      alert('提取失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    alert('已复制: ' + hex);
  };

  const reset = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    setFile(null);
    setImgSrc(null);
    setColors([]);
  };

  useEffect(() => {
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Palette className="w-7 h-7 mr-2 text-blue-600" />
          颜色板生成
        </h2>
        <p className="text-slate-500 mt-1">
          上传图片，提取主色调（K-means 或简单采样），生成配色方案，显示 Hex/RGB。
        </p>
      </div>

      {!imgSrc ? (
        <FileInput onFileSelect={handleFileSelect} accept="image/*" label="上传图片" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-blue-600" />
              提取设置
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">提取模式</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExtractMode('kmeans')}
                    className={`py-2 px-3 text-sm rounded-md border transition-all ${
                      extractMode === 'kmeans'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    K-means
                  </button>
                  <button
                    onClick={() => setExtractMode('sample')}
                    className={`py-2 px-3 text-sm rounded-md border transition-all ${
                      extractMode === 'sample'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    采样
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">颜色数量</label>
                <input
                  type="number"
                  min="2"
                  max="16"
                  value={colorCount}
                  aria-label="颜色数量"
                  onChange={(e) =>
                    setColorCount(Math.max(2, Math.min(16, parseInt(e.target.value) || 2)))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Button onClick={handleExtract} isLoading={isProcessing} className="w-full">
                  提取配色
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="w-full text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清除图片
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div>
              <h4 className="font-medium text-slate-900 mb-3">原图</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-center">
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Source"
                  className="max-w-full max-h-[300px] block"
                />
              </div>
            </div>

            {colors.length > 0 && (
              <div className="animate-in slide-in-from-bottom-6 fade-in">
                <style dangerouslySetInnerHTML={{
                  __html: colors.map((c, i) => `.palette-swatch-dynamic-${i} { background-color: ${c.hex}; }`).join('\n'),
                }} />
                <h4 className="font-medium text-slate-900 mb-3">配色方案</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {colors.map((c, i) => (
                      <div
                        key={i}
                        className={`group relative w-16 h-16 rounded-lg shadow-md border border-slate-200 overflow-hidden palette-swatch palette-swatch-dynamic-${i}`}
                      >
                        <button
                          onClick={() => copyHex(c.hex)}
                          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100"
                          title="复制"
                        >
                          <Copy className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm">
                    {colors.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1 px-2 bg-white rounded border"
                      >
                        <span className="font-mono">{c.hex}</span>
                        <span className="text-slate-500">
                          rgb({c.rgb.r}, {c.rgb.g}, {c.rgb.b})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPaletteExtractor;
