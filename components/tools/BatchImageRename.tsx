import React, { useState, useEffect, useRef } from 'react';
import JSZipModule from 'jszip';
import { FileText, Trash2, Package, Eye } from 'lucide-react';

const JSZip = (JSZipModule as { default?: typeof JSZipModule }).default ?? JSZipModule;
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

type NamingRule = 'prefix_index' | 'frame_index' | 'custom';

const BatchImageRename: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [prefix, setPrefix] = useState('image');
  const [startIndex, setStartIndex] = useState(1);
  const [customPattern, setCustomPattern] = useState('frame_{index}');
  const [namingRule, setNamingRule] = useState<NamingRule>('prefix_index');
  const [previewNames, setPreviewNames] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageItem[] = [];
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
  };

  const getExtension = (file: File) => file.name.split('.').pop() || 'png';

  const generateName = (index: number): string => {
    const ext = getExtension(images[index]?.file || new File([], 'a.png'));
    const idx = startIndex + index;

    if (namingRule === 'prefix_index') {
      return `${prefix}_${String(idx).padStart(3, '0')}.${ext}`;
    }
    if (namingRule === 'frame_index') {
      return `frame_${String(idx).padStart(3, '0')}.${ext}`;
    }
    const name = customPattern
      .replace(/\{index\}/gi, String(idx))
      .replace(/\{index:(\d+)\}/gi, (_, pad) =>
        String(idx).padStart(parseInt(pad, 10), '0')
      )
      .replace(/\{prefix\}/gi, prefix);
    return name.includes('.') ? name : `${name}.${ext}`;
  };

  useEffect(() => {
    if (images.length === 0) {
      setPreviewNames([]);
      return;
    }
    setPreviewNames(images.map((_, i) => generateName(i)));
  }, [images, prefix, startIndex, customPattern, namingRule]);

  const download = async () => {
    if (images.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('renamed_images');

      if (folder) {
        for (let i = 0; i < images.length; i++) {
          folder.file(previewNames[i], images[i].file);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'renamed_images.zip';
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

  const removeAll = () => {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <FileText className="w-7 h-7 mr-2 text-blue-600" />
          批量图片重命名
        </h2>
        <p className="text-slate-500 mt-1">
          上传多张图片，设置命名规则（如 prefix_001、frame_{`\{index\}`}），预览后打包下载。
        </p>
      </div>

      {images.length === 0 ? (
        <FileInput
          onFileSelect={handleFileSelect}
          accept="image/*"
          multiple
          label="上传多张图片"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              命名规则
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">规则类型</label>
                <div className="space-y-2">
                  {[
                    { value: 'prefix_index' as NamingRule, label: 'prefix_001' },
                    { value: 'frame_index' as NamingRule, label: 'frame_001' },
                    { value: 'custom' as NamingRule, label: '自定义' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setNamingRule(opt.value)}
                      className={`w-full text-left py-2 px-3 text-sm rounded-md border transition-all ${
                        namingRule === opt.value
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {namingRule !== 'custom' && (
                <>
                  <div>
                    <label htmlFor="batch-prefix" className="block text-sm font-medium text-slate-700 mb-2">前缀</label>
                    <input
                      id="batch-prefix"
                      type="text"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="batch-start" className="block text-sm font-medium text-slate-700 mb-2">起始序号</label>
                    <input
                      id="batch-start"
                      type="number"
                      min="0"
                      value={startIndex}
                      onChange={(e) => setStartIndex(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {namingRule === 'custom' && (
                <div>
                  <label htmlFor="batch-custom" className="block text-sm font-medium text-slate-700 mb-2">
                    自定义格式 (支持 {`\{index\}`}、{`\{index:3\}`}、{`\{prefix\}`})
                  </label>
                  <input
                    id="batch-custom"
                    type="text"
                    value={customPattern}
                    onChange={(e) => setCustomPattern(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Button onClick={download} isLoading={isZipping} className="w-full">
                  <Package className="w-4 h-4 mr-2" />
                  打包下载 (ZIP)
                </Button>
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
              <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                预览 ({images.length} 张)
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 border-b border-slate-200">
                      <th className="pb-2 py-2">序号</th>
                      <th className="pb-2 py-2">原文件名</th>
                      <th className="pb-2 py-2">新文件名</th>
                    </tr>
                  </thead>
                  <tbody>
                    {images.map((img, i) => (
                      <tr key={img.id} className="border-b border-slate-100">
                        <td className="py-2">{i + 1}</td>
                        <td className="py-2 text-slate-600 truncate max-w-[150px]">
                          {img.file.name}
                        </td>
                        <td className="py-2 font-medium text-blue-600">{previewNames[i]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchImageRename;
