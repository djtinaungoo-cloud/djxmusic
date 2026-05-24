import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Music, 
  Disc, 
  Users, 
  Calendar,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Zap
} from 'lucide-react';
import { TRACKS, Track } from './lib/data';
import { MusicPlayer } from './components/MusicPlayer';
import { TrackList } from './components/TrackList';

function App() {
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const categories = ['All', 'Journey', 'Progression', 'Emotions', 'Symphonica'];

  const filteredTracks = useMemo(() => {
    if (activeCategory === 'All') return TRACKS;
    return TRACKS.filter(t => t.category === activeCategory);
  }, [activeCategory]);

  const handleTrackSelect = (track: Track) => {
    if (currentTrack.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    const currentIndex = TRACKS.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % TRACKS.length;
    setCurrentTrack(TRACKS[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    const currentIndex = TRACKS.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + TRACKS.length) % TRACKS.length;
    setCurrentTrack(TRACKS[prevIndex]);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-800 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-red-800 rounded-lg flex items-center justify-center font-bold text-white text-xl italic shadow-lg shadow-red-900/40">
              X
            </div>
            <span className="text-2xl font-black tracking-tighter">DJX</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Sets', 'About', 'Contact'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-gray-400 hover:text-red-700 transition-colors uppercase tracking-widest"
              >
                {item}
              </a>
            ))}
            <button className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-red-800 hover:text-white transition-colors">
              BOOK NOW
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-center">
              {['Home', 'Sets', 'About', 'Contact'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl font-bold hover:text-red-700"
                >
                  {item}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.jpg" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-60 scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-red-900/20 border border-red-900/30 text-red-700 text-sm font-bold tracking-widest mb-6">
              THE JOURNEY CONTINUES
            </span>
            <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
              DJX
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Crafting immersive trance experiences from the heart of Yangon. 
              Uplifting melodies, driving beats, and pure euphoria.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="#sets"
                className="w-full sm:w-auto px-10 py-4 bg-red-800 text-white font-black rounded-full hover:bg-red-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2 group shadow-lg shadow-red-900/40"
              >
                LISTEN TO SETS
                <Disc className="group-hover:rotate-180 transition-transform duration-500" />
              </a>
              <a 
                href="#about"
                className="w-full sm:w-auto px-10 py-4 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all"
              >
                DISCOVER MORE
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500"
        >
          <ChevronDown size={32} />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Followers', value: '50K+', icon: Users },
            { label: 'Mixes Released', value: '200+', icon: Music },
            { label: 'Events', value: '150+', icon: Calendar },
            { label: 'Countries', value: '12', icon: Zap },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <stat.icon className="mx-auto mb-4 text-red-700" size={24} />
              <div className="text-3xl md:text-4xl font-black mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sets / App Section */}
      <section id="sets" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black italic mb-4">LATEST SETS</h2>
              <p className="text-gray-400 max-w-xl">
                Explore the different dimensions of trance. From the uplifting energy of 'Journey' 
                to the deep textures of 'Emotions'.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    activeCategory === cat 
                      ? 'bg-red-800 text-white' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <TrackList 
                tracks={filteredTracks}
                currentTrackId={currentTrack.id}
                onTrackSelect={handleTrackSelect}
                isPlaying={isPlaying}
              />
            </div>
            
            <div className="space-y-8">
              <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Disc className="text-red-700" />
                  CURRENTLY SPINNING
                </h3>
                <div className="aspect-square rounded-2xl overflow-hidden mb-6 group relative">
                  <img 
                    src={currentTrack.cover} 
                    alt={currentTrack.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="text-red-700 text-xs font-bold tracking-widest mb-1 uppercase">{currentTrack.category}</div>
                    <div className="text-2xl font-black leading-tight">{currentTrack.title}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white">{currentTrack.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Artist</span>
                    <span className="text-white">{currentTrack.artist}</span>
                  </div>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-red-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    {isPlaying ? 'PAUSE MIX' : 'PLAY MIX'}
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-900/20 to-purple-900/20 rounded-3xl p-8 border border-white/10">
                <h3 className="text-xl font-bold mb-4 italic">JOIN THE TRIBE</h3>
                <p className="text-sm text-gray-300 mb-6">
                  Subscribe to the podcast and never miss a beat. New mixes every month.
                </p>
                <button className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                  SUBSCRIBE ON APPLE
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white/2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden">
                <img 
                  src="/dj-profile.jpg" 
                  alt="DJX Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-red-800 rounded-3xl -z-10 animate-pulse" />
            </div>
            
            <div>
              <span className="text-red-700 font-bold tracking-widest text-sm uppercase mb-4 block">THE ARTIST</span>
              <h2 className="text-5xl font-black italic mb-8">TIN AUNG OO <br/> <span className="text-gray-500">A.K.A DJX</span></h2>
              <div className="space-y-6 text-gray-400 leading-relaxed text-lg">
                <p>
                  Hailing from the vibrant city of Yangon, Myanmar, DJX has established himself as a prominent figure in the global trance scene. With a career spanning over a decade, his "DJX Trance Mixes" have become a staple for fans of uplifting and progressive sounds.
                </p>
                <p>
                  His signature series, <span className="text-white font-bold">Journey</span>, takes listeners through the peak-time energy of modern trance, while <span className="text-white font-bold">Progression</span> explores the deeper, melodic side of the genre.
                </p>
                <p>
                  "Music is a universal language, and trance is its most emotional dialect," says DJX. This philosophy drives every set, ensuring a connection that transcends borders and cultures.
                </p>
              </div>
              
              <div className="mt-10 flex gap-6">
                <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-red-800 hover:text-white transition-all">
                  <Instagram />
                </a>
                <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-red-800 hover:text-white transition-all">
                  <Twitter />
                </a>
                <a href="#" className="p-3 bg-white/5 rounded-full hover:bg-red-800 hover:text-white transition-all">
                  <Youtube />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-black">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black italic mb-8">GET IN TOUCH</h2>
          <p className="text-gray-400 mb-12 text-lg">
            For bookings, collaborations, or just to say hi, drop me a message.
            Let's create something legendary together.
          </p>
          
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="NAME" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-700 transition-colors"
              />
              <input 
                type="email" 
                placeholder="EMAIL" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-700 transition-colors"
              />
            </div>
            <textarea 
              placeholder="MESSAGE" 
              rows={6}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-700 transition-colors"
            />
            <button className="w-full py-5 bg-red-800 text-white font-black rounded-2xl hover:bg-red-700 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-900/40">
              SEND MESSAGE
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-black pb-32">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-800 rounded flex items-center justify-center font-bold text-white italic shadow-lg shadow-red-900/40">
              X
            </div>
            <span className="text-xl font-black tracking-tighter">DJX</span>
          </div>
          
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} DJX MUSIC. ALL RIGHTS RESERVED.
          </div>
          
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            MADE FOR THE TRANCE FAMILY <Disc size={16} className="text-red-700" />
          </div>
        </div>
      </footer>

      {/* Player */}
      <MusicPlayer 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </div>
  );
}

export default App;
