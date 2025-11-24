import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { FileType, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';
import { Html2PdfOptions } from '../../types';

const WordToPdf: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'converting' | 'done'>('upload');
  
  // Hidden container for PDF generation
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (files && files[0]) {
      const selectedFile = files[0];
      if (!selectedFile.name.endsWith('.docx')) {
        alert("请选择 .docx 文件 (不支持旧版 .doc)");
        return;
      }
      setFile(selectedFile);
      
      // Convert to HTML for preview/printing
      setIsProcessing(true);
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
        setStep('preview');
      } catch (error) {
        console.error(error);
        alert("解析 Word 文件失败。");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleGeneratePdf = () => {
    if (!previewRef.current || !file) return;
    
    setStep('converting');
    
    const element = previewRef.current;
    const opt: Html2PdfOptions = {
      margin:       10, // mm
      filename:     file.name.replace('.docx', '.pdf'),
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
      setStep('done');
    }).catch((err: any) => {
        console.error(err);
        alert("生成 PDF 失败");
        setStep('preview');
    });
  };

  const reset = () => {
    setFile(null);
    setHtmlContent('');
    setStep('upload');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">Word 转 PDF</h2>
        <p className="text-slate-500 mt-1">将 Word (.docx) 文档转换为 PDF。支持预览和格式保留。</p>
      </div>

      {step === 'upload' && (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept=".docx" 
          label="上传 Word (.docx) 文档" 
        />
      )}

      {(step === 'preview' || step === 'converting' || step === 'done') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 border border-slate-200 shadow-lg min-h-[600px] max-h-[800px] overflow-y-auto rounded-lg">
                {/* Actual content to be printed */}
                <div 
                    ref={previewRef}
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                />
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-8">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                        <FileType className="w-5 h-5 mr-2 text-blue-600" />
                        控制面板
                    </h3>
                    
                    <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-800 flex items-start">
                        <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-1">格式提示</p>
                            由于浏览器限制，转换结果可能与原始 Word 排版略有差异。请先在左侧预览。
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button 
                            onClick={handleGeneratePdf} 
                            disabled={step === 'converting'}
                            isLoading={step === 'converting'}
                            className="w-full"
                        >
                            {step === 'done' ? '重新下载 PDF' : '生成并下载 PDF'}
                        </Button>
                        
                        <Button variant="outline" onClick={reset} className="w-full">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            转换其他文件
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default WordToPdf;
