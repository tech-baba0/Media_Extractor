'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaLink, FaSearch, FaSpinner, FaPaste, FaHistory, FaTrash } from 'react-icons/fa';
import VideoResult from './components/VideoResult';

interface HistoryItem {
  url: string;
  title: string;
  thumbnail: string;
  timestamp: number;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history and check for PWA shared URL on mount
  useEffect(() => {
    // Load history
    const saved = localStorage.getItem('media_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }

    // Check for shared URL from PWA
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || params.get('text');
    if (sharedUrl && sharedUrl.startsWith('http')) {
      setUrl(sharedUrl);
      // Auto-fetch if a URL was shared
      fetchData(sharedUrl);
      // Clean up the URL bar
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const saveToHistory = (data: any, fetchUrl: string) => {
    setHistory(prev => {
      const newItem: HistoryItem = {
        url: fetchUrl,
        title: data.title,
        thumbnail: data.thumbnail,
        timestamp: Date.now()
      };
      // Remove duplicates
      const filtered = prev.filter(item => item.url !== fetchUrl);
      const updated = [newItem, ...filtered].slice(0, 6); // Keep last 6
      localStorage.setItem('media_history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('media_history');
  };

  const fetchData = async (fetchUrl: string) => {
    setLoading(true);
    setError('');
    setVideoData(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/analyze`, { url: fetchUrl });
      
      setVideoData(response.data);
      saveToHistory(response.data, fetchUrl);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze URL. Please check the link and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) fetchData(url);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith('http')) {
        setUrl(text);
        fetchData(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handleHistoryClick = (historyUrl: string) => {
    setUrl(historyUrl);
    fetchData(historyUrl);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-6 pt-16 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '0s' }}></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-down">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
            Media <span className="gradient-text">Extractor</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-xl mx-auto">
            Paste a video URL to instantly analyze and download media in your preferred quality.
          </p>
        </div>

        {/* Input Card */}
        <form onSubmit={handleFetch} className="glass-panel p-2 pl-4 sm:pl-6 flex flex-col sm:flex-row items-center w-full max-w-2xl shadow-2xl relative z-20 transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 gap-2 sm:gap-0">
          <div className="flex w-full items-center flex-1">
            <FaLink className="text-gray-400 mr-3 text-xl shrink-0" />
            <input 
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste video URL here..." 
              className="flex-1 w-full bg-transparent border-none outline-none text-white placeholder-gray-500 py-2 sm:py-4"
              required
            />
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <button 
              type="button"
              onClick={handlePaste}
              title="Paste & Fetch"
              className="w-full sm:w-auto glass-button !px-4 py-3 flex justify-center items-center text-gray-300 hover:text-white bg-white/5 border border-white/10"
            >
              <FaPaste />
            </button>
            <button 
              type="submit" 
              disabled={loading || !url}
              className="w-full sm:w-auto glass-button !px-8 py-3 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              <span className="hidden sm:inline">Fetch</span>
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 glass-panel !border-red-500/30 !bg-red-500/10 text-red-200 text-center w-full max-w-2xl">
            {error}
          </div>
        )}

        {/* Results */}
        {videoData && (
          <div className="w-full mt-8">
            <VideoResult videoData={videoData} sourceUrl={url} />
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="w-full mt-16 mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-200">
                <FaHistory className="text-[#5c5bd6]" /> Recent Media
              </h3>
              <button 
                onClick={clearHistory}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <FaTrash /> Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {history.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleHistoryClick(item.url)}
                  className="glass-panel p-3 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-[#5c5bd6]/50 transition-all duration-300 group"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/40 mb-3 relative">
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaSearch className="text-white text-2xl" />
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-200 line-clamp-2" title={item.title}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 truncate">{new URL(item.url).hostname}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      
      {/* Custom Keyframes for specific animations */}
      <style jsx global>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
      `}</style>
    </main>
  );
}
