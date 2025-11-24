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
import VideoToAudio from './components/tools/VideoToAudio';
import VideoTrimmer from './components/tools/VideoTrimmer';
import VideoCompressor from './components/tools/VideoCompressor';
import AudioTrimmer from './components/tools/AudioTrimmer';
import UrlTool from './components/tools/UrlTool';
import CipherTool from './components/tools/CipherTool';
import WordCounter from './components/tools/WordCounter';
import JsonFormatter from './components/tools/JsonFormatter';
import TextDiff from './components/tools/TextDiff';
import TimestampTool from './components/tools/TimestampTool';
import CurrencyConverter from './components/tools/CurrencyConverter';
import QrCodeGenerator from './components/tools/QrCodeGenerator';
import QrCodeDecoder from './components/tools/QrCodeDecoder';
import Base64Tool from './components/tools/Base64Tool';
import BaseConverter from './components/tools/BaseConverter';
import PasswordGenerator from './components/tools/PasswordGenerator';
import ImageToIco from './components/tools/ImageToIco';
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
          
          {/* Video/Audio Tools */}
          <Route path="/video-to-images" element={<VideoToImages />} />
          <Route path="/video-to-audio" element={<VideoToAudio />} />
          <Route path="/video-trimmer" element={<VideoTrimmer />} />
          <Route path="/video-compressor" element={<VideoCompressor />} />
          <Route path="/audio-trimmer" element={<AudioTrimmer />} />
          
          {/* Text Tools */}
          <Route path="/url-tool" element={<UrlTool />} />
          <Route path="/baijiaxing" element={<CipherTool type="baijiaxing" />} />
          <Route path="/buddha" element={<CipherTool type="buddha" />} />
          <Route path="/word-counter" element={<WordCounter />} />
          
          {/* Dev & Utility Tools */}
          <Route path="/base64" element={<Base64Tool />} />
          <Route path="/json-formatter" element={<JsonFormatter />} />
          <Route path="/text-diff" element={<TextDiff />} />
          <Route path="/timestamp" element={<TimestampTool />} />
          <Route path="/base-converter" element={<BaseConverter />} />
          
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