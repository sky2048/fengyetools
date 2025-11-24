import React, { useState, useMemo } from 'react';
import { Cat } from 'lucide-react';

const CatAgeCalculator: React.FC = () => {
  const [years, setYears] = useState(1);
  const [months, setMonths] = useState(0);

  const humanAge = useMemo(() => {
    // Standard logic:
    // 1 month = 1
    // 3 months = 4
    // 6 months = 10
    // 1 year = 15
    // 2 years = 24
    // +4 every year after
    
    let age = 0;
    if (years === 0) {
        if (months <= 1) age = 1;
        else if (months <= 3) age = 4;
        else if (months <= 6) age = 10;
        else age = 12; // 7-11 months
    } else if (years === 1) {
        age = 15;
        // Add months proportion? Keep simple steps.
    } else if (years === 2) {
        age = 24;
    } else {
        age = 24 + (years - 2) * 4;
    }
    return age;
  }, [years, months]);

  const getStage = (humanAge: number) => {
    if (humanAge < 12) return { text: '幼猫期 (Kitten)', desc: '好奇心旺盛，精力无限，需要大量陪伴。' };
    if (humanAge < 25) return { text: '青年期 (Junior)', desc: '身体发育成熟，性格逐渐定型。' };
    if (humanAge < 50) return { text: '壮年期 (Prime)', desc: '猫生的巅峰时期，健康强壮。' };
    if (humanAge < 70) return { text: '熟龄期 (Mature)', desc: '开始变得沉稳，活动量可能稍减。' };
    return { text: '老年期 (Senior)', desc: '需要更多的健康关怀和舒适环境。' };
  };

  const stage = getStage(humanAge);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Cat className="w-6 h-6 mr-2 text-blue-600" />
          猫猫年龄计算
        </h2>
        <p className="text-slate-500 mt-1">科学换算，了解您的猫主子相当于人类的多少岁。</p>
      </div>

      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
         <div className="mb-8 text-center">
             <div className="inline-block p-4 bg-orange-100 rounded-full mb-4">
                 <Cat className="w-12 h-12 text-orange-600" />
             </div>
             <h3 className="text-lg font-medium text-slate-900">输入猫咪的实际年龄</h3>
         </div>

         <div className="space-y-6">
             <div className="flex gap-4">
                 <div className="flex-1">
                     <label className="block text-sm font-medium text-slate-700 mb-2">岁 (Years)</label>
                     <select 
                        value={years} 
                        onChange={(e) => setYears(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                     >
                         {[...Array(26).keys()].map(i => (
                             <option key={i} value={i}>{i} 岁</option>
                         ))}
                     </select>
                 </div>
                 <div className="flex-1">
                     <label className="block text-sm font-medium text-slate-700 mb-2">个月 (Months)</label>
                     <select 
                        value={months} 
                        onChange={(e) => setMonths(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                        disabled={years > 1} // Usually ignore months after 2 years for rough calc
                     >
                         {[...Array(12).keys()].map(i => (
                             <option key={i} value={i}>{i} 个月</option>
                         ))}
                     </select>
                 </div>
             </div>

             <div className="bg-orange-50 rounded-xl p-6 text-center border border-orange-100">
                 <div className="text-sm text-orange-600 font-medium mb-1">相当于人类</div>
                 <div className="text-5xl font-extrabold text-slate-800 mb-2">
                     {humanAge} <span className="text-xl font-medium text-slate-500">岁</span>
                 </div>
                 <div className="inline-block px-3 py-1 bg-white rounded-full text-xs font-bold text-orange-500 shadow-sm border border-orange-100">
                     {stage.text}
                 </div>
                 <p className="mt-4 text-sm text-slate-600">
                     {stage.desc}
                 </p>
             </div>
         </div>
      </div>
    </div>
  );
};

export default CatAgeCalculator;