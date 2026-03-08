import React, { useState, useCallback } from 'react';
import { Palette, Copy, Check } from 'lucide-react';

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const m = hex.replace(/^#/, '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
};

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) r = g = b = l;
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
};

const ColorFormatConverter: React.FC = () => {
  const [hex, setHex] = useState('#3b82f6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
  const [unity, setUnity] = useState({ r: 0.23, g: 0.51, b: 0.96 });
  const [copied, setCopied] = useState<string | null>(null);

  const updateFromHex = useCallback((h: string) => {
    const rgbVal = hexToRgb(h);
    if (rgbVal) {
      setRgb(rgbVal);
      const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
      setHsl(hslVal);
      setUnity({ r: rgbVal.r / 255, g: rgbVal.g / 255, b: rgbVal.b / 255 });
    }
  }, []);

  const updateFromRgb = useCallback((r: number, g: number, b: number) => {
    setHex(rgbToHex(r, g, b));
    setHsl(rgbToHsl(r, g, b));
    setUnity({ r: r / 255, g: g / 255, b: b / 255 });
  }, []);

  const updateFromHsl = useCallback((h: number, s: number, l: number) => {
    const rgbVal = hslToRgb(h, s, l);
    setRgb(rgbVal);
    setHex(rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b));
    setUnity({ r: rgbVal.r / 255, g: rgbVal.g / 255, b: rgbVal.b / 255 });
  }, []);

  const updateFromUnity = useCallback((r: number, g: number, b: number) => {
    const rr = Math.round(r * 255), gg = Math.round(g * 255), bb = Math.round(b * 255);
    setRgb({ r: rr, g: gg, b: bb });
    setHex(rgbToHex(rr, gg, bb));
    setHsl(rgbToHsl(rr, gg, bb));
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const hexStr = hex;
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslStr = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
  const unityStr = `(${unity.r.toFixed(3)}, ${unity.g.toFixed(3)}, ${unity.b.toFixed(3)})`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Palette className="w-6 h-6 mr-2 text-blue-600" />
          颜色格式转换
        </h2>
        <p className="text-slate-500 mt-1">Hex、RGB、HSL、Unity Color (0-1) 之间互转，实时预览色块。</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
        <style dangerouslySetInnerHTML={{ __html: `.color-preview-dynamic { background-color: ${hex || 'transparent'}; }` }} />
        <div className="mb-6 flex items-center gap-4">
          <div
            className="w-24 h-24 rounded-xl border-2 border-slate-200 shadow-inner flex-shrink-0 color-preview color-preview-dynamic"
          />
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-1">实时预览</p>
            <p className="font-mono text-slate-700">{hex}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Hex</label>
            <input
              type="text"
              value={hex}
              onChange={(e) => { setHex(e.target.value); updateFromHex(e.target.value); }}
              className="w-full pl-4 pr-12 py-3 font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="#3b82f6"
            />
            <button onClick={() => copyToClipboard(hexStr, 'hex')} className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
              {copied === 'hex' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">RGB</label>
            <div className="flex gap-2">
              <input type="number" min={0} max={255} value={rgb.r} onChange={(e) => { const v = parseInt(e.target.value) || 0; setRgb(p => ({ ...p, r: v })); updateFromRgb(v, rgb.g, rgb.b); }} className="flex-1 pl-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg" placeholder="R" aria-label="红色分量" />
              <input type="number" min={0} max={255} value={rgb.g} onChange={(e) => { const v = parseInt(e.target.value) || 0; setRgb(p => ({ ...p, g: v })); updateFromRgb(rgb.r, v, rgb.b); }} className="flex-1 pl-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg" placeholder="G" aria-label="绿色分量" />
              <input type="number" min={0} max={255} value={rgb.b} onChange={(e) => { const v = parseInt(e.target.value) || 0; setRgb(p => ({ ...p, b: v })); updateFromRgb(rgb.r, rgb.g, v); }} className="flex-1 pl-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg" placeholder="B" aria-label="蓝色分量" />
            </div>
            <div className="mt-1 flex items-center">
              <span className="font-mono text-sm text-slate-600 mr-2">{rgbStr}</span>
              <button onClick={() => copyToClipboard(rgbStr, 'rgb')} className="p-1 text-slate-400 hover:text-blue-600">
                {copied === 'rgb' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">HSL</label>
            <div className="flex gap-2">
              <input type="number" min={0} max={360} value={Math.round(hsl.h)} onChange={(e) => { const v = parseInt(e.target.value) || 0; setHsl(p => ({ ...p, h: v })); updateFromHsl(v, hsl.s, hsl.l); }} className="flex-1 pl-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg" placeholder="H" aria-label="色相" />
              <input type="number" min={0} max={100} value={Math.round(hsl.s)} onChange={(e) => { const v = parseInt(e.target.value) || 0; setHsl(p => ({ ...p, s: v })); updateFromHsl(hsl.h, v, hsl.l); }} className="flex-1 pl-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg" placeholder="S%" aria-label="饱和度" />
              <input type="number" min={0} max={100} value={Math.round(hsl.l)} onChange={(e) => { const v = parseInt(e.target.value) || 0; setHsl(p => ({ ...p, l: v })); updateFromHsl(hsl.h, hsl.s, v); }} className="flex-1 pl-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg" placeholder="L%" aria-label="亮度" />
            </div>
            <div className="mt-1 flex items-center">
              <span className="font-mono text-sm text-slate-600 mr-2">{hslStr}</span>
              <button onClick={() => copyToClipboard(hslStr, 'hsl')} className="p-1 text-slate-400 hover:text-blue-600">
                {copied === 'hsl' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Unity Color (0-1)</label>
            <div className="flex gap-2">
              <input type="number" min={0} max={1} step={0.001} value={unity.r.toFixed(3)} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setUnity(p => ({ ...p, r: v })); updateFromUnity(v, unity.g, unity.b); }} className="flex-1 pl-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg" aria-label="Unity 红色" placeholder="R" />
              <input type="number" min={0} max={1} step={0.001} value={unity.g.toFixed(3)} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setUnity(p => ({ ...p, g: v })); updateFromUnity(unity.r, v, unity.b); }} className="flex-1 pl-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg" aria-label="Unity 绿色" placeholder="G" />
              <input type="number" min={0} max={1} step={0.001} value={unity.b.toFixed(3)} onChange={(e) => { const v = parseFloat(e.target.value) || 0; setUnity(p => ({ ...p, b: v })); updateFromUnity(unity.r, unity.g, v); }} className="flex-1 pl-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg" aria-label="Unity 蓝色" placeholder="B" />
            </div>
            <div className="mt-1 flex items-center">
              <span className="font-mono text-sm text-slate-600 mr-2">{unityStr}</span>
              <button onClick={() => copyToClipboard(unityStr, 'unity')} className="p-1 text-slate-400 hover:text-blue-600">
                {copied === 'unity' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorFormatConverter;
