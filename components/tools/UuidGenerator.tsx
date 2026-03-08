import React, { useState } from 'react';
import { Fingerprint, RefreshCw, Copy, Check } from 'lucide-react';
import Button from '../ui/Button';

const generateUuidV4 = (): string => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  array[6] = (array[6]! & 0x0f) | 0x40;
  array[8] = (array[8]! & 0x3f) | 0x80;
  const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const UuidGenerator: React.FC = () => {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = () => {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      list.push(generateUuidV4());
    }
    setUuids(list);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    if (uuids.length === 0) return;
    navigator.clipboard.writeText(uuids.join('\n'));
    setCopied(-1);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Fingerprint className="w-6 h-6 mr-2 text-blue-600" />
          UUID/GUID 生成
        </h2>
        <p className="text-slate-500 mt-1">一键生成符合 RFC 4122 的 UUID v4，支持批量生成与复制。</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">生成数量</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              aria-label="生成数量"
              className="w-20 pl-3 pr-2 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button onClick={generate}>
            <RefreshCw className="w-4 h-4 mr-2" /> 生成
          </Button>
          {uuids.length > 0 && (
            <Button onClick={copyAll} variant="outline">
              {copied === -1 ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied === -1 ? '已复制全部' : '复制全部'}
            </Button>
          )}
        </div>

        {uuids.length > 0 && (
          <div className="space-y-2">
            {uuids.map((uuid, i) => (
              <div key={i} className="relative flex items-center group">
                <input
                  type="text"
                  readOnly
                  value={uuid}
                  aria-label={`UUID ${i + 1}`}
                  className="w-full pl-4 pr-12 py-3 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
                <button
                  onClick={() => copyToClipboard(uuid, i)}
                  className="absolute right-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  {copied === i ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {uuids.length === 0 && (
          <p className="text-slate-400 text-center py-8">点击「生成」按钮创建 UUID</p>
        )}
      </div>
    </div>
  );
};

export default UuidGenerator;
