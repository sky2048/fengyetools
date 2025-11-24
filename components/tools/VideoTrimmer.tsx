import React, { useState, useRef } from 'react';
import { Scissors, Download, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { loadFFmpeg } from '../../utils/ffmpegUtils';
import { fetchFile } from '@ffmpeg/util';

const VideoTrimmer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:10');
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setFile(files[0]);
      const url = URL.createObjectURL(files[0]);
      setVideoUrl(url);
      setOutputUrl(null);
    }
  };

  const trim = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const ffmpeg = await loadFFmpeg();
      
      const inputName = 'input_trim.mp4';
      const outputName = 'output_trim.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Use -ss (start) and -to (end) with -c copy for fast trimming (keyframe dependent)
      // Or re-encode for accuracy. Let's try fast first, but re-encode is safer for web browser playback compatibility.
      // Re-encoding: -c:v libx264 -preset ultrafast
      await ffmpeg.exec([
          '-i', inputName, 
          '-ss', startTime, 
          '-to', endTime, 
          '-c:v', 'libx264', 
          '-preset', 'ultrafast', 
          '-c:a', 'copy',
          outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: 'video/mp4' });
      setOutputUrl(URL.createObjectURL(blob));

    } catch (error) {
      console.error(error);
      alert('裁切失败');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Scissors className="w-6 h-6 mr-2 text-blue-600" />
          视频裁切
        </h2>
        <p className="text-slate-500 mt-1">输入开始和结束时间，截取视频片段。</p>
      </div>

      {!file ? (
        <FileInput onFileSelect={handleFileSelect} accept="video/*" label="上传视频" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div>
               <h3 className="font-medium mb-2">原始视频</h3>
               <video src={videoUrl!} controls className="w-full rounded-lg bg-black max-h-[400px]" />
               
               <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <div className="grid grid-cols-2 gap-4 mb-4">
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">开始时间 (HH:MM:SS)</label>
                           <input 
                              type="text" 
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md"
                              placeholder="00:00:00"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">结束时间 (HH:MM:SS)</label>
                           <input 
                              type="text" 
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md"
                              placeholder="00:00:10"
                           />
                       </div>
                   </div>
                   <div className="flex gap-2">
                        <Button onClick={trim} isLoading={processing} className="flex-1">
                            确认裁切
                        </Button>
                        <Button variant="outline" onClick={() => setFile(null)}>
                            取消
                        </Button>
                   </div>
               </div>
           </div>

           <div>
               <h3 className="font-medium mb-2">裁切结果</h3>
               <div className="bg-slate-100 rounded-xl border border-slate-200 h-[400px] flex items-center justify-center">
                   {processing ? (
                       <div className="text-center">
                           <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                           <p className="text-slate-500">处理中...</p>
                       </div>
                   ) : outputUrl ? (
                       <div className="w-full h-full p-2 flex flex-col">
                           <video src={outputUrl} controls className="w-full flex-1 bg-black rounded-lg mb-4" />
                           <a href={outputUrl} download={`trimmed_${file.name}`}>
                               <Button className="w-full">
                                   <Download className="w-4 h-4 mr-2" /> 下载结果
                               </Button>
                           </a>
                       </div>
                   ) : (
                       <p className="text-slate-400">等待裁切</p>
                   )}
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default VideoTrimmer;