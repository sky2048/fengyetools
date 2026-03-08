import React, { useState, useEffect } from 'react';
import { LayoutGrid, Download, Trash2, Plus, Rows, Columns } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { createImage } from '../../utils/imageUtils';

interface FrameItem {
  id: string;
  file: File;
  previewUrl: string;
}

const SpriteSheetGenerator: React.FC = () => {
  const [images, setImages] = useState<FrameItem[]>([]);
  const [cols, setCols] = useState(4);
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

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const loadedImages = await Promise.all(
        images.map((item) => createImage(item.previewUrl, false))
      );

      const maxW = Math.max(...loadedImages.map((img) => img.width));
      const maxH = Math.max(...loadedImages.map((img) => img.height));

      const actualCols = Math.min(cols, images.length);
      const actualRows = Math.ceil(images.length / actualCols);

      const canvasWidth = actualCols * maxW;
      const canvasHeight = actualRows * maxH;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('无法创建 Canvas 上下文');

      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      for (let i = 0; i < loadedImages.length; i++) {
        const img = loadedImages[i];
        const row = Math.floor(i / actualCols);
        const col = i % actualCols;
        const x = col * maxW;
        const y = row * maxH;
        ctx.drawImage(img, x, y, img.width, img.height);
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (!blob) throw new Error('生成失败');
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      alert('生成失败：' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <LayoutGrid className="w-7 h-7 mr-2 text-blue-600" />
          精灵表生成器
        </h2>
        <p className="text-slate-500 mt-1">
          上传多张序列帧图片，按行列排列合并成一张 Sprite Sheet，可下载。
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
              <LayoutGrid className="w-5 h-5 mr-2 text-blue-600" />
              生成设置
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">每行列数</label>
                <input
                  type="number"
                  min="1"
                  max="32"
                  value={cols}
                  onChange={(e) =>
                    setCols(Math.max(1, Math.min(32, parseInt(e.target.value) || 1)))
                  }
                  aria-label="每行列数"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Button onClick={handleGenerate} isLoading={isProcessing} className="w-full">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  生成精灵表
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
              <h4 className="font-medium text-slate-900 mb-3">图片列表 ({images.length} 张)</h4>
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
                <h4 className="font-medium text-slate-900 mb-3">生成结果</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                  <img
                    src={resultUrl}
                    alt="Sprite Sheet"
                    className="max-w-full max-h-[400px] block mb-4"
                  />
                  <a href={resultUrl} download={`spritesheet_${new Date().getTime()}.png`}>
                    <Button size="lg" className="shadow-xl">
                      <Download className="w-5 h-5 mr-2" />
                      下载精灵表
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

export default SpriteSheetGenerator;
