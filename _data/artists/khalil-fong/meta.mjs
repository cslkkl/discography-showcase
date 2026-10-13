/*  meta.mjs — khalil-fong 的编辑层。
 *  事实在 albums-raw.json（机器可抓取、可重建），这里是唯一的手写层：
 *  歌手身份、每张专辑的标题与介绍、代表曲、年代分期，以及针对这位歌手
 *  目录数据怪癖的清洗规则。
 *
 *  收录范围：只收录音室专辑，共十张。同目录里另有单曲三十四张、EP 两张
 *  （iTunes Session、艾美夢遊圖畫小說 1-6）、现场五张（This Love Live 2007、
 *  Wonderland Live 2008、Timeless Concert Live 2009、15 Live in Hong Kong 2011、
 *  大事發聲.錄音棚現場）、精选一张（The Soulboy Collection），均不收。
 *  《可啦思刻》是整张翻唱自选辑，但属正式录音室专辑，按目录原貌收录，
 *  并在介绍里说明它是翻唱辑。代表曲必须与目录里的曲目名逐字一致。
 */
export default {
  id: 'khalil-fong',
  name: '方大同',
  en: 'Khalil Fong',
  seal: '方',
  tagline: '錄音室專輯全集',
  taglineEn: 'Studio Albums',
  intro:
    '十張錄音室專輯、一百二十八首作品，時間跨度 2005 至 2024。以年輪收錄完整的錄音室目錄，按年份逐張展開。',

  /* 主題層：這位歌手的視覺人格。
   * accent 取他封面上一再出現的暖赭色。十張封面各自取「暖色且飽和」的像素群
   * 加權平均後為 #CCB072，橙月的土黃與 JTW 的金黃都落在這條色帶上。
   * 明度 0.451，印深墨字 #0A0A0B 的對比為 9.44:1（WCAG 2.1 相對亮度公式）。 */
  theme: {
    accent: '#CCB072',
    accentOn: '#0A0A0B',
    motif: 'groove',
    heroTitle: '方大同'
  },

  /* 官方入口：Apple 走目錄自帶的專輯 id 直達；其餘平台為搜尋連結。 */
  listen: ['apple', 'youtube'],

  /* 目錄裡的繁體標題沒有混入日文新字體，無需單字轉正 */
  kanjiFix: [],

  /* 目錄在《愛愛愛》三首曲名尾端留了多餘空格，另有一處用半角驚嘆號 */
  phraseFix: [
    ['唉! ', '唉！'],
    ['偷笑 ', '偷笑'],
    ['詩人的情人 ', '詩人的情人']
  ],

  /* 合作者署名清洗：目錄用英文名或藝名，這裡換成通行中文名 */
  collabFix: [
    ['Tia Ray', '袁婭維'],
    ['MISS KO', '葛仲珊']
  ],

  /* 年代分期：由構建時按 from/to 過濾專輯生成，不允許引入事實以外的東西 */
  eras: [
    {
      key: 'origins',
      from: 2005,
      to: 2007,
      title: '起點',
      en: 'Origins',
      note: '三張專輯把靈魂樂與節奏藍調寫進華語流行的語法。〈春風吹〉、〈愛愛愛〉與〈Love Song〉是這一段最常被提起的三個名字。'
    },
    {
      key: 'roots',
      from: 2008,
      to: 2009,
      title: '尋根',
      en: 'Roots',
      note: '《橙月》玩起七〇年代的復古靈魂樂，《可啦思刻》則是一整張翻唱自選輯，從 Stevie Wonder、Michael Jackson 唱到王菲的〈紅豆〉。'
    },
    {
      key: 'expand',
      from: 2011,
      to: 2014,
      title: '擴張',
      en: 'Expansion',
      note: '《15》以藍調搖滾為主軸，《回到未來》回到新靈魂樂，《危險世界》則加入大量嘻哈與電子。三張專輯各自換了一套語言。'
    },
    {
      key: 'journey',
      from: 2016,
      to: 2016,
      title: '西遊',
      en: 'Journey to the West',
      note: '《JTW西遊記》是黑碟與金碟各十首的雙碟專輯，也是他自組廠牌後的第一張作品。他在第 28 屆金曲獎以此拿下最佳國語男歌手獎。'
    },
    {
      key: 'dreamer',
      from: 2024,
      to: 2024,
      title: '夢想家',
      en: 'The Dreamer',
      note: '《The Dreamer》收錄十首歌，距上一張錄音室專輯八年。2025 年獲得第 36 屆金曲獎評審團獎。'
    }
  ],

  albums: {
    khalil2005: {
      title: 'Soulboy',
      alt: '首張專輯',
      en: 'Soulboy',
      blurb:
        '2005 年 11 月發行的出道專輯，十四首歌的詞曲、編曲與製作多由他一手包辦。全輯以靈魂樂與節奏藍調為底，〈春風吹〉由周耀輝填詞，〈南音〉出自林夕之手。',
      signature: ['春風吹', '南音', '妹妹']
    },
    khalil2006: {
      title: '愛愛愛',
      alt: '',
      en: 'This Love',
      blurb:
        '2006 年 12 月發行的第二張專輯，作曲、編曲、製作與和聲由他一手包辦。〈愛愛愛〉由周耀輝填詞，〈蘇麗珍〉借《花樣年華》的角色寫拖著不說的感情，〈四人遊〉請來薛凱琪對唱。',
      signature: ['愛愛愛', '蘇麗珍', '四人遊']
    },
    khalil2007: {
      title: '未來',
      alt: '',
      en: 'Wonderland',
      blurb:
        '2007 年 12 月發行的第三張專輯，主題放在愛情與環保兩件事上，封面因此以藍色為主調。〈Love Song〉是他第一首正面書寫男女情愛的單曲，隔年入圍第 19 屆金曲獎最佳年度歌曲獎。',
      signature: ['Love Song', '夠不夠', '公園']
    },
    khalil2008: {
      title: '橙月',
      alt: '',
      en: 'Orange Moon',
      blurb:
        '2008 年 12 月發行的第四張專輯，「橙月」是他對夕陽的比喻，整張以浪漫為主調，封面選在他小時候住過的上海拍攝。〈三人遊〉的名字來自上一張的〈四人遊〉，〈Singalongsong〉則是他聽見有人說自己的歌難唱之後寫下的。',
      signature: ['如果愛', '三人遊', 'Singalongsong']
    },
    khalil2009: {
      title: '可啦思刻',
      alt: '翻唱自選輯',
      en: 'Timeless',
      blurb:
        '2009 年 8 月發行的翻唱自選輯，九首歌全部是別人的作品，從 Stevie Wonder、Michael Jackson 一路唱到王菲的〈紅豆〉與張惠妹的〈記得〉。他親自彈奏、編曲與混音，並以〈紅豆〉作為主打。',
      signature: ['紅豆', '記得']
    },
    khalil2011: {
      title: '15',
      alt: '',
      en: '15',
      blurb:
        '2011 年 4 月發行的專輯，名稱來自他十五歲開始彈吉他，整張以藍調與搖滾為主軸。〈好不容易〉拿下 2011 年度叱咤樂壇至尊歌曲大獎，專輯本身則獲得同年的至尊唱片大獎。',
      signature: ['好不容易', '因為你', '曇花']
    },
    khalil2012: {
      title: '回到未來',
      alt: '',
      en: 'Back To Wonderland',
      blurb:
        '2012 年 12 月發行的專輯，名稱與 2007 年的《未來》互相呼應，並請到 Pino Palladino 與 Chris Dave 參與。〈千紙鶴〉由方文山填詞，〈BB88〉寫的則是一個野蠻女友。',
      signature: ['千紙鶴', 'BB88', '愛立刻']
    },
    khalil2014: {
      title: '危險世界',
      alt: '',
      en: 'Dangerous World',
      blurb:
        '2014 年 4 月發行的專輯，是他成立個人錄音室之後的第一張作品，混音交由 Phil Tan 等人處理。同名曲的靈感來自 Michael Jackson，〈黑白灰〉的靈感則來自《星際大戰》的一句台詞，〈特別的人〉是其中最具他個人特色的慢板情歌。',
      signature: ['特別的人', '危險世界', '黑白灰']
    },
    khalil2016: {
      title: 'JTW西遊記',
      alt: '雙碟專輯',
      en: 'Journey to the West',
      blurb:
        '2016 年 9 月發行的雙碟專輯，黑碟與金碟各收十首，也是他自組廠牌後的第一張作品。〈悟空〉寫於十九歲，隔了十一年才收進唱片；〈Flow〉與王力宏合作，〈無所謂〉與張靚穎對唱。這張專輯讓他在第 28 屆金曲獎拿下最佳國語男歌手獎。',
      signature: ['悟空', '聽', '很不低調']
    },
    khalil2024: {
      title: 'The Dreamer',
      alt: '',
      en: 'The Dreamer',
      blurb:
        '2024 年 10 月發行的專輯，距上一張錄音室專輯八年，十首歌由他擔任製作人。〈才二十三〉是首波主打，寫的是時間與年紀；〈回留〉由崔惟楷填詞。2025 年這張專輯獲得第 36 屆金曲獎評審團獎。',
      signature: ['才二十三', '江湖中人', '回留']
    }
  }
};
