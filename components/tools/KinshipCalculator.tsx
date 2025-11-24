import React, { useState } from 'react';
import { Users, Delete, Trash2, User } from 'lucide-react';
import { getKinshipTitle, BUTTONS } from '../../utils/kinshipData';

const KinshipCalculator: React.FC = () => {
  const [chain, setChain] = useState<string[]>([]);
  const [result, setResult] = useState('');

  const handleAdd = (id: string) => {
    const newChain = [...chain, id];
    setChain(newChain);
    updateResult(newChain);
  };

  const handleBack = () => {
    const newChain = chain.slice(0, -1);
    setChain(newChain);
    updateResult(newChain);
  };

  const handleClear = () => {
    setChain([]);
    setResult('');
  };

  const updateResult = (currentChain: string[]) => {
    if (currentChain.length === 0) {
      setResult('');
    } else {
      setResult(getKinshipTitle(currentChain));
    }
  };

  const getChainLabel = () => {
    if (chain.length === 0) return '我';
    let text = '我';
    chain.forEach(id => {
      const btn = BUTTONS.find(b => b.id === id);
      if (btn) text += ` 的 ${btn.label}`;
    });
    return text;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Users className="w-6 h-6 mr-2 text-blue-600" />
          亲戚称呼计算器
        </h2>
        <p className="text-slate-500 mt-1">逢年过节必备，快速查询复杂的亲戚关系称呼。</p>
      </div>

      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Screen */}
        <div className="bg-slate-50 p-6 border-b border-slate-200 min-h-[140px] flex flex-col justify-between">
          <div className="text-slate-500 text-sm break-words leading-relaxed">
            {getChainLabel()}
          </div>
          <div className="text-right">
            {result ? (
              <span className="text-3xl font-bold text-blue-600">{result}</span>
            ) : (
              <span className="text-3xl font-bold text-slate-300">等待计算</span>
            )}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 grid grid-cols-4 gap-3">
          {BUTTONS.map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleAdd(btn.id)}
              className="aspect-square rounded-xl bg-white border border-slate-200 shadow-sm text-lg font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition-all"
            >
              {btn.label}
            </button>
          ))}
          
          <button
            onClick={handleBack}
            className="aspect-square rounded-xl bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 flex items-center justify-center active:scale-95 transition-all"
          >
            <Delete className="w-6 h-6" />
          </button>
          
          <button
            onClick={handleClear}
            className="col-span-1 aspect-square rounded-xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 flex items-center justify-center active:scale-95 transition-all"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-6 pb-4 text-xs text-slate-400 text-center">
           支持三代以内的常见直系与旁系血亲查询
        </div>
      </div>
    </div>
  );
};

export default KinshipCalculator;