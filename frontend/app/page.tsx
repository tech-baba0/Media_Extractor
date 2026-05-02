'use client';

import { useState } from 'react';
import axios from 'axios';
import { FaLink, FaSearch, FaSpinner } from 'react-icons/fa';
import VideoResult from './components/VideoResult';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setVideoData(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/api/analyze`, { url: url });
      
      setVideoData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze URL. Please check the link and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="z-10 w-full max-w-3xl flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-down">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
            Media <span className="gradient-text">Extractor</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-xl mx-auto">
            Paste a video URL to instantly analyze and download media in your preferred quality.
          </p>
        </div>

        {/* Input Card */}
        <form onSubmit={handleFetch} className="glass-panel p-2 pl-6 flex items-center w-full max-w-2xl shadow-2xl relative z-20 transition-all focus-within:ring-2 focus-within:ring-indigo-500/50">
          <FaLink className="text-gray-400 mr-3 text-xl" />
          <input 
            type="url" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste video URL here..." 
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 py-4"
            required
          />
          <button 
            type="submit" 
            disabled={loading || !url}
            className="ml-2 glass-button !px-8 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
            <span>Fetch</span>
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 glass-panel !border-red-500/30 !bg-red-500/10 text-red-200 text-center w-full max-w-2xl">
            {error}
          </div>
        )}

        {/* Results */}
        {videoData && (
          <VideoResult videoData={videoData} sourceUrl={url} />
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
