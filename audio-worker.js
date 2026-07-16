/* audio-worker.js — performs analysis off the main thread
   - Receives a Float32Array audio buffer and sampleRate
   - Computes: BPM (simple onset autocorrelation), chroma vector using Goertzel per MIDI bins, Krumhansl key matching
   - Posts progress messages and final result
*/

// small utilities
function postProgress(p){ postMessage({type:'progress', value:p}); }

onmessage = function(e){
  const msg = e.data;
  if(!msg) return;
  if(msg.type === 'analyze'){
    try{
      const sampleRate = msg.sampleRate || 44100;
      let audio = msg.audio;
      if(audio && audio.buffer) audio = new Float32Array(audio.buffer);
      else audio = new Float32Array(audio);
      analyze(audio, sampleRate).then(result => postMessage({type:'result', result})).catch(err => { postMessage({type:'error', message:err.message}); });
    }catch(err){ postMessage({type:'error', message: err.message}); }
  }
};

async function analyze(audio, sampleRate){
  // send early progress
  postProgress(0.02);
  // normalize to -1..1 (already floats but ensure small DC offset removed)
  removeDC(audio);
  postProgress(0.08);

  // estimate BPM
  const bpm = estimateBPM(audio, sampleRate);
  postProgress(0.35);

  // estimate tuning and chroma
  const chroma = computeChroma(audio, sampleRate);
  postProgress(0.65);

  const key = matchKeyFromChroma(chroma);
  postProgress(0.85);

  // simple chord inference: pick diatonic chords from matched key's chord set using segment energy
  const chords = inferChordsFromChroma(chroma, key);
  postProgress(0.98);

  return {
    bpm,
    tempoLabel: (bpm>120? 'Fast': bpm>90? 'Mid':'Slow'),
    key,
    chroma,
    chords,
    roman: chords.map(c=>c.roman).join(' — ')
  };
}

function removeDC(buf){
  let mean = 0;
  for(let i=0;i<buf.length;i++) mean += buf[i];
  mean /= buf.length;
  if(Math.abs(mean) > 1e-6) for(let i=0;i<buf.length;i++) buf[i] -= mean;
}

// --- BPM: onset envelope + autocorrelation-based tempo estimation ---
function estimateBPM(buf, sr){
  // downsample to ~ 8kHz for envelope
  const targetSR = 8000;
  const hop = Math.max(1, Math.floor(sr/targetSR));
  const len = Math.floor(buf.length / hop);
  const env = new Float32Array(len);
  let maxv = 0;
  for(let i=0;i<len;i++){
    const v = Math.abs(buf[i*hop]);
    env[i] = (i===0? v : Math.max(v, env[i-1]*0.98));
    if(env[i]>maxv) maxv = env[i];
  }
  if(maxv <= 0) return 120.0;
  // rectify and half-wave
  for(let i=0;i<len;i++) env[i] = env[i] / maxv;

  // compute autocorrelation over tempo-relevant lags (60-200 BPM)
  const ac = new Float32Array( (targetSR/60 - targetSR/200) + 1 );
  // but simpler: compute full autocorrelation and search for lag corresponding to tempo
  const maxLag = Math.floor(targetSR * 60 / 40); // correspond to 40 BPM
  const minLag = Math.floor(targetSR * 60 / 220); // 220 BPM
  const corr = new Float32Array(maxLag - minLag + 1);
  for(let lag=minLag; lag<=maxLag; lag++){
    let s = 0;
    for(let i=0;i<env.length - lag;i+=4) s += env[i]*env[i+lag]; // sample step to speed up
    corr[lag - minLag] = s;
  }
  // find max peak
  let bestIdx = 0, best = -Infinity;
  for(let i=0;i<corr.length;i++){ if(corr[i] > best){ best = corr[i]; bestIdx = i; } }
  const bestLag = bestIdx + minLag;
  const secondsPerBeat = bestLag / targetSR;
  let bpm = 60 / secondsPerBeat;
  // clamp / smooth
  if(!isFinite(bpm) || bpm <= 40 || bpm > 240) bpm = 120;
  // quantize to nearest 0.1
  return Math.round(bpm*10)/10;
}

// --- Chroma via Goertzel per MIDI note and sum to pitch classes ---
function computeChroma(buf, sr){
  // use MIDI range 40..84 (~E2..C6), sum energy per semitone to chroma
  const minMidi = 40;
  const maxMidi = 84;
  const chroma = new Float32Array(12);
  const frame = 16384; // window length
  const step = Math.max(1, Math.floor(buf.length / frame));
  // we'll sample a window centered in the buffer for stability
  const start = Math.max(0, Math.floor((buf.length - frame)/2));
  const window = buf.subarray(start, start + frame);
  // precompute goertzel coefficients per MIDI
  for(let m = minMidi; m<=maxMidi; m++){
    const f = midiToFreq(m);
    const mag = goertzel(window, sr, f);
    chroma[m % 12] += mag;
  }
  // normalize
  const s = chroma.reduce((a,b)=>a+b, 0) || 1;
  for(let i=0;i<12;i++) chroma[i] /= s;
  return Array.from(chroma);
}

function midiToFreq(m){ return 440 * Math.pow(2, (m - 69)/12); }

// Goertzel implementation returns magnitude (energy) for a target frequency
function goertzel(samples, sr, freq){
  const N = samples.length;
  const k = Math.round( (N * freq) / sr );
  const omega = 2*Math.PI*k/N;
  const coeff = 2*Math.cos(omega);
  let s0=0, s1=0, s2=0;
  for(let i=0;i<N;i++){
    s0 = samples[i] + coeff * s1 - s2;
    s2 = s1; s1 = s0;
  }
  const real = s1 - s2 * Math.cos(omega);
  const imag = s2 * Math.sin(omega);
  const mag = Math.sqrt(real*real + imag*imag);
  return mag;
}

// Krumhansl profiles (major & minor normalized)
const KRUMH_MAJ = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
const KRUMH_MIN = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];

function correlate(a,b){ let s=0; for(let i=0;i<12;i++) s += a[i]*b[i]; return s; }

function rotate(arr, shift){ const out = new Array(12); for(let i=0;i<12;i++) out[i] = arr[(i+shift)%12]; return out; }

function matchKeyFromChroma(chroma){
  // chroma: 0=C,1=C#,2=D,... (we used MIDI%12 earlier)
  // compute correlation for each of 12 major and 12 minor rotations
  let best = {type:'major', root:0, score:-Infinity};
  // normalize profiles
  const maj = KRUMH_MAJ.slice(); const min = KRUMH_MIN.slice();
  // normalize chroma too
  const s = chroma.reduce((a,b)=>a+b,0) || 1;
  const c = chroma.map(x=>x/s);

  for(let r=0;r<12;r++){
    const rotMaj = rotate(maj, r);
    const rotMin = rotate(min, r);
    const scoreM = correlate(c, rotMaj);
    const scorem = correlate(c, rotMin);
    if(scoreM > best.score) best = {type:'major', root:r, score:scoreM};
    if(scorem > best.score) best = {type:'minor', root:r, score:scorem};
  }
  // map root index to name
  const names = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const rootName = names[best.root] + (best.type==='minor' ? ' Minor' : ' Major');
  const alt = camelotFromIndex(best.root, best.type === 'minor');
  return {name: rootName, scale: best.type==='minor' ? 'Natural minor' : 'Ionian', alt, confidence: Math.max(0, Math.min(1, best.score)) };
}

function camelotFromIndex(root, isMinor){
  // basic mapping using tonic->camelot approximate (not exact for enharmonics)
  const majorMap = ['8B','3B','10B','5B','12B','7B','2B','9B','4B','11B','6B','1B'];
  const minorMap = ['5A','12A','7A','2A','9A','4A','11A','6A','1A','8A','3A','10A'];
  return isMinor ? (minorMap[root%12]) : (majorMap[root%12]);
}

function inferChordsFromChroma(chroma, key){
  // simple diatonic inference: pick chords of scale degrees by largest chroma peaks
  // Build diatonic chord names for matched key
  const scaleDegreesMajor = ['I','ii','iii','IV','V','vi','vii°'];
  const scaleDegreesMinor = ['i','ii°','III','iv','v','VI','VII'];
  // map root index (0=C) to chord names like C, Dm, Em...
  const pitchNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  // guess root pitch index from key.name
  const rootPitch = pitchNames.indexOf(key.name.split(' ')[0].replace('♯','#'));
  const isMinor = key.scale && key.scale.toLowerCase().includes('minor');

  // generate diatonic triads for that key (basic)
  const diatonic = [];
  const majorFormula = [0,2,4,5,7,9,11];
  const minorFormula = [0,2,3,5,7,8,10];
  const formula = isMinor ? minorFormula : majorFormula;
  for(let i=0;i<7;i++){
    const root = (rootPitch + formula[i]) % 12;
    // rough quality: major if formula degree difference matches
    const quality = (isMinor ? ['m','dim','M','m','m','M','M'] : ['M','m','m','M','M','m','dim'])[i];
    const name = pitchNames[root] + (quality==='M' ? '' : (quality==='m' ? 'm' : 'dim'));
    diatonic.push({root, name, roman: isMinor ? scaleDegreesMinor[i] : scaleDegreesMajor[i]});
  }

  // pick top 4 chords by chroma energy at their root
  const scored = diatonic.map(d => ({...d, score: chroma[d.root]}));
  scored.sort((a,b)=>b.score - a.score);
  return scored.slice(0,4);
}

