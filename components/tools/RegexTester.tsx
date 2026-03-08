import React, { useState, useMemo } from 'react';
import { Regex, Trash2, List } from 'lucide-react';
import Button from '../ui/Button';

const RegexTester: React.FC = () => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('');

  const { regexError, matches, captureGroups } = useMemo(() => {
    if (!pattern.trim()) {
      return { regexError: null, matches: [], captureGroups: [] };
    }
    try {
      const re = new RegExp(pattern, flags);
      const matches: RegExpExecArray[] = [];
      let m;
      const re2 = new RegExp(pattern, flags);
      while ((m = re2.exec(testText)) !== null) {
        matches.push([...m] as RegExpExecArray);
        if (!flags.includes('g')) break;
      }
      const groups: string[][] = matches.map((m) => m.slice(1).filter(Boolean));
      return { regexError: null, matches, captureGroups: groups };
    } catch (e: unknown) {
      const err = e as Error;
      return { regexError: err.message, matches: [], captureGroups: [] };
    }
  }, [pattern, flags, testText]);

  const highlightedHtml = useMemo(() => {
    if (regexError || !pattern.trim() || !testText) return null;
    try {
      const reFlags = flags.includes('g') ? flags : flags + 'g';
      const re = new RegExp(pattern, reFlags);
      const escaped = testText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return escaped.replace(re, (match) => `<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5">${match.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</mark>`);
    } catch {
      return null;
    }
  }, [pattern, flags, testText, regexError]);

  const handleClear = () => {
    setPattern('');
    setFlags('g');
    setTestText('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Regex className="w-6 h-6 mr-2 text-blue-600" />
          正则表达式测试
        </h2>
        <p className="text-slate-500 mt-1">
          输入正则表达式和标志，实时高亮匹配结果，显示捕获组列表。
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-600 mb-1">正则表达式</label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="例如: \d+|\w+"
              className={`w-full px-3 py-2 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${regexError ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-slate-600 mb-1">标志</label>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              placeholder="gi"
              className="w-full px-3 py-2 font-mono text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={handleClear} className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200">
              <Trash2 className="w-4 h-4" />
              清空
            </Button>
          </div>
        </div>
        {regexError && (
          <div className="text-red-600 text-sm flex items-center gap-2">
            <span className="font-medium">正则错误:</span>
            {regexError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0">
            <span className="text-sm font-medium text-slate-600">测试文本</span>
          </div>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="在此输入要匹配的文本..."
            className="flex-1 min-h-[200px] w-full p-4 font-mono text-sm bg-white border border-slate-200 rounded-b-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none custom-scrollbar"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">匹配结果</span>
            {matches.length > 0 && (
              <span className="text-xs text-slate-500">共 {matches.length} 处匹配</span>
            )}
          </div>
          <div className="flex-1 min-h-[200px] w-full p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-b-xl overflow-auto custom-scrollbar">
            {highlightedHtml !== null ? (
              <pre className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic min-h-[180px]">
                {pattern.trim() ? '输入测试文本查看高亮' : '输入正则表达式开始测试'}
              </div>
            )}
          </div>
        </div>
      </div>

      {captureGroups.length > 0 && captureGroups.some((g) => g.length > 0) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 animate-in fade-in">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
            <List className="w-4 h-4" />
            捕获组
          </h3>
          <div className="space-y-2 max-h-48 overflow-auto custom-scrollbar">
            {captureGroups.map((groups, i) => (
              <div key={i} className="text-sm">
                <span className="text-slate-500 font-medium">匹配 #{i + 1}:</span>{' '}
                {groups.map((g, j) => (
                  <span key={j} className="inline-block bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 mr-1">
                    {g}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegexTester;
