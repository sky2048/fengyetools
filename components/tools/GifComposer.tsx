import React, { useState, useEffect } from 'react';
import { encode } from 'modern-gif';
import { Film, Download, Trash2, Plus } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { createImage } from '../../utils/imageUtils';

interface FrameItem {
  id: string;
  file: File;
  previewUrl: string;
}

const GifComposer: React.FC = () => {
  const [images, setImages] = useState<FrameItem[]>([]);
  const [delay, setDelay] = useState(100);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages: FrameItem[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file: files[i],
          previewUrl: URL.createObjectURL(files[i]),
        });
      }
    }
    setImages((prev) => [...prev, ...newImages]);
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

  const removeAll = () => {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }
  };

  const handleCompose = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const loadedImages = await Promise.all(
        images.map((item) => createImage(item.previewUrl, false))
      );

      const maxW = Math.max(...loadedImages.map((img) => img.width));
      const maxH = Math.max(...loadedImages.map((img) => img.height));

      const frames = loadedImages.map((img) => ({
        data: img as CanvasImageSource,
        delay,
      }));

      const blob = await encode({
        width: maxW,
        height: maxH,
        frames,
        format: 'blob',
      });

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      alert('合成失败：' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Film className="w-7 h-7 mr-2 text-blue-600" />
          GIF 合成
        </h2>
        <p className="text-slate-500 mt-1">
          上传多张图片，设置帧间隔，合成 GIF 动图。
        </p>
      </div>

      {images.length === 0 ? (
        <FileInput
          onFileSelect={handleFileSelect}
          accept="image/*"
          multiple
          label="上传多张序列帧图片"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <Film className="w-5 h-5 mr-2 text-blue-600" />
              合成设置
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">帧间隔 (ms)</label>
                <input
                  type="number"
                  min="20"
                  max="2000"
                  step="10"
                  value={delay}
                  onChange={(e) =>
                    setDelay(Math.max(20, Math.min(2000, parseInt(e.target.value) || 100)))
                  }
                  aria-label="帧间隔 (毫秒)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Button onClick={handleCompose} isLoading={isProcessing} className="w-full">
                  合成 GIF
                </Button>
                <label className="block cursor-pointer">
                  <span className="inline-flex items-center justify-center w-full h-10 px-4 rounded-lg font-medium border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700">
                    <Plus className="w-4 h-4 mr-2" />
                    添加图片
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </label>
                <Button
                  variant="outline"
                  onClick={removeAll}
                  className="w-full text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空全部
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div>
              <h4 className="font-medium text-slate-900 mb-3">帧序列 ({images.length} 张)</h4>
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                {images.map((img, index) => (
                  <div key={img.id} className="relative group">
                    <div className="w-14 h-14 bg-slate-100 rounded border overflow-hidden">
                      <img
                        src={img.previewUrl}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {resultUrl && (
              <div className="animate-in slide-in-from-bottom-6 fade-in">
                <h4 className="font-medium text-slate-900 mb-3">合成结果</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                  <img
                    src={resultUrl}
                    alt="GIF"
                    className="max-w-full max-h-[400px] block mb-4"
                  />
                  <a href={resultUrl} download={`composed_${new Date().getTime()}.gif`}>
                    <Button size="lg" className="shadow-xl">
                      <Download className="w-5 h-5 mr-2" />
                      下载 GIF
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GifComposer;
