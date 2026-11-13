import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, audioRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioRef.current || analyserRef.current) return;

    const setupAudioContext = () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;

        if (audioRef.current) {
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(ctx.destination);
          
          audioContextRef.current = ctx;
          analyserRef.current = analyser;
          sourceRef.current = source;
        }
      } catch (err) {
        // Fallback to simulated animation if MediaElementSource is already connected or restricted
        console.warn('AudioContext setup fallback:', err);
      }
    };

    const handleFirstPlay = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      } else if (!analyserRef.current) {
        setupAudioContext();
      }
    };

    const el = audioRef.current;
    el.addEventListener('play', handleFirstPlay);
    return () => {
      el.removeEventListener('play', handleFirstPlay);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close().catch(() => {});
      }
    };
  }, [audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let simPhase = 0;
    const dataArray = new Uint8Array(32);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 24;
      const barWidth = 3;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < barCount; i++) {
        let val = 0;
        if (isPlaying) {
          if (analyserRef.current && dataArray[i] > 0) {
            val = (dataArray[i] / 255) * height * 0.9;
          } else {
            // Simulated gentle harmonic wave based on beat
            simPhase += 0.002;
            const wave = Math.sin(simPhase * 5 + i * 0.4) * 0.5 + 0.5;
            const wave2 = Math.cos(simPhase * 2 + i * 0.2) * 0.3;
            val = Math.max(4, (wave + wave2) * height * 0.7);
          }
        } else {
          val = 3; // resting baseline
        }

        const barHeight = Math.max(3, val);
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        // Minimalist slate monochrome bars
        ctx.fillStyle = isPlaying ? 'rgba(30, 41, 59, 0.75)' : 'rgba(203, 213, 225, 0.6)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="flex items-center justify-center h-10 w-full max-w-[280px] px-2 py-1 bg-slate-50/80 border border-slate-100 rounded-lg">
      <canvas
        ref={canvasRef}
        width={260}
        height={32}
        className="w-full h-8"
        aria-hidden="true"
      />
    </div>
  );
};
