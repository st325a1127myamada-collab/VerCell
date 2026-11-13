import React from 'react';
import { Play, Pause } from 'lucide-react';

interface TopBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isPlaying,
  onTogglePlay,
  activeSection,
  onNavigate
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand wordmark */}
        <a 
          href="#player" 
          onClick={(e) => {
            e.preventDefault();
            onNavigate('player');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-slate-700 transition-colors"
        >
          射的企画論
        </a>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button 
            type="button"
            onClick={() => onNavigate('player')} 
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'player' ? 'text-slate-950 font-semibold' : ''
            }`}
          >
            プレイヤー
          </button>
          <button 
            type="button"
            onClick={() => onNavigate('lyrics')} 
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'lyrics' ? 'text-slate-950 font-semibold' : ''
            }`}
          >
            歌詞表示
          </button>
          <button 
            type="button"
            onClick={() => onNavigate('settings')} 
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'settings' ? 'text-slate-950 font-semibold' : ''
            }`}
          >
            音源設定
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>一時停止</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>再生する</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
