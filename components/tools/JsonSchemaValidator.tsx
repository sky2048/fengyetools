import React, { useState } from 'react';
import { FileCheck, Check, X, Trash2, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

const JsonSchemaValidator: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [schemaInput, setSchemaInput] = useState('');
  const [result, setResult] = useState<{ valid: boolean; errors?: string[] } | null>(null);

  const handleValidate = () => {
    if (!jsonInput.trim() || !schemaInput.trim()) {
      setResult(null);
      return;
    }
    try {
      const data = JSON.parse(jsonInput);
      const schema = JSON.parse(schemaInput);
      const validate = ajv.compile(schema);
      const valid = validate(data);
      if (valid) {
        setResult({ valid: true });
      } else {
        const errors = (validate.errors || []).map(
          (e) => `${e.instancePath || '/'}: ${e.message}`
        );
        setResult({ valid: false, errors });
      }
    } catch (e: unknown) {
      const err = e as Error;
      setResult({
        valid: false,
        errors: [err.message || '解析失败'],
      });
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setSchemaInput('');
    setResult(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <FileCheck className="w-6 h-6 mr-2 text-blue-600" />
          JSON Schema 校验
        </h2>
        <p className="text-slate-500 mt-1">
          使用 JSON Schema 校验 JSON 数据是否符合规范，显示通过/失败及详细错误信息。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Left: JSON */}
        <div className="flex flex-col h-full">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">JSON 数据</span>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"name": "test", "age": 18}'
            className="flex-1 w-full p-4 font-mono text-sm bg-white border border-slate-200 rounded-b-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none custom-scrollbar"
            spellCheck={false}
          />
        </div>

        {/* Right: JSON Schema */}
        <div className="flex flex-col h-full">
          <div className="bg-slate-100 p-3 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">JSON Schema</span>
          </div>
          <textarea
            value={schemaInput}
            onChange={(e) => setSchemaInput(e.target.value)}
            placeholder='{"type": "object", "properties": {"name": {"type": "string"}, "age": {"type": "number"}}, "required": ["name"]}'
            className="flex-1 w-full p-4 font-mono text-sm bg-white border border-slate-200 rounded-b-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none custom-scrollbar"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <Button
          onClick={handleValidate}
          className="flex items-center gap-2"
        >
          <FileCheck className="w-4 h-4" />
          校验
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          <Trash2 className="w-4 h-4" />
          清空
        </Button>
      </div>

      {result && (
        <div
          className={`rounded-xl border p-4 animate-in fade-in ${
            result.valid
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {result.valid ? (
              <>
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-700">校验通过</span>
              </>
            ) : (
              <>
                <X className="w-5 h-5 text-red-600" />
                <span className="text-red-700">校验失败</span>
              </>
            )}
          </div>
          {!result.valid && result.errors && result.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-red-700">
              {result.errors.map((err, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {err}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default JsonSchemaValidator;
