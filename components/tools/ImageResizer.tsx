import React, { useState, useEffect, useRef } from 'react';
import { Scaling, Download, Trash2, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { createImage } from '../../utils/imageUtils';

const ImageResizer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (files && files[0]) {
      if (!files[0].type.startsWith('image/')) {
        alert("请选择图片文件");
        return;
      }
      const selectedFile = files[0];
      setFile(selectedFile);
      
      try {
        const url = URL.createObjectURL(selectedFile);
        const img = await createImage(url);
        setOriginalImage(img);
        setWidth(img.width);
        setHeight(img.height);
        setAspectRatio(img.width / img.height);
        setResultUrl(null); // Reset previous result
      } catch (e) {
        console.error("Error loading image", e);
      }
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value) || 0;
    setWidth(newWidth);
    if (lockAspectRatio) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value) || 0;
    setHeight(newHeight);
    if (lockAspectRatio) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const handleResize = () => {
    if (!originalImage || width <= 0 || height <= 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // High quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(originalImage, 0, 0, width, height);
      
      const url = canvas.toDataURL(file?.type || 'image/png');
      setResultUrl(url);
    }
  };

  const reset = () => {
    setFile(null);
    setOriginalImage(null);
    setResultUrl(null);
    setWidth(0);
    setHeight(0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">修改分辨率</h2>
        <p className="text-slate-500 mt-1">调整图片的像素尺寸 (分辨率)。支持锁定长宽比以防止变形。</p>
      </div>

      {!file ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          label="上传图片以修改尺寸" 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <Scaling className="w-5 h-5 mr-2 text-blue-600" />
              尺寸设置
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">宽度 (px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={handleWidthChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">高度 (px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={handleHeightChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="aspect-ratio"
                  type="checkbox"
                  checked={lockAspectRatio}
                  onChange={(e) => setLockAspectRatio(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="aspect-ratio" className="ml-2 block text-sm text-slate-900">
                  锁定长宽比
                </label>
              </div>

              {originalImage && (
                 <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-500">
                    原始尺寸: {originalImage.width} x {originalImage.height} px
                 </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-3">
                 <Button onClick={handleResize} className="w-full">
                    应用更改
                 </Button>
                 <Button variant="outline" onClick={reset} className="w-full text-red-600 hover:bg-red-50 border-red-200">
                    <Trash2 className="w-4 h-4 mr-2" />
                    清除图片
                 </Button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2 space-y-4">
             <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden min-h-[400px] flex items-center justify-center p-8">
                {resultUrl ? (
                   <img src={resultUrl} alt="Resized" className="max-w-full max-h-[600px] object-contain shadow-lg bg-white" />
                ) : originalImage ? (
                   <img src={originalImage.src} alt="Original" className="max-w-full max-h-[600px] object-contain opacity-50 grayscale" />
                ) : (
                   <div className="text-slate-400">预览区域</div>
                )}
             </div>

             {resultUrl && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex items-center text-sm text-slate-600">
                      <span className="font-medium">{originalImage?.width}x{originalImage?.height}</span>
                      <ArrowRight className="w-4 h-4 mx-2 text-slate-400" />
                      <span className="font-bold text-blue-600">{width}x{height}</span>
                   </div>
                   <a href={resultUrl} download={`resized_${file?.name}`}>
                      <Button size="lg">
                         <Download className="w-5 h-5 mr-2" />
                         下载图片
                      </Button>
                   </a>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageResizer;