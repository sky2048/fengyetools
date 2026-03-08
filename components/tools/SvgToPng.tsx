import React, { useState, useRef, useEffect } from 'react';
import { FileImage, Download, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

const SvgToPng: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [outputWidth, setOutputWidth] = useState(512);
  const [outputHeight, setOutputHeight] = useState(512);
  const [keepAspect, setKeepAspect] = useState(true);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    if (!f.type.includes('svg') && !f.name.endsWith('.svg')) {
      alert('请选择 SVG 文件');
      return;
    }
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSvgContent(e.target?.result as string);
      setFile(f);
      setResultUrl(null);
    };
    reader.readAsText(f);
  };

  const handleConvert = async () => {
    if (!svgContent) return;

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const img = new Image();
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });

      let w = outputWidth;
      let h = outputHeight;

      if (keepAspect && img.naturalWidth && img.naturalHeight) {
        const ratio = img.naturalWidth / img.naturalHeight;
        if (ratio > 1) {
          h = Math.round(w / ratio);
        } else {
          w = Math.round(h * ratio);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法创建 Canvas');

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const blobOut = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      URL.revokeObjectURL(url);

      if (blobOut) {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setResultUrl(URL.createObjectURL(blobOut));
      }
    } catch (e) {
      console.error(e);
      alert('转换失败：' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setSvgContent(null);
    setResultUrl(null);
  };

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <FileImage className="w-7 h-7 mr-2 text-blue-600" />
          SVG 转 PNG
        </h2>
        <p className="text-slate-500 mt-1">
          上传 SVG 文件，设置输出尺寸，转换为 PNG 下载。
        </p>
      </div>

      {!svgContent ? (
        <FileInput
          onFileSelect={handleFileSelect}
          accept=".svg,image/svg+xml"
          label="上传 SVG 文件"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <FileImage className="w-5 h-5 mr-2 text-blue-600" />
              输出设置
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">宽度 (px)</label>
                  <input
                    type="number"
                    min="1"
                    max="4096"
                    value={outputWidth}
                    onChange={(e) =>
                      setOutputWidth(Math.max(1, Math.min(4096, parseInt(e.target.value) || 512)))
                    }
                    aria-label="宽度 (像素)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">高度 (px)</label>
                  <input
                    type="number"
                    min="1"
                    max="4096"
                    value={outputHeight}
                    onChange={(e) =>
                      setOutputHeight(Math.max(1, Math.min(4096, parseInt(e.target.value) || 512)))
                    }
                    aria-label="高度 (像素)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepAspect}
                    onChange={(e) => setKeepAspect(e.target.checked)}
                    aria-label="保持宽高比"
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">保持宽高比</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Button onClick={handleConvert} isLoading={isProcessing} className="w-full">
                  转换为 PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="w-full text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清除文件
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div>
              <h4 className="font-medium text-slate-900 mb-3">SVG 预览</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-center items-center min-h-[200px]">
                <img
                  src={svgContent ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}` : ''}
                  alt="SVG Preview"
                  className="max-w-full max-h-[300px]"
                />
              </div>
            </div>

            {resultUrl && (
              <div className="animate-in slide-in-from-bottom-6 fade-in">
                <h4 className="font-medium text-slate-900 mb-3">PNG 结果</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                  <img
                    src={resultUrl}
                    alt="PNG Result"
                    className="max-w-full max-h-[400px] block mb-4"
                  />
                  <a href={resultUrl} download={`converted_${new Date().getTime()}.png`}>
                    <Button size="lg" className="shadow-xl">
                      <Download className="w-5 h-5 mr-2" />
                      下载 PNG
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

export default SvgToPng;
