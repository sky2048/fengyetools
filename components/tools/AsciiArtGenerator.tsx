import React, { useState, useRef, useEffect } from 'react';
import { Type, Download, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

const CHARS = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^`\'. ';
const CHARS_LIGHT = ' .:-=+*#%@';

const AsciiArtGenerator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [asciiText, setAsciiText] = useState<string>('');
  const [density, setDensity] = useState(2);
  const [width, setWidth] = useState(80);
  const [charSet, setCharSet] = useState<'full' | 'light'>('full');
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
      setAsciiText('');
    }
  };

  const handleConvert = async () => {
    if (!imgRef.current || !file) return;

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      const scale = width / img.naturalWidth;
      canvas.width = width;
      canvas.height = Math.floor(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法创建 Canvas');

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const chars = charSet === 'full' ? CHARS : CHARS_LIGHT;
      const step = Math.max(1, density);
      let result = '';

      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const idx = Math.floor((gray / 255) * (chars.length - 1));
          result += chars[charSet === 'full' ? chars.length - 1 - idx : idx];
        }
        result += '\n';
      }

      setAsciiText(result);
    } catch (e) {
      console.error(e);
      alert('转换失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadText = () => {
    if (!asciiText) return;
    const blob = new Blob([asciiText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ascii_art.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    setFile(null);
    setImgSrc(null);
    setAsciiText('');
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
          <Type className="w-7 h-7 mr-2 text-blue-600" />
          ASCII 艺术生成
        </h2>
        <p className="text-slate-500 mt-1">
          上传图片，转换为 ASCII 字符图，可调节字符密度和宽度。
        </p>
      </div>

      {!imgSrc ? (
        <FileInput onFileSelect={handleFileSelect} accept="image/*" label="上传图片" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <Type className="w-5 h-5 mr-2 text-blue-600" />
              转换设置
            </h3>

            <div className="space-y-6">
              <div>
                <label htmlFor="ascii-width" className="block text-sm font-medium text-slate-700 mb-2">输出宽度 (字符数)</label>
                <input
                  id="ascii-width"
                  type="number"
                  min="20"
                  max="200"
                  value={width}
                  onChange={(e) =>
                    setWidth(Math.max(20, Math.min(200, parseInt(e.target.value) || 80)))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="ascii-density" className="block text-sm font-medium text-slate-700 mb-2">字符密度 (1=密, 4=疏)</label>
                <input
                  id="ascii-density"
                  type="number"
                  min="1"
                  max="8"
                  value={density}
                  onChange={(e) =>
                    setDensity(Math.max(1, Math.min(8, parseInt(e.target.value) || 2)))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">字符集</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCharSet('full')}
                    className={`py-2 px-3 text-sm rounded-md border transition-all ${
                      charSet === 'full'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    完整
                  </button>
                  <button
                    onClick={() => setCharSet('light')}
                    className={`py-2 px-3 text-sm rounded-md border transition-all ${
                      charSet === 'light'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    简约
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Button onClick={handleConvert} isLoading={isProcessing} className="w-full">
                  生成 ASCII
                </Button>
                {asciiText && (
                  <Button variant="outline" onClick={downloadText} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    下载 TXT
                  </Button>
                )}
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
                  className="max-w-full max-h-[200px] block"
                />
              </div>
            </div>

            {asciiText && (
              <div className="animate-in slide-in-from-bottom-6 fade-in">
                <h4 className="font-medium text-slate-900 mb-3">ASCII 结果</h4>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 overflow-auto max-h-[400px]">
                  <pre className="text-green-400 font-mono text-xs leading-tight whitespace-pre">
                    {asciiText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AsciiArtGenerator;
