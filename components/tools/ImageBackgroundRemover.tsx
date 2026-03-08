import React, { useState, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Download,
  Image as ImageIcon,
  Trash2,
  Archive,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { removeBackground as rembgWebgpuRemove } from 'rembg-webgpu';
import { remove as rembgWebRemove, rembgConfig, newSession } from '@bunnio/rembg-web';

export type EngineType = 'isnet' | 'rmbg' | 'u2net';

const ENGINE_OPTIONS: { value: EngineType; label: string; desc: string }[] = [
  { value: 'isnet', label: 'ISNet (imgly)', desc: '成熟稳定，6k+ stars' },
  { value: 'rmbg', label: 'RMBG-1.4 (rembg)', desc: 'BRIA 模型，电商/游戏场景' },
  { value: 'u2net', label: 'U2Net (rembg-web)', desc: '经典 U2Net，通用场景' },
];

let rembgWebConfigured = false;
function ensureRembgWebConfig() {
  if (!rembgWebConfigured) {
    rembgConfig.setBaseUrl('https://huggingface.co/tomjackson2023/rembg/resolve/main');
    rembgWebConfigured = true;
  }
}

/** 根据所选引擎执行抠图 */
async function runEngine(engine: EngineType, file: File): Promise<Blob> {
  if (engine === 'isnet') {
    return imglyRemoveBackground(file);
  }
  if (engine === 'rmbg') {
    const url = URL.createObjectURL(file);
    try {
      const result = await rembgWebgpuRemove(url);
      const res = await fetch(result.blobUrl);
      const blob = await res.blob();
      URL.revokeObjectURL(result.blobUrl);
      return blob;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  if (engine === 'u2net') {
    ensureRembgWebConfig();
    const session = await newSession('u2net');
    return rembgWebRemove(file, { session });
  }
  throw new Error(`Unknown engine: ${engine}`);
}

/** 为白色/浅色背景图片添加深色边距，帮助模型更好区分主体 */
async function addDarkPadding(file: File): Promise<{ blob: Blob; w: number; h: number; pad: number }> {
  const img = await createImageBitmap(file);
  const w = img.width;
  const h = img.height;
  const pad = Math.max(16, Math.min(w, h) * 0.08);
  const cw = w + pad * 2;
  const ch = h + pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#404040';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, pad, pad, w, h);
  img.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png',
      1
    );
  });
  return { blob, w, h, pad };
}

/** 修复误抠：用原图填补被错误移除的亮色区域（如发光、高光） */
async function restoreHoles(originalBlob: Blob, resultBlob: Blob, w: number, h: number): Promise<Blob> {
  const [origImg, resultImg] = await Promise.all([
    createImageBitmap(originalBlob),
    createImageBitmap(resultBlob),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(resultImg, 0, 0);
  const resultData = ctx.getImageData(0, 0, w, h);
  ctx.drawImage(origImg, 0, 0);
  const origData = ctx.getImageData(0, 0, w, h);
  origImg.close();
  resultImg.close();

  const rd = resultData.data;
  const od = origData.data;
  const alphaThresh = 64; // 低于此 alpha 视为被误抠
  const whiteThresh = 250; // 原图高于此为纯白背景，不恢复

  for (let i = 0; i < rd.length; i += 4) {
    const ra = rd[i + 3];
    if (ra < alphaThresh) {
      const or = od[i];
      const og = od[i + 1];
      const ob = od[i + 2];
      if (or < whiteThresh || og < whiteThresh || ob < whiteThresh) {
        rd[i] = or;
        rd[i + 1] = og;
        rd[i + 2] = ob;
        rd[i + 3] = 255;
      }
    }
  }

  ctx.putImageData(resultData, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png',
      1
    );
  });
}

/** 从带边距的结果中裁剪回原始尺寸 */
async function cropToCenter(
  blob: Blob,
  origW: number,
  origH: number,
  pad: number
): Promise<Blob> {
  const img = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = origW;
  canvas.height = origH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, pad, pad, origW, origH, 0, 0, origW, origH);
  img.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png',
      1
    );
  });
}

interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  resultBlob: Blob | null;
  resultUrl: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
}

type PageSize = 10 | 50 | 100 | 'all';

const ImageBackgroundRemover: React.FC = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewBg, setPreviewBg] = useState<'checker' | 'white' | 'black'>('checker');
  const [engine, setEngine] = useState<EngineType>('isnet');
  const [whiteBgMode, setWhiteBgMode] = useState(false);
  const [restoreHolesMode, setRestoreHolesMode] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith('image/')) validFiles.push(f);
    }

    if (validFiles.length === 0) {
      alert('请选择图片文件（JPG、PNG 等）。');
      return;
    }

    const newItems: ProcessedImage[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      resultBlob: null,
      resultUrl: null,
      status: 'pending',
    }));

    setImages((prev) => [...prev, ...newItems]);
    setCurrentPage(1);
  };

  // 切换引擎或选项时，将已完成的项重置为待处理，以便重新抠图
  useEffect(() => {
    setImages((prev) =>
      prev.map((img) => {
        if (img.status === 'done' || img.status === 'error') {
          if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
          return { ...img, resultBlob: null, resultUrl: null, status: 'pending' as const };
        }
        return img;
      })
    );
  }, [engine, whiteBgMode, restoreHolesMode]);

  const processAll = async () => {
    const pending = images.filter((i) => i.status === 'pending');
    if (pending.length === 0) return;

    setIsProcessing(true);
    for (const item of pending) {
      setImages((prev) =>
        prev.map((img) => (img.id === item.id ? { ...img, status: 'processing' } : img))
      );

      try {
        let blob: Blob;
        if (whiteBgMode) {
          const { blob: paddedBlob, w, h, pad } = await addDarkPadding(item.originalFile);
          const paddedFile = new File([paddedBlob], 'padded.png', { type: 'image/png' });
          let resultBlob = await runEngine(engine, paddedFile);
          blob = await cropToCenter(resultBlob, w, h, pad);
          if (restoreHolesMode) {
            blob = await restoreHoles(item.originalFile, blob, w, h);
          }
        } else {
          blob = await runEngine(engine, item.originalFile);
          if (restoreHolesMode) {
            const img = await createImageBitmap(item.originalFile);
            const w = img.width;
            const h = img.height;
            img.close();
            blob = await restoreHoles(item.originalFile, blob, w, h);
          }
        }
        const url = URL.createObjectURL(blob);
        setImages((prev) =>
          prev.map((img) =>
            img.id === item.id
              ? { ...img, resultBlob: blob, resultUrl: url, status: 'done' }
              : img
          )
        );
      } catch (e) {
        console.error('Background removal failed:', e);
        setImages((prev) =>
          prev.map((img) => (img.id === item.id ? { ...img, status: 'error' } : img))
        );
      }
    }
    setIsProcessing(false);
  };

  const clearAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
    });
    setImages([]);
    setCurrentPage(1);
  };

  const downloadAll = async () => {
    const doneImages = images.filter((i) => i.status === 'done' && i.resultBlob);
    if (doneImages.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('no_bg_images');
      if (folder) {
        doneImages.forEach((img) => {
          const baseName = img.originalFile.name.replace(/\.[^.]+$/, '');
          folder.file(`${baseName}_nobg.png`, img.resultBlob!);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'no_bg_images.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert('打包下载失败');
    } finally {
      setIsZipping(false);
    }
  };

  const totalPages = pageSize === 'all' ? 1 : Math.ceil(images.length / pageSize);
  const currentItems = useMemo(() => {
    if (pageSize === 'all') return images;
    const start = (currentPage - 1) * pageSize;
    return images.slice(start, start + pageSize);
  }, [images, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const doneCount = images.filter((i) => i.status === 'done').length;
  const pendingCount = images.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-violet-500" />
            图片抠背景
          </h2>
          <p className="text-slate-500 mt-1">
            使用 AI 在浏览器内移除图片背景，完全本地处理，无需上传，保护隐私。
          </p>
        </div>
        {images.length > 0 && (
          <Button variant="ghost" onClick={clearAll} className="text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" /> 清空
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-4">上传图片</h3>
            <FileInput
              onFileSelect={handleFileSelect}
              accept="image/*"
              multiple={true}
              label="拖拽或选择图片"
            />
<div className="mt-4 p-3 bg-violet-50 rounded-lg text-sm text-violet-700 border border-violet-100">
              <p>
                <strong>说明：</strong> 处理在本地完成，图片不会上传到任何服务器。首次加载需下载模型（约 10–50MB）。
              </p>
            </div>

            {images.length > 0 && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <h4 className="text-sm font-medium text-slate-700 mb-2">选择抠图引擎</h4>
                <div className="space-y-2">
                  {ENGINE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        engine === opt.value
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="engine"
                        value={opt.value}
                        checked={engine === opt.value}
                        onChange={() => setEngine(opt.value)}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium text-slate-800">{opt.label}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={whiteBgMode}
                  onChange={(e) => setWhiteBgMode(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-medium text-amber-800">白色/浅色背景优化</span>
                  <p className="text-xs text-amber-700 mt-0.5">
                    主体与背景颜色相近时（如白角色+白底）可开启，会添加深色边距辅助识别，减少误抠。
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-sky-200 bg-sky-50 cursor-pointer hover:bg-sky-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={restoreHolesMode}
                  onChange={(e) => setRestoreHolesMode(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <span className="font-medium text-sky-800">修复误抠（发光/高光）</span>
                  <p className="text-xs text-sky-700 mt-0.5">
                    法杖发光、高光等亮色区域被错误抠掉时开启，会用原图填补这些区域。
                  </p>
                </div>
              </label>
            </div>
            )}

            {images.length > 0 && (
              <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
                {pendingCount > 0 && (
                  <Button
                    className="w-full"
                    onClick={processAll}
                    disabled={isProcessing}
                    isLoading={isProcessing}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isProcessing ? '处理中...' : `开始抠图 (${pendingCount} 张)`}
                  </Button>
                )}
                {doneCount > 0 && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={downloadAll}
                    disabled={isZipping}
                    isLoading={isZipping}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    打包下载 (ZIP)
                  </Button>
                )}
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-2">预览背景</h4>
              <div className="flex gap-2">
                {(['checker', 'white', 'black'] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setPreviewBg(bg)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      previewBg === bg
                        ? 'bg-violet-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {bg === 'checker' ? '棋盘格' : bg === 'white' ? '白色' : '黑色'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center gap-3 bg-slate-50 rounded-t-xl">
              <h3 className="font-semibold text-slate-900">已上传 ({images.length})</h3>
              {images.length > 0 && (
                <select
                  aria-label="每页显示条数"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(
                      e.target.value === 'all' ? 'all' : (Number(e.target.value) as PageSize)
                    );
                    setCurrentPage(1);
                  }}
                  className="text-sm bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value={10}>10条/页</option>
                  <option value={50}>50条/页</option>
                  <option value={100}>100条/页</option>
                  <option value="all">全部</option>
                </select>
              )}
            </div>

            <div
              className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar"
              style={{ maxHeight: '800px' }}
            >
              {images.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p>暂无图片，请上传后点击「开始抠图」</p>
                </div>
              ) : (
                currentItems.map((img) => (
                  <div
                    key={img.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-violet-200 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                        {img.originalFile.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {img.status === 'pending' && '等待处理'}
                        {img.status === 'processing' && (
                          <span className="text-violet-600 animate-pulse">处理中...</span>
                        )}
                        {img.status === 'done' && (
                          <span className="text-green-600">已完成</span>
                        )}
                        {img.status === 'error' && (
                          <span className="text-red-500">失败</span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 mb-1">原图</p>
                        <div className="aspect-square max-h-32 rounded-lg overflow-hidden bg-slate-200">
                          <img
                            src={img.originalUrl}
                            alt="原图"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 mb-1">抠图结果</p>
                        <div
                          className={`aspect-square max-h-32 rounded-lg overflow-hidden flex items-center justify-center ${
                            previewBg === 'white' ? 'bg-white' : previewBg === 'black' ? 'bg-slate-800' : ''
                          }`}
                          style={
                            previewBg === 'checker'
                              ? {
                                  backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                                  backgroundSize: '12px 12px',
                                  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                                  backgroundColor: '#fff',
                                }
                              : undefined
                          }
                        >
                          {img.resultUrl ? (
                            <img
                              src={img.resultUrl}
                              alt="抠图"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                              {img.status === 'processing' ? '...' : '-'}
                            </div>
                          )}
                        </div>
                      </div>
                      {img.status === 'done' && img.resultUrl && (
                        <a
                          href={img.resultUrl}
                          download={img.originalFile.name.replace(/\.[^.]+$/, '_nobg.png')}
                          className="flex-shrink-0"
                          aria-label="下载抠图结果"
                        >
                          <Button size="sm" variant="secondary">
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {images.length > 0 && pageSize !== 'all' && totalPages > 1 && (
              <div className="border-t border-slate-100 p-3 bg-slate-50 flex justify-between items-center rounded-b-xl">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

export default ImageBackgroundRemover;
