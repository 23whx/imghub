import React, { useState } from 'react';
import { Link, Download, Video, Youtube } from 'lucide-react';

const VideoThumbnail = () => {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('youtube');
  const [thumbnails, setThumbnails] = useState([]);
  const [error, setError] = useState('');

  const extractVideoId = (url, platform) => {
    if (platform === 'youtube') {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
    } else if (platform === 'bilibili') {
      const patterns = [
        /bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/,
        /bilibili\.com\/video\/(av\d+)/,
        /b23\.tv\/([a-zA-Z0-9]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
    }
    
    return null;
  };

  const getThumbnails = async () => {
    setError('');
    setThumbnails([]);

    const videoId = extractVideoId(url, platform);
    
    if (!videoId) {
      setError('无法识别视频链接，请检查URL是否正确');
      return;
    }

    if (platform === 'youtube') {
      setThumbnails([
        {
          quality: 'Max Resolution',
          url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          size: '1280x720'
        },
        {
          quality: 'Standard',
          url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
          size: '640x480'
        },
        {
          quality: 'High Quality',
          url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          size: '480x360'
        },
        {
          quality: 'Medium Quality',
          url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          size: '320x180'
        },
        {
          quality: 'Default',
          url: `https://img.youtube.com/vi/${videoId}/default.jpg`,
          size: '120x90'
        }
      ]);
    } else if (platform === 'bilibili') {
      // 调用我们的后端 API 代理请求
      try {
        const res = await fetch(`/api/bilibili-cover?bvid=${videoId}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || '获取封面失败');
          return;
        }

        setThumbnails([
          {
            quality: '封面图',
            url: data.url,
            size: '原始尺寸'
          }
        ]);
      } catch (err) {
        setError('请求失败，请稍后重试');
        console.error(err);
      }
    }
  };

  const downloadThumbnail = async (thumbnailUrl, quality) => {
    try {
      // 尝试 Fetch 方式下载（适用于支持 CORS 的图片）
      // 添加 referrerPolicy: 'no-referrer' 以绕过防盗链
      const response = await fetch(thumbnailUrl, {
        referrerPolicy: 'no-referrer'
      });
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thumbnail_${quality.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Fetch download failed, falling back to new window:', error);
      // 如果 Fetch 失败（例如跨域限制），则在新窗口打开
      window.open(thumbnailUrl, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">视频缩略图查看器</h1>
        <p className="text-gray-600">获取YouTube视频的高清缩略图</p>
      </div>

      <div className="space-y-6">
        {/* 输入区 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Link className="w-5 h-5 text-blue-500" />
            <span>视频链接</span>
          </h2>

          {/* 平台选择 - 暂时隐藏 Bilibili */}
          {/* <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择平台
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setPlatform('youtube')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  platform === 'youtube'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Youtube className="w-5 h-5" />
                <span>YouTube</span>
              </button>
              <button
                onClick={() => setPlatform('bilibili')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  platform === 'bilibili'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Video className="w-5 h-5" />
                <span>Bilibili</span>
              </button>
            </div>
          </div> */}

          {/* URL输入 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              视频链接
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 示例 */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">支持的链接格式：</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
              <li>• https://youtu.be/VIDEO_ID</li>
              <li>• https://www.youtube.com/embed/VIDEO_ID</li>
            </ul>
          </div>

          <button
            onClick={getThumbnails}
            disabled={!url}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Video className="w-5 h-5" />
            <span>获取缩略图</span>
          </button>

          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          )}
        </div>

        {/* 缩略图展示 */}
        {thumbnails.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">缩略图列表</h2>
            <div className="space-y-4">
              {thumbnails.map((thumbnail, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{thumbnail.quality}</h3>
                      <p className="text-sm text-gray-500">尺寸: {thumbnail.size}</p>
                    </div>
                    <button
                      onClick={() => downloadThumbnail(thumbnail.url, thumbnail.quality)}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>下载</span>
                    </button>
                  </div>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={thumbnail.url}
                      alt={thumbnail.quality}
                      className="w-full h-auto"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML += '<p class="text-center py-8 text-gray-400">图片加载失败</p>';
                      }}
                    />
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={thumbnail.url}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600"
                      onClick={(e) => e.target.select()}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoThumbnail;

