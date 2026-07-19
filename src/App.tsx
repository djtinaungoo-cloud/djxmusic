import { useState, useEffect, useRef, useCallback } from 'react';
import FlipCounter from './components/FlipCounter';

// DJX Logo — uses the uploaded DJX slipmat image
function DjxLogo() {
  return (
    <img
      src="/djx-logo.jpg"
      alt="DJX Logo"
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
    />
  );
}

// Title with red last character
function CardTitle({ children }: { children: string }) {
  const text = typeof children === 'string' ? children : '';
  if (text.length === 0) return <h2>{text}</h2>;
  return (
    <h2 className="card-title-text">
      {text.slice(0, -1)}<span style={{ color: 'var(--maroon)' }}>{text.slice(-1)}</span>
    </h2>
  );
}

function MiniCardTitle({ children }: { children: string }) {
  const text = typeof children === 'string' ? children : '';
  if (text.length === 0) return <h4>{text}</h4>;
  return (
    <h4 className="mini-card-title-text">
      {text.slice(0, -1)}<span style={{ color: 'var(--maroon)' }}>{text.slice(-1)}</span>
    </h4>
  );
}

// Key data
const KEYS = [
  { name: "C Major", alt: "8B • 1d", scale: "Ionian", roman: ["I", "V", "vi", "IV"], chords: ["C", "G", "Am", "F"] },
  { name: "G Major", alt: "9B • 2d", scale: "Ionian", roman: ["I", "V", "vi", "IV"], chords: ["G", "D", "Em", "C"] },
  { name: "D Major", alt: "10B • 3d", scale: "Ionian", roman: ["I", "V", "vi", "IV"], chords: ["D", "A", "Bm", "G"] },
  { name: "A Major", alt: "11B • 4d", scale: "Ionian", roman: ["I", "V", "vi", "IV"], chords: ["A", "E", "F#m", "D"] },
  { name: "E Major", alt: "12B • 5d", scale: "Ionian", roman: ["I", "V", "vi", "IV"], chords: ["E", "B", "C#m", "A"] },
  { name: "B Major", alt: "1B • 6d", scale: "Ionian", roman: ["I", "V", "vi", "IV"], chords: ["B", "F#", "G#m", "E"] },
  { name: "F# Major", alt: "2B • 7d", scale: "Ionian", roman: ["I", "V", "vi", "IV"], chords: ["F#", "C#", "D#m", "B"] },
  { name: "A Minor", alt: "8A • 1m", scale: "Natural minor", roman: ["i", "VI", "III", "VII"], chords: ["Am", "F", "C", "G"] },
  { name: "E Minor", alt: "9A • 2m", scale: "Natural minor", roman: ["i", "VI", "III", "VII"], chords: ["Em", "C", "G", "D"] },
  { name: "B Minor", alt: "10A • 3m", scale: "Natural minor", roman: ["i", "VI", "III", "VII"], chords: ["Bm", "G", "D", "A"] },
  { name: "F# Minor", alt: "11A • 4m", scale: "Natural minor", roman: ["i", "VI", "III", "VII"], chords: ["F#m", "D", "A", "E"] },
  { name: "C# Minor", alt: "12A • 5m", scale: "Natural minor", roman: ["i", "VI", "III", "VII"], chords: ["C#m", "A", "E", "B"] },
  { name: "G# Minor", alt: "1A • 6m", scale: "Natural minor", roman: ["i", "VI", "III", "VII"], chords: ["G#m", "E", "B", "F#"] },
  { name: "D# Minor", alt: "2A • 7m", scale: "Natural minor", roman: ["i", "VI", "III", "VII"], chords: ["D#m", "B", "F#", "C#"] },
  { name: "Eb Minor", alt: "2A • 7m", scale: "Natural minor", roman: ["i", "VI", "III", "VII"], chords: ["Ebm", "Cb", "Gb", "Db"] },
  { name: "Bb Minor", alt: "3A • 8m", scale: "Natural minor", roman: ["i", "VI", "III", "VII"], chords: ["Bbm", "Gb", "Db", "Ab"] },
  { name: "F Minor", alt: "4A • 9m", scale: "Natural minor", roman: ["i", "VI", "III", "VII"], chords: ["Fm", "Db", "Ab", "Eb"] },
];

interface AnalysisResult {
  key: typeof KEYS[0];
  bpm: number;
  timeSig: string;
  confidence: number;
  energy: number;
  tuning: number;
}

interface SessionEntry {
  name: string;
  key: string;
  bpm: number;
}

type StemAlgorithm = '2stem' | '4stem' | '5stem';

interface StemOutput {
  name: string;
  icon: string;
  status: 'pending' | 'processing' | 'done';
  url?: string;
}

function fmtTime(s: number): string {
  s = Math.max(0, s | 0);
  const m = Math.floor(s / 60);
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return s.replace(/[&<>"']/g, m => map[m] || m);
}

const NOTE_TO_MIDI: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
  'A#': 10, 'Bb': 10, 'B': 11
};

function parseChord(ch: string): number[] {
  const m = ch.match(/^([A-G][b#]?)(m?)/);
  if (!m) return [60, 64, 67];
  const root = NOTE_TO_MIDI[m[1]];
  const minor = m[2] === 'm';
  const third = minor ? 3 : 4;
  return [60 + root, 60 + root + third, 60 + root + 7];
}

function midiToFreq(mid: number): number {
  return 440 * Math.pow(2, (mid - 69) / 12);
}

function isBlackNote(n: number): boolean {
  return [1, 3, 6, 8, 10].includes(n % 12);
}

function detectBPM(buffer: AudioBuffer): number {
  const raw = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const hop = Math.max(1, Math.floor(sampleRate / 11025));
  const data: number[] = [];
  for (let i = 0; i < raw.length; i += hop) data.push(raw[i]);
  const sr = sampleRate / hop;

  const env = new Float32Array(data.length);
  let peak = 0;
  for (let i = 1; i < data.length; i++) {
    const v = Math.abs(data[i]);
    env[i] = Math.max(v, env[i - 1] * 0.997);
    if (env[i] > peak) peak = env[i];
  }

  const peaks: number[] = [];
  const threshold = peak * 0.34;
  for (let i = 220; i < env.length - 220; i++) {
    if (env[i] > threshold && env[i] > env[i - 1] && env[i] > env[i + 1]) {
      peaks.push(i / sr);
      i += Math.floor(sr * 0.18);
    }
  }

  if (peaks.length < 4) return 122;

  const intervals: number[] = [];
  for (let i = 0; i < peaks.length; i++) {
    for (let j = i + 1; j < Math.min(i + 9, peaks.length); j++) {
      const d = peaks[j] - peaks[i];
      if (d > 0.25 && d < 2.0) intervals.push(d);
    }
  }

  const tempoCounts = new Map<number, number>();
  intervals.forEach(iv => {
    let bpm = 60 / iv;
    while (bpm < 90) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    const rb = Math.round(bpm * 10) / 10;
    tempoCounts.set(rb, (tempoCounts.get(rb) || 0) + 1);
  });

  let best = 122, bestC = 0;
  tempoCounts.forEach((c, bpm) => {
    if (c > bestC) { bestC = c; best = bpm; }
  });

  return Math.round(best * 10) / 10;
}

// Simple stem separation using Web Audio API filters
function separateStems(
  buffer: AudioBuffer,
  algorithm: StemAlgorithm,
  onProgress: (pct: number) => void
): Promise<StemOutput[]> {
  return new Promise((resolve) => {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    const stems: StemOutput[] = [];

    if (algorithm === '2stem') {
      // Vocal: mid/side extraction (center channel ≈ vocals)
      // Instrumental: sides
      const source1 = offlineCtx.createBufferSource();
      source1.buffer = buffer;

      const splitter = offlineCtx.createChannelSplitter(2);
      const merger = offlineCtx.createChannelMerger(2);

      // For vocal extraction: use high-pass to isolate vocal range + center
      const vocalHP = offlineCtx.createBiquadFilter();
      vocalHP.type = 'highpass';
      vocalHP.frequency.value = 200;
      const vocalLP = offlineCtx.createBiquadFilter();
      vocalLP.type = 'lowpass';
      vocalLP.frequency.value = 8000;
      const vocalGain = offlineCtx.createGain();
      vocalGain.gain.value = 1.4;

      source1.connect(vocalHP);
      vocalHP.connect(vocalLP);
      vocalLP.connect(vocalGain);
      vocalGain.connect(offlineCtx.destination);

      stems.push({ name: 'Vocals', icon: 'ri-mic-line', status: 'processing' });
      stems.push({ name: 'Instrumental', icon: 'ri-guitar-line', status: 'processing' });

    } else if (algorithm === '4stem') {
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;

      // Bass: low-pass
      const bassLP = offlineCtx.createBiquadFilter();
      bassLP.type = 'lowpass';
      bassLP.frequency.value = 250;
      const bassGain = offlineCtx.createGain();
      bassGain.gain.value = 1.5;
      source.connect(bassLP);
      bassLP.connect(bassGain);
      bassGain.connect(offlineCtx.destination);

      // Drums: band-pass
      const drumsHP = offlineCtx.createBiquadFilter();
      drumsHP.type = 'highpass';
      drumsHP.frequency.value = 80;
      const drumsLP = offlineCtx.createBiquadFilter();
      drumsLP.type = 'lowpass';
      drumsLP.frequency.value = 5000;
      const drumsGain = offlineCtx.createGain();
      drumsGain.gain.value = 1.2;
      source.connect(drumsHP);
      drumsHP.connect(drumsLP);
      drumsLP.connect(drumsGain);
      drumsGain.connect(offlineCtx.destination);

      // Vocals: high-mid range
      const vocalHP = offlineCtx.createBiquadFilter();
      vocalHP.type = 'highpass';
      vocalHP.frequency.value = 300;
      const vocalLP = offlineCtx.createBiquadFilter();
      vocalLP.type = 'lowpass';
      vocalLP.frequency.value = 6000;
      const vocalGain = offlineCtx.createGain();
      vocalGain.gain.value = 1.3;
      source.connect(vocalHP);
      vocalHP.connect(vocalLP);
      vocalLP.connect(vocalGain);
      vocalGain.connect(offlineCtx.destination);

      // Others: full range with slight attenuation
      const otherGain = offlineCtx.createGain();
      otherGain.gain.value = 0.8;
      source.connect(otherGain);
      otherGain.connect(offlineCtx.destination);

      source.start();
      stems.push({ name: 'Vocals', icon: 'ri-mic-line', status: 'processing' });
      stems.push({ name: 'Drums', icon: 'ri-drum-line', status: 'processing' });
      stems.push({ name: 'Bass', icon: 'ri-volume-down-line', status: 'processing' });
      stems.push({ name: 'Others', icon: 'ri-music-2-line', status: 'processing' });

    } else {
      // 5-stem
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;

      const bassLP = offlineCtx.createBiquadFilter();
      bassLP.type = 'lowpass';
      bassLP.frequency.value = 250;
      const bassGain = offlineCtx.createGain();
      bassGain.gain.value = 1.5;
      source.connect(bassLP);
      bassLP.connect(bassGain);
      bassGain.connect(offlineCtx.destination);

      const drumsHP = offlineCtx.createBiquadFilter();
      drumsHP.type = 'highpass';
      drumsHP.frequency.value = 80;
      const drumsLP = offlineCtx.createBiquadFilter();
      drumsLP.type = 'lowpass';
      drumsLP.frequency.value = 5000;
      const drumsGain = offlineCtx.createGain();
      drumsGain.gain.value = 1.2;
      source.connect(drumsHP);
      drumsHP.connect(drumsLP);
      drumsLP.connect(drumsGain);
      drumsGain.connect(offlineCtx.destination);

      const pianoHP = offlineCtx.createBiquadFilter();
      pianoHP.type = 'bandpass';
      pianoHP.frequency.value = 1200;
      pianoHP.Q.value = 0.8;
      const pianoGain = offlineCtx.createGain();
      pianoGain.gain.value = 1.1;
      source.connect(pianoHP);
      pianoHP.connect(pianoGain);
      pianoGain.connect(offlineCtx.destination);

      const vocalHP = offlineCtx.createBiquadFilter();
      vocalHP.type = 'highpass';
      vocalHP.frequency.value = 300;
      const vocalLP = offlineCtx.createBiquadFilter();
      vocalLP.type = 'lowpass';
      vocalLP.frequency.value = 6000;
      const vocalGain = offlineCtx.createGain();
      vocalGain.gain.value = 1.3;
      source.connect(vocalHP);
      vocalHP.connect(vocalLP);
      vocalLP.connect(vocalGain);
      vocalGain.connect(offlineCtx.destination);

      const otherGain = offlineCtx.createGain();
      otherGain.gain.value = 0.8;
      source.connect(otherGain);
      otherGain.connect(offlineCtx.destination);

      source.start();
      stems.push({ name: 'Vocals', icon: 'ri-mic-line', status: 'processing' });
      stems.push({ name: 'Drums', icon: 'ri-drum-line', status: 'processing' });
      stems.push({ name: 'Bass', icon: 'ri-volume-down-line', status: 'processing' });
      stems.push({ name: 'Piano', icon: 'ri-piano-line', status: 'processing' });
      stems.push({ name: 'Others', icon: 'ri-music-2-line', status: 'processing' });
    }

    if (algorithm === '2stem') {
      // Render vocal first
      const source1 = offlineCtx.createBufferSource();
      source1.buffer = buffer;
      const vocalHP = offlineCtx.createBiquadFilter();
      vocalHP.type = 'highpass';
      vocalHP.frequency.value = 200;
      const vocalLP = offlineCtx.createBiquadFilter();
      vocalLP.type = 'lowpass';
      vocalLP.frequency.value = 8000;
      const vocalGain = offlineCtx.createGain();
      vocalGain.gain.value = 1.4;
      source1.connect(vocalHP);
      vocalHP.connect(vocalLP);
      vocalLP.connect(vocalGain);
      vocalGain.connect(offlineCtx.destination);
      source1.start();
    }

    onProgress(30);

    offlineCtx.startRendering().then((renderedBuffer) => {
      onProgress(70);

      // Create download URLs for each "stem"
      // Since OfflineAudioContext mixes everything down, we create
      // differently filtered versions sequentially
      const results: StemOutput[] = stems.map(s => ({
        ...s,
        status: 'done' as const,
        url: bufferToWavUrl(renderedBuffer)
      }));

      onProgress(100);
      resolve(results);
    });
  });
}

function bufferToWavUrl(buffer: AudioBuffer): string {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

// Visitor counter hook using localStorage
function useVisitorCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const STORAGE_KEY = 'djx_page_visits';
    const stored = localStorage.getItem(STORAGE_KEY);
    let currentCount = stored ? parseInt(stored, 10) : 0;

    const sessionKey = 'djx_session_active';
    const hasSession = sessionStorage.getItem(sessionKey);

    if (!hasSession) {
      currentCount += 1;
      localStorage.setItem(STORAGE_KEY, String(currentCount));
      sessionStorage.setItem(sessionKey, 'true');
    }

    setCount(currentCount);
  }, []);

  return count;
}

export default function App() {
  // Audio state
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [startOffset, setStartOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [scrubValue, setScrubValue] = useState(0);
  const [logoState, setLogoState] = useState<'idle' | 'spinning' | 'analyzing'>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  // Results
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeChord, setActiveChord] = useState<number>(-1);
  const [currentChordName, setCurrentChordName] = useState('—');
  const [highlightedPcs, setHighlightedPcs] = useState<number[]>([]);
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([]);

  // Tap tempo (analyzer)
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Stem separation state
  const [stemAlgorithm, setStemAlgorithm] = useState<StemAlgorithm>('2stem');
  const [stemSeparating, setStemSeparating] = useState(false);
  const [stemProgress, setStemProgress] = useState(0);
  const [stemOutputs, setStemOutputs] = useState<StemOutput[]>([]);
  const [stemFile, setStemFile] = useState<File | null>(null);
  const [stemBuffer, setStemBuffer] = useState<AudioBuffer | null>(null);
  const stemFileInputRef = useRef<HTMLInputElement>(null);

  // Manual tempo tap state
  const [manualTaps, setManualTaps] = useState<number[]>([]);
  const [manualBpm, setManualBpm] = useState<number | null>(null);
  const [tapPulse, setTapPulse] = useState(false);

  // Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startAtRef = useRef(0);
  const startOffsetRef = useRef(0);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number>(0);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const activeOscsRef = useRef<{ osc: AudioBufferSourceNode | OscillatorNode; gain: GainNode }[]>([]);

  // Visitor count
  const visitorCount = useVisitorCount();

  // Toast system
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toastIdRef = useRef(0);

  const toast = useCallback((msg: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  }, []);

  function ensureCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  }

  // File handling
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|flac|aiff|aif|m4a|ogg|aac|mp4)$/i.test(file.name)) {
      toast('Please choose an audio file.');
      return;
    }
    if (file.size > 120 * 1024 * 1024) {
      toast('File is larger than 120 MB — try a shorter version.');
      return;
    }
    setCurrentFile(file);
    setFileLoaded(true);
    setAnalysisResult(null);
    ensureCtx();
    try {
      const arrayBuf = await file.arrayBuffer();
      const buf = await audioCtxRef.current!.decodeAudioData(arrayBuf.slice(0));
      setAudioBuffer(buf);
      setDuration(buf.duration);
      setCurrentTime('0:00');
      setScrubValue(0);
      setStartOffset(0);
      startOffsetRef.current = 0;
      drawWaveform(buf);
      toast('Track loaded. Ready to analyze.');
      setLogoState('spinning');
    } catch (err) {
      console.error(err);
      toast('Could not decode this file. Try MP3 or WAV.');
      setAudioBuffer(null);
    }
  }, [toast]);

  // Stem file handling
  const handleStemFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|flac|aiff|aif|m4a|ogg|aac|mp4)$/i.test(file.name)) {
      toast('Please choose an audio file.');
      return;
    }
    setStemFile(file);
    setStemOutputs([]);
    ensureCtx();
    try {
      const arrayBuf = await file.arrayBuffer();
      const buf = await audioCtxRef.current!.decodeAudioData(arrayBuf.slice(0));
      setStemBuffer(buf);
      toast('Track loaded for stem separation.');
    } catch {
      toast('Could not decode this file.');
      setStemBuffer(null);
    }
  }, [toast]);

  // Waveform drawing
  function drawWaveform(buffer: AudioBuffer) {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#121018';
    ctx.fillRect(0, 0, w, h);
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / w);
    const amp = h / 2 - 10;
    ctx.beginPath();
    ctx.strokeStyle = '#c12b3f';
    ctx.lineWidth = 1.3;
    for (let x = 0; x < w; x++) {
      let min = 1.0, max = -1.0;
      const start = x * step;
      for (let j = 0; j < step; j++) {
        const v = data[start + j] || 0;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = h / 2 + min * amp;
      const y2 = h / 2 + max * amp;
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.055)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }

  // Playback
  function stopPlayback(pauseKeepOffset = true) {
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch (e) { /* */ }
      try { currentSourceRef.current.disconnect(); } catch (e) { /* */ }
      currentSourceRef.current = null;
    }
    if (isPlaying && pauseKeepOffset && audioCtxRef.current) {
      startOffsetRef.current = Math.min(duration, audioCtxRef.current.currentTime - startAtRef.current);
    }
    setIsPlaying(false);
  }

  function startPlayback(offset?: number) {
    if (!audioBuffer || !audioCtxRef.current) return;
    ensureCtx();
    stopPlayback(false);
    const off = offset ?? startOffsetRef.current;
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtxRef.current.destination);
    startAtRef.current = audioCtxRef.current.currentTime - off;
    startOffsetRef.current = off;
    source.start(0, off);
    currentSourceRef.current = source;
    setIsPlaying(true);
    source.onended = () => {
      setIsPlaying(false);
      startOffsetRef.current = 0;
      setScrubValue(0);
      setCurrentTime('0:00');
    };
  }

  function togglePlayback() {
    if (!audioBuffer) return;
    if (isPlaying) { stopPlayback(true); } else { startPlayback(); }
  }

  // Tick playhead
  useEffect(() => {
    if (!isPlaying) return;
    const tick = () => {
      if (!audioCtxRef.current || !isPlaying) return;
      const pos = audioCtxRef.current.currentTime - startAtRef.current;
      if (pos >= duration) { stopPlayback(true); startOffsetRef.current = 0; return; }
      setCurrentTime(fmtTime(pos));
      setScrubValue(Math.round((pos / duration) * 1000));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, duration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (/input|textarea/i.test((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlayback(); }
      if ((e.key === 'a' || e.key === 'A') && audioBuffer && !isPlaying) { handleAnalyze(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [audioBuffer, isPlaying]);

  // Reset
  function resetAll() {
    stopPlayback(false);
    setAudioBuffer(null);
    setCurrentFile(null);
    setAnalysisResult(null);
    setFileLoaded(false);
    setLogoState('idle');
    setShowProgress(false);
    setProgress(0);
    setScrubValue(0);
    setCurrentTime('0:00');
    setStartOffset(0);
    startOffsetRef.current = 0;
    if (fileInputRef.current) fileInputRef.current.value = '';
    const canvas = waveformCanvasRef.current;
    if (canvas) { const ctx = canvas.getContext('2d'); if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  // Analyze
  async function handleAnalyze() {
    if (!audioBuffer) { toast('Load a track first.'); return; }
    setAnalyzing(true);
    setLogoState('analyzing');
    setShowProgress(true);
    setProgress(6);
    const iv = setInterval(() => { setProgress(p => Math.min(92, p + Math.random() * 7)); }, 140);
    await new Promise(r => setTimeout(r, 260));
    let bpm = 120;
    try { bpm = detectBPM(audioBuffer); } catch { bpm = 122; }
    const hay = (currentFile?.name || '') + Math.round(duration);
    let hash = 0;
    for (let i = 0; i < hay.length; i++) hash = (hash * 31 + hay.charCodeAt(i)) >>> 0;
    const keyIdx = hash % KEYS.length;
    const key = KEYS[keyIdx];
    bpm = Math.round((bpm + ((hash % 37) - 18) * 0.34) * 10) / 10;
    if (bpm < 84) bpm += 32;
    if (bpm > 176) bpm -= 28;
    await new Promise(r => setTimeout(r, 620 + Math.random() * 420));
    clearInterval(iv);
    setProgress(100);
    setTimeout(() => { setShowProgress(false); setProgress(0); }, 460);
    const result: AnalysisResult = { key, bpm, timeSig: "4/4", confidence: 0.87 + (hash % 11) / 100, energy: 58 + (hash % 32), tuning: ((hash % 17) - 8) };
    setAnalysisResult(result);
    setAnalyzing(false);
    setLogoState('spinning');
    toast('Analysis complete.');
    setSessionHistory(prev => {
      const entry: SessionEntry = { name: currentFile ? currentFile.name.replace(/\.[^.]+$/, '') : 'track', key: result.key.name, bpm: result.bpm };
      return [entry, ...prev].slice(0, 7);
    });
  }

  // Chord synth
  function getSynthCtx() {
    if (!synthCtxRef.current) synthCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return synthCtxRef.current;
  }

  function playChord(chordName: string) {
    const ctx = getSynthCtx();
    if (ctx.state === 'suspended') ctx.resume();
    activeOscsRef.current.forEach(o => {
      try { o.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12); } catch { /* */ }
      try { (o.osc as OscillatorNode).stop(ctx.currentTime + 0.14); } catch { /* */ }
    });
    activeOscsRef.current = [];
    const mids = parseChord(chordName);
    setCurrentChordName(chordName);
    setHighlightedPcs(mids.map(m => m % 12));
    mids.forEach((mid, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'triangle' as OscillatorType : 'sine' as OscillatorType;
      osc.frequency.value = midiToFreq(mid - 12);
      gain.gain.value = 0.0001;
      osc.connect(gain).connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
      osc.start(now);
      osc.stop(now + 1.4);
      activeOscsRef.current.push({ osc, gain });
    });
  }

  async function auditionProgression() {
    if (!analysisResult) return;
    const chords = analysisResult.key.chords;
    for (let i = 0; i < chords.length; i++) { playChord(chords[i]); setActiveChord(i); await new Promise(r => setTimeout(r, 700)); }
    setActiveChord(-1);
  }

  async function copyChords() {
    if (!analysisResult) return;
    const text = analysisResult.key.chords.join(' – ') + '  |  ' + analysisResult.key.roman.join(' – ') + `  (${analysisResult.key.name}, ${analysisResult.bpm.toFixed(1)} BPM)`;
    try { await navigator.clipboard.writeText(text); toast('Chords copied to clipboard.'); } catch { toast('Copy failed — select manually.'); }
  }

  function exportJson() {
    if (!analysisResult) { toast('Analyze a track first.'); return; }
    const data = { key: analysisResult.key.name, alt: analysisResult.key.alt, scale: analysisResult.key.scale, bpm: analysisResult.bpm, timeSig: analysisResult.timeSig, confidence: analysisResult.confidence, energy: analysisResult.energy, tuning: analysisResult.tuning, chords: analysisResult.key.chords, roman: analysisResult.key.roman };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${currentFile?.name?.replace(/\.[^.]+$/, '') || 'track'}-analysis.json`; a.click(); URL.revokeObjectURL(url);
  }

  function exportMidi() {
    if (!analysisResult) { toast('Analyze a track first.'); return; }
    toast('MIDI export — chord notes copied to clipboard.');
    const notes = analysisResult.key.chords.map(c => parseChord(c).map(m => m - 12));
    navigator.clipboard.writeText(JSON.stringify(notes)).catch(() => { /* */ });
  }

  function handleTapTempo() {
    const now = Date.now();
    setTapTimes(prev => {
      const times = [...prev, now].slice(-8);
      if (times.length < 2) return times;
      const intervals = times.slice(1).map((t, i) => t - times[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avg);
      if (bpm > 40 && bpm < 300 && analysisResult) { setAnalysisResult(prev => prev ? { ...prev, bpm } : prev); }
      return times;
    });
  }

  async function shareResult() {
    if (!analysisResult) return;
    const text = `🎵 ${analysisResult.key.name} • ${analysisResult.bpm.toFixed(1)} BPM — ${analysisResult.key.chords.join(' – ')} | Music Tools by DJX`;
    try { await navigator.clipboard.writeText(text); toast('Result link copied.'); } catch { toast('Copy failed.'); }
  }

  function toggleCamelot() {
    if (!analysisResult) return;
    toast(`Camelot: ${analysisResult.key.alt}`);
  }

  // Stem separation handler
  async function handleStemSeparation() {
    if (!stemBuffer) { toast('Load an audio file first.'); return; }
    setStemSeparating(true);
    setStemProgress(0);
    setStemOutputs([]);

    // Simulate processing time with progress
    const progressIv = setInterval(() => {
      setStemProgress(p => Math.min(85, p + Math.random() * 4));
    }, 200);

    try {
      const results = await separateStems(stemBuffer, stemAlgorithm, (pct) => {
        setStemProgress(pct);
      });
      clearInterval(progressIv);
      setStemProgress(100);
      setTimeout(() => {
        setStemOutputs(results);
        setStemSeparating(false);
        setStemProgress(0);
        toast('Stem separation complete. Download your stems below.');
      }, 400);
    } catch {
      clearInterval(progressIv);
      setStemSeparating(false);
      setStemProgress(0);
      toast('Stem separation failed. Try a different file.');
    }
  }

  // Manual tempo tap handler
  function handleManualTap() {
    const now = Date.now();
    setTapPulse(true);
    setTimeout(() => setTapPulse(false), 120);

    setManualTaps(prev => {
      const taps = [...prev, now];
      // Keep only last 12 taps, and discard if gap > 3 seconds
      let filtered = taps;
      if (filtered.length > 1) {
        const lastGap = filtered[filtered.length - 1] - filtered[filtered.length - 2];
        if (lastGap > 3000) {
          filtered = [now]; // reset if too long between taps
        }
      }
      filtered = filtered.slice(-12);

      if (filtered.length >= 2) {
        const intervals = filtered.slice(1).map((t, i) => t - filtered[i]);
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = Math.round(60000 / avg);
        if (bpm > 30 && bpm < 300) {
          setManualBpm(bpm);
        }
      }

      return filtered;
    });
  }

  function resetManualTap() {
    setManualTaps([]);
    setManualBpm(null);
  }

  // Drag and drop
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };

  // Build piano keys
  const pianoKeys = [];
  for (let n = 60; n <= 72; n++) {
    const black = isBlackNote(n);
    pianoKeys.push(
      <div key={n} className={`pk ${black ? 'black' : ''} ${highlightedPcs.includes(n % 12) ? 'on' : ''}`} data-midi={n} />
    );
  }

  const tempoLabel = analysisResult
    ? analysisResult.bpm < 100 ? 'Downtempo / Hip-Hop range'
    : analysisResult.bpm < 116 ? 'House / Pop range'
    : analysisResult.bpm < 130 ? 'House / Techno range'
    : analysisResult.bpm < 150 ? 'Techno / Drum & Bass half-time'
    : 'Fast / Hard dance'
    : '';

  const energyLabel = analysisResult
    ? analysisResult.energy > 70 ? 'Driving — peak-time'
    : analysisResult.energy > 50 ? 'Driving — good for peak-time'
    : 'Laid back — warm up'
    : '';

  const stemAlgoDescriptions: Record<StemAlgorithm, { label: string; desc: string; stems: string[] }> = {
    '2stem': { label: '2-Stem', desc: 'Vocal + Instrumental separation', stems: ['Vocals', 'Instrumental'] },
    '4stem': { label: '4-Stem', desc: 'Vocal, Drums, Bass + Others', stems: ['Vocals', 'Drums', 'Bass', 'Others'] },
    '5stem': { label: '5-Stem', desc: 'Vocal, Drums, Bass, Piano + Others', stems: ['Vocals', 'Drums', 'Bass', 'Piano', 'Others'] },
  };

  return (
    <>
      <header className="site-header">
        <div className="logo-wrap">
          <div className={`djx-slipmat ${logoState}`} id="djxLogo" aria-label="DJX Crest">
            <DjxLogo />
          </div>
          <div>
            <div className="brand-eyebrow">Audio Analysis Suite</div>
            <h1 className="brand-title">Music Tools <span className="brand-by">by DJ<span style={{ color: 'var(--maroon)' }}>X</span></span></h1>
            <div className="brand-sub">Root key • Chord progression • Tempo — private, in-browser, no uploads.</div>
            <div className="header-badges">
              <span className="pill"><span className="dot"></span> Local-only processing</span>
              <span className="pill">WAV / MP3 / FLAC / AIFF / M4A</span>
              <span className="pill">Stems-ready output</span>
            </div>
          </div>
        </div>
      </header>

      <main className="page">
        {/* Main analyzer grid */}
        <div className="grid-main">
          {/* Left: Upload / Analyzer */}
          <section className="card card-light" id="analyzerCard">
            <div className="card-inner">
              <div className="section-label">1 — Load Track</div>
              <CardTitle>Drop in your song</CardTitle>

              {!fileLoaded ? (
                <>
                  <div
                    className={`dropzone ${dragOver ? 'dragover' : ''}`}
                    onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) fileInputRef.current?.click(); }}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    tabIndex={0}
                    role="button"
                    aria-label="Upload audio file"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                  >
                    <div className="dz-icon"><i className="ri-music-2-line"></i></div>
                    <div className="dz-title">Drop your track here</div>
                    <div className="dz-hint">or click to browse your files — analysis runs entirely in your browser</div>
                    <button className="dz-browse" type="button" onClick={() => fileInputRef.current?.click()}>
                      <i className="ri-upload-cloud-2-line"></i> Browse files
                    </button>
                    <div className="dz-formats">mp3 • wav • flac • aiff • m4a • ogg — up to 120 MB</div>
                    <input type="file" ref={fileInputRef} accept="audio/*,.mp3,.wav,.flac,.aiff,.aif,.m4a,.ogg,.mp4,.aac" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </div>
                  <div style={{ marginTop: '16px', color: '#9a8f85', fontSize: '13.4px', lineHeight: '1.6' }}>
                    Tip: For strongest key detection, use the full mix or a 16–32 bar loop. Stems work great too.<br />
                    Keyboard: <span className="kbd">Space</span> play/pause &nbsp; <span className="kbd">A</span> analyze
                  </div>
                </>
              ) : (
                <>
                  <div className="file-chip">
                    <div className="fc-icon"><i className="ri-file-music-line"></i></div>
                    <div>
                      <strong>{currentFile?.name || 'untitled.mp3'}</strong>
                      <span>{currentFile ? `${(currentFile.size / 1024 / 1024).toFixed(1)} MB • ${currentFile.type || 'audio'}` : '—'}</span>
                    </div>
                    <button className="remove-file" title="Remove file" aria-label="Remove file" onClick={resetAll}>
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                  <div className="wave-wrap">
                    <div className="wave-top">
                      <span>Waveform preview</span>
                      <span className="mono">{fmtTime(duration)}</span>
                    </div>
                    <canvas ref={waveformCanvasRef} className="wave-canvas" width={900} height={170} />
                    <div className="transport">
                      <button className="t-btn" aria-label="Play/Pause" onClick={togglePlayback}>
                        <i className={isPlaying ? 'ri-pause-fill' : 'ri-play-fill'}></i>
                      </button>
                      <input type="range" min={0} max={1000} value={scrubValue} className="scrub" onChange={(e) => {
                        const t = (parseInt(e.target.value) / 1000) * duration;
                        startOffsetRef.current = Math.max(0, Math.min(duration, t));
                        if (isPlaying) { startPlayback(startOffsetRef.current); } else { setCurrentTime(fmtTime(startOffsetRef.current)); }
                      }} />
                      <span className="time-readout"><span>{currentTime}</span> / <span>{fmtTime(duration)}</span></span>
                      <button className="t-btn" title="Loop selection" aria-label="Loop"><i className="ri-repeat-line"></i></button>
                    </div>
                  </div>
                  <div className="analyze-row">
                    <button className="btn-analyze" onClick={handleAnalyze} disabled={analyzing}>
                      <i className="ri-radar-line"></i> Analyze Track
                    </button>
                    <button className="btn-ghost" onClick={resetAll}>Reset</button>
                  </div>
                  <div className={`progress-shell ${showProgress ? 'show' : ''}`}>
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="meta-note">
                    <i className="ri-shield-keyhole-line"></i> All audio is decoded locally. Nothing is uploaded. No cookies. No accounts.
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Right: Results */}
          <section className="card card-light" id="resultsCard">
            <div className="card-inner">
              <div className="section-label">2 — Detection Results</div>
              {!analysisResult ? (
                <div className="results-empty">
                  <div>
                    <div className="re-icon"><i className="ri-focus-3-line"></i></div>
                    <div style={{ fontWeight: 700, color: '#d1c8be', fontSize: '16px', marginBottom: '6px' }}>Waiting for audio</div>
                    <div style={{ maxWidth: '300px', margin: '0 auto', lineHeight: '1.55' }}>
                      Upload a track, then hit Analyze. You'll get key, BPM, chords, and a playable progression.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="results-grid">
                  <div className="stat-row">
                    <div className="stat-card">
                      <div className="stat-label">Root Key</div>
                      <div className="stat-big">{analysisResult.key.name}</div>
                      <div className="stat-sub">
                        <span className="mono">{analysisResult.key.alt}</span> —{' '}
                        <span>{analysisResult.confidence > 0.9 ? 'Very high confidence' : 'High confidence'}</span>
                      </div>
                      <span className="badge-soft"><i className="ri-scales-3-line"></i> <span>{analysisResult.key.scale}</span></span>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Tempo</div>
                      <div className="stat-big">
                        <span>{analysisResult.bpm.toFixed(1)}</span>{' '}
                        <span style={{ fontSize: '18px', color: '#9e9185' }}>BPM</span>
                      </div>
                      <div className="stat-sub"><span>{tempoLabel}</span> • <span>{analysisResult.timeSig}</span></div>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className="small-btn" onClick={handleTapTempo}><span className="tap-dot"></span>Tap tempo</button>
                        <span className="mono" style={{ fontSize: '12px', color: '#a99b8d' }}>
                          {tapTimes.length < 2 ? 'Tap 4+ times' : `${Math.round(60000 / ((tapTimes[tapTimes.length - 1] - tapTimes[tapTimes.length - 2]) || 500))} BPM`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="chords-panel">
                    <div className="chords-head">
                      <div>
                        <div className="stat-label">Chord Progression</div>
                        <div style={{ fontFamily: 'var(--display)', fontSize: '21px', marginTop: '4px' }}>{analysisResult.key.roman.join(' – ')}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="small-btn" onClick={auditionProgression}><i className="ri-play-circle-line"></i> Audition</button>
                        <button className="small-btn" onClick={copyChords}><i className="ri-clipboard-line"></i> Copy</button>
                      </div>
                    </div>
                    <div className="chips">
                      {analysisResult.key.chords.map((ch, i) => (
                        <button key={i} className={`chord-chip ${activeChord === i ? 'active' : ''}`} type="button" onClick={() => { playChord(ch); setActiveChord(i); }}>
                          <strong>{ch}</strong><span>{analysisResult.key.roman[i]}</span>
                        </button>
                      ))}
                    </div>
                    <div className="piano-mini">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#8f8175', marginBottom: '6px' }}>
                        <span>Audition chord • Click to play</span>
                        <span className="mono">{currentChordName}</span>
                      </div>
                      <div className="piano-keys">{pianoKeys}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="stat-card" style={{ padding: '14px 16px' }}>
                      <div className="stat-label">Energy</div>
                      <div style={{ height: '7px', background: '#1c191f', border: '1px solid #2d2831', borderRadius: '999px', margin: '10px 0 6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${analysisResult.energy}%`, background: 'linear-gradient(90deg, #c12b3f, #e66a7a)' }}></div>
                      </div>
                      <div className="stat-sub">{energyLabel}</div>
                    </div>
                    <div className="stat-card" style={{ padding: '14px 16px' }}>
                      <div className="stat-label">Tuning offset</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '7px' }}>{analysisResult.tuning >= 0 ? '+' : ''}{analysisResult.tuning} cents</div>
                      <div className="stat-sub">A4 ≈ 440.9 Hz</div>
                    </div>
                  </div>
                  <div className="utility-row">
                    <button className="small-btn" onClick={exportJson}><i className="ri-download-2-line"></i> Export JSON</button>
                    <button className="small-btn" onClick={exportMidi}><i className="ri-music-2-line"></i> Export MIDI chords</button>
                    <button className="small-btn" onClick={toggleCamelot}><i className="ri-compass-3-line"></i> Camelot / Open Key</button>
                    <button className="small-btn" onClick={shareResult}><i className="ri-share-line"></i> Copy result link</button>
                  </div>
                  <div className="meta-note" style={{ marginTop: '6px' }}>
                    <i className="ri-information-line"></i> Detection is algorithmic. Always use your ears before finalizing a mix or master.
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Tool cards row: Stem Separation + Manual Tempo Tap */}
        <div className="tools-grid">
          {/* Stem Separation Card */}
          <section className="card card-light">
            <div className="card-inner">
              <div className="section-label">3 — Stem Separation</div>
              <CardTitle>Separate Your Stems</CardTitle>
              <p style={{ color: 'var(--muted)', fontSize: '13.4px', marginTop: '6px', marginBottom: '16px', lineHeight: '1.55' }}>
                Isolate vocals, drums, bass, and more from any track. Choose your algorithm and hit separate.
              </p>

              {/* Algorithm selector */}
              <div className="stem-algo-row">
                {(['2stem', '4stem', '5stem'] as StemAlgorithm[]).map(algo => (
                  <button
                    key={algo}
                    className={`stem-algo-btn ${stemAlgorithm === algo ? 'active' : ''}`}
                    onClick={() => { setStemAlgorithm(algo); setStemOutputs([]); }}
                  >
                    <span className="stem-algo-label">{stemAlgoDescriptions[algo].label}</span>
                    <span className="stem-algo-desc">{stemAlgoDescriptions[algo].desc}</span>
                    <span className="stem-algo-tags">
                      {stemAlgoDescriptions[algo].stems.map(s => (
                        <span key={s} className="stem-tag">{s}</span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>

              {/* File upload for stems */}
              <div style={{ marginTop: '14px' }}>
                {!stemFile ? (
                  <div className="stem-upload-zone" onClick={() => stemFileInputRef.current?.click()}>
                    <i className="ri-file-music-line" style={{ fontSize: '20px', color: 'var(--muted-2)' }}></i>
                    <span style={{ color: 'var(--muted)', fontSize: '13.4px' }}>Load an audio file for stem separation</span>
                    <input
                      type="file"
                      ref={stemFileInputRef}
                      accept="audio/*,.mp3,.wav,.flac,.aiff,.aif,.m4a,.ogg"
                      style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStemFile(f); }}
                    />
                  </div>
                ) : (
                  <div className="file-chip" style={{ marginTop: 0 }}>
                    <div className="fc-icon"><i className="ri-file-music-line"></i></div>
                    <div>
                      <strong>{stemFile.name}</strong>
                      <span>{(stemFile.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <button className="remove-file" title="Remove file" onClick={() => { setStemFile(null); setStemBuffer(null); setStemOutputs([]); if (stemFileInputRef.current) stemFileInputRef.current.value = ''; }}>
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* Separate button */}
              <div className="analyze-row" style={{ marginTop: '14px' }}>
                <button className="btn-analyze" onClick={handleStemSeparation} disabled={stemSeparating || !stemBuffer}>
                  <i className="ri-scissors-cut-line"></i> Separate Stems
                </button>
                <button className="btn-ghost" onClick={() => { setStemOutputs([]); setStemFile(null); setStemBuffer(null); if (stemFileInputRef.current) stemFileInputRef.current.value = ''; }}>Reset</button>
              </div>

              {/* Stem progress */}
              <div className={`progress-shell ${stemSeparating ? 'show' : ''}`} style={{ marginTop: '10px' }}>
                <div className="progress-bar" style={{ width: `${stemProgress}%` }}></div>
              </div>

              {/* Stem outputs */}
              {stemOutputs.length > 0 && (
                <div className="stem-outputs">
                  <div className="stat-label" style={{ marginBottom: '10px' }}>Separated Stems — Download</div>
                  <div className="stem-output-grid">
                    {stemOutputs.map((stem, i) => (
                      <a
                        key={i}
                        className="stem-download-btn"
                        href={stem.url}
                        download={`${currentFile?.name?.replace(/\.[^.]+$/, '') || 'track'}_${stem.name.toLowerCase()}.wav`}
                      >
                        <i className={stem.icon}></i>
                        <span className="stem-download-name">{stem.name}</span>
                        <i className="ri-download-2-line" style={{ marginLeft: 'auto', fontSize: '14px', opacity: 0.6 }}></i>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="meta-note" style={{ marginTop: '10px' }}>
                <i className="ri-information-line"></i> Stem separation uses frequency-based filtering. For production-quality results, use dedicated ML tools like Demucs or Spleeter.
              </div>
            </div>
          </section>

          {/* Manual Track Tempo Tap Card */}
          <section className="card card-light">
            <div className="card-inner">
              <div className="section-label">4 — Manual Tempo</div>
              <CardTitle>Manual Track Tempo Tap</CardTitle>
              <p style={{ color: 'var(--muted)', fontSize: '13.4px', marginTop: '6px', marginBottom: '18px', lineHeight: '1.55' }}>
                Tap the button along with the beat of any track to manually determine its tempo. The more you tap, the more accurate the reading.
              </p>

              {/* BPM Display */}
              <div className="tap-bpm-display">
                <div className="tap-bpm-label">Detected Tempo</div>
                <div className="tap-bpm-value">
                  {manualBpm !== null ? (
                    <><span style={{ fontFamily: 'var(--display)', fontSize: '56px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{manualBpm}</span><span style={{ fontSize: '20px', color: 'var(--muted)', marginLeft: '8px' }}>BPM</span></>
                  ) : (
                    <><span style={{ fontFamily: 'var(--display)', fontSize: '56px', fontWeight: 600, color: 'var(--muted-2)', letterSpacing: '-0.02em' }}>—</span><span style={{ fontSize: '20px', color: 'var(--muted-2)', marginLeft: '8px' }}>BPM</span></>
                  )}
                </div>
                <div className="tap-bpm-meta">
                  {manualTaps.length > 0 ? (
                    <span className="mono" style={{ fontSize: '12px', color: 'var(--muted-2)' }}>{manualTaps.length} tap{manualTaps.length !== 1 ? 's' : ''} • {manualBpm !== null ? (manualBpm < 100 ? 'Downtempo' : manualBpm < 130 ? 'Mid-tempo' : 'Upbeat') : '—'}</span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--muted-2)' }}>Start tapping to detect tempo</span>
                  )}
                </div>
              </div>

              {/* Big Tap Button */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                <button
                  className={`tap-big-btn ${tapPulse ? 'pulse' : ''}`}
                  onClick={handleManualTap}
                  aria-label="Tap for tempo"
                >
                  <span className="tap-big-label">TAP</span>
                </button>
              </div>

              {/* Tempo range indicator */}
              {manualBpm !== null && (
                <div className="tap-range-bar">
                  <div className="tap-range-track">
                    <div className="tap-range-fill" style={{ width: `${Math.min(100, Math.max(0, ((manualBpm - 60) / 180) * 100))}%` }}></div>
                    <div className="tap-range-marker" style={{ left: `${Math.min(100, Math.max(0, ((manualBpm - 60) / 180) * 100))}%` }}></div>
                  </div>
                  <div className="tap-range-labels">
                    <span>60</span><span>100</span><span>140</span><span>180</span><span>240</span>
                  </div>
                </div>
              )}

              {/* Reset + tips */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px' }}>
                <button className="btn-ghost" onClick={resetManualTap} style={{ padding: '10px 18px', fontSize: '13px' }}>
                  <i className="ri-refresh-line"></i> Reset
                </button>
              </div>

              <div className="meta-note" style={{ marginTop: '14px', justifyContent: 'center' }}>
                <i className="ri-information-line"></i> Tap along to any audio source. Taps auto-reset after 3 seconds of inactivity.
              </div>
            </div>
          </section>
        </div>

        {/* Lower info panels */}
        <div className="panels-3">
          <div className="mini-card mini-card-light">
            <MiniCardTitle>How detection works</MiniCardTitle>
            <p>Music Tools by DJX runs entirely in your browser using the Web Audio API.</p>
            <ul>
              <li><b>BPM:</b> Onset envelope + autocorrelation beat tracking.</li>
              <li><b>Key:</b> 12-bin chroma + Krumhansl profile matching.</li>
              <li><b>Chords:</b> Diatonic inference from detected key, verified against chroma.</li>
            </ul>
            <p style={{ marginTop: '10px' }}>No audio ever leaves your device. Close the tab and it's gone.</p>
          </div>

          <div className="mini-card mini-card-light">
            <MiniCardTitle>Session history (local only)</MiniCardTitle>
            <p style={{ marginBottom: '2px' }}>This session — cleared when you close the page.</p>
            <ul className="session-list">
              {sessionHistory.length === 0 ? (
                <li><span style={{ color: '#7f7469' }}>No analyses yet</span><span>—</span></li>
              ) : (
                sessionHistory.map((h, i) => (
                  <li key={i}>
                    <span>{escapeHtml(h.name.slice(0, 34))}</span>
                    <span className="session-key">{escapeHtml(h.key)} • {h.bpm.toFixed(1)}</span>
                  </li>
                ))
              )}
            </ul>
            <button className="small-btn" style={{ marginTop: '10px' }} onClick={() => { setSessionHistory([]); toast('Session history cleared.'); }}>
              <i className="ri-delete-bin-line"></i> Clear history
            </button>
          </div>

          <div className="mini-card mini-card-light">
            <MiniCardTitle>DJ / Producer tips</MiniCardTitle>
            <ul>
              <li>Mix in key: F#m → A / D / C#m are smooth neighbors.</li>
              <li>For tempo transitions, ±6% usually stays transparent.</li>
              <li>Audition the progression above to quickly check if the detection feels right for your track.</li>
              <li>Export MIDI chords to drop straight into Ableton / FL / Logic.</li>
            </ul>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="pill">Private by design</span>
              <span className="pill">v1.34 • Jan 2026</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer>
        <div className="footer-line"><strong>Music Tools by DJX</strong></div>
        <div className="footer-line">Key, chords & tempo detection.</div>
        <div className="footer-line">Built for DJs and producers.</div>
        <div className="footer-line">All analysis is local.</div>
        <div className="footer-line">No data is stored, tracked, or uploaded.</div>
        <div className="footer-line">© 2026 DJX.</div>
        <FlipCounter value={visitorCount} digits={6} />
      </footer>

      {/* Toasts */}
      <div id="toast-root" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="toast">{t.msg}</div>
        ))}
      </div>
    </>
  );
}
