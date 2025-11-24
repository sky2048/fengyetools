import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import QRCode from 'qrcode';
import { QrCode, Download, RefreshCw, Copy, Check } from 'lucide-react';
import Button from '../ui/Button';

const QrCodeGenerator: React.FC = () => {
  const [text, setText] = useState('https://');
  const [colorDark, setColorDark] = useState('#000000');
  const [colorLight, setColorLight] = useState('#ffffff');
  const [size, setSize] = useState(300);
  const [margin, setMargin] = useState(2);
  
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const generateQR = async () => {
    if (!text.trim()) return;
    
    try {
      const url = await QRCode.toDataURL(text, {
        width: size,
        margin: margin,
        color: {
          dark: colorDark,
          light: colorLight
        }
      });
      setQrUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto generate on change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      generateQR();
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, colorDark, colorLight, size, margin]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    if (!qrUrl) return;
    try {
        // Fetch blob to put on clipboard
        const res = await fetch(qrUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (e) {
        alert('复制失败，请尝试下载');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <QrCode className="w-6 h-6 mr-2 text-blue-600" />
          二维码生成
        </h2>
        <p className="text-slate-500 mt-1">将文字、网址或名片信息生成为二维码图片。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Settings Panel */}
         <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
            <h3 className="font-semibold text-slate-900 mb-4">生成设置</h3>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">内容 (文字/网址)</label>
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                        placeholder="在此输入..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">前景色</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={colorDark}
                                onChange={(e) => setColorDark(e.target.value)}
                                className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                            />
                            <span className="text-xs text-slate-500 uppercase">{colorDark}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">背景色</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={colorLight}
                                onChange={(e) => setColorLight(e.target.value)}
                                className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                            />
                            <span className="text-xs text-slate-500 uppercase">{colorLight}</span>
                        </div>
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">尺寸 (px): {size}</label>
                     <input 
                        type="range" min="100" max="1000" step="10" 
                        value={size} 
                        onChange={(e) => setSize(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                     />
                </div>
                
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">边距: {margin}</label>
                     <input 
                        type="range" min="0" max="10" step="1" 
                        value={margin} 
                        onChange={(e) => setMargin(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                     />
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                    <Button onClick={() => setText('')} variant="outline" className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" /> 重置内容
                    </Button>
                </div>
            </div>
         </div>

         {/* Preview Panel */}
         <div className="lg:col-span-2 flex flex-col items-center">
             <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-w-[300px]">
                 {qrUrl ? (
                     <div className="relative group">
                        <img src={qrUrl} alt="QR Code" className="max-w-full border border-slate-100 rounded-lg" />
                     </div>
                 ) : (
                     <div className="w-64 h-64 bg-slate-50 flex items-center justify-center text-slate-400 rounded-lg">
                         请输入内容生成二维码
                     </div>
                 )}
             </div>
             
             {qrUrl && (
                 <div className="mt-6 flex gap-4">
                     <Button size="lg" onClick={handleDownload} className="shadow-md">
                         <Download className="w-5 h-5 mr-2" /> 下载 PNG
                     </Button>
                     <Button size="lg" variant="secondary" onClick={handleCopy} className="shadow-sm border border-slate-200">
                         {copied ? (
                             <><Check className="w-5 h-5 mr-2 text-green-600" /> 已复制</>
                         ) : (
                             <><Copy className="w-5 h-5 mr-2" /> 复制图片</>
                         )}
                     </Button>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default QrCodeGenerator;