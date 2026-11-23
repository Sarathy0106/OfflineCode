import React, { useState, useEffect } from 'react';
import { Minimize2, Maximize2, Minus, X, Shield } from 'lucide-react';

interface TopHoverBarProps {
  isFullscreen: boolean;
  onExitFullscreen: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

export const TopHoverBar: React.FC<TopHoverBarProps> = ({
  isFullscreen,
  onExitFullscreen,
  onMinimize,
  onClose
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Global ESC key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        onExitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onExitFullscreen]);

  // Track mouse proximity to top edge (within 20px)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 15) {
        setIsHovered(true);
      } else if (e.clientY > 65) {
        setIsHovered(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* Invisible Top Proximity Sensor Strip */}
      <div
        className="fixed top-0 left-0 right-0 h-4 z-50 pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
      />

      {/* Floating Glassmorphic Top Controls Bar */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out transform pointer-events-auto ${
          isHovered
            ? 'translate-y-2 opacity-100 scale-100'
            : '-translate-y-full opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 px-4 py-2 rounded-2xl shadow-2xl shadow-black/80 text-xs">
          <div className="flex items-center space-x-2 pr-3 border-r border-slate-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="font-semibold text-slate-200">
              {isFullscreen ? 'Full Screen Active' : 'Offline Exam App'}
            </span>
          </div>

          {/* Exit Full Screen Button */}
          {isFullscreen && (
            <button
              onClick={onExitFullscreen}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
              title="Exit Full Screen (or press Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Full Screen (Esc)</span>
            </button>
          )}

          {/* Minimize Window */}
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
              title="Minimize Window"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close Window */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition"
              title="Close Application"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
