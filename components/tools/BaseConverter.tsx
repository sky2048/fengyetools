import React, { useState, useEffect } from 'react';
import { Binary, Copy, Check, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

const BaseConverter: React.FC = () => {
  // Store value as string to support large numbers/BigInt concept
  // However, for UI simplicity, we track the "source of truth" decimal value
  // But to allow "typing" invalid states momentarily, we might need individual states.
  // Let's try a unified state approach where we update all fields when one changes.
  
  const [bin, setBin] = useState('');
  const [oct, setOct] = useState('');
  const [dec, setDec] = useState('');
  const [hex, setHex] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Helper using BigInt for arbitrary precision
  const updateValues = (val: string, radix: number) => {
    setError(null);
    if (!val) {
      setBin('');
      setOct('');
      setDec('');
      setHex('');
      return;
    }

    try {
      // Remove spaces for flexibility
      const cleanVal = val.replace(/\s/g, '');
      
      // Check validity characters before parsing to avoid weird JS parseInt behavior
      const validChars = radix === 2 ? /^[01]+$/ 
                       : radix === 8 ? /^[0-7]+$/ 
                       : radix === 10 ? /^[0-9]+$/ 
                       : /^[0-9a-fA-F]+$/;
      
      if (!validChars.test(cleanVal)) {
         // Don't update other fields if invalid, but keep current field input to allow correction
         // Just throw to set error state visually if needed, but we want controlled inputs
         // Let's just allow typing and show error if strictly invalid
         throw new Error("Invalid characters");
      }

      const bigVal = BigInt(parseInt(cleanVal, radix)); // Use BigInt constructor directly with prefix? No, standard parseInt handles prefixes well but BigInt() needs string like "0b..." for binary or just clean number string for decimal.
      
      // Better approach for BigInt parsing from arbitrary base:
      // BigInt doesn't support arbitrary radix parsing natively in constructor easily without 0x/0b/0o prefixes.
      // We can use standard parseInt for "safe integer range" or a library for huge numbers.
      // For a standard tool, standard JS parsing is often enough, but let's use a robust manual parse for BigInt if needed.
      // To keep it simple and dependency-free, let's stick to standard BigInt with `0x`/`0b`/`0o` injection for standard bases.
      
      let bn: bigint;
      if (radix === 10) {
          bn = BigInt(cleanVal);
      } else if (radix === 16) {
          bn = BigInt(`0x${cleanVal}`);
      } else if (radix === 8) {
          bn = BigInt(`0o${cleanVal}`);
      } else if (radix === 2) {
          bn = BigInt(`0b${cleanVal}`);
      } else {
          throw new Error("Unsupported radix");
      }

      // Update all
      if (radix !== 2) setBin(bn.toString(2));
      if (radix !== 8) setOct(bn.toString(8));
      if (radix !== 10) setDec(bn.toString(10));
      if (radix !== 16) setHex(bn.toString(16).toUpperCase());

    } catch (e) {
      // If invalid, we just don't update derived fields or clear them?
      // Better to clear derived fields to indicate invalidity
      if (radix !== 2) setBin('');
      if (radix !== 8) setOct('');
      if (radix !== 10) setDec('');
      if (radix !== 16) setHex('');
    }
  };

  const handleChange = (val: string, radix: number) => {
    // Update the specific input state immediately
    if (radix === 2) setBin(val);
    if (radix === 8) setOct(val);
    if (radix === 10) setDec(val);
    if (radix === 16) setHex(val);

    updateValues(val, radix);
  };

  const copyToClipboard = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const clearAll = () => {
    setBin('');
    setOct('');
    setDec('');
    setHex('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Binary className="w-6 h-6 mr-2 text-blue-600" />
          进制转换
        </h2>
        <p className="text-slate-500 mt-1">支持二进制、八进制、十进制、十六进制的实时双向转换。</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-3xl mx-auto">
         <div className="flex justify-end mb-4">
             <button 
                onClick={clearAll}
                className="text-sm text-red-500 hover:text-red-700 flex items-center px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
             >
                 <Trash2 className="w-4 h-4 mr-1" /> 清空
             </button>
         </div>

         <div className="space-y-6">
             {/* Binary */}
             <div className="relative">
                 <label className="block text-sm font-medium text-slate-700 mb-1">二进制 (Binary)</label>
                 <input
                    type="text"
                    value={bin}
                    onChange={(e) => handleChange(e.target.value, 2)}
                    className="w-full pl-4 pr-12 py-3 font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    placeholder="010101"
                 />
                 <button 
                    onClick={() => copyToClipboard(bin, 'bin')}
                    className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                 >
                    {copied === 'bin' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                 </button>
             </div>

             {/* Octal */}
             <div className="relative">
                 <label className="block text-sm font-medium text-slate-700 mb-1">八进制 (Octal)</label>
                 <input
                    type="text"
                    value={oct}
                    onChange={(e) => handleChange(e.target.value, 8)}
                    className="w-full pl-4 pr-12 py-3 font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    placeholder="755"
                 />
                 <button 
                    onClick={() => copyToClipboard(oct, 'oct')}
                    className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                 >
                    {copied === 'oct' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                 </button>
             </div>

             {/* Decimal */}
             <div className="relative">
                 <label className="block text-sm font-medium text-slate-700 mb-1">十进制 (Decimal)</label>
                 <input
                    type="text"
                    value={dec}
                    onChange={(e) => handleChange(e.target.value, 10)}
                    className="w-full pl-4 pr-12 py-3 font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                    placeholder="12345"
                 />
                 <button 
                    onClick={() => copyToClipboard(dec, 'dec')}
                    className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                 >
                    {copied === 'dec' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                 </button>
             </div>

             {/* Hexadecimal */}
             <div className="relative">
                 <label className="block text-sm font-medium text-slate-700 mb-1">十六进制 (Hexadecimal)</label>
                 <input
                    type="text"
                    value={hex}
                    onChange={(e) => handleChange(e.target.value, 16)}
                    className="w-full pl-4 pr-12 py-3 font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all uppercase"
                    placeholder="FF00"
                 />
                 <button 
                    onClick={() => copyToClipboard(hex, 'hex')}
                    className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                 >
                    {copied === 'hex' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                 </button>
             </div>
         </div>
         
         <div className="mt-6 text-xs text-slate-400 text-center">
             支持任意长度的大整数 (BigInt)
         </div>
      </div>
    </div>
  );
};

export default BaseConverter;