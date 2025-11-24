import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { TOOLS } from '../constants';

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter tools based on search term
  const filteredTools = TOOLS.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get categories that have matching tools
  const categories = Array.from(new Set(filteredTools.map(t => t.category)));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Sticky Header Section */}
      {/* 
         - top-16: below mobile header (which is h-16)
         - md:top-0: at top on desktop
         - -mx-4/md:-mx-8: Counteract the Layout padding to ensure full-width background
      */}
      <div className="sticky top-16 md:top-0 z-30 bg-slate-50/95 backdrop-blur-sm pt-4 pb-6 -mx-4 px-4 md:-mx-8 md:px-8 transition-all">
        <div className="text-center max-w-2xl mx-auto pt-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            一站式文件处理工具箱
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            安全、快速、免费的文件转换与处理。所有操作均在浏览器本地完成，无需上传服务器。
          </p>

          {/* Central Search Bar */}
          <div className="relative max-w-lg mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg shadow-slate-200/50 transition-all text-lg"
              placeholder="搜索工具 (例如: PDF, 压缩...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-10 pb-10 mt-6">
        {filteredTools.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">未找到匹配 "{searchTerm}" 的工具。</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 text-blue-600 font-medium hover:underline"
            >
              查看所有工具
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category}>
              <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center">
                <span className="bg-blue-100 w-2 h-6 rounded-full mr-3"></span>
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.filter(t => t.category === category).map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link 
                      key={tool.id} 
                      to={tool.path}
                      className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col h-full"
                    >
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{tool.name}</h3>
                      <p className="text-slate-500 text-sm flex-1 mb-4 leading-relaxed">
                        {tool.description}
                      </p>
                      <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 pt-2 border-t border-slate-50 mt-auto">
                        打开工具 <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;