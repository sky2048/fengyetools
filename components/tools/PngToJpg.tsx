import React, { useState, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import { Download, Image as ImageIcon, Trash2, ArrowRight, Check, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { convertPngToJpg } from '../../utils/imageUtils';

interface ConvertedImage {
  id: string;
  originalName: string;
  resultUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
}

type PageSize = 10 | 50 | 100 | 'all';

const PngToJpg: React.FC = () => {
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Pagination State
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newQueue: ConvertedImage[] = [];
    const validFiles: File[] = [];

    // Filter and prepare queue
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'image/png') {
        validFiles.push(file);
        newQueue.push({
          id: Math.random().toString(36).substr(2, 9),
          originalName: file.name,
          resultUrl: '',
          status: 'pending'
        });
      }
    }

    if (validFiles.length === 0) {
      alert("请选择 PNG 文件。");
      return;
    }

    // Add to existing list (Append)
    setConvertedImages(prev => [...prev, ...newQueue]);
    setIsProcessing(true);

    // Process queue
    // Note: We process only the newly added ones which correspond to validFiles indices
    // However, since state updates are async, we need to be careful.
    // A simple way is to process and update state by ID.

    // Create a temporary copy to update
    let currentBatchIds = newQueue.map(item => item.id);

    // Process sequentially or with limited concurrency to avoid freezing UI
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const id = currentBatchIds[i];

      // Update status to processing
      setConvertedImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'processing' } : img
      ));

      try {
        const jpgUrl = await convertPngToJpg(file, 0.92);
        
        setConvertedImages(prev => prev.map(img => 
          img.id === id ? { ...img, resultUrl: jpgUrl, status: 'done' } : img
        ));
      } catch (e) {
        console.error("Conversion failed for", file.name, e);
        setConvertedImages(prev => prev.map(img => 
          img.id === id ? { ...img, status: 'error' } : img
        ));
      }
    }

    setIsProcessing(false);
  };

  const clearAll = () => {
    // Cleanup URLs
    convertedImages.forEach(img => {
        if (img.resultUrl) URL.revokeObjectURL(img.resultUrl); // Although DataURLs don't strictly need revoke, good practice if we switched to Blob URLs
    });
    setConvertedImages([]);
    setCurrentPage(1);
  };

  const downloadAll = async () => {
    const doneImages = convertedImages.filter(img => img.status === 'done');
    if (doneImages.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // We need to convert Data URLs back to Blobs for efficient zipping
      const promises = doneImages.map(async (img) => {
        const response = await fetch(img.resultUrl);
        const blob = await response.blob();
        const fileName = img.originalName.replace(/\.png$/i, '.jpg');
        zip.file(fileName, blob);
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = "converted_jpgs.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Zip generation failed", err);
      alert("打包下载失败");
    } finally {
      setIsZipping(false);
    }
  };

  // Pagination Logic
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(convertedImages.length / pageSize);
  const currentItems = useMemo(() => {
    if (pageSize === 'all') return convertedImages;
    const start = (currentPage - 1) * pageSize;
    return convertedImages.slice(start, start + pageSize);
  }, [convertedImages, currentPage, pageSize]);

  // Safe check for pagination
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">PNG 转 JPG 转换器</h2>
        <p className="text-slate-500 mt-1">将 PNG 图片批量转换为 JPG 格式。透明背景将自动替换为白色。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload Area */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-4">上传图片</h3>
            <FileInput 
              onFileSelect={handleFileSelect} 
              accept="image/png" 
              multiple={true}
              label="拖拽多张 PNG 到此处"
            />
             <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 border border-blue-100">
               <p><strong>提示:</strong> 支持批量上传。转换将在本地完成。</p>
             </div>

             {convertedImages.length > 0 && (
                <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
                   <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={downloadAll}
                      disabled={isZipping || convertedImages.filter(i => i.status === 'done').length === 0}
                      isLoading={isZipping}
                   >
                      <Archive className="w-4 h-4 mr-2" />
                      下载全部 (ZIP)
                   </Button>
                   <Button variant="outline" onClick={clearAll} className="w-full text-red-600 hover:bg-red-50 border-red-200">
                      <Trash2 className="w-4 h-4 mr-2" />
                      清空列表
                   </Button>
                </div>
             )}
          </div>
        </div>

        {/* Right Column: Results List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 rounded-t-xl">
              <h3 className="font-semibold text-slate-900">
                已转换文件 ({convertedImages.length})
              </h3>
              
              {convertedImages.length > 0 && (
                 <select 
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value) as PageSize);
                      setCurrentPage(1);
                    }}
                    className="text-sm bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    <option value={10}>10条/页</option>
                    <option value={50}>50条/页</option>
                    <option value={100}>100条/页</option>
                    <option value="all">显示全部</option>
                  </select>
              )}
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar" style={{ maxHeight: '800px' }}>
              {convertedImages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p>暂无图片。请上传 PNG 文件开始转换。</p>
                </div>
              ) : (
                currentItems.map((img) => (
                  <div key={img.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors group">
                    <div className="flex items-center space-x-4 overflow-hidden">
                      <div className="h-12 w-12 rounded bg-white border border-slate-200 p-1 flex-shrink-0 flex items-center justify-center">
                        {img.resultUrl ? (
                            <img src={img.resultUrl} alt="preview" className="w-full h-full object-contain" />
                        ) : (
                            <div className="animate-pulse bg-slate-200 w-full h-full rounded"></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[120px] md:max-w-[200px]" title={img.originalName}>
                            {img.originalName}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-sm font-medium text-green-600">JPG</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center mt-1">
                          {img.status === 'done' && (
                             <>
                               <Check className="w-3 h-3 text-green-500 mr-1" /> 转换成功
                             </>
                          )}
                          {img.status === 'processing' && (
                             <span className="text-blue-500 animate-pulse">处理中...</span>
                          )}
                          {img.status === 'error' && (
                             <span className="text-red-500">转换失败</span>
                          )}
                          {img.status === 'pending' && (
                             <span className="text-slate-400">等待中...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {img.status === 'done' && (
                        <a 
                        href={img.resultUrl} 
                        download={img.originalName.replace(/\.png$/i, '.jpg')}
                        className="flex-shrink-0 ml-2"
                        >
                        <Button size="sm" variant="secondary">
                            <Download className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">保存</span>
                        </Button>
                        </a>
                    )}
                  </div>
                ))
              )}
            </div>

             {/* Pagination Footer */}
             {convertedImages.length > 0 && pageSize !== 'all' && totalPages > 1 && (
                <div className="border-t border-slate-100 p-3 bg-slate-50 flex justify-between items-center rounded-b-xl">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="text-slate-500"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
                  </Button>
                  
                  <span className="text-xs font-medium text-slate-500">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="text-slate-500"
                  >
                    下一页 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PngToJpg;