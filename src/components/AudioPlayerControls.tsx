import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Gauge,
  Mic,
  MicOff
} from 'lucide-react';

interface AudioPlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  playbackRate: number;
  speechAssistEnabled: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleLoop: () => void;
  onChangePlaybackRate: (rate: number) => void;
  onToggleSpeechAssist: () => void;
  onSkipTime: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isLooping,
  playbackRate,
  speechAssistEnabled,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleLoop,
  onChangePlaybackRate,
  onToggleSpeechAssist,
  onSkipTime,
}) => {
  const [isHoveringSeek, setIsHoveringSeek] = useState(false);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const safeDuration = duration > 0 ? duration : 60.5;
  const progressPercent = Math.min(100, (currentTime / safeDuration) * 100);

  const handleSeekMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverSeekTime(pos * safeDuration);
    setHoverX(e.clientX - rect.left);
  };

  const speedOptions = [0.8, 1.0, 1.2, 1.5];

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs">
      {/* Seekbar and Timeline */}
      <div className="mb-4">
        <div 
          className="relative h-6 flex items-center cursor-pointer group"
          onMouseEnter={() => setIsHoveringSeek(true)}
          onMouseLeave={() => {
            setIsHoveringSeek(false);
            setHoverSeekTime(null);
          }}
          onMouseMove={handleSeekMouseMove}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onSeek(pos * safeDuration);
          }}
        >
          {/* Track background */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden transition-all group-hover:h-2">
            <div 
              className="h-full bg-slate-900 rounded-full relative transition-[width] duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Scrubber thumb */}
          <div 
            className="absolute -ml-2 w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow-xs transition-transform group-hover:scale-125"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Hover timestamp tooltip */}
          {isHoveringSeek && hoverSeekTime !== null && (
            <div 
              className="absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-white text-[11px] font-mono rounded shadow-md pointer-events-none whitespace-nowrap"
              style={{ left: `${hoverX}px` }}
            >
              {formatTime(hoverSeekTime)}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="flex justify-between items-center text-xs text-slate-500 font-mono tabular-nums px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-400">·</span>
          <span>{formatTime(safeDuration)}</span>
        </div>
      </div>

      {/* Control Buttons Grid */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Secondary Controls: Loop & Playback Speed */}
        <div className="flex items-center gap-1.5 w-full md:w-auto justify-start">
          {/* Loop toggle */}
          <button
            type="button"
            onClick={onToggleLoop}
            className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              isLooping 
                ? 'bg-slate-100 text-slate-900 font-semibold' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title={isLooping ? 'リピートON' : 'リピートOFF'}
            aria-label="リピート切り替え"
          >
            <Repeat className="w-4 h-4" />
            <span className="text-[11px] hidden sm:inline">リピート</span>
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200/60">
            {speedOptions.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => onChangePlaybackRate(rate)}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  playbackRate === rate
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Vocal / Speech Assist Toggle */}
          <button
            type="button"
            onClick={onToggleSpeechAssist}
            className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              speechAssistEnabled
                ? 'bg-amber-50 text-amber-900 border border-amber-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title="歌詞の日本語音声アシスト（Web Speech API）"
          >
            {speechAssistEnabled ? <Mic className="w-4 h-4 text-amber-700" /> : <MicOff className="w-4 h-4" />}
            <span className="text-[11px] hidden sm:inline">音声アシスト</span>
          </button>
        </div>

        {/* Center Primary Controls: Skip back, Play/Pause, Skip forward */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSkipTime(-10)}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer active:scale-95"
            title="10秒戻る"
            aria-label="10秒戻る"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onPlayPause}
            className="w-13 h-13 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all shadow-sm cursor-pointer"
            title={isPlaying ? '一時停止 (Space)' : '再生 (Space)'}
            aria-label={isPlaying ? '一時停止' : '再生'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSkipTime(10)}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer active:scale-95"
            title="10秒進む"
            aria-label="10秒進む"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right Controls: Volume Slider & Mute */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={onToggleMute}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title={isMuted ? 'ミュート解除 (M)' : 'ミュート (M)'}
            aria-label="ミュート切り替え"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <div className="w-24 flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full"
              aria-label="音量調節"
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400 w-8 tabular-nums">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
