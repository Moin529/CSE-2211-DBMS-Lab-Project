import React, { useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

const TrailerModal = ({ isOpen, onClose, trailerUrl, movieTitle }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !trailerUrl) return null;

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(trailerUrl);
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700/50 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{movieTitle} - Trailer</h3>
              <p className="text-sm text-gray-300">Watch on YouTube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-200 p-3 hover:bg-gray-800/50 rounded-xl hover:scale-105"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            title={`${movieTitle} Trailer`}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-lg transition-all duration-200 hover:scale-105">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm font-medium">Sound On</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-lg transition-all duration-200 hover:scale-105">
                <Maximize2 className="w-4 h-4" />
                <span className="text-sm font-medium">Fullscreen</span>
              </button>
            </div>
            <div className="text-sm text-gray-400 font-medium">
              Click outside to close
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;