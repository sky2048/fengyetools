import { LucideIcon } from 'lucide-react';

export enum ToolCategory {
  IMAGE = '图片工具',
  PDF = 'PDF 工具',
  TEXT = '文本工具',
  VIDEO = '视频工具',
  AUDIO = '音频工具',
  DEV = '开发工具',
  UTILITY = '实用工具'
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: LucideIcon;
  category: ToolCategory;
}

export interface ProcessedFile {
  id: string;
  originalName: string;
  previewUrl: string; // Blob URL or Data URL
  type: string;
  size: number;
  file: File;
}

export interface PdfPage {
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
}

// --- EXIF Types ---
export interface ExifTags {
  Model?: string;
  Make?: string;
  FNumber?: number;
  ExposureTime?: number | { numerator: number; denominator: number };
  ISOSpeedRatings?: number;
  FocalLength?: number;
  DateTimeOriginal?: string;
  DateTime?: string;
  PixelXDimension?: number;
  PixelYDimension?: number;
  [key: string]: any;
}

// --- HTML2PDF Types ---
export interface Html2PdfOptions {
  margin?: number | [number, number, number, number];
  filename?: string;
  image?: { type: string; quality: number };
  html2canvas?: { scale: number; useCORS: boolean; [key: string]: any };
  jsPDF?: { unit: string; format: string; orientation: 'portrait' | 'landscape' };
}
