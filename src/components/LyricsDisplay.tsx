import React, { useEffect, useRef, useState } from 'react';
import { LyricLine } from '../data/lyrics';
import { Play, Copy, Check, Eye, AlignLeft, ArrowDown } from 'lucide-react';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  isPlaying: boolean;
  onSeekToLyric: (startTime: number) => void;
}

type LyricViewMode = 'sync' | 'plain';
type FontSize = 'sm' | 'md' | 'lg';

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  lyrics,
  currentTime,
  isPlaying,
  onSeekToLyric,
}) => {
  const [viewMode, setViewMode] = useState<LyricViewMode>('sync');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [copied, setCopied] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Find active line index
  const activeIndex = lyrics.findIndex(
    (line) => currentTime >= line.startTime && currentTime < line.endTime
  );

  // Auto-scroll when active line changes in 'sync' mode (if user hasn't scrolled away manually)
  useEffect(() => {
    if (viewMode !== 'sync' || userScrolled) return;
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, viewMode, userScrolled]);

  const handleCopyLyrics = async () => {
    const text = lyrics.map((l) => l.text).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-base';
      case 'lg':
        return 'text-2xl';
      case 'md':
      default:
        return 'text-lg md:text-xl';
    }
  };

  const formatLyricTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 md:p-7 shadow-xs flex flex-col h-[520px]">
      {/* Header bar: Mode Tabs + Action tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => {
              setViewMode('sync');
              setUserScrolled(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'sync'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>リアルタイム同期</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('plain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'plain'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>全文テキスト</span>
          </button>
        </div>

        {/* Right tools: Font size & Copy */}
        <div className="flex items-center gap-2">
          {/* Font size toggles */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-150">
            <button
              type="button"
              onClick={() => setFontSize('sm')}
              className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                fontSize === 'sm' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500'
              }`}
              title="文字サイズ：小"
            >
              小
            </button>
            <button
              type="button"
              onClick={() => setFontSize('md')}
              className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                fontSize === 'md' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500'
              }`}
              title="文字サイズ：中"
            >
              中
            </button>
            <button
              type="button"
              onClick={() => setFontSize('lg')}
              className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                fontSize === 'lg' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500'
              }`}
              title="文字サイズ：大"
            >
              大
            </button>
          </div>

          {/* Copy Lyrics */}
          <button
            type="button"
            onClick={handleCopyLyrics}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            title="歌詞をコピー"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'コピー完了' : '歌詞コピー'}</span>
          </button>
        </div>
      </div>

      {/* Lyrics Content Container */}
      <div 
        ref={containerRef}
        onWheel={() => {
          if (viewMode === 'sync') setUserScrolled(true);
        }}
        onTouchMove={() => {
          if (viewMode === 'sync') setUserScrolled(true);
        }}
        className="flex-1 overflow-y-auto pt-6 pb-12 pr-2 scroll-smooth focus:outline-none"
        tabIndex={0}
      >
        {/* Sync Mode */}
        {viewMode === 'sync' && (
          <div className="space-y-6">
            {lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = currentTime >= line.endTime;

              return (
                <div
                  key={line.id}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => {
                    onSeekToLyric(line.startTime);
                    setUserScrolled(false);
                  }}
                  className={`group relative rounded-xl p-3 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-50/90 border border-slate-200/80 shadow-xs translate-x-1'
                      : 'hover:bg-slate-50/50 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {/* Japanese lyric text */}
                      <p
                        className={`font-medium tracking-wide transition-colors leading-relaxed ${getFontSizeClass()} ${
                          isActive
                            ? 'text-slate-950 font-bold'
                            : isPast
                            ? 'text-slate-400'
                            : 'text-slate-600'
                        }`}
                      >
                        {line.text}
                      </p>

                      {/* Romaji subtext */}
                      {line.subtext && (
                        <p className={`text-xs mt-1 transition-colors ${
                          isActive ? 'text-slate-500' : 'text-slate-400/80'
                        }`}>
                          {line.subtext}
                        </p>
                      )}
                    </div>

                    {/* Time indicator and play icon */}
                    <div className="flex items-center gap-1.5 shrink-0 pt-1">
                      <span className="text-[11px] font-mono tabular-nums text-slate-400">
                        {formatLyricTime(line.startTime)}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isActive ? 'bg-slate-900 text-white' : 'text-slate-400 group-hover:text-slate-800'
                      }`}>
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Plain Text Mode */}
        {viewMode === 'plain' && (
          <div className="max-w-xl mx-auto py-4 space-y-5">
            <div className="text-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">射的企画論</h3>
              <p className="text-xs text-slate-500 mt-1">作詞・作曲：オリジナル</p>
            </div>
            {lyrics.map((line) => (
              <p
                key={line.id}
                className={`leading-loose tracking-wide text-slate-700 ${getFontSizeClass()}`}
              >
                {line.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Floating Resume Auto-Scroll Button */}
      {viewMode === 'sync' && userScrolled && (
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setUserScrolled(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-sm transition-all animate-bounce cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>再生位置の歌詞に戻る</span>
          </button>
        </div>
      )}
    </div>
  );
};
