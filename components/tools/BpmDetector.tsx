import React, { useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

/**
 * 基于峰值检测的简化 BPM 估算
 * 使用 Web Audio API 分析音频，检测能量峰值间隔来估算节奏
 */
const estimateBpm = async (file: File): Promise<number> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // 下采样到约 100Hz 以降低计算量
  const downsampleFactor = Math.floor(sampleRate / 100);
  const blockSize = downsampleFactor;
  const numBlocks = Math.floor(channelData.length / blockSize);
  const energy: number[] = [];

  for (let i = 0; i < numBlocks; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      const sample = channelData[i * blockSize + j];
      sum += sample * sample;
    }
    energy.push(Math.sqrt(sum / blockSize));
  }

  // 找峰值：局部最大值且超过阈值
  const threshold = Math.max(...energy) * 0.3;
  const minPeakDistance = Math.floor(100 * 0.3); // 最小 0.3 秒间隔
  const peaks: number[] = [];

  for (let i = 1; i < energy.length - 1; i++) {
    if (
      energy[i] > threshold &&
      energy[i] >= energy[i - 1] &&
      energy[i] >= energy[i + 1] &&
      (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance)
    ) {
      peaks.push(i);
    }
  }

  // 计算峰值间隔（单位：100Hz 下的采样点，即 0.01 秒）
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push((peaks[i] - peaks[i - 1]) / 100); // 转换为秒
  }

  if (intervals.length < 2) {
    return 0;
  }

  // 取中位数间隔，过滤异常值
  const sorted = [...intervals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianInterval = sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;

  const bpm = 60 / medianInterval;

  // BPM 通常在 60-180 之间，可能检测到的是半拍或倍拍
  let normalizedBpm = bpm;
  while (normalizedBpm < 60) normalizedBpm *= 2;
  while (normalizedBpm > 180) normalizedBpm /= 2;

  return Math.round(normalizedBpm);
};

const BpmDetector: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setFile(files[0]);
      setBpm(null);
      setError(null);
    }
  };

  const detect = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);

    try {
      const result = await estimateBpm(file);
      setBpm(result > 0 ? result : null);
      if (result === 0) {
        setError('未能检测到明显节奏，请尝试节奏更清晰的音频');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'BPM 检测失败');
      setBpm(null);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-blue-600" />
          BPM 检测
        </h2>
        <p className="text-slate-500 mt-1">基于 Web Audio API 的节奏估算，适合有明显节拍的音频。</p>
      </div>

      {!file ? (
        <FileInput onFileSelect={handleFileSelect} accept="audio/*" label="上传音频文件" />
      ) : (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-center mb-6">{file.name}</h3>

          <div className="flex justify-center mb-8">
            <audio controls src={URL.createObjectURL(file)} className="w-full" />
          </div>

          {bpm !== null && !error ? (
            <div className="text-center space-y-4 bg-green-50 p-8 rounded-lg border border-green-100">
              <p className="text-green-800 font-medium">检测结果</p>
              <p className="text-4xl font-bold text-blue-600">{bpm} <span className="text-2xl font-normal text-slate-600">BPM</span></p>
              <p className="text-sm text-slate-500">仅供参考，基于峰值检测的简化算法</p>
              <Button variant="outline" onClick={() => { setBpm(null); setFile(null); }}>
                检测其他文件
              </Button>
            </div>
          ) : error ? (
            <div className="text-center space-y-4 bg-amber-50 p-6 rounded-lg border border-amber-100">
              <p className="text-amber-800">{error}</p>
              <Button variant="outline" onClick={() => { setError(null); setFile(null); }}>
                重新选择
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button onClick={detect} isLoading={processing} className="flex-1">
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 分析中...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" /> 检测 BPM
                  </>
                )}
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

export default BpmDetector;
