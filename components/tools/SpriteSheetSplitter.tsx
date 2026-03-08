import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Grid, Download, Trash2, Scissors, Package } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

interface ImageSlice {
  id: string;
  url: string;
  blob: Blob;
  row: number;
  col: number;
}

type SplitMode = 'size' | 'grid';

const SpriteSheetSplitter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>('grid');
  const [frameWidth, setFrameWidth] = useState(64);
  const [frameHeight, setFrameHeight] = useState(64);
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [slices, setSlices] = useState<ImageSlice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (!files[0].type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      if (imgSrc) URL.revokeObjectURL(imgSrc);
      slices.forEach((s) => URL.revokeObjectURL(s.url));
      const url = URL.createObjectURL(files[0]);
      setImgSrc(url);
      setFile(files[0]);
      setSlices([]);
    }
  };

  const handleSplit = async () => {
    if (!imgRef.current || !file) return;

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const image = imgRef.current;
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;

      let pieceWidth: number;
      let pieceHeight: number;

      if (splitMode === 'size') {
        pieceWidth = Math.max(1, Math.min(naturalWidth, frameWidth));
        pieceHeight = Math.max(1, Math.min(naturalHeight, frameHeight));
      } else {
        pieceWidth = naturalWidth / cols;
        pieceHeight = naturalHeight / rows;
      }

      const actualCols = Math.floor(naturalWidth / pieceWidth);
      const actualRows = Math.floor(naturalHeight / pieceHeight);

      const newSlices: ImageSlice[] = [];

      for (let r = 0; r < actualRows; r++) {
        for (let c = 0; c < actualCols; c++) {
          const canvas = document.createElement('canvas');
          canvas.width = pieceWidth;
          canvas.height = pieceHeight;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(
              image,
              c * pieceWidth,
              r * pieceHeight,
              pieceWidth,
              pieceHeight,
              0,
              0,
              pieceWidth,
              pieceHeight
            );

            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, file.type)
            );

            if (blob) {
              newSlices.push({
                id: `slice-${r}-${c}`,
                blob,
                url: URL.createObjectURL(blob),
                row: r,
                col: c,
              });
            }
          }
        }
      }
      setSlices(newSlices);
    } catch (e) {
      console.error(e);
      alert('切割失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    slices.forEach((s) => URL.revokeObjectURL(s.url));
    setFile(null);
    setImgSrc(null);
    setSlices([]);
  };

  const downloadAll = async () => {
    if (slices.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folderName = file?.name.replace(/\.[^/.]+$/, '') + '_sprites';
      const folder = zip.folder(folderName);
      const ext = file?.type.split('/')[1] || 'png';

      if (folder) {
        slices.forEach((slice, index) => {
          const fileName = `frame_${String(slice.row).padStart(2, '0')}_${String(slice.col).padStart(2, '0')}.${ext}`;
          folder.file(fileName, slice.blob);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${folderName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert('打包失败');
    } finally {
      setIsZipping(false);
    }
  };

  useEffect(() => {
    return () => {
      slices.forEach((s) => URL.revokeObjectURL(s.url));
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Grid className="w-7 h-7 mr-2 text-blue-600" />
          精灵表切割器
        </h2>
        <p className="text-slate-500 mt-1">
          上传 Sprite Sheet 大图，按每帧宽高或行列数切割成单张图片，支持打包 ZIP 下载。
        </p>
      </div>

      {!imgSrc ? (
        <FileInput onFileSelect={handleFileSelect} accept="image/*" label="上传精灵表图片" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <Grid className="w-5 h-5 mr-2 text-blue-600" />
              切割设置
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">切割模式</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSplitMode('grid')}
                    className={`py-2 px-3 text-sm rounded-md border transition-all ${
                      splitMode === 'grid'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    行列数
                  </button>
                  <button
                    onClick={() => setSplitMode('size')}
                    className={`py-2 px-3 text-sm rounded-md border transition-all ${
                      splitMode === 'size'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    每帧尺寸
                  </button>
                </div>
              </div>

              {splitMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">行数</label>
                    <input
                      type="number"
                      min="1"
                      max="64"
                      value={rows}
                      onChange={(e) =>
                        setRows(Math.max(1, Math.min(64, parseInt(e.target.value) || 1)))
                      }
                      aria-label="行数"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">列数</label>
                    <input
                      type="number"
                      min="1"
                      max="64"
                      value={cols}
                      onChange={(e) =>
                        setCols(Math.max(1, Math.min(64, parseInt(e.target.value) || 1)))
                      }
                      aria-label="列数"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">帧宽 (px)</label>
                    <input
                      type="number"
                      min="1"
                      value={frameWidth}
                      onChange={(e) =>
                        setFrameWidth(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      aria-label="帧宽 (像素)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">帧高 (px)</label>
                    <input
                      type="number"
                      min="1"
                      value={frameHeight}
                      onChange={(e) =>
                        setFrameHeight(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      aria-label="帧高 (像素)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Button onClick={handleSplit} isLoading={isProcessing} className="w-full">
                  <Scissors className="w-4 h-4 mr-2" />
                  切割精灵表
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="w-full text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清除图片
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div>
              <h4 className="font-medium text-slate-900 mb-3">预览</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-center overflow-hidden">
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Sprite Sheet"
                  className="max-w-full max-h-[400px] block"
                />
              </div>
            </div>

            {slices.length > 0 && (
              <div className="animate-in slide-in-from-bottom-6 fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-900">切割结果 ({slices.length} 张)</h4>
                  <Button
                    size="sm"
                    onClick={downloadAll}
                    isLoading={isZipping}
                    className="bg-green-600 hover:bg-green-700 border-transparent text-white"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    打包下载 (ZIP)
                  </Button>
                </div>

                <div className="grid gap-2 bg-slate-100 p-4 rounded-xl border border-slate-200 max-h-[400px] overflow-y-auto">
                  {slices.map((slice) => (
                    <div
                      key={slice.id}
                      className="inline-block w-16 h-16 bg-white overflow-hidden shadow-sm rounded"
                    >
                      <img src={slice.url} alt="" className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpriteSheetSplitter;
