import React, { useState, useRef } from 'react';
import { Binary, ArrowRightLeft, Copy, Check, FileText, Image as ImageIcon, Trash2, Download } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

type Mode = 'text' | 'image';
type Action = 'encode' | 'decode';

const Base64Tool: React.FC = () => {
  const [mode, setMode] = useState<Mode>('text');
  const [action, setAction] = useState<Action>('encode');
  
  // Text State
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  
  // Image State
  const [file, setFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [inputBase64Image, setInputBase64Image] = useState('');
  const [decodedImageUrl, setDecodedImageUrl] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Text Handlers ---
  const handleTextProcess = () => {
    setError(null);
    try {
      if (action === 'encode') {
        // Use utf-8 encoding trick for chinese chars
        const encoded = btoa(unescape(encodeURIComponent(inputText)));
        setOutputText(encoded);
      } else {
        const decoded = decodeURIComponent(escape(atob(inputText)));
        setOutputText(decoded);
      }
    } catch (e) {
      setError(action === 'encode' ? '编码失败' : '解码失败：无效的 Base64 字符串');
      setOutputText('');
    }
  };

  // --- Image Handlers ---
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      const selectedFile = files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageBase64(e.target.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleImageDecode = () => {
    setError(null);
    if (!inputBase64Image.trim()) return;
    
    try {
        // Validate format vaguely
        let base64 = inputBase64Image.trim();
        // Try to fix missing header if user just pasted raw base64 without data URI scheme
        if (!base64.startsWith('data:image')) {
             // Try to guess type or default to png, usually not safe but let's assume png
             base64 = `data:image/png;base64,${base64}`;
        }
        
        // Test if valid by creating a simple Image loading check
        // But for now, just setting it as src is enough to try rendering
        setDecodedImageUrl(base64);
    } catch (e) {
        setError("无法解析 Base64 图片数据");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBase64AsFile = () => {
    if (!imageBase64) return;
    const link = document.createElement('a');
    link.href = imageBase64;
    link.download = 'base64_image.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Binary className="w-6 h-6 mr-2 text-blue-600" />
          Base64 转换
        </h2>
        <p className="text-slate-500 mt-1">支持文本和图片的 Base64 编码与解码，完美支持中文字符。</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl max-w-md mx-auto mb-8">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'text' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" /> 文本处理
          </button>
          <button
            onClick={() => setMode('image')}
            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'image' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ImageIcon className="w-4 h-4 mr-2" /> 图片处理
          </button>
      </div>

      {/* --- Text Mode --- */}
      {mode === 'text' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">输入内容</label>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                        <button 
                            onClick={() => setAction('encode')}
                            className={`px-3 py-1 rounded-md transition-all ${action === 'encode' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-slate-500'}`}
                        >编码</button>
                        <button 
                            onClick={() => setAction('decode')}
                            className={`px-3 py-1 rounded-md transition-all ${action === 'decode' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-slate-500'}`}
                        >解码</button>
                    </div>
                </div>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 min-h-[250px] p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                    placeholder={action === 'encode' ? "请输入要编码的普通文本..." : "请输入要解码的 Base64 字符串..."}
                />
                <div className="mt-4">
                    <Button onClick={handleTextProcess} className="w-full">
                        <ArrowRightLeft className="w-4 h-4 mr-2" /> 
                        执行{action === 'encode' ? '编码' : '解码'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">输出结果</label>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(outputText)}
                        disabled={!outputText}
                        className="h-7 text-xs"
                    >
                        {copied ? <Check className="w-3 h-3 mr-1 text-green-600" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copied ? '已复制' : '复制结果'}
                    </Button>
                </div>
                <div className="flex-1 min-h-[250px] p-4 bg-slate-50 border border-slate-200 rounded-xl overflow-auto relative font-mono text-sm break-all">
                    {error ? (
                        <span className="text-red-500">{error}</span>
                    ) : outputText ? (
                        outputText
                    ) : (
                        <span className="text-slate-400 italic">等待处理...</span>
                    )}
                </div>
                <div className="mt-4">
                    <Button variant="outline" onClick={() => { setInputText(''); setOutputText(''); setError(null); }} className="w-full text-red-600 hover:bg-red-50 border-red-200">
                        <Trash2 className="w-4 h-4 mr-2" /> 清空内容
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* --- Image Mode --- */}
      {mode === 'image' && (
          <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Image to Base64 */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                          图片转 Base64
                      </h3>
                      
                      {!file ? (
                          <FileInput 
                            onFileSelect={handleFileSelect} 
                            accept="image/*" 
                            label="上传图片" 
                          />
                      ) : (
                          <div className="space-y-4">
                              <div className="bg-slate-100 rounded-lg p-4 flex justify-center">
                                  <img src={imageBase64} alt="Preview" className="max-h-[200px] object-contain" />
                              </div>
                              <div className="text-sm text-slate-500 text-center">
                                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                              </div>
                              
                              <div className="relative">
                                  <textarea 
                                    readOnly
                                    value={imageBase64}
                                    className="w-full h-32 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none"
                                  />
                              </div>

                              <div className="flex gap-3">
                                  <Button className="flex-1" onClick={() => copyToClipboard(imageBase64)}>
                                      {copied ? '已复制' : '复制 Base64'}
                                  </Button>
                                  <Button variant="outline" className="flex-1" onClick={downloadBase64AsFile}>
                                      <Download className="w-4 h-4 mr-2" /> 保存文本
                                  </Button>
                                  <Button variant="ghost" onClick={() => { setFile(null); setImageBase64(''); }} className="text-red-500">
                                      清除
                                  </Button>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Base64 to Image */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                          Base64 转图片
                      </h3>
                      
                      <div className="space-y-4">
                          <textarea
                             value={inputBase64Image}
                             onChange={(e) => setInputBase64Image(e.target.value)}
                             placeholder="粘贴 Base64 字符串 (data:image/...)"
                             className="w-full h-32 p-3 text-xs font-mono bg-white border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          
                          <Button onClick={handleImageDecode} className="w-full">
                              <ImageIcon className="w-4 h-4 mr-2" /> 还原图片
                          </Button>

                          {error && (
                              <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>
                          )}

                          {decodedImageUrl && !error && (
                              <div className="animate-in fade-in">
                                  <div className="bg-slate-100 rounded-lg p-4 flex justify-center mb-4 min-h-[200px] items-center">
                                      <img src={decodedImageUrl} alt="Decoded" className="max-w-full max-h-[300px] object-contain shadow-sm" />
                                  </div>
                                  <a href={decodedImageUrl} download="decoded_image">
                                      <Button variant="secondary" className="w-full">
                                          <Download className="w-4 h-4 mr-2" /> 下载图片
                                      </Button>
                                  </a>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Base64Tool;