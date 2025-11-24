import React, { useState, useRef } from 'react';
import { FileAudio, Download, Loader2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { loadFFmpeg, readFileAsArrayBuffer } from '../../utils/ffmpegUtils';
import { fetchFile } from '@ffmpeg/util';

const VideoToAudio: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setFile(files[0]);
      setAudioUrl(null);
      setLogs([]);
    }
  };

  const convert = async () => {
    if (!file) return;
    setProcessing(true);
    setLogs(['正在加载 FFmpeg 核心...']);

    try {
      const ffmpeg = await loadFFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
        setLogs((prev) => [...prev.slice(-4), message]);
      });

      const inputName = 'input.mp4';
      const outputName = 'output.mp3';

      setLogs(prev => [...prev, '正在写入文件到内存...']);
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      setLogs(prev => [...prev, '开始提取音频...']);
      // Extract audio using libmp3lame
      await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', outputName]);

      setLogs(prev => [...prev, '处理完成，正在生成下载链接...']);
      const data = await ffmpeg.readFile(outputName);
      
      const blob = new Blob([data], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, '错误: ' + (error instanceof Error ? error.message : '未知错误')]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <FileAudio className="w-6 h-6 mr-2 text-blue-600" />
          提取视频音频
        </h2>
        <p className="text-slate-500 mt-1">从视频文件中提取高品质 MP3 音频。</p>
      </div>

      {!file ? (
        <FileInput onFileSelect={handleFileSelect} accept="video/*" label="上传视频文件" />
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto text-center">
          <h3 className="font-semibold text-lg mb-2">{file.name}</h3>
          <p className="text-slate-500 mb-6 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

          {processing ? (
            <div className="space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <div className="text-sm text-slate-500 font-mono bg-slate-50 p-3 rounded border border-slate-100">
                    {logs[logs.length - 1] || '处理中...'}
                </div>
            </div>
          ) : audioUrl ? (
            <div className="space-y-4">
                <audio controls src={audioUrl} className="w-full mb-4" />
                <div className="flex gap-3 justify-center">
                    <a href={audioUrl} download={`${file.name.replace(/\.[^/.]+$/, "")}.mp3`}>
                        <Button>
                            <Download className="w-4 h-4 mr-2" /> 下载 MP3
                        </Button>
                    </a>
                    <Button variant="outline" onClick={() => setFile(null)}>
                        处理其他文件
                    </Button>
                </div>
            </div>
          ) : (
             <Button onClick={convert} className="min-w-[200px]">
                 开始提取
             </Button>
          )}
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 flex items-start">
        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
        <p>所有处理均在您的浏览器本地进行，视频不会上传到服务器，保护您的隐私。</p>
      </div>
    </div>
  );
};

export default VideoToAudio;