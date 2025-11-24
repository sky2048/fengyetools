import React, { useState, useMemo } from 'react';
import { Dog } from 'lucide-react';

type Size = 'small' | 'medium' | 'large';

const DogAgeCalculator: React.FC = () => {
  const [age, setAge] = useState(1);
  const [size, setSize] = useState<Size>('medium');

  const humanAge = useMemo(() => {
    // Generalized AVMA Guidelines
    // Year 1: ~15 for all
    // Year 2: +9 (Total 24) for all
    // Year 3+: 
    //   Small: +4/year
    //   Medium: +5/year
    //   Large: +6/year (approx)
    
    if (age === 1) return 15;
    if (age === 2) return 24;
    
    const extraYears = age - 2;
    let rate = 5;
    if (size === 'small') rate = 4;
    if (size === 'medium') rate = 5;
    if (size === 'large') rate = 6; // Larger dogs age faster

    return 24 + (extraYears * rate);
  }, [age, size]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Dog className="w-6 h-6 mr-2 text-blue-600" />
          狗狗年龄计算
        </h2>
        <p className="text-slate-500 mt-1">考虑体型因素，更准确地换算狗狗的人类年龄。</p>
      </div>

      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
         <div className="mb-8 text-center">
             <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
                 <Dog className="w-12 h-12 text-indigo-600" />
             </div>
             <h3 className="text-lg font-medium text-slate-900">狗狗资料</h3>
         </div>

         <div className="space-y-6">
             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-3">体型</label>
                 <div className="grid grid-cols-3 gap-3">
                     {[
                         { id: 'small', label: '小型犬', desc: '<10kg' },
                         { id: 'medium', label: '中型犬', desc: '10-25kg' },
                         { id: 'large', label: '大型犬', desc: '>25kg' },
                     ].map((item) => (
                         <button
                            key={item.id}
                            onClick={() => setSize(item.id as Size)}
                            className={`p-3 rounded-lg border text-center transition-all ${
                                size === item.id 
                                ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200 ring-offset-1' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                         >
                             <div className="font-bold text-sm">{item.label}</div>
                             <div className={`text-xs mt-1 ${size === item.id ? 'text-indigo-200' : 'text-slate-400'}`}>{item.desc}</div>
                         </button>
                     ))}
                 </div>
             </div>

             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">实际年龄 (岁)</label>
                 <input 
                    type="range" 
                    min="1" max="20" 
                    value={age} 
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
                 <div className="text-center mt-2 font-bold text-slate-700">{age} 岁</div>
             </div>

             <div className="bg-indigo-50 rounded-xl p-6 text-center border border-indigo-100 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="text-sm text-indigo-600 font-medium mb-1">相当于人类</div>
                    <div className="text-5xl font-extrabold text-slate-800">
                        {humanAge} <span className="text-xl font-medium text-slate-500">岁</span>
                    </div>
                 </div>
                 {/* Background decoration */}
                 <Dog className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-100 transform rotate-12" />
             </div>
         </div>
      </div>
    </div>
  );
};

export default DogAgeCalculator;