import React, { useState, useRef } from 'react';
import { Braces, AlignLeft, Minimize, Copy, Check, Trash2, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Simple JSON syntax highlighter logic
  // Wraps tokens in span tags with tailwind text color classes
  const highlightJson = (json: string) => {
    if (!json) return '';
    
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-orange-600'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-purple-700 font-medium'; // key
          } else {
            cls = 'text-green-600'; // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-blue-600'; // boolean
        } else if (/null/.test(match)) {
          cls = 'text-red-500'; // null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const handleFormat = () => {
    if (!input.trim()) {
        setError(null);
        setOutput('');
        return;
    }
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Braces className="w-6 h-6 mr-2 text-blue-600" />
          JSON 格式化
        </h2>
        <p className="text-slate-500 mt-1">格式化、压缩、验证 JSON 数据，并提供语法高亮显示。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Input Panel */}
        <div className="flex flex-col h-full">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">输入 (Raw)</span>
            <div className="flex gap-2">
               <button 
                 onClick={handleFormat}
                 className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm"
               >
                 <AlignLeft className="w-4 h-4 mr-1.5" /> 格式化
               </button>
               <button 
                 onClick={handleMinify}
                 className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm"
               >
                 <Minimize className="w-4 h-4 mr-1.5" /> 压缩
               </button>
               <button 
                 onClick={handleClear}
                 className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                 title="清空"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请在此粘贴 JSON 数据..."
            className={`flex-1 w-full p-4 font-mono text-sm bg-white border border-slate-200 rounded-b-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none custom-scrollbar ${error ? 'border-red-300 focus:ring-red-200' : ''}`}
            spellCheck={false}
          />
        </div>

        {/* Output Panel */}
        <div className="flex flex-col h-full relative">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">输出 (Formatted)</span>
            <button 
              onClick={handleCopy}
              disabled={!output}
              className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 mr-1.5 text-green-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          
          <div className={`flex-1 w-full p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-b-xl overflow-auto custom-scrollbar relative`}>
             {error ? (
                <div className="flex flex-col items-center justify-center h-full text-red-600 animate-in fade-in">
                   <AlertTriangle className="w-8 h-8 mb-2" />
                   <h3 className="font-semibold">JSON 格式错误</h3>
                   <p className="text-xs mt-1 opacity-80 max-w-xs text-center break-words">{error}</p>
                </div>
             ) : output ? (
                <pre 
                  className="whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: highlightJson(output) }}
                />
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                   等待输入...
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;