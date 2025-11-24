import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { Download, FileText, AlertCircle, Trash2, Package, LayoutGrid, Grid, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { PdfPage } from '../../types';

// Set worker source to the module version (.mjs) to match the ESM environment.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type ViewMode = 'tile' | 'grid';
type PageSize = 10 | 50 | 100 | 'all';

const PdfToPng: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Store Object URLs to revoke them later (Memory Management)
  const objectUrlsRef = useRef<string[]>([]);

  // View and Pagination State
  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Cleanup function to revoke object URLs when component unmounts or resets
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Reset pagination when file or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [file, pageSize]);

  const handleReset = () => {
    // Revoke old URLs to free memory
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    
    setFile(null);
    setPages([]);
    setError(null);
    setCurrentPage(1);
    setProgress(0);
  };

  const processPdf = async (selectedFile: File) => {
    setIsProcessing(true);
    setError(null);
    setPages([]);
    setProgress(0);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      // Use an array to store results at correct indices
      const results = new Array(numPages);
      
      // Determine if OffscreenCanvas is available (Browser optimization)
      const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
      
      // Process pages in batches
      // Increased concurrency slightly as we are now using async blobs which block main thread less
      const CONCURRENCY = 6;
      
      for (let i = 1; i <= numPages; i += CONCURRENCY) {
        const batchPromises = [];
        
        for (let j = 0; j < CONCURRENCY && (i + j) <= numPages; j++) {
          const pageNum = i + j;
          batchPromises.push(
            (async () => {
              try {
                const page = await pdf.getPage(pageNum);
                // Scale: 2.0 offers better quality for text, 1.5 is a balance. 
                // 2.0 is usually preferred for "High Quality" output.
                const scale = 1.5; 
                const viewport = page.getViewport({ scale });

                let blob: Blob | null = null;

                // Strategy 1: OffscreenCanvas (Faster, better hardware usage, async encoding)
                if (hasOffscreenCanvas) {
                  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
                  const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D; // Type assertion
                  
                  if (context) {
                    await page.render({
                      canvasContext: context as any,
                      viewport: viewport,
                    } as any).promise;
                    
                    // convertToBlob is async and offloads encoding work
                    blob = await canvas.convertToBlob({ type: 'image/png' });
                  }
                } 
                // Strategy 2: Fallback DOM Canvas (Standard)
                else {
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;

                  if (context) {
                    await page.render({
                      canvasContext: context,
                      viewport: viewport,
                    } as any).promise;

                    // Wrap toBlob in promise to allow await
                    blob = await new Promise<Blob | null>((resolve) => 
                      canvas.toBlob(resolve, 'image/png')
                    );
                  }
                }

                if (blob) {
                  // Huge Performance Win: Use ObjectURL instead of Base64
                  const objectUrl = URL.createObjectURL(blob);
                  objectUrlsRef.current.push(objectUrl);

                  results[pageNum - 1] = {
                    pageNumber: pageNum,
                    imageUrl: objectUrl,
                    width: viewport.width,
                    height: viewport.height
                  };
                }
              } catch (e) {
                console.error(`Error rendering page ${pageNum}`, e);
              }
            })()
          );
        }
        
        await Promise.all(batchPromises);
        
        // Update progress
        const processedCount = Math.min(i + CONCURRENCY - 1, numPages);
        setProgress(Math.round((processedCount / numPages) * 100));
      }

      setPages(results.filter(Boolean));
    } catch (err) {
      console.error(err);
      setError("无法处理 PDF。请尝试有效的 PDF 文件。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (files[0].type !== 'application/pdf') {
        setError("请选择有效的 PDF 文件。");
        return;
      }
      // Clean up previous run if exists
      if (pages.length > 0) handleReset();
      
      setFile(files[0]);
      processPdf(files[0]);
    }
  };

  const handleDownloadAll = async () => {
    if (!file || pages.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const fileNameBase = file.name.replace(/\.pdf$/i, '');
      const folder = zip.folder(fileNameBase);

      if (folder) {
        // For Object URLs, we need to fetch the blob data back to zip it
        // This is efficient because the blob is already in memory
        const promises = pages.map(async (page) => {
          const response = await fetch(page.imageUrl);
          const blob = await response.blob();
          folder.file(`${fileNameBase}-page-${page.pageNumber}.png`, blob);
        });

        await Promise.all(promises);

        const content = await zip.generateAsync({ type: "blob" });
        
        const url = URL.createObjectURL(content);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileNameBase}-images.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Zip creation failed", err);
      setError("创建压缩包失败，请重试。");
    } finally {
      setIsZipping(false);
    }
  };

  // Pagination Logic
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(pages.length / pageSize);
  const currentItems = useMemo(() => {
    if (pageSize === 'all') return pages;
    const start = (currentPage - 1) * pageSize;
    return pages.slice(start, start + pageSize);
  }, [pages, currentPage, pageSize]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          PDF 转 PNG 转换器
          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Zap className="w-3 h-3 mr-1 fill-blue-800" />
            高速引擎
          </span>
        </h2>
        <p className="text-slate-500 mt-1">将 PDF 文档的页面提取为高质量 PNG 图片。</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">错误</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!file ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept=".pdf" 
          label="拖拽 PDF 到此处或点击上传" 
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Toolbar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900 truncate max-w-[200px] md:max-w-xs" title={file.name}>{file.name}</p>
                <p className="text-sm text-slate-500">
                  {isProcessing ? `正在提取... ${progress}%` : `${pages.length} 页已提取`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleDownloadAll}
                disabled={isProcessing || pages.length === 0}
                isLoading={isZipping}
                className="bg-blue-600 hover:bg-blue-700 text-white border-transparent"
              >
                {isZipping ? '打包中...' : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    一键下载
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset} 
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                重新开始
              </Button>
            </div>
          </div>

          {/* Progress Bar for Processing */}
          {isProcessing && (
            <div className="w-full bg-slate-100 h-1">
              <div 
                className="bg-blue-600 h-1 transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {/* Display Controls */}
          {!isProcessing && pages.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-100 bg-white flex flex-wrap justify-between items-center gap-3">
              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                 <button 
                    onClick={() => setViewMode('tile')}
                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'tile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    平铺
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Grid className="w-4 h-4 mr-2" />
                    网格
                  </button>
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <span>每页显示:</span>
                <select 
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value) as PageSize)}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">全部</option>
                </select>
              </div>
            </div>
          )}

          <div className="p-6 bg-slate-50/50 min-h-[300px]">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-12 h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-600 font-medium mb-1">正在加速转换...</p>
                <p className="text-slate-400 text-sm">正在利用并行处理与硬件加速技术</p>
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${
                  viewMode === 'tile' 
                    ? 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8' 
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {currentItems.map((page) => (
                    <div key={page.pageNumber} className="group relative bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className={`relative ${viewMode === 'tile' ? 'aspect-[1/1.4]' : 'aspect-[3/4]'} bg-slate-100`}>
                        <img 
                          src={page.imageUrl} 
                          alt={`Page ${page.pageNumber}`} 
                          className="w-full h-full object-contain p-2" 
                          loading="lazy"
                        />
                        {/* Overlay actions for Tile View */}
                        {viewMode === 'tile' && (
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a 
                                href={page.imageUrl} 
                                download={`${file.name.replace('.pdf', '')}-page-${page.pageNumber}.png`}
                                className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50 transform hover:scale-110 transition-transform shadow-lg"
                                title="下载 PNG"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                           </div>
                        )}
                      </div>
                      
                      {/* Footer Info */}
                      <div className={`border-t border-slate-100 bg-white flex justify-between items-center ${viewMode === 'tile' ? 'p-2' : 'p-3'}`}>
                        <span className={`font-medium text-slate-700 ${viewMode === 'tile' ? 'text-xs' : 'text-sm'}`}>
                          {page.pageNumber}
                        </span>
                        {/* Full download button for Grid View */}
                        {viewMode === 'grid' && (
                          <a 
                            href={page.imageUrl} 
                            download={`${file.name.replace('.pdf', '')}-page-${page.pageNumber}.png`}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="下载 PNG"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {pages.length > 0 && pageSize !== 'all' && totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="bg-white"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
                    </Button>
                    
                    <span className="text-sm text-slate-600 font-medium">
                      第 {currentPage} 页 / 共 {totalPages} 页
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-white"
                    >
                      下一页 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToPng;