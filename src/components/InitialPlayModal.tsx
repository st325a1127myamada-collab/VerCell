import React from 'react';
import { Play, VolumeX, Music, Sparkles } from 'lucide-react';
import { SONG_METADATA } from '../data/lyrics';

interface InitialPlayModalProps {
  isOpen: boolean;
  onPlay: () => void;
  onDismiss: () => void;
}

export const InitialPlayModal: React.FC<InitialPlayModalProps> = ({
  isOpen,
  onPlay,
  onDismiss
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-slate-100 rounded-full text-slate-800">
          <Music className="w-6 h-6" />
        </div>

        <div className="text-center mb-6">
          <h2 id="modal-title" className="text-xl font-bold text-slate-900 tracking-tight mb-2">
            音楽を再生しますか？
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            「{SONG_METADATA.title}」のピアノ旋律と、タイムラインに同期した歌詞表示をお楽しみいただけます。
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl mb-6 flex items-center gap-3">
          <img 
            src={SONG_METADATA.coverImage} 
            alt={SONG_METADATA.title}
            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900 truncate">
              {SONG_METADATA.title}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {SONG_METADATA.subtitle} · 1:00
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onPlay}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-xl transition-all shadow-xs whitespace-nowrap cursor-pointer"
            autoFocus
          >
            <Play className="w-4 h-4 fill-white" />
            <span>音楽を再生する</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 rounded-xl transition-all whitespace-nowrap cursor-pointer"
          >
            <VolumeX className="w-4 h-4 text-slate-400" />
            <span>静かに開く</span>
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          画面内のプレイヤー操作でいつでも再生・一時停止・音量調節が可能です
        </p>
      </div>
    </div>
  );
};
