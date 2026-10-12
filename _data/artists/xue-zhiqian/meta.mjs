/*  meta.mjs — xue-zhiqian 的编辑层。
 *  事实在 albums-raw.json（机器可抓取、可重建），这里是唯一的手写层：
 *  歌手身份、每张专辑的标题与介绍、代表曲、年代分期、以及针对这位歌手
 *  目录数据怪癖的清洗规则。换一位歌手 = 复制本目录结构，重写这一个文件。
 *
 *  说明：TW 店目录元数据本就是繁体，kanjiFix / phraseFix 留空。
 *  《未完成的歌》为新歌加精选混合专辑，介绍里如实说明。
 */
export default {
  id: 'xue-zhiqian',
  name: '薛之謙',
  en: 'Joker Xue',
  seal: '薛',
  tagline: '錄音室專輯全集',
  taglineEn: 'Studio Albums',
  intro:
    '十二張錄音室專輯、一百三十一首作品，2006 至 2024。都會情歌與自嘲是他的兩面，寫給城市裡的深夜。',

  /* 主題層：都市夜色的霓虹紫。多數封面是黑白灰，紫色來自《未完成的歌》，
   * 在深色站上與周杰倫的朱砂明確區分。 */
  theme: {
    accent: '#81558D',
    accentOn: '#F3F0EA',
    motif: 'neon',
    heroTitle: '薛之謙'
  },

  kanjiFix: [],
  phraseFix: [],
  collabFix: [],

  heroFan: ['xue2013', 'xue2016', 'xue2020', 'xue2018', 'xue2006'],

  eras: [
    {
      key: 'start',
      from: 2006,
      to: 2009,
      title: '起步',
      en: 'The Start',
      note: '四張專輯立起寫情歌的骨架，〈認真的雪〉讓他一夜被聽見，之後是漫長的爬坡。'
    },
    {
      key: 'quiet',
      from: 2012,
      to: 2013,
      title: '沉潛',
      en: 'The Quiet Years',
      note: '事業低潮的兩張。寫作沒有停，自嘲開始進到歌裡，〈醜八怪〉正在這段時間成形。'
    },
    {
      key: 'restart',
      from: 2016,
      to: 2017,
      title: '重啟',
      en: 'The Comeback',
      note: '被重新看見之後的兩張完整陳述，〈演員〉與〈紳士〉把他推回舞台中央。'
    },
    {
      key: 'prolific',
      from: 2018,
      to: 2024,
      title: '盛產',
      en: 'The Streak',
      note: '五張專輯的穩定產出。自嘲與深情的比例、都會感的輕重，成為他最鮮明的印記。'
    }
  ],

  albums: {
    xue2006: {
      title: '薛之谦',
      alt: '同名專輯',
      en: 'Joker Xue',
      blurb:
        '2006 年的出道專輯。〈認真的雪〉把一夜傳唱寫成了起點，〈王子歸來〉與〈黃色楓葉〉立起敘事情歌的骨架。',
      signature: ['認真的雪', '王子歸來', '黃色楓葉']
    },
    xue2007: {
      title: '你过得好吗',
      alt: '',
      en: 'How Have You Been',
      blurb:
        '第二張。〈你過得好嗎〉問得雲淡風輕，〈蘇黎世的從前〉把回憶放進異國街景，情歌的畫面感在這張成形。',
      signature: ['你過得好嗎', '蘇黎世的從前']
    },
    xue2008: {
      title: '深深爱过你',
      alt: '',
      en: 'Deeply Loved You',
      blurb:
        '同名曲以前世、今生兩個版本對照收錄，是他在情歌裡最直接的一次。〈傳說〉延續敘事的野心。',
      signature: ['深深愛過你(今生)', '傳說']
    },
    xue2009: {
      title: '未完成的歌',
      alt: '新歌加精選',
      en: 'The Unfinished Song',
      blurb:
        '新歌加精選的階段性盤點。同名曲把未寫完的部分留白，出道以來的舊作一次收攏，替前四張做一個小結。',
      signature: ['未完成的歌']
    },
    xue2012: {
      title: '几个薛之谦',
      alt: '',
      en: 'Several Joker Xue',
      blurb:
        '低潮期的自問。〈幾個你〉問的是面具下的數量，〈我終於成了別人的女人〉把自嘲寫進了情歌的敘事。',
      signature: ['幾個你', '我終於成了別人的女人']
    },
    xue2013: {
      title: '意外',
      alt: '',
      en: 'Unexpected',
      blurb:
        '〈醜八怪〉讓他重新被聽見：以自嘲解構審美，溫柔又刺人。〈你還要我怎樣〉與〈方圓幾里〉接住情歌基本盤。',
      signature: ['醜八怪', '意外', '你還要我怎樣', '方圓幾里']
    },
    xue2016: {
      title: '初学者',
      alt: '',
      en: 'Beginner',
      blurb:
        '翻紅之後的第一張完整陳述。〈演員〉與〈紳士〉成為他最有辨識度的兩面，〈剛剛好〉與〈一半〉接住傳唱。',
      signature: ['演員', '紳士', '初學者', '剛剛好', '一半']
    },
    xue2017: {
      title: '渡 The Crossing',
      alt: '',
      en: 'The Crossing',
      blurb: '〈動物世界〉把寓言寫進情歌，〈高尚〉談的是姿態而非愛情，同名曲〈渡〉把整張收向彼岸。',
      signature: ['動物世界', '高尚', '渡', '像風一樣']
    },
    xue2018: {
      title: '怪咖',
      alt: '',
      en: 'Freak',
      blurb:
        '〈怪咖〉與〈摩天大樓〉延續都會感的自嘲，〈違背的青春〉回望來路，〈那是你離開了北京的生活〉把城市寫進分離。',
      signature: ['怪咖', '摩天大樓', '違背的青春', '那是你離開了北京的生活']
    },
    xue2019: {
      title: '尘',
      alt: '',
      en: 'Dust',
      blurb:
        '〈木偶人〉與〈慢半拍〉把節奏收進城市的大小聲，同名曲談的是微塵般的日常，〈笑場〉把難堪寫得輕。',
      signature: ['木偶人', '慢半拍', '笑場', '陪你去流浪']
    },
    xue2020: {
      title: '天外来物',
      alt: '',
      en: 'Something from Outer Space',
      blurb:
        '〈天外來物〉把浪漫外包給宇宙，〈把你揉碎捏成蘋果〉延續他把比喻寫大的習慣，〈紙船〉回到溫柔。',
      signature: ['天外來物', '把你揉碎捏成蘋果', '紙船']
    },
    xue2022: {
      title: '无数',
      alt: '',
      en: 'Countless',
      blurb:
        '〈無數〉與〈鳳毛麟角〉在自我懷疑裡找位置，〈洛城〉把場景搬進異地，整張維持都會抒情與自省的平衡。',
      signature: ['無數', '鳳毛麟角', '洛城']
    },
    xue2024: {
      title: '守村人',
      alt: '',
      en: 'The Village Keeper',
      blurb:
        '〈守村人〉與〈銀河少年〉把視線放回平凡人與少年氣，〈情書〉回到最樸素的告白，是近年最溫柔的一張。',
      signature: ['守村人', '銀河少年', '情書']
    }
  }
};
