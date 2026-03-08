import React, { useState, useRef } from 'react';
import { Languages, Upload, Download, AlertTriangle, CheckCircle, FileJson } from 'lucide-react';
import Button from '../ui/Button';

interface LangData {
  [key: string]: string;
}

const TranslationMissingChecker: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [langFiles, setLangFiles] = useState<Record<string, LangData>>({});
  const [langNames, setLangNames] = useState<string[]>([]);
  const [baseLang, setBaseLang] = useState<string>('');
  const [missingReport, setMissingReport] = useState<Record<string, string[]> | null>(null);

  const parseJson = (text: string): LangData | null => {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null) return null;
      const result: LangData = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') result[k] = v;
      }
      return result;
    } catch {
      return null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: Record<string, LangData> = { ...langFiles };
    const names: string[] = [...new Set([...langNames])];

    Array.from(files).forEach((file) => {
      const name = file.name.replace(/\.(json|jsonc)$/i, '') || file.name;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const data = parseJson(text);
        if (data) {
          newFiles[name] = data;
          if (!names.includes(name)) names.push(name);
          setLangFiles({ ...newFiles });
          setLangNames([...names]);
          if (!baseLang) setBaseLang(name);
          setMissingReport(null);
        }
      };
      reader.readAsText(file, 'UTF-8');
    });
    e.target.value = '';
  };

  const checkMissing = () => {
    if (Object.keys(langFiles).length < 2 || !baseLang || !langFiles[baseLang]) {
      setMissingReport(null);
      return;
    }

    const baseKeys = new Set(Object.keys(langFiles[baseLang]));
    const report: Record<string, string[]> = {};

    for (const [lang, data] of Object.entries(langFiles)) {
      if (lang === baseLang) continue;
      const missing: string[] = [];
      baseKeys.forEach((k) => {
        if (!(k in data) || data[k].trim() === '') missing.push(k);
      });
      if (missing.length > 0) report[lang] = missing.sort();
    }

    setMissingReport(report);
  };

  const allKeys = baseLang ? Object.keys(langFiles[baseLang] || {}) : [];
  const totalMissing = missingReport
    ? Object.values(missingReport).reduce((s, arr) => s + arr.length, 0)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Languages className="w-6 h-6 mr-2 text-blue-600" />
          翻译缺失检测
        </h2>
        <p className="text-slate-500 mt-1">
          上传多语言 JSON 文件，以基准语言为参照，检测各语言缺失的 key。
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.jsonc"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            aria-label="上传多语言 JSON 文件"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            上传 JSON 文件
          </Button>
          {langNames.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">基准语言：</span>
                <select
                  value={baseLang}
                  onChange={(e) => {
                    setBaseLang(e.target.value);
                    setMissingReport(null);
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                  aria-label="选择基准语言"
                >
                  {langNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="outline" onClick={checkMissing}>
                <FileJson className="w-4 h-4 mr-2" />
                开始检测
              </Button>
            </>
          )}
        </div>

        {langNames.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">
              已加载：{langNames.join(', ')}（共 {allKeys.length} 个 key）
            </p>
          </div>
        )}

        {missingReport && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-800">检测结果</span>
              {totalMissing === 0 ? (
                <span className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" /> 无缺失
                </span>
              ) : (
                <span className="flex items-center text-amber-600 text-sm">
                  <AlertTriangle className="w-4 h-4 mr-1" /> 共 {totalMissing} 处缺失
                </span>
              )}
            </div>
            <div className="p-4 space-y-4 max-h-96 overflow-auto">
              {Object.entries(missingReport).map(([lang, keys]) => (
                <div key={lang} className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                    {lang}（缺失 {keys.length} 个）
                  </h4>
                  <ul className="text-sm text-slate-600 font-mono space-y-1 max-h-32 overflow-auto">
                    {keys.map((k) => (
                      <li key={k}>• {k}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationMissingChecker;
