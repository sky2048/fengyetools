import React, { useState, useRef } from 'react';
import { Table2, Plus, Trash2, Upload, Download, Copy, Check } from 'lucide-react';
import Button from '../ui/Button';

type LangKey = string;
type LangCode = string;

const LocalizationTable: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [languages, setLanguages] = useState<LangCode[]>(['zh', 'en']);
  const [rows, setRows] = useState<Record<LangKey, Record<LangCode, string>>>({});
  const [newLang, setNewLang] = useState('');
  const [copied, setCopied] = useState(false);

  const addLanguage = () => {
    const code = newLang.trim().toLowerCase();
    if (code && !languages.includes(code)) {
      setLanguages([...languages, code]);
      setNewLang('');
    }
  };

  const removeLanguage = (code: LangCode) => {
    if (languages.length <= 1) return;
    setLanguages(languages.filter((l) => l !== code));
    setRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        const r = { ...next[k] };
        delete r[code];
        next[k] = r;
      });
      return next;
    });
  };

  const addRow = () => {
    const key = `key_${Date.now()}`;
    const init: Record<LangCode, string> = {};
    languages.forEach((l) => (init[l] = ''));
    setRows((prev) => ({ ...prev, [key]: init }));
  };

  const removeRow = (key: LangKey) => {
    setRows((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateCell = (key: LangKey, lang: LangCode, value: string) => {
    setRows((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [lang]: value },
    }));
  };

  const updateKey = (oldKey: LangKey, newKey: LangKey) => {
    if (oldKey === newKey) return;
    setRows((prev) => {
      const next = { ...prev };
      next[newKey] = next[oldKey] || {};
      delete next[oldKey];
      return next;
    });
  };

  const importJson = (text: string) => {
    try {
      const data = JSON.parse(text);
      if (typeof data !== 'object' || data === null) throw new Error('Invalid JSON');
      const flat: Record<string, Record<string, string>> = {};
      const flatten = (obj: any, prefix = '') => {
        for (const k of Object.keys(obj)) {
          const v = obj[k];
          const fullKey = prefix ? `${prefix}.${k}` : k;
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            const strKeys = Object.keys(v).filter((x) => typeof v[x] === 'string');
            if (strKeys.length > 0) {
              strKeys.forEach((lang) => {
                if (!languages.includes(lang)) setLanguages((l) => [...l, lang]);
              });
              flat[fullKey] = { ...v };
            } else {
              flatten(v, fullKey);
            }
          } else if (typeof v === 'string') {
            if (!languages.includes('zh')) setLanguages((l) => ['zh', ...l.filter((x) => x !== 'zh')]);
            flat[fullKey] = { zh: v };
          }
        }
      };
      flatten(data);
      setRows(Object.keys(flat).length > 0 ? flat : (data as Record<string, Record<string, string>>));
    } catch (e) {
      alert('JSON 解析失败：' + (e as Error).message);
    }
  };

  const importCsv = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return;
    const header = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
    const keyCol = header[0]?.toLowerCase() === 'key' ? 0 : 0;
    const langCols = header.slice(1);
    langCols.forEach((c) => {
      if (c && !languages.includes(c)) setLanguages((l) => [...l, c]);
    });
    const next: Record<string, Record<string, string>> = {};
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].match(/("(?:[^"]|"")*"|[^,]*)/g)?.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];
      const key = cells[keyCol] || `row_${i}`;
      next[key] = {};
      langCols.forEach((lang, j) => {
        next[key][lang] = cells[j + 1] || '';
      });
    }
    setRows(next);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.[0]) return;
    const f = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      if (f.name.endsWith('.json')) importJson(text);
      else if (f.name.endsWith('.csv')) importCsv(text);
      else alert('仅支持 .json 或 .csv 文件');
    };
    reader.readAsText(f, 'UTF-8');
    e.target.value = '';
  };

  const exportJson = () => {
    const obj: Record<string, Record<string, string>> = {};
    Object.entries(rows).forEach(([k, v]) => (obj[k] = v));
    return JSON.stringify(obj, null, 2);
  };

  const exportCsv = () => {
    const cols = ['key', ...languages];
    const lines = [cols.map((c) => `"${c}"`).join(',')];
    Object.entries(rows).forEach(([k, v]) => {
      const row = [k, ...languages.map((l) => `"${(v[l] || '').replace(/"/g, '""')}"`)];
      lines.push(row.join(','));
    });
    return lines.join('\n');
  };

  const handleDownload = (format: 'json' | 'csv') => {
    const text = format === 'json' ? exportJson() : exportCsv();
    const blob = new Blob([text], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localization.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (format: 'json' | 'csv') => {
    const text = format === 'json' ? exportJson() : exportCsv();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const keys = Object.keys(rows);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Table2 className="w-6 h-6 mr-2 text-blue-600" />
          多语言对照表
        </h2>
        <p className="text-slate-500 mt-1">管理 key-value 翻译表，支持多语言列（zh、en 等），导入/导出 CSV、JSON。</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="语言代码 (如 en)"
            value={newLang}
            onChange={(e) => setNewLang(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
            aria-label="语言代码"
            className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Button size="sm" onClick={addLanguage}>
            <Plus className="w-4 h-4 mr-1" /> 添加语言
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={handleFileImport}
          className="hidden"
          aria-label="导入 JSON 或 CSV 文件"
        />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-1" /> 导入 JSON/CSV
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleDownload('json')}>
            <Download className="w-4 h-4 mr-1" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload('csv')}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleCopy('json')}>
            {copied ? <Check className="w-4 h-4 mr-1 text-green-600" /> : <Copy className="w-4 h-4 mr-1" />}
            复制 JSON
          </Button>
        </div>
        <Button onClick={addRow}>
          <Plus className="w-4 h-4 mr-2" /> 添加行
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="text-left p-3 font-medium text-slate-700 w-48">Key</th>
              {languages.map((lang) => (
                <th key={lang} className="text-left p-3 font-medium text-slate-700 min-w-[160px]">
                  <div className="flex items-center justify-between">
                    {lang}
                    <button
                      onClick={() => removeLanguage(lang)}
                      disabled={languages.length <= 1}
                      className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 disabled:opacity-30"
                      title="移除语言"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={languages.length + 2} className="p-8 text-center text-slate-400">
                  暂无数据，点击「添加行」或导入文件
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-2">
                    <input
                      value={key}
                      onChange={(e) => updateKey(key, e.target.value)}
                      aria-label={`Key ${key}`}
                      className="w-full px-2 py-1.5 font-mono text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  {languages.map((lang) => (
                    <td key={lang} className="p-2">
                      <input
                        value={rows[key]?.[lang] ?? ''}
                        onChange={(e) => updateCell(key, lang, e.target.value)}
                        placeholder={`${lang}...`}
                        aria-label={`${key} - ${lang}`}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  ))}
                  <td className="p-2">
                    <button
                      onClick={() => removeRow(key)}
                      className="p-1.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                      title="删除行"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LocalizationTable;
