import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Download, Trash2, RefreshCw, Sliders } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { createImage } from '../../utils/imageUtils';

const ImageRotator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  
  // Transform State
  const [rotation, setRotation] = useState(0); // 0-360
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (!files[0].type.startsWith('image/')) {
        alert("请选择图片文件");
        return;
      }
      const url = URL.createObjectURL(files[0]);
      setImgSrc(url);
      setFile(files[0]);
      // Reset transforms
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
    }
  };

  const rotateLeft = () => {
    setRotation(prev => {
      const newRot = prev - 45;
      return newRot < 0 ? newRot + 360 : newRot;
    });
  };

  const rotateRight = () => {
    setRotation(prev => (prev + 45) % 360);
  };

  const toggleFlipH = () => setFlipH(prev => !prev);
  const toggleFlipV = () => setFlipV(prev => !prev);

  const resetTransforms = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  const clearImage = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    setFile(null);
    setImgSrc(null);
    resetTransforms();
  };

  const handleDownload = async () => {
    if (!imgSrc || !file) return;

    const img = await createImage(imgSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Calculate bounding box for arbitrary rotation
    const angleInRadians = (rotation * Math.PI) / 180;
    const absCos = Math.abs(Math.cos(angleInRadians));
    const absSin = Math.abs(Math.sin(angleInRadians));

    // The new width and height of the bounding box
    const canvasWidth = img.naturalWidth * absCos + img.naturalHeight * absSin;
    const canvasHeight = img.naturalWidth * absSin + img.naturalHeight * absCos;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Move context to center of canvas to perform transforms
    ctx.translate(canvasWidth / 2, canvasHeight / 2);

    // Rotate
    ctx.rotate(angleInRadians);

    // Flip
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Draw image centered relative to the new origin
    ctx.drawImage(
      img, 
      -img.naturalWidth / 2, 
      -img.naturalHeight / 2
    );

    // Export
    const link = document.createElement('a');
    link.download = `rotated_${file.name}`;
    link.href = canvas.toDataURL(file.type);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">图片旋转/翻转</h2>
        <p className="text-slate-500 mt-1">调整图片朝向，支持45度旋转、自由角度调整和镜像翻转。</p>
      </div>

      {!imgSrc ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          label="上传图片" 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <RotateCw className="w-5 h-5 mr-2 text-blue-600" />
              变换设置
            </h3>

            <div className="space-y-6">
              {/* Quick Rotate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">快速旋转 (45°)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={rotateLeft}
                    className="flex items-center justify-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                    title="向左旋转 45°"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    左转 45°
                  </button>
                  <button 
                    onClick={rotateRight}
                    className="flex items-center justify-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                    title="向右旋转 45°"
                  >
                    <RotateCw className="w-5 h-5 mr-2" />
                    右转 45°
                  </button>
                </div>
              </div>

              {/* Free Rotation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center justify-between">
                  <span>自由角度</span>
                  <span className="text-blue-600 font-mono text-xs bg-blue-50 px-2 py-1 rounded">{Math.round(rotation)}°</span>
                </label>
                <div className="flex items-center gap-3">
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={rotation} 
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>0°</span>
                    <span>180°</span>
                    <span>360°</span>
                </div>
              </div>

              {/* Flip */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">翻转 (镜像)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={toggleFlipH}
                    className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-all ${
                      flipH 
                        ? 'bg-blue-600 text-white border-transparent' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    title="水平翻转"
                  >
                    <FlipHorizontal className="w-5 h-5 mr-2" />
                    水平翻转
                  </button>
                  <button 
                    onClick={toggleFlipV}
                    className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-all ${
                      flipV 
                        ? 'bg-blue-600 text-white border-transparent' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    title="垂直翻转"
                  >
                    <FlipVertical className="w-5 h-5 mr-2" />
                    垂直翻转
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                 <Button onClick={resetTransforms} variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重置状态
                 </Button>
                 <Button onClick={clearImage} variant="outline" className="w-full text-red-600 hover:bg-red-50 border-red-200">
                    <Trash2 className="w-4 h-4 mr-2" />
                    清除图片
                 </Button>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2 space-y-4">
             <div className="bg-slate-800/5 rounded-xl border border-slate-200 overflow-hidden min-h-[400px] flex items-center justify-center p-8 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                {/* CSS Transform Preview */}
                <img 
                  ref={imgRef}
                  src={imgSrc} 
                  alt="Preview" 
                  className="max-w-full max-h-[500px] object-contain shadow-lg transition-transform duration-200 ease-linear"
                  style={{
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
                  }}
                />
             </div>

             <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center text-sm text-slate-600 gap-4">
                   <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                     旋转: {Math.round(rotation)}°
                   </span>
                   <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                     水平: {flipH ? '是' : '否'}
                   </span>
                   <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                     垂直: {flipV ? '是' : '否'}
                   </span>
                </div>
                <Button size="lg" onClick={handleDownload}>
                   <Download className="w-5 h-5 mr-2" />
                   保存图片
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageRotator;