import React, { useState } from 'react';
import { Upload, Download, Minimize2, FileImage } from 'lucide-react';
import JSZip from 'jszip';

const ImageCompress = () => {
  const [images, setImages] = useState([]);
  const [quality, setQuality] = useState(0.8);
  const [compressing, setCompressing] = useState(false);

  const handleImagesUpload = (event) => {
    const files = Array.from(event.target.files || []);
    
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              name: file.name,
              originalSize: file.size,
              originalImage: img,
              compressedDataUrl: null,
              compressedSize: 0
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(newImages => {
      setImages([...images, ...newImages]);
    });
  };

  const compressImages = async () => {
    setCompressing(true);

    const compressedImages = await Promise.all(
      images.map(async (img) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.originalImage.width;
        canvas.height = img.originalImage.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img.originalImage, 0, 0);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);

        return {
          ...img,
          compressedDataUrl,
          compressedSize
        };
      })
    );

    setImages(compressedImages);
    setCompressing(false);
  };

  const downloadSingle = (img) => {
    const link = document.createElement('a');
    link.download = `compressed_${img.name}`;
    link.href = img.compressedDataUrl;
    link.click();
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    
    images.forEach((img, index) => {
      if (img.compressedDataUrl) {
        const base64Data = img.compressedDataUrl.split(',')[1];
        zip.file(`compressed_${img.name}`, base64Data, { base64: true });
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'compressed-images.zip';
    link.click();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getCompressionRate = (img) => {
    if (!img.compressedSize) return 0;
    return ((1 - img.compressedSize / img.originalSize) * 100).toFixed(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">图片压缩工具</h1>
        <p className="text-gray-600">批量压缩图片，减小文件大小</p>
      </div>

      <div className="space-y-6">
        {/* 上传区 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesUpload}
            className="hidden"
            id="images-upload"
          />
          <label
            htmlFor="images-upload"
            className="block w-full py-12 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">点击上传图片</p>
            <p className="text-sm text-gray-400 mt-1">支持批量上传 JPG, PNG, WEBP</p>
          </label>
        </div>

        {/* 压缩设置 */}
        {images.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <Minimize2 className="w-5 h-5 text-green-500" />
                <span>压缩设置</span>
              </h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={compressImages}
                  disabled={compressing}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {compressing ? '压缩中...' : '开始压缩'}
                </button>
                {images.some(img => img.compressedDataUrl) && (
                  <button
                    onClick={downloadAll}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>下载全部</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    压缩质量
                  </label>
                  <span className="text-sm text-gray-600">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>最小</span>
                  <span>最大</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 图片列表 */}
        {images.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              图片列表 ({images.length})
            </h2>
            <div className="space-y-4">
              {images.map((img, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    {/* 封面图 */}
                    <div className="flex-shrink-0">
                      <img
                        src={img.compressedDataUrl || img.originalImage.src}
                        alt={img.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {img.name}
                      </p>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          原始: {formatSize(img.originalSize)}
                        </span>
                        {img.compressedSize > 0 && (
                          <>
                            <span>→</span>
                            <span className="text-green-600 font-medium">
                              压缩: {formatSize(img.compressedSize)}
                            </span>
                            <span className="text-green-600 font-medium">
                              (-{getCompressionRate(img)}%)
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 操作 */}
                    {img.compressedDataUrl && (
                      <button
                        onClick={() => downloadSingle(img)}
                        className="flex-shrink-0 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {images.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">还没有上传图片</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCompress;

