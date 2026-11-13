import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, Music, RefreshCw, Info, AlertCircle } from 'lucide-react';
import { SONG_METADATA } from '../data/lyrics';
import { validateAudioFile } from '../utils/security';

interface AudioSourceSelectorProps {
  currentSourceTitle: string;
  isCustomAudio: boolean;
  onSelectDefaultAudio: () => void;
  onCustomAudioLoaded: (sanitizedName: string, url: string) => void;
}

export const AudioSourceSelector: React.FC<AudioSourceSelectorProps> = ({
  currentSourceTitle,
  isCustomAudio,
  onSelectDefaultAudio,
  onCustomAudioLoaded
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsValidating(true);

    try {
      const file = files[0];
      const result = await validateAudioFile(file);

      if (!result.valid) {
        setErrorMessage(result.error ?? 'ファイルを読み込めませんでした。');
        return;
      }

      const url = URL.createObjectURL(file);
      onCustomAudioLoaded(result.sanitizedName ?? 'audio-file', url);
    } finally {
      setIsValidating(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">
            音源ソース設定
          </h3>
        </div>
        {isCustomAudio && (
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              onSelectDefaultAudio();
            }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>標準音源に戻す</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* Default Preloaded Track */}
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            onSelectDefaultAudio();
          }}
          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
            !isCustomAudio 
              ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900/10' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900 truncate">
                標準音源（ピアノ＆メロディ）
              </span>
              {!isCustomAudio && (
                <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-medium">
                  使用中
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {SONG_METADATA.title} · 約1分
            </p>
          </div>
          {!isCustomAudio && <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />}
        </button>

        {/* Custom Audio Upload Drag & Drop */}
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`p-3.5 rounded-xl border border-dashed transition-all cursor-pointer flex items-center justify-between ${
            isDragging 
              ? 'border-slate-900 bg-slate-100/50' 
              : isCustomAudio 
              ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900/10' 
              : 'border-slate-300 hover:border-slate-400 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm"
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
            }}
          />

          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-900 truncate">
                {isValidating
                  ? 'ファイルを検証中...'
                  : isCustomAudio
                  ? currentSourceTitle
                  : '自分の音声ファイルを読み込む'}
              </span>
              {isCustomAudio && !isValidating && (
                <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-medium">
                  使用中
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              ドラッグ＆ドロップ または クリックして選択（最大50MB）
            </p>
          </div>
          {isCustomAudio && <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-3 flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>
          オリジナルの録音音源やボーカル音源をお持ちの場合、ドラッグ＆ドロップで差し替えて同期再生できます（端末内のみで処理され外部送信されません）。
        </span>
      </div>
    </div>
  );
};
