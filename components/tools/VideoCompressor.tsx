import React, { useState } from 'react';
import { Minimize2, Download, Loader2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { loadFFmpeg } from '../../utils/ffmpegUtils';
import { fetchFile } from '@ffmpeg/util';

const VideoCompressor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [crf, setCrf] = useState(28); // Default CRF 28 (Lower is better quality, higher is smaller size)
  const [outputSize, setOutputSize] = useState(0);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setFile(files[0]);
      setOutputUrl(null);
      setLogs([]);
      setOutputSize(0);
    }
  };

  const compress = async () => {
    if (!file) return;
    setProcessing(true);
    setLogs(['初始化引擎...']);

    try {
      const ffmpeg = await loadFFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
        // Simple filter to show progress related logs
        if (message.includes('time=') || message.includes('speed=')) {
           setLogs((prev) => [...prev.slice(-1), message]);
        }
      });

      const inputName = 'input_vid.mp4';
      const outputName = 'output_vid.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      setLogs(['开始压缩 (这可能需要几分钟)...']);
      
      // Use H.264 with CRF parameter. Ultrafast preset for speed in WASM.
      // -crf: 0-51. 18 is visually lossless, 23 is default, 28 is compressed.
      await ffmpeg.exec([
          '-i', inputName, 
          '-vcodec', 'libx264', 
          '-crf', crf.toString(), 
          '-preset', 'ultrafast', 
          outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: 'video/mp4' });
      
      setOutputSize(blob.size);
      setOutputUrl(URL.createObjectURL(blob));
      setLogs(['压缩完成！']);

    } catch (error) {
      console.error(error);
      setLogs(['压缩失败，请重试。']);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Minimize2 className="w-6 h-6 mr-2 text-blue-600" />
          视频压缩
        </h2>
        <p className="text-slate-500 mt-1">减小视频体积，支持调节压缩强度。</p>
      </div>

      {!file ? (
        <FileInput onFileSelect={handleFileSelect} accept="video/*" label="上传视频文件" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Settings */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
              <h3 className="font-semibold mb-4">压缩设置</h3>
              <div className="space-y-4">
                  <div>
                      <div className="flex justify-between text-sm mb-2">
                          <span>压缩强度 (CRF)</span>
                          <span className="font-mono text-blue-600">{crf}</span>
                      </div>
                      <input 
                        type="range" min="18" max="35" step="1" 
                        value={crf} 
                        onChange={(e) => setCrf(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>画质优先 (大)</span>
                          <span>体积优先 (小)</span>
                      </div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 text-xs text-slate-600 rounded">
                      建议值: 23 (平衡), 28 (压缩), 32 (极限)。WASM 环境性能有限，推荐使用 'ultrafast' 预设(已默认启用)。
                  </div>

                  <Button onClick={compress} isLoading={processing} className="w-full">
                      开始压缩
                  </Button>
                  <Button variant="outline" onClick={() => setFile(null)} disabled={processing} className="w-full">
                      取消
                  </Button>
              </div>
           </div>

           {/* Result */}
           <div className="lg:col-span-2">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[300px] flex flex-col items-center justify-center">
                   {processing ? (
                       <div className="text-center">
                           <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                           <p className="text-slate-600 font-medium">正在处理视频...</p>
                           <p className="text-slate-400 text-sm mt-2 max-w-md font-mono bg-slate-50 p-2 rounded truncate">
                               {logs[logs.length-1]}
                           </p>
                       </div>
                   ) : outputUrl ? (
                       <div className="w-full text-center space-y-4">
                           <video controls src={outputUrl} className="max-h-[400px] w-full bg-black rounded-lg" />
                           <div className="flex justify-center gap-8 text-sm">
                               <div>
                                   <p className="text-slate-500 mb-1">原始大小</p>
                                   <p className="font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                               </div>
                               <div className="text-green-600">
                                   <p className="mb-1">压缩后</p>
                                   <p className="font-bold">{(outputSize / 1024 / 1024).toFixed(2)} MB</p>
                               </div>
                               <div className="text-blue-600">
                                   <p className="mb-1">压缩率</p>
                                   <p className="font-bold">-{Math.round((1 - outputSize / file.size) * 100)}%</p>
                               </div>
                           </div>
                           <a href={outputUrl} download={`compressed_${file.name}`}>
                               <Button size="lg">
                                   <Download className="w-5 h-5 mr-2" /> 保存视频
                               </Button>
                           </a>
                       </div>
                   ) : (
                       <div className="text-slate-400 text-center">
                           <Minimize2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                           <p>预览区域</p>
                       </div>
                   )}
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default VideoCompressor;