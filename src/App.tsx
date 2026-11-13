import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SONG_METADATA, LYRICS } from './data/lyrics';
import { InitialPlayModal } from './components/InitialPlayModal';
import { TopBar } from './components/TopBar';
import { AudioPlayerControls } from './components/AudioPlayerControls';
import { LyricsDisplay } from './components/LyricsDisplay';
import { AudioSourceSelector } from './components/AudioSourceSelector';
import { AudioVisualizer } from './components/AudioVisualizer';

export default function App() {
  const [showInitialModal, setShowInitialModal] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(SONG_METADATA.duration);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [speechAssistEnabled, setSpeechAssistEnabled] = useState(false);
  
  // Audio source state
  const [audioSrc, setAudioSrc] = useState<string>('/audio/song.mp3');
  const [currentSourceTitle, setCurrentSourceTitle] = useState<string>(SONG_METADATA.title);
  const [isCustomAudio, setIsCustomAudio] = useState(false);
  const [activeSection, setActiveSection] = useState('player');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenLineRef = useRef<number | null>(null);

  // Initialize audio properties
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.loop = isLooping;
    }
  }, [volume, playbackRate, isLooping]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      window.speechSynthesis?.cancel();
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  }, [isPlaying]);

  // Web Speech API sync helper (if speechAssistEnabled)
  useEffect(() => {
    if (!speechAssistEnabled || !isPlaying) return;

    const currentLine = LYRICS.find(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );

    if (currentLine && currentLine.id !== 0 && currentLine.id !== lastSpokenLineRef.current) {
      lastSpokenLineRef.current = currentLine.id;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentLine.text);
        utterance.lang = 'ja-JP';
        utterance.rate = playbackRate * 1.05;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [currentTime, speechAssistEnabled, isPlaying, playbackRate]);

  // Audio element events
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
      lastSpokenLineRef.current = null;
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      lastSpokenLineRef.current = null;
      if (speechAssistEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleSkipTime = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      handleSeek(newTime);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (isMuted && vol > 0) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (audioRef.current) {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      audioRef.current.muted = nextMuted;
    }
  };

  const handleToggleLoop = () => {
    setIsLooping((prev) => !prev);
  };

  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleToggleSpeechAssist = () => {
    setSpeechAssistEnabled((prev) => {
      const next = !prev;
      if (!next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  // Switch to custom uploaded audio file
  const handleCustomAudioLoaded = (file: File, url: string) => {
    setAudioSrc(url);
    setCurrentSourceTitle(file.name);
    setIsCustomAudio(true);
    setCurrentTime(0);
    lastSpokenLineRef.current = null;
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 150);
  };

  // Revert back to built-in audio
  const handleSelectDefaultAudio = () => {
    setAudioSrc('/audio/song.mp3');
    setCurrentSourceTitle(SONG_METADATA.title);
    setIsCustomAudio(false);
    setCurrentTime(0);
    lastSpokenLineRef.current = null;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is focusing input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkipTime(-5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkipTime(5);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, isMuted]);

  // Initial modal acceptance
  const handleConfirmPlayFromModal = () => {
    setShowInitialModal(false);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleDismissModal = () => {
    setShowInitialModal(false);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 flex flex-col font-sans selection:bg-slate-200">
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        preload="metadata"
      />

      {/* Initial Welcome Modal prompting user to play */}
      <InitialPlayModal
        isOpen={showInitialModal}
        onPlay={handleConfirmPlayFromModal}
        onDismiss={handleDismissModal}
      />

      {/* Top Bar Navigation */}
      <TopBar
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10">
        
        {/* Hero Section: Album Card + Player & Lyrics Split */}
        <section id="player" className="scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (5 cols): Cover Art, Track Info, Visualizer, Main Controls */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Cover Art and Metadata Container */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-5 border border-slate-150">
                  <img
                    src={SONG_METADATA.coverImage}
                    alt={SONG_METADATA.title}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Playing pill overlay */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-xs border border-slate-200/60 text-xs font-medium text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span>{isPlaying ? '再生中' : '停止中'}</span>
                  </div>
                </div>

                {/* Track Metadata */}
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span>{SONG_METADATA.genre}</span>
                    <span aria-hidden="true">·</span>
                    <span>{SONG_METADATA.year}</span>
                    <span aria-hidden="true">·</span>
                    <span>1:00</span>
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
                    {currentSourceTitle}
                  </h1>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {SONG_METADATA.subtitle}
                  </p>
                </div>

                {/* Minimalist Audio Visualizer */}
                <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 font-medium">
                    オーディオ波形
                  </div>
                  <AudioVisualizer isPlaying={isPlaying} audioRef={audioRef} />
                </div>
              </div>

              {/* Player Controls Container */}
              <AudioPlayerControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                isLooping={isLooping}
                playbackRate={playbackRate}
                speechAssistEnabled={speechAssistEnabled}
                onPlayPause={togglePlay}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                onToggleMute={handleToggleMute}
                onToggleLoop={handleToggleLoop}
                onChangePlaybackRate={handleChangePlaybackRate}
                onToggleSpeechAssist={handleToggleSpeechAssist}
                onSkipTime={handleSkipTime}
              />
            </div>

            {/* Right Column (7 cols): Interactive Lyrics Display */}
            <div id="lyrics" className="lg:col-span-7 scroll-mt-20">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    歌詞タイムライン
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    行をクリックすると該当秒数にジャンプします
                  </p>
                </div>
              </div>

              <LyricsDisplay
                lyrics={LYRICS}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onSeekToLyric={handleSeek}
              />
            </div>

          </div>
        </section>

        {/* Audio Source Switcher Section */}
        <section id="settings" className="scroll-mt-20 pt-4">
          <AudioSourceSelector
            currentSourceTitle={currentSourceTitle}
            isCustomAudio={isCustomAudio}
            onSelectDefaultAudio={handleSelectDefaultAudio}
            onCustomAudioLoaded={handleCustomAudioLoaded}
          />
        </section>

      </main>

      {/* Clean, minimalist footer */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">射的企画論</span>
            <span aria-hidden="true">·</span>
            <span>シンプルオーディオプレイヤー</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>スペースキー：再生/一時停止</span>
            <span aria-hidden="true">·</span>
            <span>左右キー：5秒送り</span>
            <span aria-hidden="true">·</span>
            <span>M：ミュート</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
