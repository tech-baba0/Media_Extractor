'use client';

import { useState } from 'react';
import { FaDownload } from 'react-icons/fa';

interface Format {
  format_id?: string;
  quality: string;
  url: string;
  type: string;
  size?: string;
}

interface VideoData {
  title: string;
  thumbnail: string;
  formats: Format[];
}

export default function VideoResult({ videoData, sourceUrl }: { videoData: VideoData; sourceUrl: string }) {
  const [selectedQuality, setSelectedQuality] = useState<string>(videoData.formats[0]?.quality || '');

  const handleDownload = () => {
    const selectedFormat = videoData.formats.find(f => f.quality === selectedQuality);
    const formatId = selectedFormat?.format_id || '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const downloadUrl = `${apiUrl}/api/download?url=${encodeURIComponent(sourceUrl)}&quality=${encodeURIComponent(selectedQuality)}&format_id=${encodeURIComponent(formatId)}`;
    window.location.href = downloadUrl;
  };

  return (
    <div className="glass-panel p-6 mt-8 w-full max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Video Preview */}
        <div className="w-full md:w-5/12 shrink-0">
          <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl bg-black/40 border border-white/5 group flex items-center justify-center">
            {sourceUrl.endsWith('.mp4') || sourceUrl.endsWith('.webm') ? (
              <video 
                src={sourceUrl} 
                controls 
                poster={videoData.thumbnail}
                className="w-full h-full object-contain"
              />
            ) : (
              <img 
                src={videoData.thumbnail} 
                alt={videoData.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
          </div>
        </div>

        {/* Right: Info & Quality Selector */}
        <div className="w-full md:w-7/12 flex flex-col justify-center">
          <div>
            <h3 className="text-2xl font-extrabold text-white mb-2 line-clamp-2 tracking-tight" title={videoData.title}>
              {videoData.title}
            </h3>
            <p className="text-sm text-gray-400 mb-5">Select format to download:</p>
            
            {/* Quality Selector */}
            <div className="space-y-3 mb-6">
              {videoData.formats.map((format, idx) => {
                const isSelected = selectedQuality === format.quality;
                return (
                  <label 
                    key={idx} 
                    onClick={() => setSelectedQuality(format.quality)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-[#3b3a5a] border-[#5c5bd6]' 
                        : 'bg-[#2b2d42] border-transparent hover:bg-[#34354f]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Custom Radio Button */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#5c5bd6]' : 'border-gray-500'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 bg-[#5c5bd6] rounded-full" />}
                      </div>
                      <span className="text-lg font-bold text-gray-100">{format.quality}</span>
                      {format.size && (
                        <span className="text-xs font-medium text-gray-400 ml-2">
                          ({format.size})
                        </span>
                      )}
                    </div>
                    
                    {/* Format Badge */}
                    <span className="text-xs font-bold text-gray-400 bg-black/20 px-3 py-1 rounded-md uppercase tracking-wider">
                      {format.type}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <button 
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-3 py-4 text-lg font-bold rounded-xl bg-[#5c5bd6] hover:bg-[#4a49c4] text-white transition-all shadow-lg active:scale-[0.98]"
          >
            <FaDownload />
            Download {selectedQuality}
          </button>
        </div>
      </div>
    </div>
  );
}
