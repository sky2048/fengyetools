import React, { useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

const BmiCalculator: React.FC = () => {
  const [height, setHeight] = useState<number | ''>(170);
  const [weight, setWeight] = useState<number | ''>(65);
  const [bmi, setBmi] = useState<number | null>(null);

  const calculateBmi = () => {
    if (height && weight && height > 0) {
      const hM = height / 100;
      const val = weight / (hM * hM);
      setBmi(parseFloat(val.toFixed(1)));
    }
  };

  const getStatus = (val: number) => {
    if (val < 18.5) return { label: '偏瘦', color: 'text-blue-500', bg: 'bg-blue-500' };
    if (val < 24) return { label: '正常', color: 'text-green-500', bg: 'bg-green-500' };
    if (val < 28) return { label: '偏胖', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { label: '肥胖', color: 'text-red-500', bg: 'bg-red-500' };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-blue-600" />
          BMI 计算器
        </h2>
        <p className="text-slate-500 mt-1">身体质量指数 (BMI) 是国际上常用的衡量人体胖瘦程度的标准。</p>
      </div>

      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">身高 (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => { setHeight(parseFloat(e.target.value)); setBmi(null); }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="170"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">体重 (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => { setWeight(parseFloat(e.target.value)); setBmi(null); }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="65"
              />
            </div>
          </div>

          <Button onClick={calculateBmi} className="w-full text-lg h-12">
            开始计算
          </Button>

          {bmi !== null && (
            <div className="mt-8 pt-6 border-t border-slate-100 animate-in slide-in-from-top-4">
              <div className="text-center mb-6">
                <div className="text-sm text-slate-500 uppercase tracking-wide mb-1">您的 BMI 指数</div>
                <div className="text-5xl font-bold text-slate-800 mb-2">{bmi}</div>
                <div className={`text-lg font-semibold ${getStatus(bmi).color}`}>
                  {getStatus(bmi).label}
                </div>
              </div>

              {/* Visual Gauge */}
              <div className="relative h-4 rounded-full overflow-hidden bg-slate-100 flex mb-2">
                <div className="flex-1 bg-blue-400" title="偏瘦 (<18.5)"></div>
                <div className="flex-1 bg-green-400" title="正常 (18.5-24)"></div>
                <div className="flex-[0.7] bg-yellow-400" title="偏胖 (24-28)"></div>
                <div className="flex-1 bg-red-400" title="肥胖 (>28)"></div>
                
                {/* Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-black transform -translate-x-1/2 transition-all duration-500"
                  style={{ 
                    left: `${Math.min(Math.max((bmi / 35) * 100, 0), 100)}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>18.5</span>
                <span>24</span>
                <span>28</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BmiCalculator;