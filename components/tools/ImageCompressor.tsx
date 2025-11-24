import React, { useState, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
import { Download, Sliders, Archive, Trash2, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { compressImage, formatBytes } from '../../utils/imageUtils';

interface CompressedResult {
  originalFile: File;
  compressedBlob: Blob | null;
  compressedUrl: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
}

type PageSize = 10 | 50 | 100 | 'all';

const ImageCompressor: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<CompressedResult[]>([]);
  
  const [quality, setQuality] = useState(0.7);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Estimation State
  const [estimatedRatio, setEstimatedRatio] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Single File Preview State
  const [singlePreview, setSinglePreview] = useState<{ url: string; blob: Blob } | null>(null);

  // Pagination State
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const validFiles: File[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      if (selectedFiles[i].type.startsWith('image/')) {
        validFiles.push(selectedFiles[i]);
      }
    }

    if (validFiles.length === 0) {
      alert("请选择图片文件。");
      return;
    }

    // Append new files instead of replacing if we want to support adding more, 
    // but for simplicity and consistency with reset logic, let's replace or just merge.
    // Here we replace to keep logic simple as per other tools, or we could append.
    // Let's replace for now based on current UI flow, or user can clear and add.
    setFiles(validFiles);
    
    // Reset results and estimation
    const initialResults: CompressedResult[] = validFiles.map(f => ({
      originalFile: f,
      compressedBlob: null,
      compressedUrl: null,
      status: 'pending'
    }));
    setResults(initialResults);
    setSinglePreview(null);
    setEstimatedRatio(null);
    setCurrentPage(1);
  };

  const handleReset = () => {
    results.forEach(r => {
      if (r.compressedUrl) URL.revokeObjectURL(r.compressedUrl);
    });
    if (singlePreview) URL.revokeObjectURL(singlePreview.url);
    
    setFiles([]);
    setResults([]);
    setSinglePreview(null);
    setEstimatedRatio(null);
    setCurrentPage(1);
  };

  // --- Estimation & Auto-Preview Logic ---
  useEffect(() => {
    if (files.length === 0) return;

    // Debounce to avoid heavy processing while dragging slider
    const timer = setTimeout(async () => {
      setIsEstimating(true);
      try {
        // Always use the first file as a sample to calculate ratio
        const sampleFile = files[0];
        const res = await compressImage(sampleFile, quality);
        
        const ratio = res.blob.size / sampleFile.size;
        setEstimatedRatio(ratio);

        if (files.length === 1) {
          // For single file, update the visual preview directly
          setSinglePreview(res);
        } else {
          // For batch, we don't need the image URL for the sample, just the ratio
          // Revoke immediately to save memory
          URL.revokeObjectURL(res.url);
        }
      } catch (error) {
        console.error("Estimation failed", error);
      } finally {
        setIsEstimating(false);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [quality, files]);

  // --- Batch Processing Logic ---
  const processBatch = async () => {
    if (files.length <= 0) return;

    setIsBatchProcessing(true);
    const newResults = [...results];

    // Process all files that aren't done yet (or re-process all if quality changed? 
    // Standard behavior: re-process all to match current quality setting)
    for (let i = 0; i < newResults.length; i++) {
      newResults[i] = { ...newResults[i], status: 'processing' };
      setResults([...newResults]);

      try {
        const res = await compressImage(newResults[i].originalFile, quality);
        newResults[i] = {
          ...newResults[i],
          compressedBlob: res.blob,
          compressedUrl: res.url,
          status: 'done'
        };
      } catch (e) {
        console.error(e);
        newResults[i] = { ...newResults[i], status: 'error' };
      }
      
      setResults([...newResults]);
    }

    setIsBatchProcessing(false);
  };

  const downloadBatchZip = async () => {
    const doneFiles = results.filter(r => r.status === 'done' && r.compressedBlob);
    if (doneFiles.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("compressed_images");
      
      if (folder) {
        doneFiles.forEach(item => {
          const name = `min_${item.originalFile.name.substring(0, item.originalFile.name.lastIndexOf('.'))}.jpg`;
          folder.file(name, item.compressedBlob as Blob);
        });

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = "compressed_images.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Zip error", e);
      alert("打包下载失败");
    } finally {
      setIsZipping(false);
    }
  };

  // Stats Calculation
  const totalOriginalSize = files.reduce((acc, curr) => acc + curr.size, 0);
  
  // Calculate estimated total based on the sample ratio
  const estimatedTotalCompressedSize = estimatedRatio 
    ? totalOriginalSize * estimatedRatio 
    : 0;
  
  const estimatedSavings = estimatedRatio 
    ? Math.round((1 - estimatedRatio) * 100) 
    : 0;

  // Actual Stats (for completed items)
  const doneItems = results.filter(r => r.status === 'done');
  const actualTotalCompressed = doneItems.reduce((acc, curr) => acc + (curr.compressedBlob?.size || 0), 0);
  const actualTotalOriginal = doneItems.reduce((acc, curr) => acc + curr.originalFile.size, 0);
  const actualSavings = actualTotalCompressed > 0 
    ? Math.round((1 - actualTotalCompressed / actualTotalOriginal) * 100) 
    : 0;

  // Pagination Logic
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(results.length / pageSize);
  const currentItems = useMemo(() => {
    if (pageSize === 'all') return results;
    const start = (currentPage - 1) * pageSize;
    return results.slice(start, start + pageSize);
  }, [results, currentPage, pageSize]);

  // Safe check for pagination
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5 flex justify-between items-center flex-wrap gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">图片压缩</h2>
           <p className="text-slate-500 mt-1">在保持视觉质量的同时减小图片文件大小。</p>
        </div>
        {files.length > 0 && (
             <Button variant="ghost" onClick={handleReset} className="text-red-600 hover:bg-red-50">
                 <Trash2 className="w-4 h-4 mr-2" /> 清空重新开始
             </Button>
        )}
      </div>

      {files.length === 0 ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          multiple={true}
          label="上传单张或多张图片"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* --- Control Panel --- */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <Sliders className="w-5 h-5 mr-2 text-blue-600" />
                  压缩设置
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">全局质量</label>
                      <span className="text-sm text-blue-600 font-mono">{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between mt-1 text-xs text-slate-400">
                      <span>最大压缩</span>
                      <span>最佳质量</span>
                    </div>
                  </div>

                  {/* --- Estimation Display --- */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center mb-2">
                        <Info className="w-3 h-3 text-slate-400 mr-1" />
                        <span className="text-xs font-medium text-slate-500">
                            {isEstimating ? '估算中...' : '预计压缩结果'}
                        </span>
                    </div>
                    
                    {isEstimating ? (
                        <div className="h-8 flex items-center justify-center">
                            <div className="animate-pulse bg-slate-200 w-20 h-4 rounded"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="flex justify-between items-end">
                                <span className="text-sm text-slate-600">原始:</span>
                                <span className="text-sm font-mono">{formatBytes(totalOriginalSize)}</span>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <span className="text-sm text-slate-600">压缩后:</span>
                                <span className="text-lg font-bold text-blue-700 font-mono">
                                    ~{formatBytes(estimatedTotalCompressedSize)}
                                </span>
                            </div>
                            <div className="flex justify-end mt-1">
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                    预计节省 {estimatedSavings}%
                                </span>
                            </div>
                        </div>
                    )}
                  </div>
                  
                  {files.length > 1 && (
                      <div className="pt-2">
                          <Button 
                            className="w-full" 
                            onClick={processBatch}
                            disabled={isBatchProcessing}
                            isLoading={isBatchProcessing}
                          >
                              {isBatchProcessing ? '正在压缩...' : `开始压缩全部 (${files.length})`}
                          </Button>
                      </div>
                  )}
                </div>
             </div>
             
             {/* Completed Stats Box (Batch Only) */}
             {files.length > 1 && doneItems.length > 0 && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <h4 className="text-green-800 font-semibold text-sm mb-2">实际结果</h4>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-700">已处理:</span>
                        <span className="font-mono">{doneItems.length}/{files.length}</span>
                    </div>
                     <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-700">总节省:</span>
                        <span className="font-mono font-bold text-green-800">-{actualSavings}%</span>
                    </div>
                    {doneItems.length === files.length && (
                         <Button 
                            size="sm" 
                            onClick={downloadBatchZip} 
                            isLoading={isZipping}
                            className="w-full mt-3 bg-green-600 hover:bg-green-700 border-transparent text-white"
                        >
                            <Archive className="w-4 h-4 mr-2" />
                            打包下载 (ZIP)
                         </Button>
                    )}
                </div>
             )}
          </div>

          {/* --- Content Area --- */}
          <div className="md:col-span-8 lg:col-span-9">
            
            {/* Single File View */}
            {files.length === 1 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-900 truncate">{files[0].name}</h3>
                        <span className="text-xs px-2 py-1 bg-slate-200 rounded text-slate-600">预览模式</span>
                    </div>
                    <div className="p-6 flex flex-col items-center text-center">
                    {isEstimating && !singlePreview ? (
                        <div className="py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4 mx-auto"></div>
                            <p className="text-slate-500">生成预览中...</p>
                        </div>
                    ) : singlePreview ? (
                        <>
                        <div className="relative mb-6 w-full max-h-[400px] flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200 p-2">
                            <img src={singlePreview.url} alt="Compressed" className="max-w-full max-h-[380px] object-contain" />
                        </div>
                        
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                <p className="text-xs text-red-500 uppercase font-semibold mb-1">原始大小</p>
                                <p className="text-xl font-bold text-slate-800">{formatBytes(files[0].size)}</p>
                            </div>
                           
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-green-600 uppercase font-semibold mb-1">压缩后</p>
                                    <p className="text-xl font-bold text-slate-800">{formatBytes(singlePreview.blob.size)}</p>
                                </div>
                                <div className="bg-white px-3 py-1 rounded-md text-sm font-bold text-green-600 shadow-sm">
                                    -{Math.round((1 - singlePreview.blob.size / files[0].size) * 100)}%
                                </div>
                            </div>
                        </div>

                        <a 
                            href={singlePreview.url} 
                            download={`compressed_${files[0].name}`} 
                            className="w-full max-w-md"
                        >
                            <Button className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                下载此图片
                            </Button>
                        </a>
                        </>
                    ) : null}
                    </div>
                </div>
            )}

            {/* Multi File List */}
            {files.length > 1 && (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-3">
                        <div className="flex flex-col">
                           <h3 className="font-semibold text-slate-900">文件列表 ({files.length})</h3>
                           <div className="text-sm text-slate-500">
                             {isEstimating ? '正在计算预计大小...' : '请点击开始压缩以应用更改'}
                           </div>
                        </div>
                        
                        {/* Pagination & Size Selector Header */}
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
                    </div>
                    
                    <div className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar flex-grow" style={{ maxHeight: '600px' }}>
                        {currentItems.map((item, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400 flex-shrink-0">
                                        <span className="text-xs font-bold">IMG</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate max-w-[150px] sm:max-w-xs">
                                            {item.originalFile.name}
                                        </p>
                                        <p className="text-xs text-slate-500">{formatBytes(item.originalFile.size)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    {/* Status / Result */}
                                    <div className="text-right min-w-[100px]">
                                        {item.status === 'pending' && (
                                             <div className="flex flex-col items-end text-xs text-slate-400">
                                                <span>等待处理</span>
                                                {estimatedRatio && (
                                                    <span className="text-[10px] text-slate-400/70">
                                                        预估: ~{formatBytes(item.originalFile.size * estimatedRatio)}
                                                    </span>
                                                )}
                                             </div>
                                        )}
                                        {item.status === 'processing' && <span className="text-xs text-blue-600 animate-pulse">处理中...</span>}
                                        {item.status === 'error' && <span className="text-xs text-red-500">失败</span>}
                                        {item.status === 'done' && item.compressedBlob && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-green-600">{formatBytes(item.compressedBlob.size)}</span>
                                                <span className="text-[10px] text-green-500">
                                                    -{Math.round((1 - item.compressedBlob.size / item.originalFile.size) * 100)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action */}
                                    {item.status === 'done' && item.compressedUrl ? (
                                        <a 
                                            href={item.compressedUrl} 
                                            download={`min_${item.originalFile.name}`}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="下载"
                                        >
                                            <Download className="w-5 h-5" />
                                        </a>
                                    ) : (
                                        <div className="w-9"></div> 
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {files.length > 0 && pageSize !== 'all' && totalPages > 1 && (
                        <div className="border-t border-slate-100 p-3 bg-slate-50 flex justify-between items-center">
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
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;