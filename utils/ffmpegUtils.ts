import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const loadFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;

  try {
    // Dynamic import relies on the importmap in index.html
    // @ts-ignore
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    
    ffmpeg = new FFmpeg();

    const baseURL = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm';
    const coreBaseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    // Manually load the worker as a Blob URL to bypass CORS restrictions
    // The default behavior tries to load it relative to the CDN, which is blocked for Workers
    const workerBlobURL = await toBlobURL(`${baseURL}/worker.js`, 'text/javascript');

    if (ffmpeg) {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${coreBaseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${coreBaseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: workerBlobURL,
      });
    }

    return ffmpeg;
  } catch (error) {
    console.error("Failed to load FFmpeg:", error);
    throw new Error("FFmpeg initialization failed. Please check your network connection or browser compatibility.");
  }
};

export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};