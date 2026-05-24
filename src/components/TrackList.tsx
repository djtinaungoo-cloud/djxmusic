import React from 'react';
import { Track } from '../lib/data';
import { Play, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrackListProps {
  tracks: Track[];
  currentTrackId: string;
  onTrackSelect: (track: Track) => void;
  isPlaying: boolean;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrackId,
  onTrackSelect,
  isPlaying,
}) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {tracks.map((track, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          key={track.id}
          onClick={() => onTrackSelect(track)}
          className={`group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
            currentTrackId === track.id 
              ? 'bg-red-900/10 border border-red-900/30' 
              : 'hover:bg-white/5 border border-transparent'
          }`}
        >
          <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-lg">
            <img 
              src={track.cover} 
              alt={track.title} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
              currentTrackId === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              {currentTrackId === track.id && isPlaying ? (
                <div className="flex gap-1 items-end h-4">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 16, 4] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-red-700"
                    />
                  ))}
                </div>
              ) : (
                <Play fill="white" className="text-white" size={24} />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold truncate ${currentTrackId === track.id ? 'text-red-700' : 'text-white'}`}>
              {track.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] uppercase tracking-wider text-red-700 border border-red-900/20">
                {track.category}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {track.duration}
              </span>
            </div>
          </div>

          <div className="text-gray-500 group-hover:text-white transition-colors">
            <ChevronRight size={20} />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
