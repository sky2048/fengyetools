import React, { useState, useCallback } from 'react';
import { FileCheck, Upload, Copy, Check, AlertCircle } from 'lucide-react';
import SparkMD5 from 'spark-md5';

const FileHashChecker: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [md5Hash, setMd5Hash] = useState('');
  const [sha256Hash, setSha256Hash] = useState('');
  const [compareHash, setCompareHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<'none' | 'match' | 'mismatch'>('none');

  const computeMd5 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const spark = new SparkMD5.ArrayBuffer();
        spark.append(e.target?.result as ArrayBuffer);
        resolve(spark.end());
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(f);
    });
  };

  const computeSha256 = async (f: File): Promise<string> => {
    const buffer = await f.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      setMd5Hash('');
      setSha256Hash('');
      setMatchResult('none');
      return;
    }
    setFile(f);
    setLoading(true);
    setMatchResult('none');
    try {
      const [md5, sha256] = await Promise.all([computeMd5(f), computeSha256(f)]);
      setMd5Hash(md5);
      setSha256Hash(sha256);
    } catch (err) {
      setMd5Hash('');
      setSha256Hash('');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkMatch = useCallback(() => {
    const compare = compareHash.trim().toLowerCase();
    if (!compare) {
      setMatchResult('none');
      return;
    }
    const md5Lower = md5Hash.toLowerCase();
    const sha256Lower = sha256Hash.toLowerCase();
    if (compare === md5Lower || compare === sha256Lower) {
      setMatchResult('match');
    } else {
      setMatchResult('mismatch');
    }
  }, [compareHash, md5Hash, sha256Hash]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <FileCheck className="w-6 h-6 mr-2 text-blue-600" />
          文件哈希/校验
        </h2>
        <p className="text-slate-500 mt-1">上传文件计算 MD5 / SHA-256 哈希值，支持粘贴哈希值进行比对。</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">选择文件</label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <Upload className="w-10 h-10 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">点击或拖拽文件到此处</span>
            {file && <span className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{file.name}</span>}
            <input type="file" className="hidden" onChange={handleFileChange} aria-label="选择文件" />
          </label>
        </div>

        {loading && (
          <p className="text-slate-500 text-sm mb-4">计算中...</p>
        )}

        {!loading && (md5Hash || sha256Hash) && (
          <div className="space-y-4 mb-6">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">MD5</label>
              <input
                type="text"
                readOnly
                value={md5Hash}
                className="w-full pl-4 pr-12 py-3 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg"
                aria-label="MD5 哈希值"
              />
              <button
                onClick={() => copyToClipboard(md5Hash, 'md5')}
                className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
              >
                {copied === 'md5' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">SHA-256</label>
              <input
                type="text"
                readOnly
                value={sha256Hash}
                className="w-full pl-4 pr-12 py-3 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg"
                aria-label="SHA-256 哈希值"
              />
              <button
                onClick={() => copyToClipboard(sha256Hash, 'sha256')}
                className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
              >
                {copied === 'sha256' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 pt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">粘贴哈希值比对</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={compareHash}
              onChange={(e) => { setCompareHash(e.target.value); setMatchResult('none'); }}
              placeholder="粘贴 MD5 或 SHA-256 哈希值"
              className="flex-1 pl-4 py-3 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="粘贴哈希值比对"
            />
            <button
              onClick={checkMatch}
              disabled={!compareHash.trim() || !md5Hash}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              比对
            </button>
          </div>
          {matchResult === 'match' && (
            <p className="mt-2 flex items-center text-green-600 text-sm">
              <Check className="w-4 h-4 mr-1" /> 哈希值一致
            </p>
          )}
          {matchResult === 'mismatch' && (
            <p className="mt-2 flex items-center text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" /> 哈希值不一致
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileHashChecker;
