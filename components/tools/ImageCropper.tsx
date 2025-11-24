import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Crop as CropIcon, Download, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

// Helper to center crop on init
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect?: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect || 16 / 9,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

const ImageCropper: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (!files[0].type.startsWith('image/')) {
        alert("请选择图片文件");
        return;
      }
      setCrop(undefined); // Reset crop
      setResultUrl(null); // Reset result
      const reader = new FileReader();
      reader.addEventListener('load', () => 
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(files[0]);
      setFile(files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  };

  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current || !file) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const base64 = canvas.toDataURL(file.type);
    setResultUrl(base64);
  };

  const reset = () => {
    setFile(null);
    setImgSrc('');
    setResultUrl(null);
    setAspect(undefined);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">图片裁剪</h2>
        <p className="text-slate-500 mt-1">拖拽选框裁剪图片，支持自由比例或固定比例。</p>
      </div>

      {!imgSrc ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          label="上传图片开始裁剪" 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
                    <CropIcon className="w-5 h-5 mr-2 text-blue-600" />
                    裁剪设置
                </h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">比例预设</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setAspect(undefined)}
                                className={`px-3 py-2 text-sm rounded-md border ${!aspect ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                自由比例
                            </button>
                            <button 
                                onClick={() => setAspect(1)}
                                className={`px-3 py-2 text-sm rounded-md border ${aspect === 1 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                1:1 (方形)
                            </button>
                            <button 
                                onClick={() => setAspect(16/9)}
                                className={`px-3 py-2 text-sm rounded-md border ${aspect === 16/9 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                16:9 (宽屏)
                            </button>
                            <button 
                                onClick={() => setAspect(4/3)}
                                className={`px-3 py-2 text-sm rounded-md border ${aspect === 4/3 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                4:3 (标准)
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <Button onClick={handleCrop} className="w-full">
                            生成裁剪结果
                        </Button>
                         <Button variant="outline" onClick={reset} className="w-full text-red-600 hover:bg-red-50 border-red-200">
                            <Trash2 className="w-4 h-4 mr-2" />
                            清除图片
                         </Button>
                    </div>
                </div>
            </div>

            {/* Editor / Preview Area */}
            <div className="lg:col-span-2 space-y-6">
                {/* Editor */}
                <div className="bg-slate-800 rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center p-4">
                    <ReactCrop 
                        crop={crop} 
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                        className="max-h-[600px]"
                    >
                        <img 
                            ref={imgRef} 
                            src={imgSrc} 
                            alt="Crop source" 
                            onLoad={onImageLoad}
                            className="max-w-full max-h-[600px] object-contain"
                        />
                    </ReactCrop>
                </div>

                {/* Result */}
                {resultUrl && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-900">裁剪结果预览</h4>
                            <a href={resultUrl} download={`cropped_${file?.name}`}>
                                <Button variant="primary" size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    下载裁剪图
                                </Button>
                            </a>
                        </div>
                        <div className="flex justify-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <img src={resultUrl} alt="Cropped Result" className="max-h-[300px] shadow-sm" />
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageCropper;