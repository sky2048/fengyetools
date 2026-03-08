import React, { useState } from 'react';
import { Waves, Download } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { loadFFmpeg } from '../../utils/ffmpegUtils';
import { fetchFile } from '@ffmpeg/util';

const AudioFadeInOut: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(1);
  const [fadeOut, setFadeOut] = useState(1);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setFile(files[0]);
      setOutputUrl(null);
    }
  };

  const process = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const ffmpeg = await loadFFmpeg();
      const ext = file.name.split('.').pop() || 'mp3';
      const inputName = `input.${ext}`;
      const outputName = `output.${ext}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // afade: t=in/out, st=start time (seconds), d=duration
      const filters: string[] = [];
      if (fadeIn > 0) {
        filters.push(`afade=t=in:st=0:d=${fadeIn}`);
      }
      if (fadeOut > 0) {
        // st 需要知道音频总时长，ffmpeg 可用 -t 配合，这里用 atempo 或直接 st=0 配合 d 表示从结尾往前 d 秒开始淡出
        // afade=t=out:st=0:d=2 表示从开头开始 2 秒淡出（错误）
        // 正确：afade=t=out:st=END-d:d=d 需要知道 END
        // 简化：用 -af "afade=t=out:st=0:d=X" 时 st=0 表示从音频开始，d 表示淡出持续时长，但这样会从开头就淡出
        // 正确用法：afade=t=out:st={duration-fadeOut}:d={fadeOut}
        // 我们不知道 duration，可以用 atrim+afade 或者用 asetpts 等
        // 更简单：用 -af "apad,atrim=0,afade=t=out:st=0:d=X" 不行
        // 查文档：afade t=out st 是淡出开始的时间点（秒），d 是淡出持续时长
        // 所以需要先获取时长。可以用 ffprobe 或两次处理。简化：让用户输入或我们用 -t 获取
        // 另一种：用 aduration 或 在 js 里用 Audio 获取 duration
        const audio = new Audio(URL.createObjectURL(file));
        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => resolve();
          audio.onerror = () => resolve();
        });
        const duration = audio.duration || 0;
        URL.revokeObjectURL(audio.src);
        const fadeOutStart = Math.max(0, duration - fadeOut);
        filters.push(`afade=t=out:st=${fadeOutStart}:d=${fadeOut}`);
      }

      const filterStr = filters.length > 0 ? filters.join(',') : 'anull';
      await ffmpeg.exec([
        '-i', inputName,
        '-af', filterStr,
        outputName
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: file.type });
      setOutputUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error(error);
      alert('淡入淡出处理失败');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Waves className="w-6 h-6 mr-2 text-blue-600" />
          音频淡入淡出
        </h2>
        <p className="text-slate-500 mt-1">为音频添加淡入、淡出效果，平滑开始与结束。</p>
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
              <label htmlFor="fade-in" className="block text-sm font-medium text-slate-700 mb-1">淡入时长 (秒)</label>
              <input
                id="fade-in"
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={fadeIn}
                onChange={(e) => setFadeIn(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                aria-label="淡入时长（秒）"
              />
            </div>
            <div>
              <label htmlFor="fade-out" className="block text-sm font-medium text-slate-700 mb-1">淡出时长 (秒)</label>
              <input
                id="fade-out"
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={fadeOut}
                onChange={(e) => setFadeOut(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                aria-label="淡出时长（秒）"
              />
            </div>
          </div>

          {outputUrl ? (
            <div className="text-center space-y-4 bg-green-50 p-6 rounded-lg border border-green-100">
              <p className="text-green-800 font-medium">处理完成！</p>
              <audio controls src={outputUrl} className="w-full" />
              <div className="flex gap-3 justify-center">
                <a href={outputUrl} download={`faded_${file.name}`}>
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
              <Button onClick={process} isLoading={processing} className="flex-1">
                <Waves className="w-4 h-4 mr-2" /> 应用淡入淡出
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

export default AudioFadeInOut;
