import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { FileText, Download, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import FileInput from '../ui/FileInput';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const PdfToWord: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      if (files[0].type !== 'application/pdf') {
        setError("请选择有效的 PDF 文件。");
        return;
      }
      setFile(files[0]);
      setDownloadUrl(null);
      setError(null);
      setProgress(0);
    }
  };

  const convertToWord = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      const docParagraphs: Paragraph[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Basic text extraction logic
        // This is a simplified extraction that preserves line breaks but not complex layout
        let lastY = -1;
        let lineText = "";
        
        for (const item of textContent.items) {
            // Type guard for TextItem
            if ('str' in item) {
                const currentY = item.transform[5]; // Y position
                
                // If Y changes significantly, it's a new line
                if (lastY !== -1 && Math.abs(currentY - lastY) > 10) {
                    docParagraphs.push(new Paragraph({
                        children: [new TextRun(lineText)],
                        spacing: { after: 120 }
                    }));
                    lineText = "";
                }
                
                lineText += item.str + " ";
                lastY = currentY;
            }
        }
        // Add the last line of the page
        if (lineText) {
             docParagraphs.push(new Paragraph({
                children: [new TextRun(lineText)],
                spacing: { after: 200 } // Gap between pages
            }));
        }
        
        // Page break marker could be added here if needed
        setProgress(10 + Math.round((i / numPages) * 70));
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: docParagraphs.length > 0 ? docParagraphs : [new Paragraph("未能提取到文本，可能是纯图片 PDF。")],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setProgress(100);

    } catch (err) {
      console.error(err);
      setError("转换失败。请注意，此工具最适合包含可选文本的 PDF，不适用于扫描图片 PDF。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">PDF 转 Word</h2>
        <p className="text-slate-500 mt-1">提取 PDF 中的文本内容并生成 Word 文档 (.docx)。</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">转换错误</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!file ? (
        <FileInput 
          onFileSelect={handleFileSelect} 
          accept=".pdf" 
          label="拖拽 PDF 到此处或点击上传" 
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{file.name}</h3>
          <p className="text-slate-500 mb-8 text-sm">
            注意：此转换侧重于提取文本。复杂的布局、表格和图像可能无法完全保留。
          </p>

          {isProcessing ? (
             <div className="w-full max-w-md mx-auto">
               <div className="flex justify-between text-sm text-slate-600 mb-2">
                 <span>处理中...</span>
                 <span>{progress}%</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                 <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
             </div>
          ) : downloadUrl ? (
             <div className="space-y-4">
               <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                 转换成功！您的文档已准备好下载。
               </div>
               <div className="flex gap-4 justify-center">
                  <a href={downloadUrl} download={`${file.name.replace('.pdf', '')}.docx`}>
                    <Button className="w-full min-w-[200px]">
                      <Download className="w-4 h-4 mr-2" />
                      下载 Word 文档
                    </Button>
                  </a>
                  <Button variant="outline" onClick={() => { setFile(null); setDownloadUrl(null); }}>
                    转换其他文件
                  </Button>
               </div>
             </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Button onClick={convertToWord} className="min-w-[160px]">
                开始转换
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

export default PdfToWord;