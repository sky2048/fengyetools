import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Copy, Check, Trash2, Download, Upload, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';

const CsvToJson: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConvert = () => {
    if (!input.trim()) {
      setError(null);
      setOutput('');
      return;
    }
    try {
      const result = Papa.parse(input.trim(), {
        delimiter: delimiter || ',',
        header: true,
        skipEmptyLines: true,
      });
      if (result.errors.length > 0) {
        setError(result.errors[0].message);
        setOutput('');
      } else {
        const jsonStr = JSON.stringify(result.data, null, 2);
        setOutput(jsonStr);
        setError(null);
      }
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setInput(text);
      setError(null);
      setOutput('');
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
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
          <FileSpreadsheet className="w-6 h-6 mr-2 text-blue-600" />
          CSV 转 JSON
        </h2>
        <p className="text-slate-500 mt-1">粘贴或上传 CSV 文件，解析为 JSON 数组，支持自定义分隔符，可下载 JSON。</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">分隔符</label>
          <input
            type="text"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            placeholder=","
            aria-label="分隔符"
            className="w-16 px-2 py-1.5 border border-slate-300 rounded text-sm font-mono"
            maxLength={2}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="hidden"
          aria-label="上传 CSV 文件"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4 mr-1.5" /> 上传 CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-320px)] min-h-[450px]">
        <div className="flex flex-col h-full">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">CSV 输入</span>
            <div className="flex gap-2">
              <button
                onClick={handleConvert}
                className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm"
              >
                转换
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
            placeholder="请粘贴 CSV 数据或上传文件..."
            className={`flex-1 w-full p-4 font-mono text-sm bg-white border border-slate-200 rounded-b-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none custom-scrollbar ${error ? 'border-red-300 focus:ring-red-200' : ''}`}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col h-full relative">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">JSON 输出</span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                {copied ? <Check className="w-4 h-4 mr-1.5 text-green-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copied ? '已复制' : '复制'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-1.5" /> 下载
              </button>
            </div>
          </div>
          <div className={`flex-1 w-full p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-b-xl overflow-auto custom-scrollbar`}>
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-red-600 animate-in fade-in">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <h3 className="font-semibold">解析错误</h3>
                <p className="text-xs mt-1 opacity-80 max-w-xs text-center break-words">{error}</p>
              </div>
            ) : output ? (
              <pre className="whitespace-pre-wrap break-words">{output}</pre>
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

export default CsvToJson;
