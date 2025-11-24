import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileInputProps {
  onFileSelect: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
}

const FileInput: React.FC<FileInputProps> = ({ onFileSelect, accept, multiple = false, label = "点击上传或拖拽文件到此处" }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative cursor-pointer flex flex-col items-center justify-center w-full h-64 
        rounded-xl border-2 border-dashed transition-all duration-200
        ${isDragging 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
        }
      `}
    >
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
        <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
          <UploadCloud className="w-8 h-8" />
        </div>
        <p className="mb-2 text-lg font-medium text-slate-700">
          {label}
        </p>
        <p className="text-sm text-slate-500">
          {accept ? `支持格式: ${accept.replace(/,/g, ', ')}` : '支持所有文件'}
        </p>
      </div>
    </div>
  );
};

export default FileInput;