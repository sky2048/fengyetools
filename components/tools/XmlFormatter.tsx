import React, { useState } from 'react';
import { FileCode, AlignLeft, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

const XmlFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validateXml = (xml: string): string | null => {
    const trimmed = xml.trim();
    if (!trimmed) return null;
    const tagStack: string[] = [];
    const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9:_-]*)\s*(\/)?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g;
    let m;
    while ((m = tagRe.exec(trimmed)) !== null) {
      const full = m[0];
      if (full.startsWith('<!--') || full.startsWith('<![CDATA[')) continue;
      if (full.endsWith('/>')) continue;
      const tagName = m[1];
      if (full.startsWith('</')) {
        const expected = tagStack.pop();
        if (expected !== tagName) return `标签不匹配: 期望 </${expected}>, 得到 </${tagName}>`;
      } else {
        tagStack.push(tagName);
      }
    }
    if (tagStack.length > 0) return `未闭合标签: <${tagStack[tagStack.length - 1]}>`;
    return null;
  };

  const formatXml = (xml: string, indent = 2): string => {
    const spaces = ' '.repeat(indent);
    let formatted = '';
    let level = 0;
    const regex = /(>)(<)(\/*)/g;
    xml = xml.replace(/\r?\n/g, '').replace(/\s+/g, ' ').trim();
    xml = xml.replace(regex, '$1\n$2$3');
    const parts = xml.split('\n');
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i].trim();
      if (!part) continue;
      const isClosing = /^<\//.test(part);
      const isSelfClosing = /\/>$/.test(part);
      if (isClosing) level = Math.max(0, level - 1);
      formatted += spaces.repeat(level) + part + '\n';
      if (!isClosing && !isSelfClosing && /<[a-zA-Z]/.test(part)) level++;
    }
    return formatted.trimEnd();
  };

  const handleFormat = () => {
    if (!input.trim()) {
      setError(null);
      setOutput('');
      return;
    }
    const validationError = validateXml(input);
    if (validationError) {
      setError(validationError);
      setOutput('');
      return;
    }
    try {
      setOutput(formatXml(input, 2));
      setError(null);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || '格式化失败');
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
          XML 格式化
        </h2>
        <p className="text-slate-500 mt-1">
          格式化 XML 文档（2 空格缩进），并进行基本的标签匹配验证。
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
            placeholder="请在此粘贴 XML..."
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
                <h3 className="font-semibold">格式验证失败</h3>
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

export default XmlFormatter;
