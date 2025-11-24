import React, { useState, useEffect } from 'react';
import { Link, Copy, Check, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

const UrlTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'encode' | 'decode'>('decode');

  // Clear output when switching modes
  useEffect(() => {
    setOutput('');
  }, [mode]);

  const handleProcess = () => {
    if (!input.trim()) return;

    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch (e) {
      setOutput(mode === 'decode' ? "解码错误：无效的 URL 格式" : "编码错误");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInput('');
    setOutput('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Mode Switcher */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <Link className="w-6 h-6 mr-2 text-blue-600" />
            URL 编解码
          </h2>
          <p className="text-slate-500 mt-1">对 URL 字符串进行标准格式的编码 (Encode) 或解码 (Decode)。</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-lg flex items-center self-start md:self-center">
            <button
                onClick={() => setMode('decode')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'decode' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                解码 (Decode)
            </button>
            <button
                onClick={() => setMode('encode')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'encode' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                编码 (Encode)
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Input Area */}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm text-base"
            placeholder={mode === 'encode' ? "请输入需要编码的特殊字符或 URL..." : "请输入需要解码的 URL 字符串..."}
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
             <Button size="sm" onClick={handleProcess}>
                {mode === 'encode' ? '执行编码' : '执行解码'}
             </Button>
          </div>
        </div>

        {/* Output Area */}
        <div className="relative bg-slate-50 rounded-xl border border-slate-200 min-h-[160px] p-4">
            <div className="absolute top-0 left-0 px-3 py-1 bg-slate-200 rounded-br-lg text-xs font-medium text-slate-600">
                结果
            </div>
            {output ? (
                <p className="pt-6 text-slate-800 break-all whitespace-pre-wrap leading-relaxed">{output}</p>
            ) : (
                <p className="pt-6 text-slate-400 text-sm italic">结果将显示在这里...</p>
            )}
            
            {output && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                        onClick={clear}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="清空"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 mr-1 text-green-600" /> 已复制
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-1" /> 复制结果
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default UrlTool;