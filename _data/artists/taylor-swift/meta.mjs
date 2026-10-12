/*  meta.mjs — taylor-swift 的编辑层。
 *  事实在 albums-raw.json（机器可抓取、可重建），这里是唯一的手写层。
 *
 *  说明：目录元数据为英文（TW 店），无假名/新字体问题，kanjiFix 留空。
 *  只收錄原始錄音室專輯；Taylor's Version 重錄版不是新專輯，不收錄。
 *  代表曲必须与目录里的曲目名逐字一致（含大小写与省略号）。
 *  名字用她的英文名，不另取中文譯名。
 */
export default {
  id: 'taylor-swift',
  name: 'Taylor Swift',
  en: 'Taylor Swift',
  seal: 'T',
  tagline: '錄音室專輯全集',
  taglineEn: 'Studio Albums',
  intro:
    '十二張原始錄音室專輯、一百七十四首作品，2006 至 2025。從鄉村敘事到流行再到虛構民謠，重錄版不收錄。',

  /* 主題層：Midnights 的午夜靛藍。深色站上安穩，與朱砂、霓虹紫都拉開距離。 */
  theme: {
    accent: '#56679F',
    accentOn: '#F3F0EA',
    motif: 'midnight',
    heroTitle: 'Taylor Swift'
  },

  kanjiFix: [],
  phraseFix: [],
  collabFix: [],

  heroFan: ['ts2014', 'ts2020a', 'ts2025', 'ts2008', 'ts2022'],

  eras: [
    {
      key: 'country',
      from: 2006,
      to: 2008,
      title: '鄉村起點',
      en: 'Country Beginnings',
      note: '兩張鄉村專輯。把日記寫成歌的敘事天賦在這裡現形，主流市場從〈Love Story〉開始認得她。'
    },
    {
      key: 'crossover',
      from: 2010,
      to: 2012,
      title: '轉向流行',
      en: 'The Crossover',
      note: '〈Red〉記錄鄉村與流行之間的裂縫，〈All Too Well〉成為她寫作被反覆討論的標竿。'
    },
    {
      key: 'pop',
      from: 2014,
      to: 2017,
      title: '全面流行',
      en: 'Full Pop',
      note: '〈1989〉完成流行轉身，〈reputation〉轉而處理名聲、反擊與重生。'
    },
    {
      key: 'folklore',
      from: 2019,
      to: 2020,
      title: '民謠與色彩',
      en: 'Folklore & Colour',
      note: '〈Lover〉回到明亮的色彩，〈folklore〉與〈evermore〉在疫情間轉進虛構敘事，一連兩張。'
    },
    {
      key: 'midnight',
      from: 2022,
      to: 2025,
      title: '午夜之後',
      en: 'After Midnight',
      note: '從〈Midnights〉的深夜自省，到詩集般的長篇，再到舞台燈光下的自我陳述。'
    }
  ],

  albums: {
    ts2006: {
      title: 'Taylor Swift',
      alt: '同名專輯',
      en: 'Taylor Swift',
      blurb:
        '2006 年的出道專輯。〈Tim McGraw〉用一首歌紀念一段夏天，〈Our Song〉與〈Teardrops On My Guitar〉立起鄉村敘事的起點。',
      signature: ['Tim McGraw', 'Our Song', 'Picture To Burn']
    },
    ts2008: {
      title: 'Fearless',
      alt: '',
      en: 'Fearless',
      blurb:
        '讓她跨進主流的專輯。〈Love Story〉與〈You Belong With Me〉接連傳唱，〈The Best Day〉把鏡頭轉向母親。',
      signature: ['Love Story', 'You Belong With Me', 'Fifteen', 'The Best Day']
    },
    ts2010: {
      title: 'Speak Now',
      alt: '',
      en: 'Speak Now',
      blurb:
        '全專輯由她獨立作詞作曲。〈Enchanted〉與〈Back to December〉兩端拉扯，〈Long Live〉是寫給同路人的頌歌。',
      signature: ['Mine', 'Enchanted', 'Back to December', 'Long Live', 'Speak Now']
    },
    ts2012: {
      title: 'Red',
      alt: '',
      en: 'Red',
      blurb:
        '鄉村與流行之間的裂縫被寫成顏色。〈All Too Well〉成為她寫作的標竿，〈I Knew You Were Trouble〉與〈22〉撐起流行面。',
      signature: [
        'Red',
        'I Knew You Were Trouble',
        'All Too Well',
        '22',
        'Begin Again',
        'State of Grace'
      ]
    },
    ts2014: {
      title: '1989',
      alt: '',
      en: '1989',
      blurb:
        '正式的流行轉身。〈Blank Space〉把媒體寫她的劇本自己演一遍，〈Style〉與〈Out of the Woods〉構成整張的合成器骨架。',
      signature: ['Blank Space', 'Style', 'Shake It Off', 'Out of the Woods', 'Welcome To New York']
    },
    ts2017: {
      title: 'reputation',
      alt: '',
      en: 'reputation',
      blurb:
        '沉寂一年的反擊之作。〈Look What You Made Me Do〉直面風暴，〈Delicate〉與〈New Year’s Day〉在灰暗裡留下柔軟的角落。',
      signature: [
        '...Ready For It?',
        'Delicate',
        'Look What You Made Me Do',
        'Getaway Car',
        'New Year’s Day'
      ]
    },
    ts2019: {
      title: 'Lover',
      alt: '',
      en: 'Lover',
      blurb:
        '重新敞亮的專輯。〈Cruel Summer〉成為傳唱最久的遺珠，〈Lover〉與〈Paper Rings〉把承諾寫得具體，〈The Archer〉自我剖白。',
      signature: ['Lover', 'Cruel Summer', 'The Man', 'The Archer', 'Paper Rings']
    },
    ts2020a: {
      title: 'folklore',
      alt: '',
      en: 'folklore',
      blurb:
        '疫情期間寫成的虛構敘事專輯。以第三人格造了一座小鎮與三角習題，〈cardigan〉與〈exile〉定下整張的灰調。',
      signature: ['cardigan', 'the 1', 'august', 'this is me trying', 'peace']
    },
    ts2020b: {
      title: 'evermore',
      alt: 'folklore 的姊妹作',
      en: 'evermore',
      blurb:
        '五個月後的姊妹作。〈willow〉與〈champagne problems〉延續虛構敘事，〈long story short〉是給自己的收束。',
      signature: ['willow', 'champagne problems', 'tolerate it', 'long story short', 'ivy']
    },
    ts2022: {
      title: 'Midnights',
      alt: '',
      en: 'Midnights',
      blurb:
        '十三個失眠夜的自我審視。〈Anti-Hero〉把自嘲寫到極大聲，〈Karma〉與〈Lavender Haze〉在合成器裡夜遊。',
      signature: ['Anti-Hero', 'Karma', 'Lavender Haze', 'Midnight Rain', 'Mastermind']
    },
    ts2024: {
      title: 'The Tortured Poets Department',
      alt: '',
      en: 'The Tortured Poets Department',
      blurb:
        '長篇的詩集式專輯。〈Fortnight〉開場，〈So Long, London〉與〈loml〉處理離別，〈Down Bad〉把心碎誇張成失重。',
      signature: [
        'Fortnight (feat. Post Malone)',
        'Down Bad',
        'So Long, London',
        'loml',
        'Who’s Afraid of Little Old Me?'
      ]
    },
    ts2025: {
      title: 'The Life of a Showgirl',
      alt: '',
      en: 'The Life of a Showgirl',
      blurb:
        '巡演之後寫下的舞台後台。同名曲請來 Sabrina Carpenter 合唱，〈The Fate of Ophelia〉與〈Opalite〉把燈光調亮。',
      signature: [
        'The Fate of Ophelia',
        'Opalite',
        'Elizabeth Taylor',
        'Father Figure',
        'CANCELLED!'
      ]
    }
  }
};
