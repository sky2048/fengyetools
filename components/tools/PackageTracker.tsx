import React, { useState, useEffect } from 'react';
import { Truck, Search, ExternalLink, History, Trash2, Package } from 'lucide-react';
import Button from '../ui/Button';

interface SearchHistoryItem {
  number: string;
  carrier: string;
  date: number;
}

const CARRIERS = [
  { name: '顺丰速运', regex: /^SF/i, code: 'shunfeng' },
  { name: '京东物流', regex: /^JD/i, code: 'jd' },
  { name: '圆通速递', regex: /^(YT|8)/i, code: 'yuantong' },
  { name: '中通快递', regex: /^7/i, code: 'zhongtong' },
  { name: '申通快递', regex: /^77/i, code: 'shentong' },
  { name: '韵达快递', regex: /^4/i, code: 'yunda' },
  { name: 'EMS', regex: /^E[A-Z]/i, code: 'ems' },
  { name: '邮政包裹', regex: /^9/i, code: 'youzhengguonei' },
  { name: '极兔速递', regex: /^J/i, code: 'jtexpress' },
];

const PackageTracker: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [detectedCarrier, setDetectedCarrier] = useState<{ name: string; code: string } | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('omni_package_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const updateHistory = (newItem: SearchHistoryItem) => {
    const filtered = history.filter(h => h.number !== newItem.number);
    const newHistory = [newItem, ...filtered].slice(0, 10); // Keep last 10
    setHistory(newHistory);
    localStorage.setItem('omni_package_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('omni_package_history');
  };

  const deleteHistoryItem = (num: string) => {
    const newHistory = history.filter(h => h.number !== num);
    setHistory(newHistory);
    localStorage.setItem('omni_package_history', JSON.stringify(newHistory));
  };

  // Auto detect carrier
  useEffect(() => {
    if (!trackingNumber) {
      setDetectedCarrier(null);
      return;
    }
    const match = CARRIERS.find(c => c.regex.test(trackingNumber));
    if (match) {
      setDetectedCarrier({ name: match.name, code: match.code });
    } else {
      setDetectedCarrier(null);
    }
  }, [trackingNumber]);

  const handleSearch = (platform: 'kuaidi100' | 'baidu') => {
    if (!trackingNumber.trim()) return;

    // Save to history
    updateHistory({
      number: trackingNumber,
      carrier: detectedCarrier?.name || '未知快递',
      date: Date.now()
    });

    // Open link
    let url = '';
    if (platform === 'kuaidi100') {
      url = `https://m.kuaidi100.com/result.jsp?nu=${trackingNumber}`;
    } else {
      url = `https://www.baidu.com/s?wd=${trackingNumber}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Truck className="w-6 h-6 mr-2 text-blue-600" />
          快递查询 (传送门)
        </h2>
        <p className="text-slate-500 mt-1">输入单号，智能识别快递公司，一键跳转查询最新物流状态。</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Search Box */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Package className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                    placeholder="请输入快递单号 (例如: SF123456...)"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
                {detectedCarrier && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center animate-in fade-in slide-in-from-right-2">
                        <Truck className="w-3 h-3 mr-1" />
                        {detectedCarrier.name}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button size="lg" onClick={() => handleSearch('kuaidi100')} className="w-full bg-[#3278dd] hover:bg-[#2a66bd]">
                    <Search className="w-5 h-5 mr-2" />
                    通过 快递100 查询
                </Button>
                <Button size="lg" variant="secondary" onClick={() => handleSearch('baidu')} className="w-full border border-slate-300">
                    <Search className="w-5 h-5 mr-2" />
                    通过 百度搜索 查询
                </Button>
            </div>
            
            <div className="mt-4 text-center text-xs text-slate-400">
                提示: 纯前端工具无法直接连接快递接口，我们将为您跳转到官方结果页。
            </div>
        </div>

        {/* History */}
        {history.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700 flex items-center">
                        <History className="w-4 h-4 mr-2" />
                        查询历史
                    </h3>
                    <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700 hover:underline">
                        清空历史
                    </button>
                </div>
                <div className="divide-y divide-slate-100">
                    {history.map((item) => (
                        <div key={item.number} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => setTrackingNumber(item.number)}
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-mono font-medium text-slate-800">{item.number}</span>
                                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">
                                        {item.carrier}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400">
                                    上次查询: {new Date(item.date).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => { setTrackingNumber(item.number); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title="填入"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => deleteHistoryItem(item.number)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="删除"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PackageTracker;