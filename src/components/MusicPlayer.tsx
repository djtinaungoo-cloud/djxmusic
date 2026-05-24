import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic } from 'lucide-react';
import { Track } from '../lib/data';
import { motion } from 'framer-motion';

interface PlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const MusicPlayer: React.FC<PlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
}) => {
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const playerRef = useRef<any>(null);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setIsSeeking(true);
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    playerRef.current?.seekTo(parseFloat((e.target as HTMLInputElement).value));
  };

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const Player = ReactPlayer as any;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
        
        {/* Track Info */}
        <div className="flex items-center gap-4 w-full md:w-1/3">
          <motion.img 
            key={currentTrack.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            src={currentTrack.cover} 
            alt={currentTrack.title} 
            className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover shadow-lg shadow-red-900/20"
          />
          <div className="overflow-hidden">
            <h4 className="text-white font-bold truncate">{currentTrack.title}</h4>
            <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 w-full md:w-1/3">
          <div className="flex items-center gap-6">
            <button onClick={onPrev} className="text-gray-400 hover:text-red-700 transition-colors">
              <SkipBack size={24} />
            </button>
            <button 
              onClick={onTogglePlay}
              className="w-12 h-12 flex items-center justify-center bg-red-800 hover:bg-red-700 text-white rounded-full transition-all transform hover:scale-110 active:scale-95"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={onNext} className="text-gray-400 hover:text-red-700 transition-colors">
              <SkipForward size={24} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-gray-400 w-10 text-right">{formatTime(played * duration)}</span>
            <input
              type="range"
              min={0}
              max={0.999999}
              step="any"
              value={played}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-800"
            />
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Extra */}
        <div className="hidden md:flex items-center justify-end gap-4 w-1/3">
          <div className="flex items-center gap-2 group">
            <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step="any"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <button className="text-gray-400 hover:text-white">
            <ListMusic size={20} />
          </button>
        </div>
      </div>

      {/* Hidden Player */}
      <div className="hidden">
        <Player
          ref={playerRef}
          url={currentTrack.url}
          playing={isPlaying}
          volume={volume}
          muted={isMuted}
          onProgress={(state: any) => !isSeeking && setPlayed(state.played)}
          onDuration={(d: any) => setDuration(d)}
          onEnded={onNext}
          config={{
            soundcloud: {
              options: { visual: true }
            }
          }}
        />
      </div>
    </div>
  );
};
