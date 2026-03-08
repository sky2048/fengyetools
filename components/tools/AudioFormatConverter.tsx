import React, { useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { loadFFmpeg } from '../../utils/ffmpegUtils';
import { fetchFile } from '@ffmpeg/util';

const FORMAT_OPTIONS = [
  { value: 'mp3', label: 'MP3', mime: 'audio/mpeg', ffmpegArgs: ['-acodec', 'libmp3lame', '-q:a', '2'] },
  { value: 'wav', label: 'WAV', mime: 'audio/wav', ffmpegArgs: ['-acodec', 'pcm_s16le'] },
  { value: 'ogg', label: 'OGG', mime: 'audio/ogg', ffmpegArgs: ['-acodec', 'libvorbis', '-q:a', '5'] },
  { value: 'aac', label: 'AAC', mime: 'audio/aac', ffmpegArgs: ['-acodec', 'aac', '-b:a', '192k'] },
  { value: 'flac', label: 'FLAC', mime: 'audio/flac', ffmpegArgs: ['-acodec', 'flac'] },
] as const;

const AudioFormatConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('mp3');

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setFile(files[0]);
      setOutputUrl(null);
    }
  };

  const convert = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const ffmpeg = await loadFFmpeg();
      const ext = file.name.split('.').pop() || 'mp3';
      const inputName = `input.${ext}`;
      const format = FORMAT_OPTIONS.find(f => f.value === targetFormat) || FORMAT_OPTIONS[0];
      const outputName = `output.${format.value}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      await ffmpeg.exec([
        '-i', inputName,
        ...format.ffmpegArgs,
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: format.mime });
      setOutputUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error(error);
      alert('格式转换失败');
    } finally {
      setProcessing(false);
    }
  };

  const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'converted';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <RefreshCw className="w-6 h-6 mr-2 text-blue-600" />
          音频格式转换
        </h2>
        <p className="text-slate-500 mt-1">支持 WAV、MP3、OGG、AAC、FLAC 等格式互转。</p>
      </div>

      {!file ? (
        <FileInput onFileSelect={handleFileSelect} accept="audio/*" label="上传音频文件" />
      ) : (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-center mb-6">{file.name}</h3>

          <div className="flex justify-center mb-8">
            <audio controls src={URL.createObjectURL(file)} className="w-full" />
          </div>

          <div className="mb-6">
            <label htmlFor="target-format" className="block text-sm font-medium text-slate-700 mb-2">目标格式</label>
            <select
              id="target-format"
              aria-label="目标格式"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {outputUrl ? (
            <div className="text-center space-y-4 bg-green-50 p-6 rounded-lg border border-green-100">
              <p className="text-green-800 font-medium">转换完成！</p>
              <audio controls src={outputUrl} className="w-full" />
              <div className="flex gap-3 justify-center">
                <a href={outputUrl} download={`${baseName}.${targetFormat}`}>
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
              <Button onClick={convert} isLoading={processing} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" /> 开始转换
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

export default AudioFormatConverter;
