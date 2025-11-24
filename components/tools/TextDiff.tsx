import React, { useState } from 'react';
// @ts-ignore
import * as Diff from 'diff';
import { GitCompare, ArrowRightLeft, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

const TextDiff: React.FC = () => {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [diffResult, setDiffResult] = useState<any[] | null>(null);

  const compare = () => {
    if (!oldText && !newText) return;
    
    // Use diffLines for code/text blocks usually preferred
    const result = Diff.diffLines(oldText, newText);
    setDiffResult(result);
  };

  const swap = () => {
    const temp = oldText;
    setOldText(newText);
    setNewText(temp);
    setDiffResult(null);
  };

  const clear = () => {
    setOldText('');
    setNewText('');
    setDiffResult(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <GitCompare className="w-6 h-6 mr-2 text-blue-600" />
          文本对比
        </h2>
        <p className="text-slate-500 mt-1">对比两段文本或代码的差异，支持高亮显示新增和删除内容。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         {/* Inputs */}
         <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-2">原始文本 (Old)</label>
            <textarea 
                value={oldText}
                onChange={(e) => setOldText(e.target.value)}
                className="flex-1 min-h-[200px] p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                placeholder="在此粘贴原始内容..."
            />
         </div>
         <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-2">新文本 (New)</label>
            <textarea 
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="flex-1 min-h-[200px] p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                placeholder="在此粘贴修改后的内容..."
            />
         </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 py-2">
          <Button onClick={compare} className="min-w-[120px]">
              开始对比
          </Button>
          <Button variant="outline" onClick={swap}>
              <ArrowRightLeft className="w-4 h-4 mr-2" /> 交换内容
          </Button>
          <Button variant="outline" onClick={clear} className="text-red-600 hover:bg-red-50 border-red-200">
              <Trash2 className="w-4 h-4 mr-2" /> 清空
          </Button>
      </div>

      {/* Result */}
      {diffResult && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4 text-sm">
                  <span className="font-medium text-slate-700">对比结果</span>
                  <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm"></span>
                      <span className="text-slate-500 text-xs">删除</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm"></span>
                      <span className="text-slate-500 text-xs">新增</span>
                  </div>
              </div>
              <div className="p-4 overflow-x-auto">
                  <pre className="font-mono text-sm whitespace-pre-wrap break-all">
                      {diffResult.map((part, index) => {
                          let className = "text-slate-600";
                          let bgClass = "bg-transparent";
                          let prefix = "  ";
                          
                          if (part.added) {
                              className = "text-green-800";
                              bgClass = "bg-green-50 border-l-2 border-green-400";
                              prefix = "+ ";
                          } else if (part.removed) {
                              className = "text-red-800";
                              bgClass = "bg-red-50 border-l-2 border-red-400";
                              prefix = "- ";
                          }

                          return (
                              <span key={index} className={`block ${className} ${bgClass} px-2`}>
                                  {/* Handle line breaks inside parts to ensure formatting stays consistent */}
                                  {part.value.endsWith('\n') ? part.value.slice(0, -1) : part.value}
                              </span>
                          );
                      })}
                  </pre>
              </div>
          </div>
      )}
    </div>
  );
};

export default TextDiff;