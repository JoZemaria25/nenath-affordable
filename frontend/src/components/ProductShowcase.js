import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

/**
 * Cinematic product showcase - auto-plays product images with Ken Burns effect
 * making them look like a video preview. Also supports actual video URLs.
 */
export default function ProductShowcase({ images = [], videoUrl = '', productName = '' }) {
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (playing && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 3000);
      return () => clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, images.length]);

  const togglePlay = () => setPlaying(prev => !prev);
  const goNext = () => setCurrentIndex(prev => (prev + 1) % images.length);
  const goPrev = () => setCurrentIndex(prev => (prev - 1 + images.length) % images.length);

  if (!images.length && !videoUrl) return null;

  return (
    <>
      {/* Inline Preview Player */}
      <div data-testid="product-showcase" className="relative group cursor-pointer" onClick={() => setFullscreen(true)}>
        <div className="aspect-[16/9] bg-[#1c1a17] overflow-hidden relative">
          {/* Image slideshow */}
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                idx === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              style={{
                animation: idx === currentIndex && playing ? 'kenBurns 3s ease-in-out forwards' : 'none',
              }}
            >
              <img src={img} alt={`${productName} ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              data-testid="showcase-play-btn"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-14 h-14 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center hover:bg-white/30 transition-all group-hover:scale-110"
            >
              {playing ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" />}
            </button>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {images.map((_, idx) => (
                  <div key={idx} className={`h-0.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'}`} />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-white/60 uppercase tracking-wider font-body">
              {playing ? 'Now Playing' : 'Preview'} {currentIndex + 1}/{images.length}
            </span>
          </div>

          {/* Nav arrows on hover */}
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={16} /></button>
            </>
          )}
        </div>

        {/* Label */}
        <div className="absolute top-3 left-3">
          <span className="bg-[#1c1a17]/80 text-white text-[9px] uppercase tracking-[0.15em] px-2 py-1 backdrop-blur-sm">
            <Play size={8} className="inline mr-1" />Product Showcase
          </span>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => { setFullscreen(false); setPlaying(false); }}>
          <button data-testid="close-showcase" onClick={() => { setFullscreen(false); setPlaying(false); }} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"><X size={24} /></button>

          {/* If actual video URL exists, show it in fullscreen */}
          {videoUrl ? (
            <div className="w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
              {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                <iframe
                  src={`${videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}?autoplay=1`}
                  title="Product video" className="w-full h-full" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                />
              ) : (
                <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
              )}
            </div>
          ) : (
            /* Fullscreen image slideshow */
            <div className="w-full h-full relative" onClick={(e) => e.stopPropagation()}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                >
                  <img src={img} alt="" className="max-h-full max-w-full object-contain" style={{
                    animation: idx === currentIndex ? 'kenBurnsFS 3.5s ease-in-out forwards' : 'none'
                  }} />
                </div>
              ))}

              {/* Fullscreen controls */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <button onClick={goPrev} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"><ChevronLeft size={20} /></button>
                <button onClick={togglePlay} className="p-3 bg-white/20 rounded-full hover:bg-white/30 text-white">
                  {playing ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                </button>
                <button onClick={goNext} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"><ChevronRight size={20} /></button>
              </div>

              {/* Progress dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentIndex(idx)}
                    className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-[#C6A85B]' : 'w-3 bg-white/30'}`} />
                ))}
              </div>

              {/* Product name */}
              <div className="absolute top-6 left-6">
                <p className="text-white/80 text-xs uppercase tracking-[0.2em]">{productName}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-1%, -1%); }
        }
        @keyframes kenBurnsFS {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}
