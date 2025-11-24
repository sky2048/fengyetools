import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Grid3x3, Download, Trash2, Scissors, Package, Grid } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

interface ImageSlice {
  id: string;
  url: string;
  blob: Blob;
  row: number;
  col: number;
}

const ImageSplitter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [slices, setSlices] = useState<ImageSlice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (!files[0].type.startsWith('image/')) {
        alert("请选择图片文件");
        return;
      }
      
      // Cleanup previous
      if (imgSrc) URL.revokeObjectURL(imgSrc);
      slices.forEach(s => URL.revokeObjectURL(s.url));
      
      const url = URL.createObjectURL(files[0]);
      setImgSrc(url);
      setFile(files[0]);
      setSlices([]);
    }
  };

  const handleSplit = async () => {
    if (!imgRef.current || !file) return;

    setIsProcessing(true);
    // Small delay to let UI show loading state
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const image = imgRef.current;
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;

      const pieceWidth = naturalWidth / cols;
      const pieceHeight = naturalHeight / rows;

      const newSlices: ImageSlice[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement('canvas');
          canvas.width = pieceWidth;
          canvas.height = pieceHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
             // Draw the specific section of the source image
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
             
             const blob = await new Promise<Blob | null>(resolve => 
                canvas.toBlob(resolve, file.type)
             );

             if (blob) {
               newSlices.push({
                 id: `slice-${r}-${c}`,
                 blob,
                 url: URL.createObjectURL(blob),
                 row: r,
                 col: c
               });
             }
          }
        }
      }
      setSlices(newSlices);
    } catch (e) {
      console.error(e);
      alert("切割失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    slices.forEach(s => URL.revokeObjectURL(s.url));
    setFile(null);
    setImgSrc(null);
    setSlices([]);
    setRows(3);
    setCols(3);
  };

  const downloadAll = async () => {
    if (slices.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folderName = file?.name.replace(/\.[^/.]+$/, "") + "_split";
      const folder = zip.folder(folderName);
      
      const ext = file?.type.split('/')[1] || 'png';

      if (folder) {
        slices.forEach((slice, index) => {
           // Naming convention: index (1-9) or row_col
           const fileName = `split_${slice.row + 1}_${slice.col + 1}.${ext}`;
           folder.file(fileName, slice.blob);
        });

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${folderName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert("打包失败");
    } finally {
      setIsZipping(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      slices.forEach(s => URL.revokeObjectURL(s.url));
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          图片切片
        </h2>
        <p className="text-slate-500 mt-1">将图片分割为 N x N 的网格图片，支持朋友圈九宫格模式。</p>
      </div>

      {!imgSrc ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          label="上传图片开始切图" 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Controls */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
              <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
                 <Grid className="w-5 h-5 mr-2 text-blue-600" />
                 切图设置
              </h3>

              <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">快速预设</label>
                    <div className="grid grid-cols-3 gap-2">
                       <button onClick={() => { setRows(3); setCols(3); }} className={`py-2 px-1 text-sm rounded-md border transition-all ${rows === 3 && cols === 3 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-slate-50 border-slate-200'}`}>
                         3 x 3 (九宫格)
                       </button>
                       <button onClick={() => { setRows(2); setCols(2); }} className={`py-2 px-1 text-sm rounded-md border transition-all ${rows === 2 && cols === 2 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-slate-50 border-slate-200'}`}>
                         2 x 2 (四宫格)
                       </button>
                       <button onClick={() => { setRows(1); setCols(3); }} className={`py-2 px-1 text-sm rounded-md border transition-all ${rows === 1 && cols === 3 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-slate-50 border-slate-200'}`}>
                         1 x 3 (长图)
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">行数 (Rows)</label>
                       <input 
                          type="number" 
                          min="1" max="10" 
                          value={rows}
                          onChange={(e) => setRows(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">列数 (Cols)</label>
                       <input 
                          type="number" 
                          min="1" max="10" 
                          value={cols}
                          onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                       />
                    </div>
                 </div>
                 
                 <div className="pt-4 border-t border-slate-100 space-y-3">
                     <Button onClick={handleSplit} isLoading={isProcessing} className="w-full">
                        <Scissors className="w-4 h-4 mr-2" />
                        生成切片
                     </Button>
                     <Button variant="outline" onClick={reset} className="w-full text-red-600 hover:bg-red-50 border-red-200">
                        <Trash2 className="w-4 h-4 mr-2" />
                        清除图片
                     </Button>
                 </div>
              </div>
           </div>

           {/* Preview & Result */}
           <div className="lg:col-span-2 space-y-8">
              {/* Preview Area */}
              <div>
                 <h4 className="font-medium text-slate-900 mb-3">预览 (Preview)</h4>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-center overflow-hidden">
                    <div className="relative inline-block max-w-full max-h-[500px] shadow-lg">
                       <img 
                          ref={imgRef}
                          src={imgSrc} 
                          alt="Original" 
                          className="max-w-full max-h-[500px] block"
                       />
                       {/* Grid Overlay */}
                       <div 
                          className="absolute inset-0 border border-blue-400/50 pointer-events-none"
                          style={{
                             display: 'grid',
                             gridTemplateRows: `repeat(${rows}, 1fr)`,
                             gridTemplateColumns: `repeat(${cols}, 1fr)`
                          }}
                       >
                          {Array.from({ length: rows * cols }).map((_, i) => (
                             <div key={i} className="border border-dashed border-white/70 bg-black/10"></div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Results Area */}
              {slices.length > 0 && (
                 <div className="animate-in slide-in-from-bottom-6 fade-in">
                     <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-900">切割结果 ({slices.length} 张)</h4>
                        <Button size="sm" onClick={downloadAll} isLoading={isZipping} className="bg-green-600 hover:bg-green-700 border-transparent text-white">
                           <Package className="w-4 h-4 mr-2" />
                           打包下载 (ZIP)
                        </Button>
                     </div>

                     <div 
                        className="grid gap-2 bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-inner"
                        style={{
                           gridTemplateColumns: `repeat(${cols}, 1fr)`
                        }}
                     >
                        {slices.map((slice) => (
                           <div key={slice.id} className="relative group aspect-square bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              <img src={slice.url} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                 <a 
                                    href={slice.url} 
                                    download={`split_${slice.row + 1}_${slice.col + 1}.${file?.type.split('/')[1] || 'png'}`}
                                    className="bg-white p-1.5 rounded-full text-slate-700 hover:text-blue-600 shadow-lg transform scale-90 hover:scale-110 transition-all"
                                 >
                                    <Download className="w-4 h-4" />
                                 </a>
                              </div>
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

export default ImageSplitter;