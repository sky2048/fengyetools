import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Copy, RefreshCw, ArrowRight, Calculator, Calendar, Check, X } from 'lucide-react';
import Button from '../ui/Button';

// Helper functions
const formatDateTime = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

const TimestampTool: React.FC = () => {
  // --- Current Time State ---
  const [now, setNow] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // --- Converter State ---
  const [tsInput, setTsInput] = useState('');
  const [tsUnit, setTsUnit] = useState<'s' | 'ms'>('s');
  const [dateResult, setDateResult] = useState('');

  const [dateInput, setDateInput] = useState(formatDateTime(new Date()));
  const [tsResult, setTsResult] = useState('');

  // --- Calculator State ---
  const [calcBaseTime, setCalcBaseTime] = useState(formatDateTime(new Date()));
  const [calcAmount, setCalcAmount] = useState(0);
  const [calcUnit, setCalcUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'>('days');
  const [calcOperation, setCalcOperation] = useState<'add' | 'sub'>('add');
  const [calcResult, setCalcResult] = useState<{ ts: number; date: string } | null>(null);

  // Real-time clock
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Initial converter values
  useEffect(() => {
    setTsInput(Math.floor(Date.now() / 1000).toString());
    handleTsToDate(Math.floor(Date.now() / 1000).toString(), 's');
    
    const d = new Date();
    setDateInput(formatDateTime(d));
    handleDateToTs(formatDateTime(d));
    setCalcBaseTime(formatDateTime(d));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Handlers
  const handleTsToDate = (val: string, unit: 's' | 'ms') => {
    if (!val) {
        setDateResult('');
        return;
    }
    try {
        const num = parseInt(val);
        const date = new Date(unit === 's' ? num * 1000 : num);
        if (isNaN(date.getTime())) throw new Error("Invalid");
        setDateResult(formatDateTime(date));
    } catch (e) {
        setDateResult("无效的时间戳");
    }
  };

  const handleDateToTs = (val: string) => {
    try {
        // Handle common formats manually or trust Date.parse (which handles ISO and YYYY/MM/DD mostly)
        // Replace space with T for ISO compatibility if standard "YYYY-MM-DD HH:mm:ss"
        let parseVal = val.trim();
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(parseVal)) {
            parseVal = parseVal.replace(' ', 'T');
        }
        
        const date = new Date(parseVal);
        if (isNaN(date.getTime())) throw new Error("Invalid");
        
        const ts = Math.floor(date.getTime() / 1000);
        setTsResult(ts.toString());
    } catch (e) {
        setTsResult("无效的日期格式");
    }
  };

  const handleCalculate = () => {
    try {
        let parseVal = calcBaseTime.trim();
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(parseVal)) {
            parseVal = parseVal.replace(' ', 'T');
        }
        const base = new Date(parseVal);
        if (isNaN(base.getTime())) {
            alert("基准时间格式不正确");
            return;
        }

        let result = new Date(base);
        const op = calcOperation === 'add' ? 1 : -1;
        const amt = calcAmount * op;

        switch (calcUnit) {
            case 'seconds': result.setSeconds(result.getSeconds() + amt); break;
            case 'minutes': result.setMinutes(result.getMinutes() + amt); break;
            case 'hours': result.setHours(result.getHours() + amt); break;
            case 'days': result.setDate(result.getDate() + amt); break;
            case 'weeks': result.setDate(result.getDate() + amt * 7); break;
            case 'months': result.setMonth(result.getMonth() + amt); break;
            case 'years': result.setFullYear(result.getFullYear() + amt); break;
        }

        setCalcResult({
            ts: Math.floor(result.getTime() / 1000),
            date: formatDateTime(result)
        });

    } catch (e) {
        alert("计算错误");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-blue-600" />
          时间戳工具
        </h2>
        <p className="text-slate-500 mt-1">Unix 时间戳转换、获取当前时间、时间计算。</p>
      </div>

      {/* 1. Current Time Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
         <div className="flex justify-between items-center mb-4 border-b border-blue-500/50 pb-2">
             <h3 className="font-medium text-blue-100 flex items-center">
                 当前时间
                 <span className={`ml-2 w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`}></span>
             </h3>
             <button 
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 bg-blue-500/30 hover:bg-blue-500/50 rounded-lg transition-colors"
             >
                 {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
             </button>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
             <div className="space-y-1">
                 <div className="text-xs text-blue-200 uppercase tracking-wider">Unix 时间戳 (秒)</div>
                 <div className="text-3xl font-mono font-bold tracking-tight cursor-pointer hover:text-blue-100 transition-colors" 
                      onClick={() => copyToClipboard(Math.floor(now.getTime() / 1000).toString(), 'curr_s')}>
                     {Math.floor(now.getTime() / 1000)}
                     {copyFeedback === 'curr_s' && <span className="ml-2 text-xs text-green-300 font-normal animate-fade-in">已复制</span>}
                 </div>
             </div>

             <div className="space-y-1">
                 <div className="text-xs text-blue-200 uppercase tracking-wider">Unix 时间戳 (毫秒)</div>
                 <div className="text-3xl font-mono font-bold tracking-tight cursor-pointer hover:text-blue-100 transition-colors"
                      onClick={() => copyToClipboard(now.getTime().toString(), 'curr_ms')}>
                     {now.getTime()}
                     {copyFeedback === 'curr_ms' && <span className="ml-2 text-xs text-green-300 font-normal animate-fade-in">已复制</span>}
                 </div>
             </div>

             <div className="space-y-1">
                 <div className="text-xs text-blue-200 uppercase tracking-wider">格式化日期</div>
                 <div className="text-3xl font-mono font-bold tracking-tight cursor-pointer hover:text-blue-100 transition-colors"
                      onClick={() => copyToClipboard(formatDateTime(now), 'curr_date')}>
                     {formatDateTime(now)}
                     {copyFeedback === 'curr_date' && <span className="ml-2 text-xs text-green-300 font-normal animate-fade-in">已复制</span>}
                 </div>
             </div>
         </div>
      </div>

      {/* 2. Converter Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Timestamp -> Date */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                 <RefreshCw className="w-5 h-5 mr-2 text-blue-600" />
                 时间戳转日期
             </h3>
             
             <div className="space-y-4">
                 <div className="flex gap-2">
                     <div className="flex-1 relative">
                        <input 
                            type="text" 
                            value={tsInput}
                            onChange={(e) => {
                                setTsInput(e.target.value);
                                handleTsToDate(e.target.value, tsUnit);
                            }}
                            placeholder="输入时间戳..."
                            className="w-full pl-4 pr-16 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute right-1 top-1 p-1 bg-slate-100 rounded text-xs flex">
                            <button 
                                onClick={() => { setTsUnit('s'); handleTsToDate(tsInput, 's'); }}
                                className={`px-2 py-0.5 rounded ${tsUnit === 's' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                            >秒</button>
                            <button 
                                onClick={() => { setTsUnit('ms'); handleTsToDate(tsInput, 'ms'); }}
                                className={`px-2 py-0.5 rounded ${tsUnit === 'ms' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                            >毫秒</button>
                        </div>
                     </div>
                 </div>
                 
                 <div className="flex justify-center">
                     <ArrowRight className="w-5 h-5 text-slate-300" />
                 </div>

                 <div className="relative bg-slate-50 rounded-lg border border-slate-200 p-3">
                     <div className="text-xs text-slate-400 mb-1">转换结果 (北京时间)</div>
                     <div className="font-mono font-medium text-lg text-slate-800 min-h-[28px]">
                         {dateResult}
                     </div>
                     {dateResult && !dateResult.includes('无效') && (
                         <button 
                            onClick={() => copyToClipboard(dateResult, 'res_date')}
                            className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm"
                         >
                             {copyFeedback === 'res_date' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                         </button>
                     )}
                 </div>
             </div>
         </div>

         {/* Date -> Timestamp */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                 <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                 日期转时间戳
             </h3>
             
             <div className="space-y-4">
                 <div>
                    <input 
                        type="text" 
                        value={dateInput}
                        onChange={(e) => {
                            setDateInput(e.target.value);
                            handleDateToTs(e.target.value);
                        }}
                        placeholder="YYYY-MM-DD HH:mm:ss"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono"
                    />
                 </div>
                 
                 <div className="flex justify-center">
                     <ArrowRight className="w-5 h-5 text-slate-300" />
                 </div>

                 <div className="relative bg-slate-50 rounded-lg border border-slate-200 p-3">
                     <div className="text-xs text-slate-400 mb-1">转换结果 (秒)</div>
                     <div className="font-mono font-medium text-lg text-slate-800 min-h-[28px]">
                         {tsResult}
                     </div>
                     {tsResult && !tsResult.includes('无效') && (
                         <button 
                            onClick={() => copyToClipboard(tsResult, 'res_ts')}
                            className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded shadow-sm"
                         >
                             {copyFeedback === 'res_ts' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                         </button>
                     )}
                 </div>
             </div>
         </div>
      </div>

      {/* 3. Calculator Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-blue-600" />
              时间计算器
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">基准时间</label>
                  <input 
                      type="text"
                      value={calcBaseTime}
                      onChange={(e) => setCalcBaseTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                  />
              </div>
              
              <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">操作</label>
                  <select 
                      value={calcOperation}
                      onChange={(e) => setCalcOperation(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                      <option value="add">加 (+)</option>
                      <option value="sub">减 (-)</option>
                  </select>
              </div>

              <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">数量</label>
                   <input 
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
              </div>

              <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">单位</label>
                  <select 
                      value={calcUnit}
                      onChange={(e) => setCalcUnit(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                      <option value="seconds">秒</option>
                      <option value="minutes">分钟</option>
                      <option value="hours">小时</option>
                      <option value="days">天</option>
                      <option value="weeks">周</option>
                      <option value="months">月</option>
                      <option value="years">年</option>
                  </select>
              </div>

              <div className="md:col-span-3">
                  <Button onClick={handleCalculate} className="w-full">
                      计算结果
                  </Button>
              </div>
          </div>

          {calcResult && (
              <div className="mt-6 relative p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap justify-between items-center gap-4 animate-in slide-in-from-top-2">
                  <button 
                      onClick={() => setCalcResult(null)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-slate-200 transition-colors"
                      title="清除结果"
                  >
                      <X className="w-4 h-4" />
                  </button>
                  
                  <div>
                      <div className="text-xs text-slate-500 uppercase">结果日期</div>
                      <div className="text-lg font-mono font-bold text-slate-800">{calcResult.date}</div>
                  </div>
                  <div className="mr-8">
                      <div className="text-xs text-slate-500 uppercase text-right">结果时间戳</div>
                      <div className="text-lg font-mono font-bold text-blue-600">{calcResult.ts}</div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default TimestampTool;