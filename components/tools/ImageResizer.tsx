import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { Scaling, Download, Trash2, ArrowRight, Archive, Images, AlertCircle, Check } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { createImage, formatBytes } from '../../utils/imageUtils';

interface ResizedImage {
  id: string;
  originalFile: File;
  resultUrl: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  originalDims?: { w: number; h: number };
  processedDims?: { w: number; h: number };
  processedSize?: number;
}

const ImageResizer: React.FC = () => {
  const [fileList, setFileList] = useState<ResizedImage[]>([]);
  
  // Settings
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  
  // Tracks which dimension drives the scaling in batch mode when locked
  const [activeDimension, setActiveDimension] = useState<'width' | 'height'>('width');
  
  // Reference image (usually the first one) for calculating ratio in UI
  const [referenceRatio, setReferenceRatio] = useState<number>(1);
  const [referenceLoaded, setReferenceLoaded] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Initialize with the first file when list changes
  useEffect(() => {
    if (fileList.length > 0 && !referenceLoaded) {
      const firstItem = fileList[0];
      createImage(URL.createObjectURL(firstItem.originalFile)).then(img => {
        setTargetWidth(img.width);
        setTargetHeight(img.height);
        setReferenceRatio(img.width / img.height);
        setReferenceLoaded(true);
        
        // Update first item dims immediately for UI
        setFileList(prev => prev.map((item, idx) => idx === 0 ? {
            ...item, 
            originalDims: { w: img.width, h: img.height }
        } : item));
      }).catch(err => console.error("Failed to load reference image", err));
    }
  }, [fileList, referenceLoaded]);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newFiles: ResizedImage[] = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          newFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            originalFile: files[i],
            resultUrl: null,
            status: 'pending'
          });
        }
      }
      
      if (newFiles.length === 0) {
          alert("请选择有效的图片文件");
          return;
      }

      // If existing files, we just append, but if we want to reset reference logic we might check
      // For simplicity, if list was empty, reset reference loaded state
      if (fileList.length === 0) {
        setReferenceLoaded(false);
      }
      
      setFileList(prev => [...prev, ...newFiles]);
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setTargetWidth(val);
    setActiveDimension('width');
    if (lockAspectRatio && referenceLoaded) {
      setTargetHeight(Math.round(val / referenceRatio));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setTargetHeight(val);
    setActiveDimension('height');
    if (lockAspectRatio && referenceLoaded) {
      setTargetWidth(Math.round(val * referenceRatio));
    }
  };

  const processBatch = async () => {
    if (fileList.length === 0 || targetWidth <= 0 || targetHeight <= 0) return;

    setIsProcessing(true);
    
    const newList = [...fileList];

    for (let i = 0; i < newList.length; i++) {
        const item = newList[i];
        
        // Skip already done unless we want to allow re-processing (user might have changed settings)
        // Let's allow re-processing by resetting status visually or just overwriting
        newList[i] = { ...item, status: 'processing' };
        setFileList([...newList]);

        try {
            const objectUrl = URL.createObjectURL(item.originalFile);
            const img = await createImage(objectUrl);
            
            // Calculate specific dimensions for this image
            let w = targetWidth;
            let h = targetHeight;

            if (lockAspectRatio) {
                const imgRatio = img.width / img.height;
                if (activeDimension === 'width') {
                    // Width is master
                    w = targetWidth;
                    h = Math.round(targetWidth / imgRatio);
                } else {
                    // Height is master
                    h = targetHeight;
                    w = Math.round(targetHeight * imgRatio);
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, w, h);
                
                // Get Blob
                const blob = await new Promise<Blob | null>(resolve => 
                    canvas.toBlob(resolve, item.originalFile.type, 0.92)
                );

                if (blob) {
                    const resUrl = URL.createObjectURL(blob);
                    newList[i] = {
                        ...item,
                        status: 'done',
                        resultUrl: resUrl,
                        originalDims: { w: img.width, h: img.height }, // Store now if not before
                        processedDims: { w, h },
                        processedSize: blob.size
                    };
                } else {
                    throw new Error("Blob creation failed");
                }
            }
        } catch (e) {
            console.error(e);
            newList[i] = { ...item, status: 'error' };
        }
        // Free temp url used for loading
        // (Note: we rely on createImage handling revoke or we do it here if we made it specifically)
        // In this flow, we created objectUrl just for loading img.
        
        setFileList([...newList]);
    }

    setIsProcessing(false);
  };

  const handleDownloadZip = async () => {
    const doneFiles = fileList.filter(f => f.status === 'done' && f.resultUrl);
    if (doneFiles.length === 0) return;

    setIsZipping(true);
    try {
        const zip = new JSZip();
        const folder = zip.folder("resized_images");

        if (folder) {
            const promises = doneFiles.map(async (item) => {
                if (!item.resultUrl) return;
                const response = await fetch(item.resultUrl);
                const blob = await response.blob();
                
                // Construct filename: name_WxH.ext
                const nameParts = item.originalFile.name.split('.');
                const ext = nameParts.pop();
                const baseName = nameParts.join('.');
                const fileName = `${baseName}_${item.processedDims?.w}x${item.processedDims?.h}.${ext}`;
                
                folder.file(fileName, blob);
            });
            
            await Promise.all(promises);
            
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = "resized_batch.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (e) {
        alert("打包失败");
    } finally {
        setIsZipping(false);
    }
  };

  const removeItem = (index: number) => {
      const newList = [...fileList];
      const item = newList[index];
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      newList.splice(index, 1);
      setFileList(newList);
      
      if (newList.length === 0) {
          setReferenceLoaded(false);
          setTargetWidth(0);
          setTargetHeight(0);
      }
  };

  const resetAll = () => {
      fileList.forEach(f => {
          if (f.resultUrl) URL.revokeObjectURL(f.resultUrl);
      });
      setFileList([]);
      setReferenceLoaded(false);
      setTargetWidth(0);
      setTargetHeight(0);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          修改分辨率
        </h2>
        <p className="text-slate-500 mt-1">批量调整多张图片的像素尺寸。支持锁定长宽比以防止变形。</p>
      </div>

      {fileList.length === 0 ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          multiple={true}
          label="上传单张或多张图片" 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit lg:sticky lg:top-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <Scaling className="w-5 h-5 mr-2 text-blue-600" />
              全局尺寸设置
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">宽度 (px)</label>
                  <input
                    type="number"
                    value={targetWidth || ''}
                    onChange={handleWidthChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="自动"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">高度 (px)</label>
                  <input
                    type="number"
                    value={targetHeight || ''}
                    onChange={handleHeightChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="自动"
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
                <label htmlFor="aspect-ratio" className="ml-2 block text-sm text-slate-900 select-none cursor-pointer">
                  锁定长宽比
                </label>
              </div>
              
              {lockAspectRatio && fileList.length > 1 && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded border border-amber-100 flex items-start">
                      <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                      <span>
                          <strong>批量模式提示：</strong>
                          因为各图比例不同，锁定比例时将以您最后修改的数值（{activeDimension === 'width' ? '宽度' : '高度'}）为准进行缩放，另一边自动计算。
                      </span>
                  </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-3">
                 <Button onClick={processBatch} isLoading={isProcessing} className="w-full">
                    {fileList.length > 1 ? `批量处理 (${fileList.length})` : '应用更改'}
                 </Button>
                 
                 {fileList.some(f => f.status === 'done') && (
                     <Button 
                        variant="secondary" 
                        onClick={handleDownloadZip} 
                        isLoading={isZipping}
                        className="w-full bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                     >
                        <Archive className="w-4 h-4 mr-2" />
                        下载全部 (ZIP)
                     </Button>
                 )}

                 <Button variant="outline" onClick={resetAll} className="w-full text-red-600 hover:bg-red-50 border-red-200">
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空列表
                 </Button>
              </div>
            </div>
          </div>

          {/* List / Preview */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex justify-between items-center mb-2">
                 <h3 className="font-semibold text-slate-700">图片列表 ({fileList.length})</h3>
                 <label className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium flex items-center">
                     <Images className="w-4 h-4 mr-1" /> 添加更多
                     <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                 </label>
             </div>

             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {fileList.map((item, idx) => (
                        <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 relative">
                                {item.resultUrl ? (
                                    <img src={item.resultUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Images className="w-6 h-6" />
                                    </div>
                                )}
                                {idx === 0 && referenceLoaded && (
                                    <div className="absolute top-0 left-0 right-0 bg-blue-500/80 text-white text-[10px] text-center font-bold">参考</div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-slate-900 truncate pr-2" title={item.originalFile.name}>
                                        {item.originalFile.name}
                                    </p>
                                    <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="flex items-center text-xs text-slate-500 space-x-2">
                                    <span>{formatBytes(item.originalFile.size)}</span>
                                    {item.originalDims && (
                                        <>
                                            <span className="text-slate-300">|</span>
                                            <span>{item.originalDims.w} x {item.originalDims.h}</span>
                                        </>
                                    )}
                                </div>
                                
                                {/* Status Area */}
                                <div className="mt-2 flex items-center h-6">
                                    {item.status === 'done' ? (
                                        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                            <Check className="w-3 h-3 mr-1" />
                                            成功: {item.processedDims?.w} x {item.processedDims?.h} 
                                            <span className="ml-1 text-slate-400">({formatBytes(item.processedSize || 0)})</span>
                                        </div>
                                    ) : item.status === 'processing' ? (
                                        <span className="text-xs text-blue-500 animate-pulse">处理中...</span>
                                    ) : item.status === 'error' ? (
                                        <span className="text-xs text-red-500">处理失败</span>
                                    ) : (
                                        <span className="text-xs text-slate-400">等待处理</span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {item.status === 'done' && item.resultUrl && (
                                <a 
                                    href={item.resultUrl} 
                                    download={`resized_${item.originalFile.name}`}
                                    className="flex-shrink-0"
                                >
                                    <Button size="sm" variant="secondary">
                                        <Download className="w-4 h-4 mr-2" /> 下载
                                    </Button>
                                </a>
                            )}
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageResizer;
