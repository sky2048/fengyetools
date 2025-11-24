import React, { useState, useEffect } from 'react';
import { Scroll, Languages, Copy, Check, ArrowRightLeft, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { encryptBaijiaxing, decryptBaijiaxing, encryptBuddha, decryptBuddha } from '../../utils/cipherUtils';

interface CipherToolProps {
  type: 'baijiaxing' | 'buddha';
}

const CipherTool: React.FC<CipherToolProps> = ({ type }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Reset state when tool type changes (e.g. navigating from Baijiaxing to Buddha)
  useEffect(() => {
    setInput('');
    setOutput('');
    setMode('encrypt');
    setCopied(false);
  }, [type]);

  const config = {
    baijiaxing: {
      title: '百家姓加密',
      desc: '将文本内容隐藏在百家姓序列中。',
      icon: Languages,
      placeholderInput: '请输入要加密的普通文本...',
      placeholderDecrypt: '请输入“百家姓：”开头的密文...',
      encryptFn: encryptBaijiaxing,
      decryptFn: decryptBaijiaxing
    },
    buddha: {
      title: '佛曰加密',
      desc: '将文本混淆为看似佛经的字符序列。',
      icon: Scroll,
      placeholderInput: '请输入要加密的普通文本...',
      placeholderDecrypt: '请输入“佛曰：”开头的密文...',
      encryptFn: encryptBuddha,
      decryptFn: decryptBuddha
    }
  };

  const currentConfig = config[type];
  const Icon = currentConfig.icon;

  const handleProcess = () => {
    if (!input.trim()) return;
    
    if (mode === 'encrypt') {
      setOutput(currentConfig.encryptFn(input));
    } else {
      setOutput(currentConfig.decryptFn(input));
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'encrypt' ? 'decrypt' : 'encrypt');
    setInput('');
    setOutput('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <Icon className="w-6 h-6 mr-2 text-blue-600" />
            {currentConfig.title}
          </h2>
          <p className="text-slate-500 mt-1">{currentConfig.desc}</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-lg flex items-center">
            <button
                onClick={() => setMode('encrypt')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'encrypt' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                加密
            </button>
            <button
                onClick={() => setMode('decrypt')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'decrypt' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                解密
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm text-base"
            placeholder={mode === 'encrypt' ? currentConfig.placeholderInput : currentConfig.placeholderDecrypt}
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
             <Button size="sm" onClick={handleProcess}>
                {mode === 'encrypt' ? '执行加密' : '执行解密'}
             </Button>
          </div>
        </div>

        <div className="relative bg-slate-50 rounded-xl border border-slate-200 min-h-[160px] p-4">
            <div className="absolute top-0 left-0 px-3 py-1 bg-slate-200 rounded-br-lg text-xs font-medium text-slate-600">
                结果
            </div>
            {output ? (
                <p className="pt-6 text-slate-800 break-all whitespace-pre-wrap leading-relaxed">{output}</p>
            ) : (
                <p className="pt-6 text-slate-400 text-sm italic">结果将显示在这里...</p>
            )}
            
            {output && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                        onClick={() => { setInput(''); setOutput(''); }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="清空"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 mr-1 text-green-600" /> 已复制
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-1" /> 复制结果
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CipherTool;