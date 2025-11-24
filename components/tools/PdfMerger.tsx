import React, { useState } from 'react';
// @ts-ignore
import { PDFDocument } from 'pdf-lib';
import { Files, Download, Trash2, GripVertical, ArrowUp, ArrowDown, Plus, FileText } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { formatBytes } from '../../utils/imageUtils';

interface PdfFile {
  id: string;
  file: File;
  pageCount: number | null;
}

const PdfMerger: React.FC = () => {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Drag & Sort
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles: PdfFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      if (selectedFiles[i].type === 'application/pdf') {
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file: selectedFiles[i],
          pageCount: null // Could be loaded async if needed
        });
      }
    }
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  // --- Sorting ---
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setFiles(newFiles);
  };

  // --- Drag and Drop ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newFiles = [...files];
    const [draggedItem] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedItem);

    setFiles(newFiles);
    setDraggedIndex(null);
  };

  const mergePdfs = async () => {
    if (files.length < 2) {
        alert("请至少选择两个 PDF 文件进行合并");
        return;
    }
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const pdfFile of files) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_document_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      alert("合并失败，请检查文件是否加密或损坏");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <Files className="w-6 h-6 mr-2 text-blue-600" />
          PDF 合并
        </h2>
        <p className="text-slate-500 mt-1">将多个 PDF 文件合并为一个，支持自由调整文件顺序。</p>
      </div>

      {files.length === 0 ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept=".pdf" 
          multiple={true}
          label="拖拽多个 PDF 文件到此处" 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* File List */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                       <h3 className="font-semibold text-slate-900">文件列表 ({files.length})</h3>
                       <div className="flex gap-2">
                           <label className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 cursor-pointer transition-colors">
                               <Plus className="w-3 h-3 mr-1" /> 添加文件
                               <input type="file" multiple accept=".pdf" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                           </label>
                           <button 
                              onClick={() => setFiles([])}
                              className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                           >
                              <Trash2 className="w-3 h-3 mr-1" /> 清空
                           </button>
                       </div>
                    </div>
                    
                    <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {files.map((fileItem, index) => (
                            <div 
                                key={fileItem.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                                className={`flex items-center gap-3 p-3 bg-slate-50 border rounded-lg transition-all ${
                                    draggedIndex === index 
                                    ? 'opacity-50 border-blue-400 bg-blue-50 scale-95' 
                                    : 'border-slate-200 hover:border-blue-300'
                                }`}
                            >
                                <div className="cursor-move text-slate-400 hover:text-blue-500">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                
                                <div className="w-10 h-10 bg-red-50 rounded flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-red-500" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-700 truncate">{fileItem.file.name}</span>
                                        <span className="text-xs bg-slate-200 text-slate-500 px-1.5 rounded">{index + 1}</span>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {formatBytes(fileItem.file.size)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <div className="flex flex-col">
                                        <button onClick={() => moveUp(index)} disabled={index === 0} className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20">
                                            <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => moveDown(index)} disabled={index === files.length - 1} className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20">
                                            <ArrowDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <button onClick={() => removeFile(index)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Panel */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
                    <h3 className="font-semibold text-slate-900 mb-4">合并选项</h3>
                    <div className="space-y-4">
                        <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded border border-blue-100">
                            <p>您可以通过拖拽左侧列表项来调整 PDF 的合并顺序。</p>
                        </div>
                        
                        <div className="flex justify-between text-sm text-slate-600 py-2 border-t border-slate-100">
                            <span>文件数量:</span>
                            <span className="font-medium">{files.length}</span>
                        </div>

                        <Button onClick={mergePdfs} isLoading={isProcessing} disabled={files.length < 2} className="w-full">
                            <Download className="w-4 h-4 mr-2" />
                            开始合并
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PdfMerger;