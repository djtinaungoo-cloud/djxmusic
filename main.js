/* main.js — wires UI to the audio analysis worker
   - Decodes audio in the main thread (AudioContext) and transfers a Float32Array to the worker
   - Receives progress messages and final result from the worker
   - Provides cancel/terminate handling
*/

const workerPath = 'audio-worker.js';
let worker = null;
let pendingBuffer = null;

const $ = (s, r=document) => r.querySelector(s);

function createWorker(){
  if(worker) worker.terminate();
  worker = new Worker(workerPath);
  worker.onmessage = handleWorkerMessage;
}

function handleWorkerMessage(e){
  const msg = e.data;
  if(msg.type === 'progress'){
    const pct = Math.round((msg.value||0)*100);
    $('#progressShell').classList.add('show');
    $('#progressBar').style.width = pct + '%';
  } else if(msg.type === 'result'){
    $('#progressBar').style.width = '100%';
    $('#progressShell').classList.remove('show');
    applyAnalysisResult(msg.result);
    $('#djxLogo').classList.remove('analyzing');
    $('#djxLogo').classList.add('spinning');
  } else if(msg.type === 'log'){
    console.debug('worker:', msg.message);
  } else if(msg.type === 'error'){
    toast(msg.message || 'Analysis error');
    $('#progressShell').classList.remove('show');
    $('#djxLogo').classList.remove('analyzing');
  }
}

function toast(text){
  const root = $('#toast-root');
  if(!root) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  root.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(6px)'; setTimeout(()=>t.remove(),220); }, 2800);
}

function applyAnalysisResult(res){
  if(!res) return;
  const key = res.key || {name:'—', scale:'', alt:'', confidence:'unknown'};
  $('#keyBig').textContent = key.name + (key.scale && key.scale.toLowerCase().includes('minor') ? '' : '');
  $('#keyAlt').textContent = key.alt || '';
  $('#keyConfidence').textContent = (key.confidence ? (Math.round(key.confidence*100) + '%') : '—');
  $('#scaleType').textContent = key.scale || '';

  $('#bpmBig').textContent = (res.bpm || 0).toFixed(1);
  $('#tempoLabel').textContent = res.tempoLabel || '';

  // chords: simple presentation
  const chips = $('#chordChips');
  chips.innerHTML = '';
  (res.chords || []).forEach(c => {
    const el = document.createElement('button');
    el.className = 'chord-chip';
    el.type = 'button';
    el.innerHTML = `<strong>${c.name}</strong><span class="mono">${c.roman}</span>`;
    el.onclick = ()=>{ toast('Preview not implemented in demo'); };
    chips.appendChild(el);
  });

  $('#romanLine').textContent = (res.roman || '—');
  $('#resultsEmpty').style.display = 'none';
  $('#resultsFull').style.display = 'grid';
}

// UI -> analysis
async function analyzeAudioBuffer(audioBuffer){
  if(!audioBuffer) return;
  createWorker();
  $('#progressShell').classList.add('show');
  $('#progressBar').style.width = '2%';
  $('#djxLogo').classList.remove('spinning');
  $('#djxLogo').classList.add('analyzing');

  // extract mono Float32Array (downmix if multi-channel)
  const chCount = audioBuffer.numberOfChannels;
  const len = audioBuffer.length;
  let data = new Float32Array(len);
  if(chCount === 1){
    data.set(audioBuffer.getChannelData(0));
  } else {
    // simple average downmix
    for(let c=0;c<chCount;c++){
      const ch = audioBuffer.getChannelData(c);
      for(let i=0;i<len;i++) data[i] += ch[i] / chCount;
    }
  }

  // To avoid sending huge buffers we may analyze a representative slice. If > 5M samples, trim center 60s
  const maxSamples = 5_000_000; // ~5M floats (~20MB)
  let sendData = data;
  if(data.length > maxSamples){
    const start = Math.max(0, Math.floor((data.length - maxSamples)/2));
    sendData = data.subarray(start, start + maxSamples);
  }

  // Transfer the underlying buffer
  try{
    worker.postMessage({type:'analyze', sampleRate: audioBuffer.sampleRate, audio: sendData}, [sendData.buffer]);
  }catch(err){
    // some browsers freeze the transferred buffer; fall back to copy
    worker.postMessage({type:'analyze', sampleRate: audioBuffer.sampleRate, audio: sendData.slice(0)});
  }
}

// Entry points wired to existing UI -- file decode then analyze
(function init(){
  const fileInput = $('#fileInput');
  const browseBtn = $('#browseBtn');
  const dropzone = $('#dropzone');
  const analyzeBtn = $('#analyzeBtn');
  const resetBtn = $('#resetBtn');

  browseBtn.addEventListener('click', ()=> fileInput.click());
  dropzone.addEventListener('drop', e=>{ e.preventDefault(); const f = e.dataTransfer.files?.[0]; if(f) handleFile(f); });
  fileInput.addEventListener('change', e=>{ const f = e.target.files?.[0]; if(f) handleFile(f); });
  resetBtn.addEventListener('click', ()=>{ if(worker) worker.terminate(); worker = null; $('#progressShell').classList.remove('show'); $('#progressBar').style.width='0%'; resetUI(); });
  analyzeBtn.addEventListener('click', ()=>{ if(pendingBuffer) analyzeAudioBuffer(pendingBuffer); else toast('Load a track first'); });

  // playback and other UI are unchanged and handled inline in index.html's legacy code; we only wire analysis worker here

  function resetUI(){
    $('#fileInfo').style.display='none';
    $('#preUploadHelp').style.display='block';
    $('#resultsFull').style.display='none';
    $('#resultsEmpty').style.display='grid';
    $('#djxLogo').classList.remove('spinning','analyzing');
    $('#waveform').getContext('2d').clearRect(0,0,900,170);
    pendingBuffer = null;
  }

  async function handleFile(file){
    if(!file) return;
    // basic validation (same as original)
    if(!file.type.startsWith('audio/') && !/\.(mp3|wav|flac|aiff|aif|m4a|ogg|aac|mp4)$/i.test(file.name)){
      toast('Please choose an audio file.');
      return;
    }
    if(file.size > 120 * 1024 * 1024){ toast('File is larger than 120 MB — try a shorter version.'); return; }

    $('#fileName').textContent = file.name;
    $('#fileMeta').textContent = `${(file.size/1024/1024).toFixed(1)} MB • ${file.type || 'audio'}`;
    $('#fileInfo').style.display='block';
    $('#preUploadHelp').style.display='none';
    $('#resultsFull').style.display='none';
    $('#resultsEmpty').style.display='grid';

    try{
      const arrayBuf = await file.arrayBuffer();
      // decode using an AudioContext so playback still works. We'll use OfflineAudioContext for a more deterministic decode for analysis
      const ac = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 2, 44100);
      // Use the normal AudioContext decode for compatibility
      const decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decoded = await decodeCtx.decodeAudioData(arrayBuf.slice(0));
      pendingBuffer = decoded;
      $('#totalTime').textContent = formatTime(decoded.duration);
      $('#durationLabel').textContent = formatTime(decoded.duration);
      // draw waveform if original inline function exists
      if(typeof drawWaveform === 'function') drawWaveform(decoded);
      toast('Track loaded. Ready to analyze.');
      $('#djxLogo').classList.add('spinning');
    }catch(err){
      console.error(err);
      toast('Could not decode this file. Try MP3 or WAV.');
      pendingBuffer = null;
    }
  }

  function formatTime(s){ s = Math.max(0, s|0); const m=Math.floor(s/60); const sec=(s%60).toString().padStart(2,'0'); return `${m}:${sec}`; }

})();
