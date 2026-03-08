import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PdfToPng from './components/tools/PdfToPng';
import PngToJpg from './components/tools/PngToJpg';
import ImageCompressor from './components/tools/ImageCompressor';
import PdfToWord from './components/tools/PdfToWord';
import WordToPdf from './components/tools/WordToPdf';
import PdfMerger from './components/tools/PdfMerger';
import ImageToPdf from './components/tools/ImageToPdf';
import ImageWatermark from './components/tools/ImageWatermark';
import ImageResizer from './components/tools/ImageResizer';
import ImageCropper from './components/tools/ImageCropper';
import ImageRotator from './components/tools/ImageRotator';
import ImageSplitter from './components/tools/ImageSplitter';
import ImageJoiner from './components/tools/ImageJoiner';
import ExifViewer from './components/tools/ExifViewer';
import VideoToImages from './components/tools/VideoToImages';
import ImageSequencePlayer from './components/tools/ImageSequencePlayer';
import VideoToAudio from './components/tools/VideoToAudio';
import VideoTrimmer from './components/tools/VideoTrimmer';
import VideoCompressor from './components/tools/VideoCompressor';
import AudioTrimmer from './components/tools/AudioTrimmer';
import AudioFormatConverter from './components/tools/AudioFormatConverter';
import AudioNormalizer from './components/tools/AudioNormalizer';
import AudioFadeInOut from './components/tools/AudioFadeInOut';
import BpmDetector from './components/tools/BpmDetector';
import UrlTool from './components/tools/UrlTool';
import CipherTool from './components/tools/CipherTool';
import WordCounter from './components/tools/WordCounter';
import JsonFormatter from './components/tools/JsonFormatter';
import JsonSchemaValidator from './components/tools/JsonSchemaValidator';
import LuaFormatter from './components/tools/LuaFormatter';
import XmlFormatter from './components/tools/XmlFormatter';
import RegexTester from './components/tools/RegexTester';
import CsvToJson from './components/tools/CsvToJson';
import LocalizationExtractor from './components/tools/LocalizationExtractor';
import LocalizationTable from './components/tools/LocalizationTable';
import TranslationMissingChecker from './components/tools/TranslationMissingChecker';
import TextDiff from './components/tools/TextDiff';
import TimestampTool from './components/tools/TimestampTool';
import CurrencyConverter from './components/tools/CurrencyConverter';
import QrCodeGenerator from './components/tools/QrCodeGenerator';
import QrCodeDecoder from './components/tools/QrCodeDecoder';
import Base64Tool from './components/tools/Base64Tool';
import BaseConverter from './components/tools/BaseConverter';
import UeBlueprintSlimmer from './components/tools/UeBlueprintSlimmer';
import PromptOptimizer from './components/tools/PromptOptimizer';
import PasswordGenerator from './components/tools/PasswordGenerator';
import UuidGenerator from './components/tools/UuidGenerator';
import VersionNumberGenerator from './components/tools/VersionNumberGenerator';
import ColorFormatConverter from './components/tools/ColorFormatConverter';
import FileHashChecker from './components/tools/FileHashChecker';
import MarkdownToHtml from './components/tools/MarkdownToHtml';
import ImageToIco from './components/tools/ImageToIco';
import SpriteSheetSplitter from './components/tools/SpriteSheetSplitter';
import SpriteSheetGenerator from './components/tools/SpriteSheetGenerator';
import TexturePowerOfTwo from './components/tools/TexturePowerOfTwo';
import BatchImageRename from './components/tools/BatchImageRename';
import ErrorBoundary from './components/ErrorBoundary';
import ColorPaletteExtractor from './components/tools/ColorPaletteExtractor';
import AsciiArtGenerator from './components/tools/AsciiArtGenerator';
import SvgToPng from './components/tools/SvgToPng';
import GifSplitter from './components/tools/GifSplitter';
import GifComposer from './components/tools/GifComposer';
import ImageBackgroundRemover from './components/tools/ImageBackgroundRemover';
import UnitConverter from './components/tools/UnitConverter';
import BmiCalculator from './components/tools/BmiCalculator';
import KinshipCalculator from './components/tools/KinshipCalculator';
import CatAgeCalculator from './components/tools/CatAgeCalculator';
import DogAgeCalculator from './components/tools/DogAgeCalculator';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          {/* PDF Tools */}
          <Route path="/pdf-to-png" element={<PdfToPng />} />
          <Route path="/pdf-to-word" element={<PdfToWord />} />
          <Route path="/word-to-pdf" element={<WordToPdf />} />
          <Route path="/pdf-merger" element={<PdfMerger />} />
          
          {/* Image Tools */}
          <Route path="/png-to-jpg" element={<PngToJpg />} />
          <Route path="/compressor" element={<ImageCompressor />} />
          <Route path="/image-to-pdf" element={<ImageToPdf />} />
          <Route path="/image-resizer" element={<ImageResizer />} />
          <Route path="/image-cropper" element={<ImageCropper />} />
          <Route path="/image-rotator" element={<ImageRotator />} />
          <Route path="/image-splitter" element={<ImageSplitter />} />
          <Route path="/image-joiner" element={<ImageJoiner />} />
          <Route path="/watermark" element={<ImageWatermark />} />
          <Route path="/exif-viewer" element={<ExifViewer />} />
          <Route path="/image-to-ico" element={<ImageToIco />} />
          <Route path="/sprite-sheet-splitter" element={<SpriteSheetSplitter />} />
          <Route path="/sprite-sheet-generator" element={<SpriteSheetGenerator />} />
          <Route path="/texture-power-of-two" element={<TexturePowerOfTwo />} />
          <Route path="/batch-image-rename" element={<ErrorBoundary><BatchImageRename /></ErrorBoundary>} />
          <Route path="/color-palette-extractor" element={<ColorPaletteExtractor />} />
          <Route path="/ascii-art-generator" element={<AsciiArtGenerator />} />
          <Route path="/svg-to-png" element={<SvgToPng />} />
          <Route path="/gif-splitter" element={<GifSplitter />} />
          <Route path="/gif-composer" element={<GifComposer />} />
          <Route path="/image-background-remover" element={<ImageBackgroundRemover />} />
          
          {/* Video/Audio Tools */}
          <Route path="/video-to-images" element={<VideoToImages />} />
          <Route path="/image-sequence-player" element={<ImageSequencePlayer />} />
          <Route path="/video-to-audio" element={<VideoToAudio />} />
          <Route path="/video-trimmer" element={<VideoTrimmer />} />
          <Route path="/video-compressor" element={<VideoCompressor />} />
          <Route path="/audio-trimmer" element={<AudioTrimmer />} />
          <Route path="/audio-format-converter" element={<AudioFormatConverter />} />
          <Route path="/audio-normalizer" element={<AudioNormalizer />} />
          <Route path="/audio-fade-in-out" element={<AudioFadeInOut />} />
          <Route path="/bpm-detector" element={<BpmDetector />} />
          
          {/* Text Tools */}
          <Route path="/url-tool" element={<UrlTool />} />
          <Route path="/baijiaxing" element={<CipherTool type="baijiaxing" />} />
          <Route path="/buddha" element={<CipherTool type="buddha" />} />
          <Route path="/word-counter" element={<WordCounter />} />
          
          {/* Dev & Utility Tools */}
          <Route path="/base64" element={<Base64Tool />} />
          <Route path="/json-formatter" element={<JsonFormatter />} />
          <Route path="/json-schema-validator" element={<JsonSchemaValidator />} />
          <Route path="/lua-formatter" element={<LuaFormatter />} />
          <Route path="/xml-formatter" element={<XmlFormatter />} />
          <Route path="/regex-tester" element={<RegexTester />} />
          <Route path="/csv-to-json" element={<CsvToJson />} />
          <Route path="/localization-extractor" element={<LocalizationExtractor />} />
          <Route path="/localization-table" element={<LocalizationTable />} />
          <Route path="/translation-missing-checker" element={<TranslationMissingChecker />} />
          <Route path="/text-diff" element={<TextDiff />} />
          <Route path="/timestamp" element={<TimestampTool />} />
          <Route path="/base-converter" element={<BaseConverter />} />
          <Route path="/uuid-generator" element={<UuidGenerator />} />
          <Route path="/version-generator" element={<VersionNumberGenerator />} />
          <Route path="/color-converter" element={<ColorFormatConverter />} />
          <Route path="/file-hash-checker" element={<FileHashChecker />} />
          <Route path="/markdown-to-html" element={<MarkdownToHtml />} />
          <Route path="/ue-blueprint-slimmer" element={<UeBlueprintSlimmer />} />
          <Route path="/prompt-optimizer" element={<PromptOptimizer />} />
          
          <Route path="/currency-converter" element={<CurrencyConverter />} />
          <Route path="/qrcode-generator" element={<QrCodeGenerator />} />
          <Route path="/qrcode-decoder" element={<QrCodeDecoder />} />
          <Route path="/password-generator" element={<PasswordGenerator />} />
          
          {/* Unit Converters */}
          <Route path="/unit-weight" element={<UnitConverter category="weight" />} />
          <Route path="/unit-length" element={<UnitConverter category="length" />} />
          <Route path="/unit-temperature" element={<UnitConverter category="temperature" />} />
          <Route path="/unit-pressure" element={<UnitConverter category="pressure" />} />
          
          {/* Life Calculators */}
          <Route path="/bmi-calculator" element={<BmiCalculator />} />
          <Route path="/kinship-calculator" element={<KinshipCalculator />} />
          <Route path="/cat-age" element={<CatAgeCalculator />} />
          <Route path="/dog-age" element={<DogAgeCalculator />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;