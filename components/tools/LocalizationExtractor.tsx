import React, { useState } from 'react';
import { Languages, Copy, Check, Download, Trash2, FileCode } from 'lucide-react';
import Button from '../ui/Button';

const PATTERNS = [
  { name: 'i18n("key")', regex: /i18n\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g },
  { name: 't("key")', regex: /(?<![a-zA-Z])t\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g },
  { name: 'L["key"]', regex: /L\s*\[\s*["'`]([^"'`]+)["'`]\s*\]/g },
  { name: 'L[\'key\']', regex: /L\s*\[\s*["'`]([^"'`]+)["'`]\s*\]/g },
  { name: '$t("key")', regex: /\$t\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g },
  { name: 'useTranslation key', regex: /(?:useTranslation|translate)\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g },
  { name: '__("key")', regex: /__\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g },
  { name: 'formatMessage({id:"key"})', regex: /formatMessage\s*\(\s*\{\s*id\s*:\s*["'`]([^"'`]+)["'`]/g },
];

const LocalizationExtractor: React.FC = () => {
  const [input, setInput] = useState('');
  const [keys, setKeys] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const extract = () => {
    const source = input.trim();
    if (!source) {
      setKeys([]);
      return;
    }

    const found = new Set<string>();
    for (const { regex } of PATTERNS) {
      const re = new RegExp(regex.source, regex.flags);
      let m;
      while ((m = re.exec(source)) !== null) {
        found.add(m[1]);
      }
    }

    setKeys(Array.from(found).sort());
  };

  const getExportText = () => {
    if (exportFormat === 'json') {
      const obj: Record<string, string> = {};
      keys.forEach((k) => (obj[k] = ''));
      return JSON.stringify(obj, null, 2);
    }
    return ['key,value', ...keys.map((k) => `${JSON.stringify(k)},`)].join('\n');
  };

  const handleCopy = () => {
    if (!keys.length) return;
    navigator.clipboard.writeText(getExportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!keys.length) return;
    const text = getExportText();
    const ext = exportFormat === 'json' ? 'json' : 'csv';
    const blob = new Blob([text], { type: exportFormat === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `i18n-keys.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput('');
    setKeys([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Languages className="w-6 h-6 mr-2 text-blue-600" />
          本地化字符串提取
        </h2>
        <p className="text-slate-500 mt-1">
          粘贴代码，用正则提取 i18n(&quot;key&quot;)、t(&quot;key&quot;)、L[&quot;key&quot;] 等模式的 key，导出为 JSON/CSV。
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm font-medium text-slate-700 mb-2">支持的匹配模式</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {PATTERNS.map((p) => (
            <span key={p.name} className="px-2 py-1 bg-white rounded border border-slate-200 font-mono text-slate-600">
              {p.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">粘贴代码</span>
            <Button variant="outline" size="sm" onClick={extract}>
              <FileCode className="w-4 h-4 mr-1.5" /> 提取
            </Button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此粘贴包含 i18n/t/L 等调用的代码..."
            className="min-h-[320px] flex-1 p-4 font-mono text-sm bg-white border border-slate-200 rounded-b-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center flex-wrap gap-2">
            <span className="text-sm font-medium text-slate-600">提取结果 ({keys.length} 个 key)</span>
            <div className="flex items-center gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
                aria-label="导出格式"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={handleCopy}
                disabled={!keys.length}
                className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {copied ? <Check className="w-4 h-4 mr-1.5 text-green-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
                {copied ? '已复制' : '复制'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!keys.length}
                className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-1.5" /> 下载
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-[320px] p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-b-xl overflow-auto">
            {keys.length > 0 ? (
              <pre className="whitespace-pre-wrap break-words text-slate-700">{getExportText()}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                点击「提取」后在此查看结果
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={extract}>
          <FileCode className="w-4 h-4 mr-2" /> 提取 Key
        </Button>
        <Button variant="outline" onClick={handleClear} className="border-red-200 text-red-600 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-2" /> 清空
        </Button>
      </div>
    </div>
  );
};

export default LocalizationExtractor;
