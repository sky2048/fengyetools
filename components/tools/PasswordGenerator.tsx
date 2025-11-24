import React, { useState, useEffect } from 'react';
import { KeyRound, RefreshCw, Copy, Check, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    let chars = "";
    if (useUpper) chars += upper;
    if (useLower) chars += lower;
    if (useNumbers) chars += numbers;
    if (useSymbols) chars += symbols;

    if (!chars) {
        setPassword('');
        return;
    }

    let result = "";
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += chars.charAt(array[i] % chars.length);
    }
    setPassword(result);
  };

  // Auto generate on settings change
  useEffect(() => {
    generatePassword();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, useUpper, useLower, useNumbers, useSymbols]);

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrengthColor = () => {
      if (!password) return 'bg-slate-200';
      let score = 0;
      if (length > 8) score++;
      if (length > 12) score++;
      if (useUpper && useLower) score++;
      if (useNumbers) score++;
      if (useSymbols) score++;
      
      if (score < 3) return 'bg-red-500';
      if (score < 5) return 'bg-yellow-500';
      return 'bg-green-500';
  };

  const getStrengthText = () => {
      if (!password) return '';
      let score = 0;
      if (length > 8) score++;
      if (length > 12) score++;
      if (useUpper && useLower) score++;
      if (useNumbers) score++;
      if (useSymbols) score++;
      
      if (score < 3) return '弱';
      if (score < 5) return '中';
      return '强';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <KeyRound className="w-6 h-6 mr-2 text-blue-600" />
          随机密码生成
        </h2>
        <p className="text-slate-500 mt-1">生成包含大小写、数字、符号的高强度随机密码，保障账户安全。</p>
      </div>

      <div className="max-w-2xl mx-auto">
          {/* Display Area */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-300 ${getStrengthColor()}`}></div>
              
              <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">生成的密码</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${getStrengthColor()}`}>
                      强度: {getStrengthText()}
                  </span>
              </div>
              
              <div className="font-mono text-2xl md:text-3xl text-slate-800 break-all py-4 min-h-[80px] flex items-center">
                  {password || <span className="text-slate-300 text-lg">请选择至少一种字符类型</span>}
              </div>

              <div className="flex gap-4 mt-4 border-t border-slate-100 pt-4">
                  <Button onClick={generatePassword} variant="outline" className="flex-1">
                      <RefreshCw className="w-4 h-4 mr-2" /> 重新生成
                  </Button>
                  <Button onClick={copyToClipboard} className="flex-1">
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? '已复制' : '复制密码'}
                  </Button>
              </div>
          </div>

          {/* Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
              <div>
                  <div className="flex justify-between mb-2">
                      <label className="font-medium text-slate-700">密码长度</label>
                      <span className="font-mono text-blue-600 font-bold">{length}</span>
                  </div>
                  <input 
                      type="range" 
                      min="6" max="64" 
                      value={length} 
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                      <span className="ml-3 text-slate-700">大写字母 (A-Z)</span>
                  </label>
                  <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                      <span className="ml-3 text-slate-700">小写字母 (a-z)</span>
                  </label>
                  <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                      <span className="ml-3 text-slate-700">数字 (0-9)</span>
                  </label>
                  <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                      <span className="ml-3 text-slate-700">特殊符号 (!@#)</span>
                  </label>
              </div>
          </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;