import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Film, FolderOpen, UploadCloud, Play, Pause, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

interface ImageFrame {
  file: File;
  previewUrl: string;
  id: string;
}

/** 自然排序：frame_1 < frame_2 < frame_10 */
function naturalSort(a: File, b: File): number {
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();
  const partsA = nameA.split(/(\d+)/);
  const partsB = nameB.split(/(\d+)/);
  const len = Math.min(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const pa = partsA[i];
    const pb = partsB[i];
    const numA = parseInt(pa, 10);
    const numB = parseInt(pb, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA !== numB) return numA - numB;
    } else {
      const cmp = pa.localeCompare(pb);
      if (cmp !== 0) return cmp;
    }
  }
  return partsA.length - partsB.length;
}

const ImageSequencePlayer: React.FC = () => {
  const [frames, setFrames] = useState<ImageFrame[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(10);
  const [loop, setLoop] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<ImageFrame[]>([]);
  framesRef.current = frames;

  const addFiles = useCallback((files: FileList | null, append = false) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) return;
    arr.sort(naturalSort);
    const newFrameItems: ImageFrame[] = arr.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }));
    setFrames((prev) => {
      if (append && prev.length > 0) {
        const existingFiles = prev.map((f) => f.file);
        const combined = [...existingFiles, ...arr].sort(naturalSort);
        prev.forEach((f) => URL.revokeObjectURL(f.previewUrl));
        return combined.map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9),
        }));
      }
      prev.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return newFrameItems;
    });
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);

  const handleFileSelect = (files: FileList | null) => addFiles(files);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) addFiles(files);
    e.target.value = '';
  };

  const reset = () => {
    frames.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setFrames([]);
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      framesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying || frames.length === 0) return;
    const interval = 1000 / fps;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((i) => {
        const next = i + 1;
        if (next >= frames.length) {
          if (loop) return 0;
          setIsPlaying(false);
          return i;
        }
        return next;
      });
    }, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, fps, frames.length, loop]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (frames.length === 0) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentIndex((i) => Math.max(0, i - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentIndex((i) => Math.min(frames.length - 1, i + 1));
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [frames.length]);

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(frames.length - 1, i + 1));

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    setCurrentIndex(Math.min(frames.length - 1, Math.max(0, v)));
  };

  const currentFrame = frames[currentIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-500" ref={containerRef}>
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          序列图播放
          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Film className="w-3 h-3 mr-1 fill-blue-800" />
            帧预览
          </span>
        </h2>
        <p className="text-slate-500 mt-1">预览图片序列是否连贯，支持多选或选择文件夹。</p>
      </div>

      {frames.length === 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileInput
              onFileSelect={handleFileSelect}
              accept="image/*"
              multiple
              label="选择多张图片"
            />
            <div
              onClick={() => document.getElementById('folder-input')?.click()}
              className="relative cursor-pointer flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all"
            >
              <input
                id="folder-input"
                type="file"
                className="hidden"
                webkitdirectory
                directory
                multiple
                accept="image/*"
                onChange={handleFolderSelect}
                aria-label="选择文件夹"
              />
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                <div className="p-4 rounded-full mb-4 bg-slate-200 text-slate-500">
                  <FolderOpen className="w-8 h-8" />
                </div>
                <p className="mb-2 text-lg font-medium text-slate-700">选择文件夹</p>
                <p className="text-sm text-slate-500">加载文件夹内全部图片，按文件名排序</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Film className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    已加载 {frames.length} 张图片
                    {frames[0] && (
                      <span className="text-slate-500 font-normal ml-2 text-sm">
                        ({frames[0].file.name} ~ {frames[frames.length - 1].file.name})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">空格: 播放/暂停 | 左右键: 上一帧/下一帧</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium flex items-center transition-colors">
                  <UploadCloud className="w-3.5 h-3.5 mr-1" /> 加图
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files, true);
                      e.target.value = '';
                    }}
                  />
                </label>
                <label className="cursor-pointer text-sm px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium flex items-center transition-colors">
                  <FolderOpen className="w-3.5 h-3.5 mr-1" /> 换文件夹
                  <input
                    type="file"
                    className="hidden"
                    webkitdirectory
                    directory
                    multiple
                    accept="image/*"
                    onChange={handleFolderSelect}
                  />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-black/5 rounded-lg overflow-hidden aspect-video flex items-center justify-center min-h-[300px] mb-6">
                {currentFrame && (
                  <img
                    src={currentFrame.previewUrl}
                    alt={`帧 ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goPrev}
                      disabled={currentIndex === 0}
                      className="h-9"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="h-9 min-w-[80px]"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          暂停
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          播放
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goNext}
                      disabled={currentIndex === frames.length - 1}
                      className="h-9"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">帧率</span>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={fps}
                      onChange={(e) => setFps(parseInt(e.target.value, 10))}
                      className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      aria-label="帧率"
                      title="帧率"
                    />
                    <span className="text-sm font-mono text-slate-700 w-8">{fps} FPS</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={loop}
                      onChange={(e) => setLoop(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    循环播放
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, frames.length - 1)}
                    value={currentIndex}
                    onChange={handleProgressChange}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label="进度"
                    title="进度"
                  />
                  <span className="text-sm font-mono text-slate-600 whitespace-nowrap">
                    第 {currentIndex + 1} / {frames.length} 帧
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSequencePlayer;
