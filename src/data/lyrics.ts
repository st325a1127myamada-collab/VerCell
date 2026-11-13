export interface LyricLine {
  id: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
  subtext?: string;  // romaji or explanation
  note?: string;     // commentary on festival shooting stall context
}

export interface SongMetadata {
  title: string;
  subtitle: string;
  artist: string;
  duration: number; // 60.5
  genre: string;
  year: string;
  coverImage: string;
  description: string;
}

export const SONG_METADATA: SongMetadata = {
  title: "射的企画論",
  subtitle: "文化祭模擬店と予算の哀歌",
  artist: "オリジナル楽曲",
  duration: 60.5,
  genre: "Acoustic Pop / Story Ballad",
  year: "2026",
  coverImage: "/src/assets/images/album_cover_shateki_1792128203446.jpg",
  description: "文化祭の射的模擬店を巡るリアルな葛藤を、どこか懐かしく温かなピアノ旋律に乗せて歌い上げたショートストーリーソング。"
};

export const LYRICS: LyricLine[] = [
  {
    id: 0,
    startTime: 0.0,
    endTime: 12.8,
    text: "（イントロ - 穏やかなピアノの音色）",
    subtext: "Intro - Gentle Piano Prelude",
    note: "どこか懐かしい学園祭の準備期間を想起させるピアノソロ。"
  },
  {
    id: 1,
    startTime: 12.8,
    endTime: 18.8,
    text: "射的行ってみてください よろしくお願いします",
    subtext: "Shateki itte mite kudasai, yoroshiku onegaishimasu",
    note: "文化祭の通りで道行く人に声をかける、少し控えめで丁寧な呼び込みの声。"
  },
  {
    id: 2,
    startTime: 18.8,
    endTime: 26.8,
    text: "なんて呼び込んでも あまり効果はないと 落ち込む日々に",
    subtext: "Nante yobikondemo amari kouka wa nai to, ochikomu hibi ni",
    note: "熱意とは裏腹に、なかなか客足が伸びないもどかしさと切なさ。"
  },
  {
    id: 3,
    startTime: 26.8,
    endTime: 33.8,
    text: "打ち込むのは コルク玉ではなく 企画論",
    subtext: "Uchikomu no wa koruku-dama dewa naku, kikakuron",
    note: "銃でコルク玉を放つのではなく、頭と時間をひたすら企画書へと注ぎ込む言葉遊び。"
  },
  {
    id: 4,
    startTime: 33.8,
    endTime: 37.8,
    text: "景品はお菓子のみ",
    subtext: "Keihin wa okashi nomi",
    note: "豪華な賞品は用意できず、駄菓子を中心とした親しみやすいラインナップ。"
  },
  {
    id: 5,
    startTime: 37.8,
    endTime: 43.8,
    text: "でも経費が重なる予感 さようなら予算",
    subtext: "Demo keihi ga kasanaru yokan, sayounara yosan",
    note: "看板・装飾・的の製作費が膨らみ、当初の予算枠が儚く消えゆく現実。"
  },
  {
    id: 6,
    startTime: 43.8,
    endTime: 48.8,
    text: "ゲーム性は前年と変わらずにあるので",
    subtext: "Geemu-sei wa zennen to kawarazu ni aru node",
    note: "定番のコルク銃と倒れる的。安定のルールだからこそ大きな変更は加えず。"
  },
  {
    id: 7,
    startTime: 48.8,
    endTime: 54.8,
    text: "意外と早くに決定した企画論の部分",
    subtext: "Igai to hayaku ni kettei shita kikakuron no bubun",
    note: "大枠の企画自体はすんなり決まったものの、本当に大変なのはこの先だった。"
  },
  {
    id: 8,
    startTime: 54.8,
    endTime: 60.5,
    text: "球拾いの問題改善しないまま",
    subtext: "Tamahiroi no mondai kaizen shinai mama",
    note: "射的のコルク玉拾いの運用が未改善のまま本番を迎える余韻。"
  }
];
