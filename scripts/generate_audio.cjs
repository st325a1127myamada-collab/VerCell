const fs = require('fs');
const { execSync } = require('child_process');

const SAMPLE_RATE = 44100;
const DURATION = 60.5; // ~60 seconds
const numSamples = Math.floor(SAMPLE_RATE * DURATION);

const left = new Float32Array(numSamples);
const right = new Float32Array(numSamples);

function noteFreq(name) {
  const notes = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };
  let pitch, octave;
  if (name.length === 2) {
    pitch = name[0];
    octave = parseInt(name[1], 10);
  } else {
    pitch = name.slice(0, 2);
    octave = parseInt(name.slice(2), 10);
  }
  const semitone = notes[pitch] + (octave - 4) * 12 - 9;
  return 440.0 * Math.pow(2.0, semitone / 12.0);
}

function addNote(freq, startSec, durationSec, velocity = 0.5, pan = 0.0, isMelody = false) {
  const startIdx = Math.floor(startSec * SAMPLE_RATE);
  const noteSamples = Math.floor(durationSec * SAMPLE_RATE);
  const endIdx = Math.min(numSamples, startIdx + noteSamples);
  if (startIdx >= numSamples) return;

  const harmonics = isMelody ? [
    [1.0, 0.8, 1.0],
    [2.0, 0.45, 1.4],
    [3.0, 0.22, 1.8],
    [4.0, 0.1, 2.4]
  ] : [
    [1.0, 1.0, 1.2],
    [2.0, 0.55, 1.8],
    [3.0, 0.32, 2.5],
    [4.0, 0.18, 3.2],
    [5.0, 0.1, 4.0]
  ];

  const decayRate = isMelody ? 1.5 : 1.1;
  const lGain = Math.sqrt(0.5 * (1.0 - pan)) * velocity;
  const rGain = Math.sqrt(0.5 * (1.0 + pan)) * velocity;

  const twoPi = Math.PI * 2.0;

  for (let i = startIdx; i < endIdx; i++) {
    const t = (i - startIdx) / SAMPLE_RATE;
    let env;
    if (t < 0.006) {
      env = t / 0.006;
    } else {
      env = Math.exp(-decayRate * (t - 0.006) / Math.max(0.2, durationSec * 0.7));
    }

    let sample = 0;
    for (let h = 0; h < harmonics.length; h++) {
      const hNum = harmonics[h][0];
      const hAmp = harmonics[h][1];
      const hDecay = harmonics[h][2];
      const hFreq = freq * hNum;
      if (hFreq < 18000) {
        sample += hAmp * env * Math.exp(-hDecay * t) * Math.sin(twoPi * hFreq * t);
      }
    }

    left[i] += sample * lGain;
    right[i] += sample * rGain;
  }
}

const tempo = 84.0;
const beat = 60.0 / tempo; // ~0.714s

function playArpeggio(bassNote, chordNotes, startTime, duration) {
  addNote(noteFreq(bassNote), startTime, duration * 0.95, 0.45, -0.2);
  const step = beat * 0.5;
  for (let i = 0; i < chordNotes.length; i++) {
    const t = startTime + i * step;
    if (t < startTime + duration) {
      addNote(noteFreq(chordNotes[i]), t, (duration - i * step) * 0.9, 0.28, 0.15);
    }
  }
}

// Intro (0s - 12.8s)
playArpeggio('F2', ['F3', 'A3', 'C4', 'F4'], 0.0, beat * 4);
playArpeggio('E2', ['G3', 'C4', 'E4', 'G4'], beat * 4, beat * 4);
playArpeggio('D2', ['F3', 'A3', 'C4', 'F4'], beat * 8, beat * 4);
playArpeggio('Bb1', ['D3', 'F3', 'Bb3', 'D4'], beat * 12, beat * 2);
playArpeggio('C2', ['E3', 'G3', 'C4', 'E4'], beat * 14, beat * 2);

const introMelody = [
  ['A4', 0.5, beat * 1.5],
  ['C5', 0.5 + beat * 1.5, beat * 1.5],
  ['F5', 0.5 + beat * 3.0, beat * 2.0],
  ['E5', 0.5 + beat * 5.0, beat * 1.5],
  ['C5', 0.5 + beat * 6.5, beat * 1.5],
  ['D5', 0.5 + beat * 8.0, beat * 2.0],
  ['C5', 0.5 + beat * 10.0, beat * 1.0],
  ['A4', 0.5 + beat * 11.0, beat * 1.0],
  ['Bb4', 0.5 + beat * 12.0, beat * 1.5],
  ['G4', 0.5 + beat * 13.5, beat * 1.5],
  ['F4', 0.5 + beat * 15.0, beat * 2.2],
];
introMelody.forEach(([n, st, dur]) => addNote(noteFreq(n), st, dur, 0.35, 0.08, true));

// Song sections chords
const sectionChords = [
  ['F2', ['A3', 'C4', 'F4'], 12.8, 2.8],
  ['E2', ['G3', 'C4', 'E4'], 15.6, 2.8],
  ['D2', ['F3', 'A3', 'C4'], 18.5, 3.2],
  ['A1', ['E3', 'A3', 'C4'], 21.7, 2.6],
  ['Bb1', ['D3', 'F3', 'Bb3'], 24.3, 2.8],
  ['C2', ['E3', 'G3', 'C4'], 27.1, 2.8],
  ['A1', ['E3', 'G3', 'C4'], 29.9, 2.4],
  ['D2', ['F3', 'A3', 'D4'], 32.3, 2.2],
  ['G1', ['D3', 'F3', 'Bb3'], 34.5, 2.8],
  ['C2', ['E3', 'Bb3', 'C4'], 37.3, 3.2],
  ['F2', ['A3', 'C4', 'F4'], 40.5, 3.2],
  ['Bb1', ['D3', 'F3', 'Bb3'], 43.7, 2.8],
  ['C2', ['E3', 'G3', 'C4'], 46.5, 2.8],
  ['A1', ['E3', 'A3', 'C4'], 49.3, 2.6],
  ['D2', ['F3', 'A3', 'D4'], 51.9, 2.6],
  ['G1', ['D3', 'G3', 'Bb3'], 54.5, 2.6],
  ['C2', ['E3', 'G3', 'Bb3', 'C4'], 57.1, 2.0],
  ['F2', ['A3', 'C4', 'F4'], 59.1, 2.0],
];
sectionChords.forEach(([bass, chord, st, dur]) => playArpeggio(bass, chord, st, dur));

// Vocal melody
const vocalMelody = [
  ['C4', 13.0, 0.4], ['F4', 13.4, 0.4], ['G4', 13.8, 0.4], ['A4', 14.2, 0.4],
  ['A4', 14.6, 0.3], ['G4', 14.9, 0.3], ['F4', 15.2, 0.4],
  ['G4', 15.7, 0.4], ['A4', 16.1, 0.4], ['Bb4', 16.5, 0.4], ['A4', 16.9, 0.4],
  ['G4', 17.3, 0.4], ['F4', 17.7, 0.6],
  ['A4', 19.3, 0.4], ['A4', 19.7, 0.3], ['Bb4', 20.0, 0.4], ['C5', 20.4, 0.5],
  ['Bb4', 20.9, 0.4], ['A4', 21.3, 0.5],
  ['G4', 22.0, 0.35], ['G4', 22.35, 0.35], ['A4', 22.7, 0.35], ['Bb4', 23.05, 0.4],
  ['A4', 23.45, 0.4], ['G4', 23.85, 0.5],
  ['F4', 24.5, 0.4], ['E4', 24.9, 0.4], ['F4', 25.3, 0.4], ['G4', 25.7, 0.5], ['F4', 26.2, 0.6],
  ['A4', 27.2, 0.4], ['Bb4', 27.6, 0.4], ['C5', 28.0, 0.5], ['D5', 28.5, 0.5],
  ['C5', 29.2, 0.4], ['Bb4', 29.6, 0.4], ['A4', 30.0, 0.4], ['G4', 30.4, 0.5],
  ['F4', 31.2, 0.4], ['G4', 31.6, 0.4], ['A4', 32.0, 0.8],
  ['A4', 34.6, 0.4], ['Bb4', 35.0, 0.4], ['C5', 35.4, 0.5], ['A4', 35.9, 0.4],
  ['G4', 36.3, 0.4], ['F4', 36.7, 0.6],
  ['A4', 38.3, 0.35], ['Bb4', 38.65, 0.35], ['C5', 39.0, 0.45], ['C5', 39.45, 0.4],
  ['D5', 39.85, 0.4], ['C5', 40.25, 0.5],
  ['Bb4', 41.2, 0.4], ['A4', 41.6, 0.4], ['G4', 42.0, 0.4], ['F4', 42.4, 0.8],
  ['A4', 44.2, 0.4], ['Bb4', 44.6, 0.4], ['C5', 45.0, 0.5], ['D5', 45.5, 0.4],
  ['C5', 46.2, 0.4], ['Bb4', 46.6, 0.4], ['A4', 47.0, 0.4], ['G4', 47.4, 0.5],
  ['F4', 49.2, 0.35], ['G4', 49.55, 0.35], ['A4', 49.9, 0.4], ['Bb4', 50.3, 0.5],
  ['C5', 51.0, 0.35], ['C5', 51.35, 0.35], ['D5', 51.7, 0.4], ['C5', 52.1, 0.4], ['Bb4', 52.5, 0.4],
  ['A4', 54.0, 0.5], ['G4', 54.5, 0.6],
  ['A4', 55.6, 0.35], ['Bb4', 55.95, 0.35], ['C5', 56.3, 0.5], ['D5', 56.8, 0.4],
  ['C5', 57.4, 0.35], ['Bb4', 57.75, 0.35], ['A4', 58.1, 0.4], ['G4', 58.5, 0.4],
  ['F4', 58.9, 0.9]
];
vocalMelody.forEach(([n, st, dur]) => addNote(noteFreq(n), st, dur, 0.42, 0.0, true));

// Normalization
let maxAmp = 0;
for (let i = 0; i < numSamples; i++) {
  const al = Math.abs(left[i]);
  const ar = Math.abs(right[i]);
  if (al > maxAmp) maxAmp = al;
  if (ar > maxAmp) maxAmp = ar;
}

const scale = maxAmp > 0.01 ? (0.88 / maxAmp) : 1;

// Build WAV header + PCM
const dataLen = numSamples * 4;
const buffer = Buffer.alloc(44 + dataLen);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataLen, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
buffer.writeUInt16LE(1, 20);  // audioFormat (1 for PCM)
buffer.writeUInt16LE(2, 22);  // numChannels (2)
buffer.writeUInt32LE(SAMPLE_RATE, 24); // sampleRate
buffer.writeUInt32LE(SAMPLE_RATE * 4, 28); // byteRate
buffer.writeUInt16LE(4, 32);  // blockAlign
buffer.writeUInt16LE(16, 34); // bitsPerSample
buffer.write('data', 36);
buffer.writeUInt32LE(dataLen, 40);

let offset = 44;
for (let i = 0; i < numSamples; i++) {
  const l = Math.max(-32767, Math.min(32767, Math.round(left[i] * scale * 32767)));
  const r = Math.max(-32767, Math.min(32767, Math.round(right[i] * scale * 32767)));
  buffer.writeInt16LE(l, offset);
  buffer.writeInt16LE(r, offset + 2);
  offset += 4;
}

fs.writeFileSync('public/audio/song.wav', buffer);
console.log('WAV written, size:', buffer.length);

try {
  execSync('ffmpeg -y -i public/audio/song.wav -b:a 192k public/audio/song.mp3');
  console.log('Converted to MP3 successfully!');
} catch (e) {
  console.error('ffmpeg conversion error:', e);
}
