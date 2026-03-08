import React, { useState } from 'react';
import { FileCode, AlignLeft, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

const LuaFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const checkBrackets = (code: string): string | null => {
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];
    const open = new Set(Object.keys(pairs));
    const close = new Set(Object.values(pairs));
    let inString = false;
    let stringChar = '';
    let i = 0;
    while (i < code.length) {
      const c = code[i];
      if (inString) {
        if (c === '\\' && i + 1 < code.length) i++;
        else if (c === stringChar) inString = false;
        i++;
        continue;
      }
      if ((c === '"' || c === "'") && (i === 0 || code[i - 1] !== '\\')) {
        inString = true;
        stringChar = c;
        i++;
        continue;
      }
      if (c === '-' && code.slice(i, i + 2) === '--') {
        const nl = code.indexOf('\n', i);
        i = nl === -1 ? code.length : nl + 1;
        continue;
      }
      if (open.has(c)) stack.push(pairs[c]);
      else if (close.has(c)) {
        if (stack.pop() !== c) return `括号不匹配: 多余的 '${c}'`;
      }
      i++;
    }
    if (stack.length > 0) return `括号不匹配: 缺少 '${stack[stack.length - 1]}'`;
    return null;
  };

  const formatLua = (code: string, indent = 2): string => {
    const spaces = ' '.repeat(indent);
    let result = '';
    let level = 0;
    const lines = code.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) {
        result += '\n';
        continue;
      }
      const closeMatch = trimmed.match(/^(\s*)(end|until|elseif|else)\b/);
      if (closeMatch) level = Math.max(0, level - 1);
      result += spaces.repeat(level) + trimmed + '\n';
      const openMatch = trimmed.match(/\b(do|then|function|repeat)\s*$/);
      if (openMatch) level++;
      if (/^\s*(if|for|while)\b/.test(trimmed) && !trimmed.includes('then') && !trimmed.includes('do')) level++;
    }
    return result.trimEnd();
  };

  const handleFormat = () => {
    if (!input.trim()) {
      setError(null);
      setOutput('');
      return;
    }
    const bracketError = checkBrackets(input);
    if (bracketError) {
      setError(bracketError);
      setOutput('');
      return;
    }
    try {
      setOutput(formatLua(input, 2));
      setError(null);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message);
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
          <FileCode className="w-6 h-6 mr-2 text-blue-600" />
          Lua 格式化
        </h2>
        <p className="text-slate-500 mt-1">
          格式化 Lua 代码（2 空格缩进），并进行简单的括号匹配检查。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        <div className="flex flex-col h-full">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">输入</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleFormat} className="flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4" /> 格式化
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear} className="text-red-600 hover:bg-red-50 hover:border-red-200">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请在此粘贴 Lua 代码..."
            className={`flex-1 w-full p-4 font-mono text-sm bg-white border border-slate-200 rounded-b-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none custom-scrollbar ${error ? 'border-red-300' : ''}`}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col h-full relative">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">输出</span>
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!output} className="flex items-center gap-1.5">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制'}
            </Button>
          </div>
          <div className={`flex-1 w-full p-4 font-mono text-sm bg-slate-50 border border-slate-200 rounded-b-xl overflow-auto custom-scrollbar`}>
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-red-600 animate-in fade-in">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <h3 className="font-semibold">语法检查失败</h3>
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

export default LuaFormatter;
