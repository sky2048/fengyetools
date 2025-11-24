import React, { useState } from 'react';
// @ts-ignore
import EXIF from 'exif-js';
import { Info, Camera, Clock, Aperture, Zap, FileImage, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { formatBytes } from '../../utils/imageUtils';
import { ExifTags } from '../../types';

const ExifViewer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [exifData, setExifData] = useState<ExifTags | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      const selectedFile = files[0];
      if (!selectedFile.type.startsWith('image/')) {
        alert("请选择图片文件");
        return;
      }

      // Reset
      if (imgSrc) URL.revokeObjectURL(imgSrc);
      setFile(selectedFile);
      setExifData(null);
      setLoading(true);

      // Create preview
      const url = URL.createObjectURL(selectedFile);
      setImgSrc(url);

      // Read EXIF
      // We need to create a temporary image element for EXIF.getData to work reliably with blob URLs
      const img = new Image();
      img.src = url;
      img.onload = () => {
        // @ts-ignore
        EXIF.getData(img, function() {
            // @ts-ignore
            const allMetaData = EXIF.getAllTags(this) as ExifTags;
            setExifData(allMetaData);
            setLoading(false);
        });
      };
    }
  };

  const clear = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    setFile(null);
    setImgSrc(null);
    setExifData(null);
  };

  // Helpers to extract and format common EXIF tags safely
  const getTag = (tag: keyof ExifTags) => exifData ? exifData[tag] : undefined;
  
  const formatExposure = (time: any) => {
      if (!time) return '-';
      // time might be a number (0.0166) or Fraction object depending on lib version/file
      if (time < 1) {
          return `1/${Math.round(1/time)}`;
      }
      return `${time}s`;
  };

  const formatFNumber = (num: any) => num ? `f/${Number(num).toFixed(1)}` : '-';

  const formatDateTime = (str: string) => {
      if (!str) return '-';
      // EXIF dates usually come as "YYYY:MM:DD HH:MM:SS"
      // Let's make it nicer
      const parts = str.split(' ');
      if (parts.length === 2) {
          return `${parts[0].replace(/:/g, '-')} ${parts[1]}`;
      }
      return str;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          图片信息 (EXIF)
        </h2>
        <p className="text-slate-500 mt-1">
            查看图片的元数据，包括相机型号、拍摄参数 (ISO, 光圈, 快门)、拍摄时间等。
            <br/>
            <span className="text-xs text-slate-400">注意：部分经过社交软件压缩的图片可能会丢失 EXIF 信息。</span>
        </p>
      </div>

      {!file ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept="image/jpeg,image/tiff,image/png,image/webp" 
          label="上传图片查看信息" 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left: Image Preview & Basic Info */}
           <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center mb-4 max-h-[300px]">
                      {imgSrc && <img src={imgSrc} alt="Preview" className="max-w-full max-h-[300px] object-contain" />}
                  </div>
                  
                  <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">文件名</span>
                          <span className="font-medium text-slate-900 truncate max-w-[150px]">{file.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">文件大小</span>
                          <span className="font-medium text-slate-900">{formatBytes(file.size)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">文件类型</span>
                          <span className="font-medium text-slate-900">{file.type}</span>
                      </div>
                      {exifData && (
                          <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">分辨率</span>
                              <span className="font-medium text-slate-900">
                                  {getTag('PixelXDimension') || '-'} x {getTag('PixelYDimension') || '-'}
                              </span>
                          </div>
                      )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100">
                      <Button onClick={clear} variant="outline" className="w-full text-red-600 hover:bg-red-50 border-red-200">
                          <Trash2 className="w-4 h-4 mr-2" />
                          清除图片
                      </Button>
                  </div>
              </div>
           </div>

           {/* Right: EXIF Data */}
           <div className="lg:col-span-2 space-y-6">
               {loading ? (
                   <div className="flex items-center justify-center h-64 text-slate-500">
                       读取中...
                   </div>
               ) : !exifData || Object.keys(exifData).length === 0 ? (
                   <div className="bg-amber-50 border border-amber-100 rounded-xl p-8 text-center">
                       <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Info className="w-6 h-6 text-amber-600" />
                       </div>
                       <h3 className="text-lg font-semibold text-amber-800 mb-2">未找到 EXIF 信息</h3>
                       <p className="text-amber-700 text-sm">
                           这张图片似乎不包含拍摄元数据。
                           <br/>它可能是被编辑过、截图、或者是由未记录 EXIF 的设备生成的。
                       </p>
                   </div>
               ) : (
                   <>
                        {/* Key Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                 <div className="flex items-center text-slate-400 mb-2">
                                     <Camera className="w-4 h-4 mr-1.5" />
                                     <span className="text-xs font-medium uppercase">相机</span>
                                 </div>
                                 <div className="font-bold text-slate-800 text-sm truncate" title={getTag('Model')}>
                                     {getTag('Model') || '未知型号'}
                                 </div>
                                 <div className="text-xs text-slate-500 truncate">
                                     {getTag('Make') || '未知厂商'}
                                 </div>
                             </div>

                             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                 <div className="flex items-center text-slate-400 mb-2">
                                     <Aperture className="w-4 h-4 mr-1.5" />
                                     <span className="text-xs font-medium uppercase">拍摄参数</span>
                                 </div>
                                 <div className="font-bold text-slate-800 text-sm">
                                     {formatFNumber(getTag('FNumber'))}
                                 </div>
                                 <div className="text-xs text-slate-500">
                                     {formatExposure(getTag('ExposureTime'))}
                                 </div>
                             </div>

                             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                 <div className="flex items-center text-slate-400 mb-2">
                                     <Zap className="w-4 h-4 mr-1.5" />
                                     <span className="text-xs font-medium uppercase">ISO / 焦距</span>
                                 </div>
                                 <div className="font-bold text-slate-800 text-sm">
                                     ISO {getTag('ISOSpeedRatings') || '-'}
                                 </div>
                                 <div className="text-xs text-slate-500">
                                     {getTag('FocalLength') ? `${Number(getTag('FocalLength'))}mm` : '-'}
                                 </div>
                             </div>

                             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                 <div className="flex items-center text-slate-400 mb-2">
                                     <Clock className="w-4 h-4 mr-1.5" />
                                     <span className="text-xs font-medium uppercase">时间</span>
                                 </div>
                                 <div className="font-bold text-slate-800 text-xs">
                                     {formatDateTime(getTag('DateTimeOriginal') || getTag('DateTime') || '')}
                                 </div>
                             </div>
                        </div>

                        {/* Detailed Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                             <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center">
                                 <FileImage className="w-4 h-4 text-slate-500 mr-2" />
                                 <h3 className="font-medium text-slate-700 text-sm">完整元数据</h3>
                             </div>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-sm text-left">
                                     <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                         <tr>
                                             <th className="px-6 py-3 font-medium">标签 (Tag)</th>
                                             <th className="px-6 py-3 font-medium">值 (Value)</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-100">
                                         {Object.entries(exifData)
                                            .filter(([key]) => key !== 'thumbnail' && key !== 'MakerNote' && key !== 'UserComment') // Filter out huge binary dumps
                                            .map(([key, value]: [string, any]) => (
                                             <tr key={key} className="hover:bg-slate-50 transition-colors">
                                                 <td className="px-6 py-3 font-medium text-slate-600 whitespace-nowrap">{key}</td>
                                                 <td className="px-6 py-3 text-slate-800 break-all max-w-xs">
                                                     {String(value)}
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                        </div>
                   </>
               )}
           </div>
        </div>
      )}
    </div>
  );
};

export default ExifViewer;
