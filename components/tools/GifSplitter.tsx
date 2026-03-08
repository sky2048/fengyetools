import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Film, Download, Trash2, Package } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { parseGIF, decompressFrames } from 'gifuct-js';

interface FrameItem {
  id: string;
  url: string;
  blob: Blob;
  index: number;
}

const GifSplitter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (files[0].type !== 'image/gif') {
        alert('请选择 GIF 文件');
        return;
      }
      if (imgSrc) URL.revokeObjectURL(imgSrc);
      frames.forEach((f) => URL.revokeObjectURL(f.url));
      const url = URL.createObjectURL(files[0]);
      setImgSrc(url);
      setFile(files[0]);
      setFrames([]);
    }
  };

  const handleSplit = async () => {
    if (!file) return;

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const buffer = await file.arrayBuffer();
      const gif = parseGIF(buffer);
      const rawFrames = decompressFrames(gif, true);

      if (rawFrames.length === 0) {
        alert('无法解析 GIF 帧');
        setIsProcessing(false);
        return;
      }

      const firstFrame = rawFrames[0];
      const width = firstFrame.dims.width;
      const height = firstFrame.dims.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法创建 Canvas');

      const newFrames: FrameItem[] = [];
      let prevImageData: ImageData | null = null;

      for (let i = 0; i < rawFrames.length; i++) {
        const frame = rawFrames[i];
        const patch = frame.patch;

        if (patch) {
          if (frame.disposalType === 2 && prevImageData) {
            ctx.putImageData(prevImageData, 0, 0);
          }
          const imgData = new ImageData(
            new Uint8ClampedArray(patch),
            frame.dims.width,
            frame.dims.height
          );
          ctx.putImageData(imgData, frame.dims.left, frame.dims.top);

          if (frame.disposalType === 1) {
            prevImageData = ctx.getImageData(0, 0, width, height);
          } else if (frame.disposalType === 2) {
            prevImageData = ctx.getImageData(0, 0, width, height);
          }
        }

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );

        if (blob) {
          newFrames.push({
            id: `frame-${i}`,
            url: URL.createObjectURL(blob),
            blob,
            index: i,
          });
        }
      }

      setFrames(newFrames);
    } catch (e) {
      console.error(e);
      alert('分解失败：' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (frames.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folderName = file?.name.replace(/\.[^/.]+$/, '') + '_frames';
      const folder = zip.folder(folderName);

      if (folder) {
        frames.forEach((frame) => {
          const fileName = `frame_${String(frame.index).padStart(4, '0')}.png`;
          folder.file(fileName, frame.blob);
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

  const reset = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    setFile(null);
    setImgSrc(null);
    setFrames([]);
  };

  useEffect(() => {
    return () => {
      frames.forEach((f) => URL.revokeObjectURL(f.url));
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Film className="w-7 h-7 mr-2 text-blue-600" />
          GIF 分解
        </h2>
        <p className="text-slate-500 mt-1">
          上传 GIF 动图，分解为帧序列图片，打包 ZIP 下载。
        </p>
      </div>

      {!imgSrc ? (
        <FileInput
          onFileSelect={handleFileSelect}
          accept="image/gif,.gif"
          label="上传 GIF 文件"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <Film className="w-5 h-5 mr-2 text-blue-600" />
              分解设置
            </h3>

            <div className="space-y-6">
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Button onClick={handleSplit} isLoading={isProcessing} className="w-full">
                  分解 GIF
                </Button>
                <Button
                  size="sm"
                  onClick={downloadAll}
                  isLoading={isZipping}
                  disabled={frames.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 border-transparent text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  打包下载 (ZIP)
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="w-full text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清除文件
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div>
              <h4 className="font-medium text-slate-900 mb-3">GIF 预览</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-center">
                <img
                  src={imgSrc}
                  alt="GIF"
                  className="max-w-full max-h-[300px] block"
                />
              </div>
            </div>

            {frames.length > 0 && (
              <div className="animate-in slide-in-from-bottom-6 fade-in">
                <h4 className="font-medium text-slate-900 mb-3">帧序列 ({frames.length} 张)</h4>
                <div className="grid gap-2 bg-slate-100 p-4 rounded-xl border border-slate-200 max-h-[400px] overflow-y-auto">
                  {frames.map((frame) => (
                    <div
                      key={frame.id}
                      className="inline-block w-16 h-16 bg-white overflow-hidden shadow-sm rounded"
                    >
                      <img src={frame.url} alt="" className="w-full h-full object-contain" />
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

export default GifSplitter;
