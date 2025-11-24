import React, { useState, useEffect } from 'react';
import { Coins, ArrowRightLeft, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

// Common currencies list
const CURRENCIES = [
  { code: 'CNY', name: '人民币 (CNY)', flag: '🇨🇳' },
  { code: 'USD', name: '美元 (USD)', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元 (EUR)', flag: '🇪🇺' },
  { code: 'JPY', name: '日元 (JPY)', flag: '🇯🇵' },
  { code: 'GBP', name: '英镑 (GBP)', flag: '🇬🇧' },
  { code: 'HKD', name: '港币 (HKD)', flag: '🇭🇰' },
  { code: 'TWD', name: '新台币 (TWD)', flag: '🇹🇼' },
  { code: 'AUD', name: '澳元 (AUD)', flag: '🇦🇺' },
  { code: 'CAD', name: '加元 (CAD)', flag: '🇨🇦' },
  { code: 'SGD', name: '新加坡元 (SGD)', flag: '🇸🇬' },
  { code: 'KRW', name: '韩元 (KRW)', flag: '🇰🇷' },
  { code: 'THB', name: '泰铢 (THB)', flag: '🇹🇭' },
  { code: 'RUB', name: '卢布 (RUB)', flag: '🇷🇺' },
];

interface ExchangeRateData {
  result: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}

const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNY');
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchRate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using a free API that doesn't require a key for basic rate info
      const response = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data: ExchangeRateData = await response.json();
      
      if (data.rates && data.rates[toCurrency]) {
        setRate(data.rates[toCurrency]);
        setLastUpdated(new Date(data.time_last_update_utc).toLocaleString());
      } else {
        throw new Error('Currency not found');
      }
    } catch (err) {
      console.error(err);
      setError("无法获取最新汇率，请检查网络连接。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCurrency, toCurrency]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const convertedAmount = rate ? (amount * rate).toFixed(4) : '---';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Coins className="w-6 h-6 mr-2 text-blue-600" />
          汇率换算
        </h2>
        <p className="text-slate-500 mt-1">实时查询全球货币汇率并进行换算。数据来源: open.er-api.com</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
           
           {/* Input Section */}
           <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center mb-8">
               {/* From */}
               <div className="md:col-span-3 space-y-2">
                   <label className="block text-sm font-medium text-slate-700">持有金额</label>
                   <div className="relative">
                       <input 
                           type="number" 
                           value={amount}
                           onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value)))}
                           className="block w-full pl-4 pr-24 py-3 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                       />
                       <div className="absolute inset-y-0 right-0 flex items-center">
                           <select 
                               value={fromCurrency}
                               onChange={(e) => setFromCurrency(e.target.value)}
                               className="h-full py-0 pl-2 pr-8 border-l border-slate-300 bg-slate-50 text-slate-700 rounded-r-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium"
                           >
                               {CURRENCIES.map(c => (
                                   <option key={c.code} value={c.code}>{c.code}</option>
                               ))}
                           </select>
                       </div>
                   </div>
                   <div className="text-xs text-slate-500 text-right px-1">
                       {CURRENCIES.find(c => c.code === fromCurrency)?.name}
                   </div>
               </div>

               {/* Swap Button */}
               <div className="md:col-span-1 flex justify-center pt-6">
                   <button 
                       onClick={swapCurrencies}
                       className="p-3 bg-slate-100 rounded-full text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all shadow-sm border border-slate-200"
                       title="交换货币"
                   >
                       <ArrowRightLeft className="w-5 h-5" />
                   </button>
               </div>

               {/* To */}
               <div className="md:col-span-3 space-y-2">
                   <label className="block text-sm font-medium text-slate-700">换算结果</label>
                   <div className="relative">
                       <input 
                           type="text" 
                           readOnly 
                           value={convertedAmount}
                           className="block w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900"
                       />
                       <div className="absolute inset-y-0 right-0 flex items-center">
                           <select 
                               value={toCurrency}
                               onChange={(e) => setToCurrency(e.target.value)}
                               className="h-full py-0 pl-2 pr-8 border-l border-slate-300 bg-slate-100 text-slate-700 rounded-r-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium"
                           >
                               {CURRENCIES.map(c => (
                                   <option key={c.code} value={c.code}>{c.code}</option>
                               ))}
                           </select>
                       </div>
                   </div>
                   <div className="text-xs text-slate-500 text-right px-1">
                       {CURRENCIES.find(c => c.code === toCurrency)?.name}
                   </div>
               </div>
           </div>

           {/* Info / Error Section */}
           <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
               {loading ? (
                   <div className="flex items-center justify-center py-4 text-slate-500">
                       <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                       正在更新汇率...
                   </div>
               ) : error ? (
                   <div className="flex items-center text-red-600">
                       <AlertCircle className="w-5 h-5 mr-2" />
                       {error}
                       <button onClick={fetchRate} className="ml-4 text-sm underline hover:text-red-800">重试</button>
                   </div>
               ) : rate ? (
                   <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                       <div className="flex items-center text-lg font-medium text-slate-800">
                           <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                           1 {fromCurrency} = {rate} {toCurrency}
                       </div>
                       <div className="text-xs text-slate-400">
                           更新时间: {lastUpdated}
                       </div>
                   </div>
               ) : null}
           </div>

           <div className="mt-6 pt-4 border-t border-slate-100 text-center">
               <Button onClick={fetchRate} variant="outline" size="sm">
                   <RefreshCw className="w-4 h-4 mr-2" /> 刷新汇率
               </Button>
           </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-slate-400">
            免责声明：汇率仅供参考，交易时请以银行柜台成交价为准。
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;