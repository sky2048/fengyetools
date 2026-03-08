import React, { useState } from 'react';
import { Volume2, Download } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { loadFFmpeg } from '../../utils/ffmpegUtils';
import { fetchFile } from '@ffmpeg/util';

const TARGET_DB_OPTIONS = [-24, -20, -18, -16, -14, -12, -10];

const AudioNormalizer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [targetDb, setTargetDb] = useState<number>(-16);
  const [useLoudnorm, setUseLoudnorm] = useState(true);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setFile(files[0]);
      setOutputUrl(null);
    }
  };

  const normalize = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const ffmpeg = await loadFFmpeg();
      const ext = file.name.split('.').pop() || 'mp3';
      const inputName = `input.${ext}`;
      const outputName = `output.${ext}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      let filterArgs: string[];
      if (useLoudnorm) {
        // loudnorm: I=integrated loudness (LUFS), TP=true peak, LRA=loudness range
        filterArgs = [`loudnorm=I=${targetDb}:TP=-1.5:LRA=11`];
      } else {
        // volume filter: 将音量调整到目标 dB
        filterArgs = [`volume=${targetDb}dB`];
      }

      await ffmpeg.exec([
        '-i', inputName,
        '-af', filterArgs.join(','),
        '-ar', '44100',
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: file.type });
      setOutputUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error(error);
      alert('归一化失败，可尝试使用简单音量模式');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Volume2 className="w-6 h-6 mr-2 text-blue-600" />
          音频归一化
        </h2>
        <p className="text-slate-500 mt-1">统一音量到目标响度，支持 loudnorm 或简单 volume 模式。</p>
      </div>

      {!file ? (
        <FileInput onFileSelect={handleFileSelect} accept="audio/*" label="上传音频文件" />
      ) : (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-center mb-6">{file.name}</h3>

          <div className="flex justify-center mb-8">
            <audio controls src={URL.createObjectURL(file)} className="w-full" />
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="target-db" className="block text-sm font-medium text-slate-700 mb-2">目标响度 (dB)</label>
              <select
                id="target-db"
              aria-label="目标响度"
              value={targetDb}
              onChange={(e) => setTargetDb(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
            >
                {TARGET_DB_OPTIONS.map((db) => (
                  <option key={db} value={db}>{db} dB</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="loudnorm"
                checked={useLoudnorm}
                onChange={(e) => setUseLoudnorm(e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="loudnorm" className="text-sm text-slate-700">
                使用 loudnorm（更精确，适合广播标准；失败时可取消勾选用 volume）
              </label>
            </div>
          </div>

          {outputUrl ? (
            <div className="text-center space-y-4 bg-green-50 p-6 rounded-lg border border-green-100">
              <p className="text-green-800 font-medium">归一化完成！</p>
              <audio controls src={outputUrl} className="w-full" />
              <div className="flex gap-3 justify-center">
                <a href={outputUrl} download={`normalized_${file.name}`}>
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
              <Button onClick={normalize} isLoading={processing} className="flex-1">
                <Volume2 className="w-4 h-4 mr-2" /> 开始归一化
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

export default AudioNormalizer;
