import React, { useState, useMemo } from 'react';
import { FileCode, Copy, Check, Download } from 'lucide-react';
import { marked } from 'marked';
import Button from '../ui/Button';

const MarkdownToHtml: React.FC = () => {
  const [markdown, setMarkdown] = useState('# Hello\n\n这是一段 **Markdown** 文本。');
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => {
    try {
      return marked.parse(markdown) as string;
    } catch {
      return '<p class="text-red-500">解析错误</p>';
    }
  }, [markdown]);

  const fullHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown 导出</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    pre { background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    code { background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 0.25rem; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #94a3b8; margin: 0; padding-left: 1rem; color: #64748b; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
  }, [html]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHtml = () => {
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markdown-export.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <FileCode className="w-6 h-6 mr-2 text-blue-600" />
          Markdown 转 HTML
        </h2>
        <p className="text-slate-500 mt-1">输入 Markdown 文本，实时渲染为 HTML，支持复制或下载完整页面。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">Markdown 输入</label>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full h-80 px-4 py-3 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="# 输入 Markdown..."
            spellCheck={false}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700">HTML 预览</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4 mr-1 text-green-600" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? '已复制' : '复制 HTML'}
              </Button>
              <Button size="sm" onClick={downloadHtml}>
                <Download className="w-4 h-4 mr-1" /> 下载
              </Button>
            </div>
          </div>
          <div
            className="w-full h-80 px-4 py-3 overflow-auto border border-slate-300 rounded-lg bg-white text-slate-800 prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarkdownToHtml;
