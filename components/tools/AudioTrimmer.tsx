import React, { useState } from 'react';
import { Music, Scissors, Download, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { loadFFmpeg } from '../../utils/ffmpegUtils';
import { fetchFile } from '@ffmpeg/util';

const AudioTrimmer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:10');

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setFile(files[0]);
      setOutputUrl(null);
    }
  };

  const trim = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const ffmpeg = await loadFFmpeg();
      const ext = file.name.split('.').pop() || 'mp3';
      const inputName = `input.${ext}`;
      const outputName = `output.${ext}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec([
          '-i', inputName, 
          '-ss', startTime, 
          '-to', endTime, 
          '-c', 'copy', // Audio copy is usually fine and fast
          outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: file.type });
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
          <Music className="w-6 h-6 mr-2 text-blue-600" />
          音频裁切
        </h2>
        <p className="text-slate-500 mt-1">支持 MP3, WAV 等格式的片段截取。</p>
      </div>

      {!file ? (
        <FileInput onFileSelect={handleFileSelect} accept="audio/*" label="上传音频文件" />
      ) : (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-center mb-6">{file.name}</h3>
            
            <div className="flex justify-center mb-8">
                <audio controls src={URL.createObjectURL(file)} className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">开始 (HH:MM:SS)</label>
                    <input 
                        type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-center font-mono"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">结束 (HH:MM:SS)</label>
                    <input 
                        type="text" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-center font-mono"
                    />
                </div>
            </div>

            {outputUrl ? (
                <div className="text-center space-y-4 bg-green-50 p-6 rounded-lg border border-green-100">
                    <p className="text-green-800 font-medium">裁切完成！</p>
                    <audio controls src={outputUrl} className="w-full" />
                    <div className="flex gap-3 justify-center">
                        <a href={outputUrl} download={`trimmed_${file.name}`}>
                            <Button>
                                <Download className="w-4 h-4 mr-2" /> 下载文件
                            </Button>
                        </a>
                        <Button variant="outline" onClick={() => { setOutputUrl(null); setFile(null); }}>
                            继续处理
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <Button onClick={trim} isLoading={processing} className="flex-1">
                        <Scissors className="w-4 h-4 mr-2" /> 开始裁切
                    </Button>
                    <Button variant="outline" onClick={() => setFile(null)}>
                        取消
                    </Button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AudioTrimmer;