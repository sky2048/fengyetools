import React, { useState } from 'react';
import { Monitor, Download, Image as ImageIcon } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { createImage } from '../../utils/imageUtils';

const ImageToIco: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (!files[0].type.startsWith('image/')) {
        alert("请选择图片文件");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(files[0]);
      setPreviewUrl(URL.createObjectURL(files[0]));
    }
  };

  // Helper to create PNG blob from image for a specific size
  const createResizedPng = async (img: HTMLImageElement, size: number): Promise<Uint8Array> => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context failed");

    ctx.drawImage(img, 0, 0, size, size);
    
    return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
            if (blob) {
                const buffer = await blob.arrayBuffer();
                resolve(new Uint8Array(buffer));
            } else {
                reject(new Error("Blob creation failed"));
            }
        }, 'image/png');
    });
  };

  const generateIco = async () => {
    if (!file || !previewUrl) return;
    setIsProcessing(true);

    try {
        const img = await createImage(previewUrl);
        const sizes = [16, 32, 48, 64, 128, 256]; // Standard Windows sizes
        
        // 1. Generate PNG buffers for all sizes
        const imagesData = await Promise.all(sizes.map(s => createResizedPng(img, s)));

        // 2. Calculate file offsets
        // Header: 6 bytes
        // Directory: 16 bytes * num_images
        const headerSize = 6;
        const directorySize = 16 * sizes.length;
        let currentOffset = headerSize + directorySize;

        // 3. Build File
        // Total size calculation
        const totalSize = currentOffset + imagesData.reduce((acc, curr) => acc + curr.length, 0);
        const buffer = new Uint8Array(totalSize);
        const view = new DataView(buffer.buffer);

        // Write Header
        view.setUint16(0, 0, true); // Reserved
        view.setUint16(2, 1, true); // Type (1 = ICO)
        view.setUint16(4, sizes.length, true); // Count

        // Write Directory Entries & Data
        let dirOffset = 6;
        
        for (let i = 0; i < sizes.length; i++) {
            const size = sizes[i];
            const data = imagesData[i];
            const len = data.length;

            // ICONDIRENTRY
            view.setUint8(dirOffset + 0, size === 256 ? 0 : size); // Width
            view.setUint8(dirOffset + 1, size === 256 ? 0 : size); // Height
            view.setUint8(dirOffset + 2, 0); // Color count (0 if >=8bpp)
            view.setUint8(dirOffset + 3, 0); // Reserved
            view.setUint16(dirOffset + 4, 1, true); // Planes
            view.setUint16(dirOffset + 6, 32, true); // BPP
            view.setUint32(dirOffset + 8, len, true); // Size
            view.setUint32(dirOffset + 12, currentOffset, true); // Offset

            // Write Image Data
            buffer.set(data, currentOffset);

            dirOffset += 16;
            currentOffset += len;
        }

        // 4. Download
        const blob = new Blob([buffer], { type: 'image/x-icon' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.name.split('.')[0]}.ico`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (e) {
        console.error(e);
        alert("转换失败");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Monitor className="w-6 h-6 mr-2 text-blue-600" />
          图片转 ICO
        </h2>
        <p className="text-slate-500 mt-1">将图片转换为标准的 Windows 图标文件 (.ico)，自动包含 16x16 至 256x256 多种尺寸。</p>
      </div>

      {!file ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/*" 
          label="上传图片 (建议正方形 PNG/JPG)" 
        />
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto text-center">
            <div className="bg-slate-50 w-32 h-32 mx-auto rounded-lg flex items-center justify-center mb-6 border border-slate-200 p-2">
                <img src={previewUrl!} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 mb-2">{file.name}</h3>
            <p className="text-sm text-slate-500 mb-8">
                将被转换为包含 16, 32, 48, 64, 128, 256px 尺寸的 ICO 文件。
            </p>

            <div className="flex gap-4 justify-center">
                <Button onClick={generateIco} isLoading={isProcessing} className="min-w-[150px]">
                    <Download className="w-4 h-4 mr-2" /> 转换并下载
                </Button>
                <Button variant="outline" onClick={() => setFile(null)}>
                    更换图片
                </Button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageToIco;