import React, { useState, useEffect } from 'react';
import { Calculator, AlignLeft, Trash2, Type } from 'lucide-react';
import Button from '../ui/Button';

const WordCounter: React.FC = () => {
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    chars: 0,
    charsNoSpace: 0,
    words: 0,
    lines: 0,
    chinese: 0,
    english: 0,
    number: 0,
    punctuation: 0,
  });

  useEffect(() => {
    const val = text;
    
    // 1. Basic Chars
    const chars = val.length;
    const charsNoSpace = val.replace(/\s/g, '').length;
    
    // 2. Lines
    const lines = val ? val.split(/\r\n|\r|\n/).length : 0;
    
    // 3. Chinese Chars
    const chineseMatch = val.match(/[\u4e00-\u9fa5]/g);
    const chinese = chineseMatch ? chineseMatch.length : 0;

    // 4. English Words (Approximation)
    // Split by non-word characters but keep unicode aware
    const wordsMatch = val.match(/[a-zA-Z]+/g);
    const englishWords = wordsMatch ? wordsMatch.length : 0;

    // 5. Numbers
    const numMatch = val.match(/[0-9]/g);
    const number = numMatch ? numMatch.length : 0;

    // 6. Total "Words" (Chinese chars + English words)
    // Simple common logic: 1 Chinese char = 1 word, English words separated by space
    const totalWords = chinese + englishWords;

    // 7. Punctuation
    const punctMatch = val.match(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~，。？！；：“”‘’（）]/g);
    const punctuation = punctMatch ? punctMatch.length : 0;

    setStats({
        chars,
        charsNoSpace,
        words: totalWords,
        lines,
        chinese,
        english: englishWords,
        number,
        punctuation
    });

  }, [text]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Calculator className="w-6 h-6 mr-2 text-blue-600" />
          字数统计
        </h2>
        <p className="text-slate-500 mt-1">实时统计文本字符数、单词数、行数，支持中英文区分。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Area */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
             <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
                 <span className="text-sm font-medium text-slate-600">输入文本</span>
                 <button 
                     onClick={() => setText('')}
                     className="flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                 >
                     <Trash2 className="w-4 h-4 mr-1.5" /> 清空
                 </button>
             </div>
             <textarea
                 value={text}
                 onChange={(e) => setText(e.target.value)}
                 className="flex-1 w-full p-4 text-base leading-relaxed bg-white border border-slate-200 rounded-b-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none custom-scrollbar"
                 placeholder="在此输入或粘贴文本..."
             />
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
                  <h3 className="font-semibold text-slate-900 mb-6 flex items-center">
                      <AlignLeft className="w-5 h-5 mr-2 text-blue-600" />
                      统计结果
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                          <div className="text-xs text-blue-600 uppercase font-semibold mb-1">总字符数</div>
                          <div className="text-2xl font-bold text-blue-900">{stats.chars}</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                          <div className="text-xs text-green-600 uppercase font-semibold mb-1">总词数</div>
                          <div className="text-2xl font-bold text-green-900">{stats.words}</div>
                      </div>
                  </div>

                  <div className="space-y-4 divide-y divide-slate-100">
                      <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-slate-600">不含空格字符</span>
                          <span className="font-mono font-medium">{stats.charsNoSpace}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-slate-600">行数</span>
                          <span className="font-mono font-medium">{stats.lines}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-slate-600">中文字符</span>
                          <span className="font-mono font-medium">{stats.chinese}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-slate-600">英文单词</span>
                          <span className="font-mono font-medium">{stats.english}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-slate-600">数字</span>
                          <span className="font-mono font-medium">{stats.number}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-slate-600">标点符号</span>
                          <span className="font-mono font-medium">{stats.punctuation}</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default WordCounter;