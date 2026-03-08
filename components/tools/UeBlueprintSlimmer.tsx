import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Minimize2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

type Notice = {
  type: 'success' | 'error';
  text: string;
} | null;

const IGNORE_DEFAULT_VALUES = new Set([
  '',
  'None',
  'true',
  'false',
  '0',
  '0.0',
  '0.000000',
]);

const formatCount = (value: number) => value.toLocaleString('zh-CN');

const extractFirstLinkedTarget = (raw: string) => {
  const firstTarget = raw.split(',')[0]?.trim();
  if (!firstTarget) return '';

  const cleaned = firstTarget.replace(/"/g, '');
  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]}.${parts[1]}`;
  }

  return cleaned;
};

const extractDisplayText = (raw: string) => {
  const quotedValues = Array.from(raw.matchAll(/"([^"]*)"/g)).map(match => match[1]);
  return quotedValues.length > 0 ? quotedValues[quotedValues.length - 1] : raw.trim();
};

const UeBlueprintSlimmer: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(null), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const stats = useMemo(() => {
    const inputChars = input.length;
    const outputChars = output.length;
    const reductionChars = Math.max(inputChars - outputChars, 0);
    const reductionRatio = inputChars > 0 ? (reductionChars / inputChars) * 100 : 0;

    return {
      inputChars,
      outputChars,
      reductionChars,
      reductionRatio,
    };
  }, [input, output]);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
  };

  const slimDown = () => {
    const source = input.trim();
    if (!source) {
      setOutput('');
      showNotice('error', '请先粘贴 UE 蓝图复制出来的 T3D 文本');
      return;
    }

    const objects = source.split(/Begin Object/g);
    const results: string[] = [];

    objects.forEach((objectBlock) => {
      const obj = objectBlock.trim();
      if (!obj) return;

      const nameMatch = obj.match(/Name="(.*?)"/);
      if (!nameMatch) return;

      const classNameMatch = obj.match(/Class=([^\s]+)/);
      const nodeName = nameMatch[1];
      const nodeDetails: string[] = [];

      if (classNameMatch?.[1]) {
        nodeDetails.push(`Type: ${classNameMatch[1]}`);
      }

      const memberNameMatch = obj.match(/MemberName="(.*?)"/);
      if (memberNameMatch?.[1]) {
        nodeDetails.push(`Call: ${memberNameMatch[1]}`);
      }

      const customFunctionMatch = obj.match(/CustomFunctionName="(.*?)"/);
      if (customFunctionMatch?.[1]) {
        nodeDetails.push(`Event: ${customFunctionMatch[1]}`);
      }

      const inputKeyMatch = obj.match(/InputKey=([^\r\n]+)/);
      if (inputKeyMatch?.[1]) {
        nodeDetails.push(`Key: ${inputKeyMatch[1].trim()}`);
      }

      let nodeBlock = `NODE: ${nodeName}`;
      if (nodeDetails.length > 0) {
        nodeBlock += ` [${nodeDetails.join(' | ')}]`;
      }
      nodeBlock += '\n';

      const pinSections = obj.split('CustomProperties Pin');
      pinSections.shift();

      pinSections.forEach((pinSection) => {
        const pinNameMatch = pinSection.match(/PinName="(.*?)"/);
        if (!pinNameMatch?.[1]) return;

        const pinName = pinNameMatch[1];
        const details: string[] = [];

        const linkMatch = pinSection.match(/LinkedTo=\((.*?)\)/s);
        if (linkMatch?.[1]) {
          const target = extractFirstLinkedTarget(linkMatch[1]);
          if (target) {
            details.push(`--> ${target}`);
          }
        }

        const defaultValueMatch = pinSection.match(/DefaultValue="(.*?)"/);
        if (defaultValueMatch) {
          const value = defaultValueMatch[1].trim();
          if (!IGNORE_DEFAULT_VALUES.has(value)) {
            details.push(`Val: ${value}`);
          }
        }

        const defaultTextValueMatch = pinSection.match(/DefaultTextValue=(.*?)(?:,\s*[A-Za-z]+=|\)\s*$)/s);
        if (defaultTextValueMatch?.[1]) {
          const textValue = extractDisplayText(defaultTextValueMatch[1]);
          if (textValue && textValue !== '""') {
            details.push(`Text: "${textValue}"`);
          }
        }

        if (details.length > 0) {
          nodeBlock += `  - ${pinName}: ${details.join(' | ')}\n`;
        }
      });

      results.push(nodeBlock.trimEnd());
    });

    const slimmed = results.join('\n\n');
    setOutput(slimmed);

    if (slimmed) {
      showNotice('success', `已完成瘦身，提取 ${results.length} 个节点摘要`);
    } else {
      showNotice('error', '未识别到可用节点，请确认粘贴内容是否为 UE 蓝图复制文本');
    }
  };

  const copyToClipboard = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      showNotice('success', '结果已复制到剪贴板');
    } catch {
      showNotice('error', '复制失败，请手动复制');
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setNotice(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center text-2xl font-bold text-slate-900">
            <Minimize2 className="mr-2 h-6 w-6 text-blue-600" />
            UE 蓝图 Token 瘦身
          </h2>
          <p className="mt-1 text-slate-500">
            粘贴 UE 蓝图复制出的 T3D 文本，提炼节点关系和关键字段，减少上下文占用。
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          本地浏览器处理，不会上传任何内容
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">原始字符数</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{formatCount(stats.inputChars)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">瘦身后字符数</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{formatCount(stats.outputChars)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-500">减少字符数</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{formatCount(stats.reductionChars)}</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="text-sm text-blue-700">瘦身比例</div>
          <div className="mt-2 text-2xl font-bold text-blue-700">
            {stats.inputChars > 0 ? `${stats.reductionRatio.toFixed(1)}%` : '--'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={slimDown}>
          <Minimize2 className="mr-2 h-4 w-4" />
          立即瘦身
        </Button>
        <Button variant="outline" onClick={copyToClipboard} disabled={!output}>
          <Copy className="mr-2 h-4 w-4" />
          复制结果
        </Button>
        <Button
          variant="outline"
          onClick={clearAll}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          清空
        </Button>

        <div className="ml-auto text-sm text-slate-500">
          建议直接粘贴从 UE 蓝图中复制出的原始文本
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-2">
        {notice && (
          <div
            className={`absolute right-0 top-0 z-10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm shadow-lg ${
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

        <div className="flex min-h-[480px] flex-col">
          <div className="rounded-t-xl border border-b-0 border-slate-200 bg-slate-100 px-4 py-3">
            <div className="text-sm font-medium text-slate-700">输入</div>
            <div className="mt-1 text-xs text-slate-500">粘贴原始 T3D 文本</div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在 UE 中选中节点并 Ctrl+C，然后在此处 Ctrl+V"
            className="min-h-[480px] flex-1 resize-none rounded-b-xl border border-slate-200 bg-white p-4 font-mono text-sm leading-6 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            spellCheck={false}
          />
        </div>

        <div className="flex min-h-[480px] flex-col">
          <div className="rounded-t-xl border border-b-0 border-slate-200 bg-slate-100 px-4 py-3">
            <div className="text-sm font-medium text-slate-700">输出</div>
            <div className="mt-1 text-xs text-slate-500">精简后的逻辑摘要</div>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="点击“立即瘦身”后在这里查看结果..."
            className="min-h-[480px] flex-1 resize-none rounded-b-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-emerald-700 outline-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};

export default UeBlueprintSlimmer;
