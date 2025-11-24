import React, { useState } from 'react';
// @ts-ignore
import jsQR from 'jsqr';
import { ScanLine, Upload, Copy, Check, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

const QrCodeDecoder: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      const selectedFile = files[0];
      if (!selectedFile.type.startsWith('image/')) {
        setError('请选择有效的图片文件');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setResult(null);
      setIsScanning(true);

      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      // Create an image element to draw onto canvas
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          setError('无法创建 Canvas 上下文');
          setIsScanning(false);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          // Get image data for jsQR
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            setResult(code.data);
          } else {
            setError('未能识别出二维码，请尝试更清晰的图片。');
          }
        } catch (e) {
          console.error(e);
          setError('解析过程发生错误。');
        } finally {
          setIsScanning(false);
        }
      };
      
      img.onerror = () => {
        setError('无法加载图片。');
        setIsScanning(false);
      };
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <ScanLine className="w-6 h-6 mr-2 text-blue-600" />
          二维码解析
        </h2>
        <p className="text-slate-500 mt-1">上传二维码图片，自动识别并提取其中的文本或网址信息。</p>
      </div>

      {!file ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          label="上传包含二维码的图片" 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Preview Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
            <h3 className="text-sm font-medium text-slate-500 mb-4 w-full">图片预览</h3>
            <div className="relative bg-slate-100 rounded-lg p-2 max-h-[400px] overflow-hidden flex items-center justify-center">
               {previewUrl && (
                 <img src={previewUrl} alt="QR Preview" className="max-w-full max-h-[350px] object-contain rounded" />
               )}
               {isScanning && (
                 <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                 </div>
               )}
            </div>
            <div className="mt-4 w-full">
              <Button variant="outline" onClick={handleReset} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" /> 识别其他图片
              </Button>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 mb-4">解析结果</h3>
            
            {error ? (
              <div className="h-full flex flex-col items-center justify-center text-red-500 p-8 text-center bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="w-10 h-10 mb-2 opacity-80" />
                <p>{error}</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                 <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 min-h-[120px] break-all font-mono text-sm text-slate-800">
                   {result}
                 </div>
                 
                 <div className="flex gap-3 flex-wrap">
                    <Button onClick={handleCopy} className="flex-1">
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? '已复制' : '复制内容'}
                    </Button>
                    
                    {isValidUrl(result) && (
                      <a href={result} target="_blank" rel="noreferrer" className="flex-1">
                        <Button variant="secondary" className="w-full">
                          <ExternalLink className="w-4 h-4 mr-2" /> 打开链接
                        </Button>
                      </a>
                    )}
                 </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                等待解析...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QrCodeDecoder;