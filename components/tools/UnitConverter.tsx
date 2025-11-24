import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Scale, Ruler, Thermometer, Gauge } from 'lucide-react';

type UnitCategory = 'weight' | 'length' | 'temperature' | 'pressure';

interface UnitDef {
  id: string;
  name: string;
  rate: number; // Rate to base unit (linear)
  toBase?: (val: number) => number; // Custom to base (non-linear like temp)
  fromBase?: (val: number) => number; // Custom from base
}

interface UnitConverterProps {
  category: UnitCategory;
}

const CONFIG: Record<UnitCategory, { title: string, icon: any, units: UnitDef[] }> = {
  weight: {
    title: '重量单位换算',
    icon: Scale,
    units: [
      { id: 'kg', name: '千克 (kg)', rate: 1 },
      { id: 'g', name: '克 (g)', rate: 0.001 },
      { id: 'mg', name: '毫克 (mg)', rate: 0.000001 },
      { id: 'lb', name: '磅 (lb)', rate: 0.45359237 },
      { id: 'oz', name: '盎司 (oz)', rate: 0.02834952 },
      { id: 't', name: '公吨 (t)', rate: 1000 },
      { id: 'jin', name: '市斤', rate: 0.5 },
    ]
  },
  length: {
    title: '长度单位换算',
    icon: Ruler,
    units: [
      { id: 'm', name: '米 (m)', rate: 1 },
      { id: 'km', name: '千米 (km)', rate: 1000 },
      { id: 'cm', name: '厘米 (cm)', rate: 0.01 },
      { id: 'mm', name: '毫米 (mm)', rate: 0.001 },
      { id: 'in', name: '英寸 (in)', rate: 0.0254 },
      { id: 'ft', name: '英尺 (ft)', rate: 0.3048 },
      { id: 'yd', name: '码 (yd)', rate: 0.9144 },
      { id: 'mi', name: '英里 (mi)', rate: 1609.344 },
      { id: 'li', name: '市里', rate: 500 },
    ]
  },
  pressure: {
    title: '压力单位换算',
    icon: Gauge,
    units: [
      { id: 'pa', name: '帕斯卡 (Pa)', rate: 1 },
      { id: 'kpa', name: '千帕 (kPa)', rate: 1000 },
      { id: 'mpa', name: '兆帕 (MPa)', rate: 1000000 },
      { id: 'bar', name: '巴 (bar)', rate: 100000 },
      { id: 'atm', name: '标准大气压 (atm)', rate: 101325 },
      { id: 'psi', name: '磅力/平方英寸 (psi)', rate: 6894.757 },
      { id: 'mmhg', name: '毫米汞柱 (mmHg)', rate: 133.322 },
    ]
  },
  temperature: {
    title: '温度单位换算',
    icon: Thermometer,
    units: [
      { 
        id: 'c', name: '摄氏度 (°C)', rate: 1,
        toBase: (v) => v, 
        fromBase: (v) => v 
      },
      { 
        id: 'f', name: '华氏度 (°F)', rate: 1,
        toBase: (v) => (v - 32) * 5 / 9, 
        fromBase: (v) => (v * 9 / 5) + 32 
      },
      { 
        id: 'k', name: '开尔文 (K)', rate: 1,
        toBase: (v) => v - 273.15, 
        fromBase: (v) => v + 273.15 
      },
    ]
  }
};

const UnitConverter: React.FC<UnitConverterProps> = ({ category }) => {
  const { title, icon: Icon, units } = CONFIG[category];
  
  const [amount1, setAmount1] = useState<number | ''>(1);
  const [unit1, setUnit1] = useState(units[0].id);
  
  const [amount2, setAmount2] = useState<number | ''>('');
  const [unit2, setUnit2] = useState(units[1]?.id || units[0].id);

  // Calculate derived value
  const calculate = (val: number | '', sourceUnitId: string, targetUnitId: string): number | '' => {
    if (val === '') return '';
    
    const sourceUnit = units.find(u => u.id === sourceUnitId)!;
    const targetUnit = units.find(u => u.id === targetUnitId)!;

    let baseValue: number;

    // 1. Convert to base
    if (sourceUnit.toBase) {
        baseValue = sourceUnit.toBase(val);
    } else {
        baseValue = val * sourceUnit.rate;
    }

    // 2. Convert from base
    if (targetUnit.fromBase) {
        return parseFloat(targetUnit.fromBase(baseValue).toPrecision(10)); // Precision fix
    } else {
        return parseFloat((baseValue / targetUnit.rate).toPrecision(10));
    }
  };

  // Handlers
  const handleAmount1Change = (val: string) => {
    const num = val === '' ? '' : parseFloat(val);
    setAmount1(num);
    setAmount2(calculate(num, unit1, unit2));
  };

  const handleAmount2Change = (val: string) => {
    const num = val === '' ? '' : parseFloat(val);
    setAmount2(num);
    setAmount1(calculate(num, unit2, unit1));
  };

  // Re-calculate when units change
  useEffect(() => {
    // Prefer preserving amount1 and updating amount2
    setAmount2(calculate(amount1, unit1, unit2));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit1, unit2]);

  // Reset when category changes
  useEffect(() => {
      setUnit1(units[0].id);
      setUnit2(units[1]?.id || units[0].id);
      setAmount1(1);
      // Will trigger effect above to set amount2
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Icon className="w-6 h-6 mr-2 text-blue-600" />
          {title}
        </h2>
        <p className="text-slate-500 mt-1">常用计量单位在线换算。</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
              {/* Input 1 */}
              <div className="md:col-span-3 space-y-2">
                  <div className="relative">
                      <input 
                          type="number" 
                          value={amount1}
                          onChange={(e) => handleAmount1Change(e.target.value)}
                          className="block w-full pl-4 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                          placeholder="0"
                      />
                  </div>
                  <select 
                      value={unit1}
                      onChange={(e) => setUnit1(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
              </div>

              {/* Equals */}
              <div className="md:col-span-1 flex justify-center py-4 md:py-0">
                  <div className="p-2 bg-slate-100 rounded-full text-slate-400">
                      <ArrowRightLeft className="w-5 h-5" />
                  </div>
              </div>

              {/* Input 2 */}
              <div className="md:col-span-3 space-y-2">
                  <div className="relative">
                      <input 
                          type="number" 
                          value={amount2}
                          onChange={(e) => handleAmount2Change(e.target.value)}
                          className="block w-full pl-4 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-slate-50"
                          placeholder="0"
                      />
                  </div>
                  <select 
                      value={unit2}
                      onChange={(e) => setUnit2(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
              </div>
          </div>
      </div>
    </div>
  );
};

export default UnitConverter;