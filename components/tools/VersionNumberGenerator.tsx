import React, { useState } from 'react';
import { Tag, Copy, Check } from 'lucide-react';
import Button from '../ui/Button';

const VersionNumberGenerator: React.FC = () => {
  const [major, setMajor] = useState(1);
  const [minor, setMinor] = useState(0);
  const [patch, setPatch] = useState(0);
  const [suffix, setSuffix] = useState<'none' | 'alpha' | 'beta' | 'rc'>('none');
  const [suffixNum, setSuffixNum] = useState(1);
  const [copied, setCopied] = useState(false);

  const buildVersion = (): string => {
    let v = `${major}.${minor}.${patch}`;
    if (suffix !== 'none') {
      v += `-${suffix}.${suffixNum}`;
    }
    return v;
  };

  const version = buildVersion();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(version);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Tag className="w-6 h-6 mr-2 text-blue-600" />
          版本号生成器
        </h2>
        <p className="text-slate-500 mt-1">输入 major.minor.patch，生成语义化版本号，支持 alpha/beta/rc 等预发布后缀。</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Major</label>
            <input
              type="number"
              min={0}
              value={major}
              onChange={(e) => setMajor(Math.max(0, parseInt(e.target.value) || 0))}
              aria-label="Major 版本号"
              className="w-full pl-4 py-3 font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Minor</label>
            <input
              type="number"
              min={0}
              value={minor}
              onChange={(e) => setMinor(Math.max(0, parseInt(e.target.value) || 0))}
              aria-label="Minor 版本号"
              className="w-full pl-4 py-3 font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patch</label>
            <input
              type="number"
              min={0}
              value={patch}
              onChange={(e) => setPatch(Math.max(0, parseInt(e.target.value) || 0))}
              aria-label="Patch 版本号"
              className="w-full pl-4 py-3 font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">预发布后缀</label>
            <select
              value={suffix}
              onChange={(e) => setSuffix(e.target.value as typeof suffix)}
              aria-label="预发布后缀"
              className="w-full pl-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">无</option>
              <option value="alpha">alpha</option>
              <option value="beta">beta</option>
              <option value="rc">rc</option>
            </select>
          </div>
          {suffix !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">后缀序号</label>
              <input
                type="number"
                min={1}
                value={suffixNum}
                onChange={(e) => setSuffixNum(Math.max(1, parseInt(e.target.value) || 1))}
                aria-label="后缀序号"
                className="w-full pl-4 py-3 font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        <div className="relative border-t border-slate-200 pt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">生成的版本号</label>
          <input
            type="text"
            readOnly
            value={version}
            aria-label="生成的版本号"
            className="w-full pl-4 pr-12 py-3 font-mono text-lg bg-slate-50 border border-slate-300 rounded-lg"
          />
          <button
            onClick={copyToClipboard}
            className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionNumberGenerator;
