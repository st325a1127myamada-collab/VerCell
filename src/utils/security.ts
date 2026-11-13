export const MAX_AUDIO_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.m4a',
  '.aac',
  '.ogg',
  '.flac',
  '.webm',
] as const;

export const ALLOWED_PLAYBACK_RATES = [0.8, 1.0, 1.2, 1.5] as const;

export interface AudioValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

/**
 * Sanitizes a user-supplied filename by removing path traversal sequences,
 * control characters, bidirectional override characters, and excessive length.
 */
export function sanitizeFileName(rawName: string): string {
  const baseName = rawName.split(/[/\\]/).pop() ?? 'audio';
  // Remove control characters (C0/C1) and Unicode bidi overrides (e.g. U+202E)
  const cleaned = baseName
    .replace(/[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/\.\.+/g, '.')
    .trim();

  if (!cleaned) return 'audio-file';
  return cleaned.length > 80 ? `${cleaned.slice(0, 77)}...` : cleaned;
}

/**
 * Checks the leading bytes of a file against known audio container magic numbers
 * so spoofed HTML/SVG/script files renamed to .mp3 cannot be loaded.
 */
function hasValidAudioMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;

  // MP3 with ID3v2 tag: "ID3"
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return true;
  }

  // MP3 / AAC ADTS frame sync: 0xFF 0xE0 mask
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return true;
  }

  // WAV / RIFF: "RIFF" .... "WAVE"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return true;
  }

  // OGG: "OggS"
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return true;
  }

  // FLAC: "fLaC"
  if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
    return true;
  }

  // MP4 / M4A / AAC container: "ftyp" at offset 4
  if (
    bytes.length >= 8 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return true;
  }

  // WebM / Matroska EBML header: 0x1A 0x45 0xDF 0xA3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return true;
  }

  return false;
}

/**
 * Performs comprehensive validation (size, extension, MIME, magic-byte header)
 * on a user-selected audio file before creating a Blob URL.
 */
export async function validateAudioFile(file: File): Promise<AudioValidationResult> {
  if (!file) {
    return { valid: false, error: 'ファイルが選択されていません。' };
  }

  if (file.size === 0) {
    return { valid: false, error: '空のファイルは読み込めません。' };
  }

  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'ファイルサイズが大きすぎます（上限50MB）。',
    };
  }

  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = ALLOWED_AUDIO_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );
  const hasAllowedMime =
    file.type === '' || file.type.startsWith('audio/') || file.type === 'video/mp4';

  if (!hasAllowedExtension && !file.type.startsWith('audio/')) {
    return {
      valid: false,
      error: '対応している音声ファイル（mp3, wav, m4a, aac, ogg, flac, webm）を選択してください。',
    };
  }

  if (!hasAllowedMime) {
    return {
      valid: false,
      error: '不正なファイル形式（MIMEタイプ）です。',
    };
  }

  try {
    const headerBuffer = await file.slice(0, 16).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);
    if (!hasValidAudioMagicBytes(headerBytes)) {
      return {
        valid: false,
        error: 'ファイル内容が有効な音声フォーマットとして認識できませんでした。',
      };
    }
  } catch {
    return {
      valid: false,
      error: 'ファイルの検証中にエラーが発生しました。',
    };
  }

  return {
    valid: true,
    sanitizedName: sanitizeFileName(file.name),
  };
}

/**
 * Ensures audio src URLs are strictly safe relative paths or same-origin blob URLs.
 */
export function isSafeAudioSrc(src: string): boolean {
  if (!src) return false;
  if (src.startsWith('/audio/') && !src.includes('..')) {
    return true;
  }
  if (src.startsWith('blob:')) {
    try {
      const parsed = new URL(src);
      return parsed.protocol === 'blob:' && parsed.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Clamps numeric playback values to safe finite bounds.
 */
export function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}
