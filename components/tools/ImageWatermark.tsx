import React, { useState, useEffect, useRef } from 'react';
import { Stamp, Download, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { blobToDataURL } from '../../utils/imageUtils';

type WatermarkStrength = 'weak' | 'medium' | 'strong';

const ImageWatermark: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('枫叶工具箱');
  const [color, setColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(0.5);
  const [strength, setStrength] = useState<WatermarkStrength>('medium');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
       if (!files[0].type.startsWith('image/')) {
          alert("请选择图片文件");
          return;
       }
       setFile(files[0]);
    }
  };

  const drawWatermark = async () => {
    if (!file || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = await blobToDataURL(file);
    
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Configure Text
        const fontSize = Math.max(20, img.width * 0.05); // Responsive font size
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;

        if (strength === 'weak') {
            // Weak: Bottom Right
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(text, img.width - 20, img.height - 20);
        } else if (strength === 'medium') {
            // Medium: 5 Points (Corners + Center)
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Center
            ctx.fillText(text, img.width / 2, img.height / 2);
            
            // Corners (inset)
            const inset = fontSize * 2;
            ctx.fillText(text, inset, inset); // TL
            ctx.fillText(text, img.width - inset, inset); // TR
            ctx.fillText(text, inset, img.height - inset); // BL
            ctx.fillText(text, img.width - inset, img.height - inset); // BR

        } else if (strength === 'strong') {
            // Strong: Tiled Pattern Rotated
            ctx.translate(img.width / 2, img.height / 2);
            ctx.rotate(-45 * Math.PI / 180);
            ctx.translate(-img.width / 2, -img.height / 2);

            ctx.textAlign = 'center';
            const gap = fontSize * 4; // Spacing between watermarks
            
            // Draw grid larger than image to account for rotation
            const diag = Math.sqrt(img.width ** 2 + img.height ** 2);
            
            for (let x = -diag; x < diag; x += gap * 2) {
                for (let y = -diag; y < diag; y += gap) {
                    ctx.fillText(text, x, y);
                }
            }
            
            // Reset transform for good measure
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        // Update Preview
        setPreviewUrl(canvas.toDataURL(file.type));
    };
  };

  // Redraw when settings change
  useEffect(() => {
    drawWatermark();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, text, color, opacity, strength]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">图片水印</h2>
        <p className="text-slate-500 mt-1">为您的图片添加自定义水印保护。</p>
      </div>

      {!file ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          label="上传图片添加水印" 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
                    <Stamp className="w-5 h-5 mr-2 text-blue-600" />
                    水印设置
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">水印文字</label>
                        <input 
                            type="text" 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-2">强度 (布局)</label>
                         <div className="grid grid-cols-3 gap-2">
                             {[
                                 { id: 'weak', label: '弱' },
                                 { id: 'medium', label: '中' },
                                 { id: 'strong', label: '强' }
                             ].map((opt) => (
                                 <button
                                    key={opt.id}
                                    onClick={() => setStrength(opt.id as WatermarkStrength)}
                                    className={`py-2 px-1 text-sm rounded-md border transition-all ${
                                        strength === opt.id 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                 >
                                     {opt.label}
                                 </button>
                             ))}
                         </div>
                         <p className="text-xs text-slate-400 mt-2">
                             {strength === 'weak' && '单水印，右下角。'}
                             {strength === 'medium' && '五点分布，覆盖关键区域。'}
                             {strength === 'strong' && '全屏平铺，强力保护。'}
                         </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">不透明度</label>
                        <input 
                            type="range" 
                            min="0.1" max="1" step="0.1" 
                            value={opacity}
                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">颜色</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                            />
                            <span className="text-sm text-slate-500">{color}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setFile(null)} className="w-full">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            更换图片
                        </Button>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden min-h-[400px] flex items-center justify-center p-4">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Watermarked" className="max-w-full max-h-[600px] object-contain shadow-md" />
                    ) : (
                        <div className="animate-pulse bg-slate-200 w-full h-full rounded"></div>
                    )}
                    {/* Hidden Canvas for Processing */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                
                {previewUrl && (
                    <div className="flex justify-end">
                        <a href={previewUrl} download={`watermarked_${file.name}`}>
                            <Button size="lg">
                                <Download className="w-5 h-5 mr-2" />
                                下载带水印图片
                            </Button>
                        </a>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageWatermark;