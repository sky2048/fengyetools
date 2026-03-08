import React, { useState, useRef, useEffect } from 'react';
import { Square, Download, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

type ScaleMode = 'fit' | 'fill' | 'stretch';

const TexturePowerOfTwo: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [scaleMode, setScaleMode] = useState<ScaleMode>('fit');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);
  const [targetSize, setTargetSize] = useState<{ w: number; h: number } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  const nearestPow2 = (n: number) => Math.pow(2, Math.round(Math.log2(n)));

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (!files[0].type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      if (imgSrc) URL.revokeObjectURL(imgSrc);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(files[0]);
      setImgSrc(url);
      setFile(files[0]);
      setResultUrl(null);
      setOriginalSize(null);
      setTargetSize(null);
    }
  };

  const handleProcess = async () => {
    if (!imgRef.current || !file) return;

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const img = imgRef.current;
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const pow2W = nearestPow2(w);
      const pow2H = nearestPow2(h);

      setOriginalSize({ w, h });
      setTargetSize({ w: pow2W, h: pow2H });

      const canvas = document.createElement('canvas');
      canvas.width = pow2W;
      canvas.height = pow2H;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('无法创建 Canvas 上下文');

      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, pow2W, pow2H);

      if (scaleMode === 'fit') {
        const scale = Math.min(pow2W / w, pow2H / h);
        const dw = w * scale;
        const dh = h * scale;
        const dx = (pow2W - dw) / 2;
        const dy = (pow2H - dh) / 2;
        ctx.drawImage(img, 0, 0, w, h, dx, dy, dw, dh);
      } else if (scaleMode === 'fill') {
        const scale = Math.max(pow2W / w, pow2H / h);
        const sw = w * scale;
        const sh = h * scale;
        const sx = (sw - pow2W) / 2;
        const sy = (sh - pow2H) / 2;
        ctx.drawImage(img, sx, sy, pow2W, pow2H, 0, 0, pow2W, pow2H);
      } else {
        ctx.drawImage(img, 0, 0, w, h, 0, 0, pow2W, pow2H);
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, file.type)
      );

      if (blob) {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setResultUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.error(e);
      alert('处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setImgSrc(null);
    setResultUrl(null);
    setOriginalSize(null);
    setTargetSize(null);
  };

  useEffect(() => {
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Square className="w-7 h-7 mr-2 text-blue-600" />
          纹理 2 的幂次调整
        </h2>
        <p className="text-slate-500 mt-1">
          将图片尺寸调整为最近的 2^n（如 512×512），支持多种缩放模式。
        </p>
      </div>

      {!imgSrc ? (
        <FileInput onFileSelect={handleFileSelect} accept="image/*" label="上传图片" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <Square className="w-5 h-5 mr-2 text-blue-600" />
              调整设置
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">缩放模式</label>
                <div className="space-y-2">
                  {[
                    { value: 'fit' as ScaleMode, label: '适应 (Fit) - 保持比例，完整显示' },
                    { value: 'fill' as ScaleMode, label: '填充 (Fill) - 保持比例，填满画布' },
                    { value: 'stretch' as ScaleMode, label: '拉伸 (Stretch) - 不保持比例' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setScaleMode(opt.value)}
                      className={`w-full text-left py-2 px-3 text-sm rounded-md border transition-all ${
                        scaleMode === opt.value
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {originalSize && targetSize && (
                <div className="text-sm text-slate-600 space-y-1">
                  <p>原尺寸: {originalSize.w} × {originalSize.h}</p>
                  <p>目标尺寸: {targetSize.w} × {targetSize.h}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Button onClick={handleProcess} isLoading={isProcessing} className="w-full">
                  调整尺寸
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
                  alt="Original"
                  className="max-w-full max-h-[300px] block"
                />
              </div>
            </div>

            {resultUrl && (
              <div className="animate-in slide-in-from-bottom-6 fade-in">
                <h4 className="font-medium text-slate-900 mb-3">调整结果</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="max-w-full max-h-[300px] block mb-4"
                  />
                  <a href={resultUrl} download={`texture_pow2_${new Date().getTime()}.png`}>
                    <Button size="lg" className="shadow-xl">
                      <Download className="w-5 h-5 mr-2" />
                      下载图片
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TexturePowerOfTwo;
