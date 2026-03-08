import React, { useEffect, useState } from 'react';
import { Sparkles, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

const STORAGE_KEY = 'ds_api_key';

const PromptOptimizer: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [userInput, setUserInput] = useState('');
  const [optimizedResult, setOptimizedResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
  };

  const optimizePrompt = async () => {
    const key = apiKey.trim();
    const input = userInput.trim();

    if (!key) {
      showNotice('error', '请输入 DeepSeek API Key');
      return;
    }
    if (!input) {
      showNotice('error', '请输入提问内容');
      return;
    }

    localStorage.setItem(STORAGE_KEY, key);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);

    setIsLoading(true);
    setOptimizedResult('');

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                '你是一个提示词优化专家。你的任务是将用户口语化、表达模糊的提问转化为专业、术语准确、逻辑清晰的提问。只输出优化后的文本，不要有任何解释。如果用户输入的是技术领域，请确保使用正确的专业术语。',
            },
            {
              role: 'user',
              content: `优化以下提问：\n\n"${input}"`,
            },
          ],
          temperature: 0.6,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const result = data.choices[0].message.content.replace(/^"|"$/g, '');
      setOptimizedResult(result);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '请求失败';
      showNotice('error', `错误: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!optimizedResult) return;
    try {
      await navigator.clipboard.writeText(optimizedResult);
      setCopySuccess(true);
      showNotice('success', '优化后的内容已复制到剪贴板');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      showNotice('error', '复制失败，请手动复制');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center text-2xl font-bold text-slate-900">
            <Sparkles className="mr-2 h-6 w-6 text-blue-600" />
            DeepSeek 提示词优化器
          </h2>
          <p className="mt-1 text-slate-500">
            输入随口一问，获取专业、术语准确、逻辑清晰的 Prompt。
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          需配置 DeepSeek API Key，Key 仅保存在浏览器本地
        </div>
      </div>

      <div className="space-y-6">
        {/* API Key */}
        <div>
          <div className="mb-1 flex justify-between">
            <label className="text-sm font-medium text-slate-700">DeepSeek API Key</label>
            {saveStatus && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> 已保存到本地
              </span>
            )}
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-[10px] text-slate-400">
            * Key 将保存在浏览器本地缓存中，不会上传至其他服务器。
          </p>
        </div>

        {/* User Input */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">原始提问</label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={4}
            placeholder="在此输入你的想法..."
            className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Button */}
        <Button onClick={optimizePrompt} isLoading={isLoading} className="w-full sm:w-auto">
          <Sparkles className="mr-2 h-4 w-4" />
          立即优化
        </Button>

        {/* Result */}
        {optimizedResult && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              优化后的提问：
            </label>
            <div className="relative group">
              <div className="rounded-lg border border-blue-100 bg-slate-50 p-4 pr-12 italic leading-relaxed text-slate-800">
                {optimizedResult}
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="absolute right-2 top-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:bg-blue-50"
                title="复制"
              >
                {copySuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notice Toast */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg ${
            notice.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {notice.text}
        </div>
      )}
    </div>
  );
};

export default PromptOptimizer;
