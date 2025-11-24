import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { Image, Download, Plus, X, Trash2, LayoutGrid, Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { blobToDataURL, formatBytes } from '../../utils/imageUtils';

interface ImageItem {
  file: File;
  previewUrl: string;
  id: string;
}

type ViewMode = 'tile' | 'grid';
type PageSize = 10 | 50 | 100 | 'all';

const ImageToPdf: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // View and Pagination State
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); // Default to grid for images usually
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    const newImages: ImageItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        newImages.push({
          file,
          previewUrl,
          id: Math.random().toString(36).substr(2, 9)
        });
      }
    }
    
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(img => img.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setCurrentPage(1);
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        const imageItem = images[i];
        const imgData = await blobToDataURL(imageItem.file);
        
        // Get image properties to calculate aspect ratio
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        
        // Calculate dimensions to fit page (maintaining aspect ratio)
        const ratio = imgProps.width / imgProps.height;
        let w = pdfWidth - 20; // 10mm margin
        let h = w / ratio;
        
        if (h > pdfHeight - 20) {
            h = pdfHeight - 20;
            w = h * ratio;
        }
        
        const x = (pdfWidth - w) / 2;
        const y = (pdfHeight - h) / 2;

        if (i > 0) doc.addPage();
        doc.addImage(imgData, imageItem.file.type === 'image/png' ? 'PNG' : 'JPEG', x, y, w, h);
      }

      doc.save('converted-images.pdf');

    } catch (err) {
      console.error(err);
      alert("PDF 生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  // Pagination Logic
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(images.length / pageSize);
  const currentItems = useMemo(() => {
    if (pageSize === 'all') return images;
    const start = (currentPage - 1) * pageSize;
    return images.slice(start, start + pageSize);
  }, [images, currentPage, pageSize]);

  // Handle page change safe check
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">图片 转 PDF</h2>
        <p className="text-slate-500 mt-1">将多张图片合并为一个 PDF 文件。支持 JPG, PNG 等。</p>
      </div>

      {images.length === 0 ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          multiple={true}
          label="拖拽多张图片到此处" 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Image List */}
             <div className="lg:col-span-2 flex flex-col space-y-4">
                {/* Toolbar */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-3 sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-700 mr-2">已选 ({images.length})</h3>
                    <label className="cursor-pointer text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium flex items-center transition-colors">
                        <Plus className="w-3.5 h-3.5 mr-1" /> 加图
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                    </label>
                    <button 
                      onClick={clearAll}
                      className="text-sm px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium flex items-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> 清空
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button 
                          onClick={() => setViewMode('tile')}
                          className={`p-1.5 rounded-md transition-all ${viewMode === 'tile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          title="平铺视图"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setViewMode('grid')}
                          className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          title="网格视图"
                        >
                          <Grid className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Page Size */}
                    <select 
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value) as PageSize);
                        setCurrentPage(1);
                      }}
                      className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10条/页</option>
                      <option value={50}>50条/页</option>
                      <option value={100}>100条/页</option>
                      <option value="all">全部</option>
                    </select>
                  </div>
                </div>
                
                {/* Grid Content */}
                <div className={`grid gap-4 ${
                  viewMode === 'tile' 
                    ? 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8' 
                    : 'grid-cols-2 md:grid-cols-3'
                }`}>
                    {currentItems.map((img, index) => {
                        // Calculate global index for numbering
                        const globalIndex = pageSize === 'all' 
                          ? index 
                          : (currentPage - 1) * pageSize + index;

                        return (
                          <div key={img.id} className="relative group bg-white rounded-lg border border-slate-200 p-2 shadow-sm hover:shadow-md transition-shadow">
                              <div className={`bg-slate-100 rounded overflow-hidden mb-2 flex items-center justify-center ${viewMode === 'tile' ? 'aspect-square' : 'aspect-[4/3]'}`}>
                                  <img src={img.previewUrl} className="w-full h-full object-contain" alt="preview" />
                              </div>
                              <div className="flex justify-between items-center px-1">
                                  <span className="text-xs text-slate-500 font-medium truncate max-w-[80px]">
                                      页码 {globalIndex + 1}
                                  </span>
                                  {viewMode === 'grid' && (
                                    <span className="text-xs text-slate-400">
                                        {formatBytes(img.file.size)}
                                    </span>
                                  )}
                              </div>
                              <button 
                                  onClick={() => removeImage(img.id)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 hover:scale-110 z-10"
                                  title="删除"
                              >
                                  <X className="w-3 h-3" />
                              </button>
                          </div>
                        );
                    })}
                </div>

                {/* Pagination Controls */}
                {images.length > 0 && pageSize !== 'all' && totalPages > 1 && (
                  <div className="mt-4 flex justify-center items-center space-x-4 py-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
                    </Button>
                    
                    <span className="text-sm text-slate-600 font-medium">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      下一页 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
             </div>

             {/* Action Panel - Right Side */}
             <div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-8">
                    <div className="text-center mb-6">
                        <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Image className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">准备生成</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          共 {images.length} 张图片
                          <br/>
                          <span className="text-xs text-slate-400">按当前顺序合并</span>
                        </p>
                    </div>
                    
                    <Button 
                        className="w-full" 
                        onClick={generatePdf} 
                        isLoading={isGenerating}
                        disabled={images.length === 0}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        生成 PDF
                    </Button>

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 leading-relaxed border border-slate-100">
                       提示: 图片将自动缩放以适应 A4 纸张大小，同时保持原始长宽比。
                    </div>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default ImageToPdf;