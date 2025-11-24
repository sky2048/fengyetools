import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, LayoutDashboard, Search, ChevronUp, ChevronDown, Menu, X } from 'lucide-react';
import { TOOLS, APP_NAME } from '../constants';
import { ToolCategory } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const ScrollController: React.FC = () => {
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      
      if (height > 100) {
        setIsVisible(true);
        if (winScroll > 300) {
          setDirection('up');
        } else {
          setDirection('down');
        }
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const handleScroll = () => {
    if (direction === 'up') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleScroll}
      className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 opacity-90 hover:opacity-100 transform hover:scale-110"
      title={direction === 'up' ? "返回顶部" : "去到底部"}
    >
      {direction === 'up' ? (
        <ChevronUp className="w-6 h-6" />
      ) : (
        <ChevronDown className="w-6 h-6" />
      )}
    </button>
  );
};

// Extracted Sidebar Content for reuse in Desktop Sidebar and Mobile Drawer
const SidebarContent: React.FC<{ onCloseMobile?: () => void }> = ({ onCloseMobile }) => {
  const location = useLocation();
  const [sidebarSearch, setSidebarSearch] = useState('');

  const filteredTools = TOOLS.filter(t => 
    t.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const activeCategories = Array.from(new Set(filteredTools.map(t => t.category)));

  return (
    <div className="flex flex-col h-full">
      {/* Logo Area (Only for Desktop inside sidebar, Mobile has its own header) */}
      <div className="hidden md:flex h-16 items-center px-6 border-b border-slate-200 flex-shrink-0">
        <Box className="w-6 h-6 text-blue-600 mr-2" />
        <span className="text-xl font-bold text-slate-900">{APP_NAME}</span>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索工具..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>
      
      {/* Nav Links */}
      <div className="flex-1 py-4 px-4 space-y-6 overflow-y-auto custom-scrollbar">
         <div>
           <NavLink
            to="/"
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                isActive || location.pathname === '/'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            仪表盘
          </NavLink>
         </div>

         {filteredTools.length === 0 ? (
           <div className="text-center text-slate-400 text-sm py-4">
             未找到相关工具
           </div>
         ) : (
           activeCategories.map(category => (
              <div key={category}>
                <h4 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {category}
                </h4>
                <div className="space-y-1">
                  {filteredTools
                    .filter(t => t.category === category)
                    .map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <NavLink
                          key={tool.id}
                          to={tool.path}
                          onClick={onCloseMobile}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-lg transition-colors text-sm group ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`
                          }
                        >
                          <Icon className={`w-4 h-4 mr-3 ${location.pathname === tool.path ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                          {tool.name}
                        </NavLink>
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

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform flex flex-col h-full animate-in slide-in-from-left duration-200">
             {/* Mobile Drawer Header */}
             <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center">
                  <Box className="w-6 h-6 text-blue-600 mr-2" />
                  <span className="text-xl font-bold text-slate-900">{APP_NAME}</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500">
                  <X className="w-6 h-6" />
                </button>
             </div>
             
             {/* Reuse Content */}
             <SidebarContent onCloseMobile={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col relative">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center">
            <Box className="w-6 h-6 text-blue-600 mr-2" />
            <span className="text-lg font-bold text-slate-900">{APP_NAME}</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>

        <footer className="py-6 px-8 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} {APP_NAME}. 本地浏览器处理，无需上传服务器。
        </footer>

        {/* Scroll To Top/Bottom Button */}
        <ScrollController />
      </main>
    </div>
  );
};

export default Layout;