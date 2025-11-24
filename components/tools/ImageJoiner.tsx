import React, { useState, useEffect } from 'react';
import { Rows, Columns, X, Download, Plus, Trash2, GripVertical, ArrowUp, ArrowDown, ArrowUpDown, Check } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { createImage } from '../../utils/imageUtils';

interface JoinItem {
  id: string;
  file: File;
  previewUrl: string;
}

type Direction = 'vertical' | 'horizontal';

const ImageJoiner: React.FC = () => {
  const [images, setImages] = useState<JoinItem[]>([]);
  const [direction, setDirection] = useState<Direction>('vertical');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Drag & Sort States
  const [isSortMode, setIsSortMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Cleanup URLs
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages: JoinItem[] = [];
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file: files[i],
          previewUrl: URL.createObjectURL(files[i])
        });
      }
    }
    setImages(prev => [...prev, ...newImages]);
    // Clear old result when inputs change
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].previewUrl);
    newImages.splice(index, 1);
    setImages(newImages);
    if (resultUrl) {
       URL.revokeObjectURL(resultUrl);
       setResultUrl(null);
    }
  };

  // --- Manual Sorting ---
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    // Swap
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
    resetResult();
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    // Swap
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
    resetResult();
  };

  const resetResult = () => {
    if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
        setResultUrl(null);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isSortMode) {
        e.preventDefault();
        return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary for drop to work
    if (isSortMode) {
        e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!isSortMode || draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);

    setImages(newImages);
    setDraggedIndex(null);
    resetResult();
  };

  const handleJoin = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      // Load all images using shared utility, disabling CORS for local blobs
      const loadedImages = await Promise.all(
        images.map(item => createImage(item.previewUrl, false))
      );

      if (loadedImages.length === 0) {
        throw new Error("没有有效的图片可供拼接");
      }

      // Calculate Canvas Dimensions
      let canvasWidth = 0;
      let canvasHeight = 0;

      if (direction === 'vertical') {
        canvasWidth = loadedImages.reduce((max, img) => Math.max(max, img.width), 0);
        canvasHeight = loadedImages.reduce((sum, img) => sum + img.height, 0);
      } else {
        canvasWidth = loadedImages.reduce((sum, img) => sum + img.width, 0);
        canvasHeight = loadedImages.reduce((max, img) => Math.max(max, img.height), 0);
      }

      // Browser limits check (approximate safe limit)
      const MAX_DIMENSION = 30000; 
      const MAX_AREA = 268435456; // 16384 * 16384
      
      if (canvasWidth > MAX_DIMENSION || canvasHeight > MAX_DIMENSION || (canvasWidth * canvasHeight) > MAX_AREA) {
        throw new Error(`拼接后的图片尺寸过大 (${canvasWidth}x${canvasHeight})，浏览器无法处理。请减少图片数量或压缩图片后再试。`);
      }

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('无法创建 Canvas 上下文');

      // Draw Images
      let currentX = 0;
      let currentY = 0;

      loadedImages.forEach(img => {
        if (direction === 'vertical') {
          // Center horizontally
          const x = (canvasWidth - img.width) / 2;
          ctx.drawImage(img, x, currentY);
          currentY += img.height;
        } else {
          // Center vertically
          const y = (canvasHeight - img.height) / 2;
          ctx.drawImage(img, currentX, y);
          currentX += img.width;
        }
      });

      // Use toBlob instead of toDataURL for large images support and memory efficiency
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('图片生成失败 (Canvas toBlob returned null)'));
        }, 'image/png');
      });

      if (!blob) throw new Error('生成图片数据为空');

      const url = URL.createObjectURL(blob);
      setResultUrl(url);

    } catch (e) {
      console.error("Joining error:", e);
      alert('拼接失败：' + (e instanceof Error ? e.message : '可能是因为图片过大导致内存不足'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          图片拼接
        </h2>
        <p className="text-slate-500 mt-1">将多张图片拼接为一张长图，支持自定义顺序。</p>
      </div>

      {images.length === 0 ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          multiple 
          label="上传多张图片开始拼接" 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Image List & Management */}
          <div className="lg:col-span-1 flex flex-col h-[calc(100vh-200px)] sticky top-6">
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                   <h3 className="font-semibold text-slate-900">图片列表 ({images.length})</h3>
                   <div className="flex gap-2">
                      <label className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors" title="添加图片">
                         <Plus className="w-4 h-4" />
                         <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                      </label>
                      <button 
                         onClick={() => {
                            images.forEach(i => URL.revokeObjectURL(i.previewUrl));
                            setImages([]);
                            setResultUrl(null);
                         }}
                         className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                         title="清空全部"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                
                {/* Mode Switcher */}
                <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">操作模式:</span>
                    <button 
                        onClick={() => setIsSortMode(!isSortMode)}
                        className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${
                            isSortMode 
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        {isSortMode ? (
                            <>
                                <Check className="w-3 h-3 mr-1" /> 完成排序
                            </>
                        ) : (
                            <>
                                <ArrowUpDown className="w-3 h-3 mr-1" /> 调整顺序
                            </>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                   {images.map((img, index) => (
                      <div 
                        key={img.id} 
                        draggable={isSortMode}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`flex items-center gap-3 bg-slate-50 p-2 rounded-lg border transition-all select-none ${
                            draggedIndex === index 
                            ? 'opacity-50 border-blue-400 bg-blue-50 scale-95' 
                            : 'border-slate-100 hover:border-blue-200'
                        } ${isSortMode ? 'cursor-move' : ''}`}
                      >
                         {/* Index / Drag Handle */}
                         <div className="w-6 flex justify-center text-slate-400">
                             {isSortMode ? (
                                 <GripVertical className="w-4 h-4 text-indigo-400" />
                             ) : (
                                 <span className="text-xs font-medium text-slate-400">{index + 1}</span>
                             )}
                         </div>

                         <div className="w-10 h-10 bg-white rounded border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center pointer-events-none">
                            <img src={img.previewUrl} alt="" className="max-w-full max-h-full object-contain" />
                         </div>
                         
                         <div className="flex-1 min-w-0 pointer-events-none">
                            <p className="text-sm font-medium text-slate-700 truncate">{img.file.name}</p>
                         </div>

                         {/* Actions */}
                         {!isSortMode ? (
                             <div className="flex items-center gap-1">
                                <div className="flex flex-col">
                                    <button 
                                        onClick={() => moveUp(index)}
                                        disabled={index === 0}
                                        className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400"
                                    >
                                        <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button 
                                        onClick={() => moveDown(index)}
                                        disabled={index === images.length - 1}
                                        className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400"
                                    >
                                        <ArrowDown className="w-3 h-3" />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => removeImage(index)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-1"
                                    title="移除"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                             </div>
                         ) : (
                             <div className="text-xs text-indigo-400 font-medium px-2">
                                 拖拽
                             </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Right: Settings & Preview */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
             {/* Settings Toolbar */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <span className="text-sm font-medium text-slate-700">拼接方向:</span>
                   <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button
                         onClick={() => setDirection('vertical')}
                         className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                            direction === 'vertical' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                         }`}
                      >
                         <Rows className="w-4 h-4 mr-2" /> 竖向 (垂直)
                      </button>
                      <button
                         onClick={() => setDirection('horizontal')}
                         className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                            direction === 'horizontal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                         }`}
                      >
                         <Columns className="w-4 h-4 mr-2" /> 横向 (水平)
                      </button>
                   </div>
                </div>

                <Button onClick={handleJoin} isLoading={isProcessing} className="min-w-[120px]">
                   生成长图
                </Button>
             </div>

             {/* Preview Area */}
             <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-8 flex items-center justify-center min-h-[400px] relative overflow-auto">
                {resultUrl ? (
                   <div className="flex flex-col items-center w-full">
                      <div className="relative shadow-lg border border-slate-200 bg-white max-w-full mb-6">
                         <img src={resultUrl} alt="Joined Result" className="max-w-full max-h-[600px] object-contain block" />
                      </div>
                      <a href={resultUrl} download={`joined_image_${new Date().getTime()}.png`}>
                         <Button size="lg" className="shadow-xl">
                            <Download className="w-5 h-5 mr-2" />
                            下载拼接图片
                         </Button>
                      </a>
                   </div>
                ) : (
                   <div className="text-center text-slate-400">
                      <p>点击 "生成长图" 查看结果</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageJoiner;
