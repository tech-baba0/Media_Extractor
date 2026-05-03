'use client';

import { useState, useEffect } from 'react';
import { FaDownload, FaCircleNotch, FaVideo, FaMusic, FaCut } from 'react-icons/fa';

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
  audioFormats?: Format[];
}

export default function VideoResult({ videoData, sourceUrl }: { videoData: VideoData; sourceUrl: string }) {
  const [isAudioMode, setIsAudioMode] = useState(false);
  const activeFormats = isAudioMode && videoData.audioFormats ? videoData.audioFormats : videoData.formats;
  const [selectedQuality, setSelectedQuality] = useState<string>(activeFormats[0]?.quality || '');
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Trimming State
  const [isTrimming, setIsTrimming] = useState(false);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:30');

  useEffect(() => {
    // When switching modes, select the first format of the new list
    setSelectedQuality(activeFormats[0]?.quality || '');
  }, [isAudioMode, activeFormats]);

  useEffect(() => {
    // Dynamic Hue based on title string hash
    let hash = 0;
    for (let i = 0; i < videoData.title.length; i++) {
      hash = videoData.title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash) % 360;
    const hue2 = (hue1 + 60) % 360;
    
    // Create subtle dynamic background colors
    document.documentElement.style.setProperty('--dynamic-hue-1', `${hue1}`);
    document.documentElement.style.setProperty('--dynamic-hue-2', `${hue2}`);

    const bgElems = document.querySelectorAll('.animate-float');
    if (bgElems.length >= 2) {
      (bgElems[0] as HTMLElement).style.backgroundColor = `hsla(${hue1}, 70%, 50%, 0.2)`;
      (bgElems[1] as HTMLElement).style.backgroundColor = `hsla(${hue2}, 70%, 50%, 0.2)`;
    }

    return () => {
      if (bgElems.length >= 2) {
        (bgElems[0] as HTMLElement).style.backgroundColor = '';
        (bgElems[1] as HTMLElement).style.backgroundColor = '';
      }
    };
  }, [videoData.title]);

  const handleDownload = () => {
    setIsDownloading(true);
    const selectedFormat = activeFormats.find(f => f.quality === selectedQuality);
    const formatId = selectedFormat?.format_id || '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    let downloadUrl = `${apiUrl}/api/download?url=${encodeURIComponent(sourceUrl)}&quality=${encodeURIComponent(selectedQuality)}&format_id=${encodeURIComponent(formatId)}`;
    
    if (isAudioMode) {
      downloadUrl += `&isAudio=true`;
    }

    if (isTrimming) {
      downloadUrl += `&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
    }

    window.location.href = downloadUrl;

    // Reset loader after 15 seconds (assumes the server has started the file attachment download by then)
    setTimeout(() => {
      setIsDownloading(false);
    }, 15000);
  };

  return (
    <div className="glass-panel p-6 mt-8 w-full max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Video Preview */}
        <div className="w-full md:w-5/12 shrink-0">
          <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl bg-black/40 border border-white/5 group flex items-center justify-center mb-4">
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
          
          {/* Trimming UI Toggle */}
          <div className="bg-[#2b2d42]/80 rounded-xl p-4 border border-white/5">
            <label className="flex items-center justify-between cursor-pointer mb-2">
              <div className="flex items-center gap-2 text-gray-200 font-semibold">
                <FaCut className="text-pink-400" /> Trim Clip
              </div>
              <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${isTrimming ? 'bg-pink-500' : 'bg-gray-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isTrimming ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <input type="checkbox" className="hidden" checked={isTrimming} onChange={() => setIsTrimming(!isTrimming)} />
            </label>
            
            {isTrimming && (
              <div className="flex items-center gap-2 mt-3 animate-fade-in-down">
                <input 
                  type="text" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-center text-sm text-white focus:border-pink-400 outline-none" 
                  placeholder="00:00:00"
                />
                <span className="text-gray-500">-</span>
                <input 
                  type="text" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-center text-sm text-white focus:border-pink-400 outline-none" 
                  placeholder="00:00:30"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Info & Quality Selector */}
        <div className="w-full md:w-7/12 flex flex-col min-w-0">
          <div className="flex-1">
            <h3 className="text-2xl font-extrabold text-white mb-4 line-clamp-3 break-words tracking-tight" title={videoData.title}>
              {videoData.title}
            </h3>
            
            {/* Mode Toggle (Video/Audio) */}
            {videoData.audioFormats && videoData.audioFormats.length > 0 && (
              <div className="flex bg-[#2b2d42] rounded-xl p-1 mb-5">
                <button 
                  onClick={() => setIsAudioMode(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${!isAudioMode ? 'bg-[#5c5bd6] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  <FaVideo /> Video
                </button>
                <button 
                  onClick={() => setIsAudioMode(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${isAudioMode ? 'bg-[#5c5bd6] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  <FaMusic /> Audio Only
                </button>
              </div>
            )}
            
            {/* Quality Selector */}
            <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {activeFormats.map((format, idx) => {
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
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        isSelected ? 'border-[#5c5bd6]' : 'border-gray-500'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 bg-[#5c5bd6] rounded-full" />}
                      </div>
                      <span className="text-lg font-bold text-gray-100 whitespace-nowrap">{format.quality}</span>
                      {format.size && (
                        <span className="text-xs font-medium text-gray-400 ml-1 sm:ml-2 truncate">
                          ({format.size})
                        </span>
                      )}
                    </div>
                    
                    <span className="text-xs font-bold text-gray-400 bg-black/20 px-3 py-1 rounded-md uppercase tracking-wider shrink-0 ml-2">
                      {format.type}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <button 
            onClick={handleDownload}
            disabled={isDownloading || !selectedQuality}
            className={`w-full relative overflow-hidden flex items-center justify-center gap-3 py-4 text-lg font-bold rounded-xl text-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-90 disabled:cursor-wait ${isAudioMode ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : 'bg-[#5c5bd6] hover:bg-[#4a49c4]'}`}
          >
            {isDownloading ? (
              <>
                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                <FaCircleNotch className="animate-spin text-2xl relative z-10" />
                <span className="relative z-10 tracking-wide">Processing Media...</span>
              </>
            ) : (
              <>
                <FaDownload />
                <span>Download {isAudioMode ? 'Audio' : selectedQuality}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
