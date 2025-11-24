import React, { useState, useEffect, useRef, useMemo } from 'react';
import JSZip from 'jszip';
import { Film, Download, Trash2, Package, LayoutGrid, Grid, ChevronLeft, ChevronRight, Clock, Settings2 } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { formatBytes } from '../../utils/imageUtils';

interface VideoFrame {
  id: string;
  timestamp: number;
  imageUrl: string;
  blob: Blob;
}

type ViewMode = 'tile' | 'grid';
type PageSize = 10 | 50 | 100 | 'all';

const VideoToImages: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fps, setFps] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [videoMeta, setVideoMeta] = useState<{ duration: number; width: number; height: number } | null>(null);
  
  const [isZipping, setIsZipping] = useState(false);

  // View and Pagination
  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Hidden video element ref
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Ref to track frames for cleanup on unmount
  const framesRef = useRef<VideoFrame[]>([]);

  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  // Cleanup frames on unmount
  useEffect(() => {
    return () => {
      framesRef.current.forEach(f => URL.revokeObjectURL(f.imageUrl));
    };
  }, []);

  // Fix: Memoize video URL to prevent reset on re-render
  const videoUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : null;
  }, [file]);

  // Cleanup video URL when file changes or component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (!files[0].type.startsWith('video/')) {
        alert("请选择有效的视频文件");
        return;
      }
      reset();
      setFile(files[0]);
    }
  };

  const reset = () => {
    frames.forEach(f => URL.revokeObjectURL(f.imageUrl));
    setFile(null);
    setFrames([]);
    setVideoMeta(null);
    setProgress(0);
    setIsProcessing(false);
    setCurrentPage(1);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoMeta({
        duration: videoRef.current.duration,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      });
    }
  };

  const startExtraction = async () => {
    if (!file || !videoRef.current || !videoMeta) return;

    // Cleanup previous run if any
    if (frames.length > 0) {
       frames.forEach(f => URL.revokeObjectURL(f.imageUrl));
    }

    setIsProcessing(true);
    setFrames([]);
    setProgress(0);

    const video = videoRef.current;
    const interval = 1 / fps;
    const duration = videoMeta.duration;
    const newFrames: VideoFrame[] = [];

    let frameIndex = 0;
    let currentTime = 0;
    let lastCapturedTime = -1; // Initialize to -1 to ensure 0.00s is captured

    // Helper to wait for seek with a timeout safety to prevent infinite hanging
    const seekTo = (time: number) => new Promise<void>((resolve) => {
      let timeoutId: any;
      
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        clearTimeout(timeoutId);
        resolve();
      };

      // Safety fallback: if seeked doesn't fire in 800ms, proceed anyway
      // This handles cases where browser gets stuck or time didn't technically change enough
      timeoutId = setTimeout(() => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }, 800);

      video.addEventListener('seeked', onSeeked);
      video.currentTime = time;
    });

    try {
      // Ensure video is ready enough to play/seek
      if (video.readyState < 2) {
        await new Promise<void>((resolve) => {
           const onCanPlay = () => {
             video.removeEventListener('loadeddata', onCanPlay);
             video.removeEventListener('canplay', onCanPlay);
             resolve();
           };
           video.addEventListener('loadeddata', onCanPlay);
           video.addEventListener('canplay', onCanPlay);
           // Force load check
           if (video.readyState >= 2) resolve();
        });
      }

      // Loop allows going slightly past duration.
      // This forces the browser to clamp to the video end, allowing us to capture the final frame.
      while (currentTime <= duration + interval) {
        // If user clicked cancel/reset during loop, stop
        if (!videoRef.current) break; 

        await seekTo(currentTime);
        
        // Double check if reset happened during await
        if (!videoRef.current) break;

        const actualTime = video.currentTime;

        // DUPLICATE DETECTION (Critical for finding the end):
        // If the video time hasn't changed significantly since the last capture,
        // it means we've hit the end of the video (browser clamped the time).
        if (Math.abs(actualTime - lastCapturedTime) < 0.001) {
            break;
        }
        
        lastCapturedTime = actualTime;

        // Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          
          // Convert to blob
          const blob = await new Promise<Blob | null>((resolve) => 
            canvas.toBlob(resolve, 'image/jpeg', 0.9)
          );

          if (blob) {
            const url = URL.createObjectURL(blob);
            newFrames.push({
              id: Math.random().toString(36).substr(2, 9),
              timestamp: actualTime,
              imageUrl: url,
              blob: blob
            });
          }
        }

        frameIndex++;
        // Use multiplication to avoid floating point accumulation drift
        currentTime = frameIndex * interval;
        
        // Update progress based on actual time
        setProgress(Math.min(Math.round((actualTime / duration) * 100), 99));
        
        // Small delay to allow UI update and prevent browser freeze
        await new Promise(r => setTimeout(r, 10));
      }
      
      // Only update state if we finished successfully and weren't reset
      if (videoRef.current) {
          setFrames(newFrames);
          setProgress(100);
      }
    } catch (e) {
      console.error("Extraction failed", e);
      alert("提取过程中发生错误，请尝试使用其他浏览器或视频格式。");
    } finally {
      if (videoRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const downloadAll = async () => {
    if (frames.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folderName = file?.name.replace(/\.[^/.]+$/, "") || "video-frames";
      const folder = zip.folder(folderName);

      if (folder) {
        frames.forEach((frame, index) => {
           // Format timestamp to 00_00_00 (HH_MM_SS) or just seconds
           const timeStr = frame.timestamp.toFixed(2).replace('.', '_');
           folder.file(`frame_${index + 1}_${timeStr}s.jpg`, frame.blob);
        });

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${folderName}_frames.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert("打包下载失败");
    } finally {
      setIsZipping(false);
    }
  };

  const formatTime = (seconds: number) => {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8);
  };

  // Pagination Logic
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(frames.length / pageSize);
  const currentItems = useMemo(() => {
    if (pageSize === 'all') return frames;
    const start = (currentPage - 1) * pageSize;
    return frames.slice(start, start + pageSize);
  }, [frames, currentPage, pageSize]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          视频 提取图片
          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Film className="w-3 h-3 mr-1 fill-blue-800" />
            帧提取器
          </span>
        </h2>
        <p className="text-slate-500 mt-1">按指定帧率将视频文件转换为高质量图片序列。</p>
      </div>

      {/* Hidden Video Element for Processing */}
      {file && videoUrl && (
        <video 
          ref={videoRef}
          src={videoUrl}
          className="hidden"
          onLoadedMetadata={handleLoadedMetadata}
          muted
          playsInline
          crossOrigin="anonymous"
        />
      )}

      {!file ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="video/*" 
          label="拖拽视频文件到此处" 
        />
      ) : (
        <div className="space-y-6">
           {/* Settings & Info Panel */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
                 <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                       <Film className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                       <p className="font-medium text-slate-900 truncate max-w-[200px]">{file.name}</p>
                       <div className="flex items-center text-xs text-slate-500 space-x-3 mt-1">
                          <span>{formatBytes(file.size)}</span>
                          {videoMeta && (
                            <>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span>{videoMeta.width}x{videoMeta.height}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span>{formatTime(videoMeta.duration)}</span>
                            </>
                          )}
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex gap-3">
                    {!isProcessing && frames.length > 0 && (
                       <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={downloadAll}
                          isLoading={isZipping}
                          className="bg-blue-600 hover:bg-blue-700 border-transparent text-white"
                       >
                          <Package className="w-4 h-4 mr-2" />
                          下载全部 (ZIP)
                       </Button>
                    )}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={reset}
                        className="text-red-600 hover:bg-red-50 border-red-200"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {frames.length > 0 ? '重新开始' : '取消'}
                    </Button>
                 </div>
              </div>

              {/* Configuration Area (Only visible if not processed yet) */}
              {frames.length === 0 && !isProcessing && (
                 <div className="p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                        <Settings2 className="w-4 h-4 mr-2 text-slate-500" />
                        提取设置
                    </h3>
                    
                    <div className="max-w-xl">
                       <label className="block text-sm font-medium text-slate-700 mb-2">
                          提取频率 (FPS) - 当前: {fps} 张/秒
                       </label>
                       <div className="flex items-center gap-4 mb-6">
                          <input 
                             type="range" 
                             min="0.1" 
                             max="10" 
                             step="0.1"
                             value={fps}
                             onChange={(e) => setFps(parseFloat(e.target.value))}
                             className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <input 
                             type="number"
                             min="0.1"
                             max="60"
                             step="0.1"
                             value={fps}
                             onChange={(e) => setFps(parseFloat(e.target.value))}
                             className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-center"
                          />
                       </div>

                       <div className="flex gap-2 mb-6">
                          {[0.5, 1, 2, 5].map(val => (
                             <button
                                key={val}
                                onClick={() => setFps(val)}
                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${fps === val ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                             >
                                {val} FPS
                             </button>
                          ))}
                       </div>

                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 mb-6">
                          <p>预计将生成约 <strong>{videoMeta ? Math.ceil(videoMeta.duration * fps) : '-'}</strong> 张图片。</p>
                       </div>

                       <Button onClick={startExtraction} disabled={!videoMeta} className="w-full sm:w-auto">
                          开始提取
                       </Button>
                    </div>
                 </div>
              )}

              {/* Progress Bar */}
              {isProcessing && (
                 <div className="p-12 text-center">
                    <div className="w-full max-w-md mx-auto">
                       <div className="flex justify-between text-sm text-slate-600 mb-2">
                          <span>正在提取帧...</span>
                          <span>{progress}%</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-4">
                          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                       </div>
                       <p className="text-xs text-slate-400">处理长视频可能需要一些时间，请勿关闭页面。</p>
                    </div>
                 </div>
              )}

              {/* Results Display */}
              {!isProcessing && frames.length > 0 && (
                  <div>
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
                              onChange={(e) => {
                                 setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value) as PageSize);
                                 setCurrentPage(1);
                              }}
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           >
                              <option value={10}>10</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                              <option value="all">全部</option>
                           </select>
                        </div>
                     </div>

                     <div className="p-6 bg-slate-50/50 min-h-[300px]">
                        <div className={`grid gap-6 ${
                           viewMode === 'tile' 
                              ? 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8' 
                              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        }`}>
                           {currentItems.map((frame) => (
                              <div key={frame.id} className="group relative bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                                 <div className={`relative ${viewMode === 'tile' ? 'aspect-video' : 'aspect-video'} bg-black`}>
                                    <img 
                                       src={frame.imageUrl} 
                                       alt={`Timestamp ${frame.timestamp}`} 
                                       className="w-full h-full object-contain" 
                                       loading="lazy"
                                    />
                                    {/* Overlay actions for Tile View */}
                                    {viewMode === 'tile' && (
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <a 
                                             href={frame.imageUrl} 
                                             download={`frame_${frame.timestamp.toFixed(2)}.jpg`}
                                             className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50 transform hover:scale-110 transition-transform shadow-lg"
                                             title="下载图片"
                                          >
                                             <Download className="w-5 h-5" />
                                          </a>
                                       </div>
                                    )}
                                 </div>
                                 
                                 {/* Footer Info */}
                                 <div className={`border-t border-slate-100 bg-white flex justify-between items-center ${viewMode === 'tile' ? 'p-2' : 'p-3'}`}>
                                    <div className="flex items-center text-slate-500">
                                       <Clock className="w-3 h-3 mr-1" />
                                       <span className={`font-mono font-medium ${viewMode === 'tile' ? 'text-xs' : 'text-sm'}`}>
                                          {frame.timestamp.toFixed(2)}s
                                       </span>
                                    </div>
                                    {/* Full download button for Grid View */}
                                    {viewMode === 'grid' && (
                                       <a 
                                          href={frame.imageUrl} 
                                          download={`frame_${frame.timestamp.toFixed(2)}.jpg`}
                                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                          title="下载"
                                       >
                                          <Download className="w-4 h-4" />
                                       </a>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>

                        {/* Pagination Controls */}
                        {frames.length > 0 && pageSize !== 'all' && totalPages > 1 && (
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
                     </div>
                  </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default VideoToImages;