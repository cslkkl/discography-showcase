/*  meta.mjs — jacky-cheung 的编辑层。
 *  事实在 albums-raw.json（机器可抓取、可重建），这里是唯一的手写层。
 *
 *  说明：粤语与国语录音室专辑都收录；现场、演唱会、精選、合輯與復刻重發不收
 *  （復黑王系列的《祗願一生愛一人》《似曾相識》是该专辑在目录里的唯一版本，按原专辑收录）。
 *  《黑與白》为新歌加精选混合，介绍里如实说明。
 *  代表曲必须与目录里的曲目名逐字一致。
 */
export default {
  id: 'jacky-cheung',
  name: '張學友',
  en: 'Jacky Cheung',
  seal: '張',
  tagline: '錄音室專輯全集',
  taglineEn: 'Studio Albums',
  intro:
    '四十張錄音室專輯、四百三十三首作品，1985 至 2014。粵語與國語雙線並行，從出道到歌神的完整年輪。',

  /* 主題層：香檳金。他的封面近半是暖金色，像頒獎禮的燈光。
   * 明度 0.63，印深墨字。 */
  theme: {
    accent: '#D79C36',
    accentOn: '#08080A',
    motif: 'spotlight',
    heroTitle: '歌神'
  },

  kanjiFix: [],
  phraseFix: [],
  collabFix: [],

  heroFan: ['cheung1993a', 'cheung1997b', 'cheung2010', 'cheung1992b', 'cheung1985'],

  eras: [
    {
      key: 'start',
      from: 1985,
      to: 1988,
      title: '起步',
      en: 'The Start',
      note: '出道頭四年的八張。〈Smile Again 瑪莉亞〉與〈太陽星辰〉讓香港記住了這把聲音。'
    },
    {
      key: 'turn',
      from: 1989,
      to: 1991,
      title: '蛻變',
      en: 'The Turn',
      note: '事業低潮後的三年六張，〈每天愛你多一些〉在 1991 年把他送上頂峰的門口。'
    },
    {
      key: 'peak',
      from: 1992,
      to: 1995,
      title: '頂峰',
      en: 'The Peak',
      note: '四大天王年代。〈吻別〉的銷量紀錄、〈分手總要在雨天〉與〈餓狼傳說〉並存，粵語國語兩線全開。'
    },
    {
      key: 'classic',
      from: 1996,
      to: 2000,
      title: '雋永',
      en: 'The Classics',
      note: '五年的七張。〈忘記你我做不到〉與〈心如刀割〉持續產出國語經典，〈愛是永恆〉把音樂劇帶進專輯。'
    },
    {
      key: 'mature',
      from: 2001,
      to: 2014,
      title: '千禧之後',
      en: 'After 2000',
      note: '節奏放慢的九張。爵士、即興與人生況味，〈她來聽我的演唱會〉之後他唱的是時間。'
    }
  ],

  albums: {
    cheung1985: {
      title: 'Smile',
      alt: '出道專輯',
      en: 'Smile',
      blurb:
        '1985 年的出道專輯。〈Smile Again 瑪莉亞〉與〈輕撫你的臉〉讓新人張學友一夜之間被聽見。',
      signature: ['Smile Again 瑪莉亞', '輕撫你的臉', '情已逝']
    },
    cheung1986a: {
      title: '情無四歸',
      alt: '國語',
      en: 'Exiled in Love',
      blurb: '第一張國語專輯。〈月半彎〉與〈穿過妳的黑髮的我的手〉把粵語時期的聲勢帶進台灣市場。',
      signature: ['月半彎 (國)', '穿過妳的黑髮的我的手', '每次都想呼喊你的名字']
    },
    cheung1986b: {
      title: 'Amour / 遙遠的她',
      alt: '',
      en: 'Amour',
      blurb:
        '〈遙遠的她〉成為他第一首現象級粵語情歌，〈月半彎〉的溫度與〈霸王別姬〉的戲曲嘗試同框。',
      signature: ['遙遠的她', '月半彎', 'Amour']
    },
    cheung1986c: {
      title: '相愛',
      alt: '',
      en: 'In Love',
      blurb: '〈藍雨〉與〈別戀〉接連成為金曲，〈飛機師的風衣〉延續他把場景寫進情歌的路數。',
      signature: ['藍雨', '別戀', '飛機師的風衣']
    },
    cheung1987a: {
      title: '在我心深處',
      alt: '',
      en: 'Deep in My Heart',
      blurb: '同名曲與〈藍雨〉國語版並收，是他早期把心事寫進歌名的一張。',
      signature: ['在我心深處', '藍雨', '思念 ~ 台北之歌']
    },
    cheung1987b: {
      title: 'Jacky',
      alt: '',
      en: 'Jacky',
      blurb: '〈太陽星辰〉確立他一線歌手的位置，〈夜深〉與〈沉默的眼睛〉是深夜情歌的定式。',
      signature: ['太陽星辰', '夜深', '沉默的眼睛']
    },
    cheung1987c: {
      title: '意亂情迷',
      alt: '國語為主',
      en: 'Mesmerized',
      blurb:
        '以 Jacky 的國語版本為基底混編，〈太陽星辰〉〈沉默的眼睛〉都有國語面貌，另收〈昨日情〉等新作。',
      signature: ['太陽星辰', '沉默的眼睛', '昨日情']
    },
    cheung1988: {
      title: '昨夜夢魂中',
      alt: '',
      en: 'Last Night in Dream',
      blurb: '銷量低潮的一年。同名曲把失意唱得漂亮，〈天變地變情不變〉是這張的亮色。',
      signature: ['昨夜夢魂中', '天變地變情不變']
    },
    cheung1989a: {
      title: '給我親愛的',
      alt: '',
      en: 'For My Dear',
      blurb: '回穩的一張。同名曲重回情歌正軌，〈Linda〉輕快，〈仍是會喜歡你〉收得溫柔。',
      signature: ['給我親愛的', 'Linda', '仍是會喜歡你']
    },
    cheung1989b: {
      title: '祗願一生愛一人',
      alt: '',
      en: 'Only Want to Love One',
      blurb: '〈夕陽醉了〉與同名曲讓他走出低潮，這是蛻變前夜的最後一張粵語專輯。',
      signature: ['祇願一生愛一人', '夕陽醉了', '忘情冷雨夜']
    },
    cheung1990a: {
      title: '似曾相識',
      alt: '國語',
      en: 'Deja Vu',
      blurb: '國語專輯。〈似曾相識〉與〈晚安,吾愛〉在台灣立穩腳跟，為之後的吻別時代鋪路。',
      signature: ['似曾相識', '晚安,吾愛', '最深的承諾']
    },
    cheung1990b: {
      title: '夢中的你',
      alt: '',
      en: 'You in the Dream',
      blurb: '〈李香蘭〉成為傳世金曲，〈再度重遇妳〉與電影主題曲〈人間道〉展現粵語歌的敘事厚度。',
      signature: ['李香蘭', '夢中的妳', '再度重遇妳']
    },
    cheung1991a: {
      title: '一顆不變心',
      alt: '',
      en: 'An Unchanged Heart',
      blurb: '同名曲穩坐年榜，〈壯志驕陽〉熱血，〈道道道〉是電影《倩女幽魂III》的俠氣。',
      signature: ['一顆不變心', '壯志驕陽', '道道道']
    },
    cheung1991b: {
      title: '情不禁',
      alt: '',
      en: "Can't Help Falling",
      blurb: '〈每天愛你多一些〉從這裡唱起，成為他傳唱度最高的作品，也把他推上頂峰年代。',
      signature: ['每天愛你多一些', '情不禁(粵)', '馬路英雄']
    },
    cheung1992a: {
      title: '愛.火.花',
      alt: '',
      en: 'Love. Spark.',
      blurb: '〈還是覺得你最好〉成為粵語情歌的標準答案，〈你是我今生唯一傳奇〉接住深情的一面。',
      signature: ['還是覺得你最好', '愛.火.花', '你是我今生唯一傳奇']
    },
    cheung1992b: {
      title: '真情流露',
      alt: '',
      en: 'True Expression',
      blurb:
        '頂峰年代的粵語之作。〈分手總要在雨天〉與〈相思風雨中〉兩首金曲同框，〈紅葉舞秋山〉俠骨。',
      signature: ['分手總要在雨天', '相思風雨中', '暗戀你', '紅葉舞秋山']
    },
    cheung1993a: {
      title: '吻別',
      alt: '國語',
      en: 'Goodbye Kiss',
      blurb:
        '華語唱片銷量的里程碑。〈吻別〉〈一路上有你〉〈秋意濃〉三首成經典，國語市場自此沒有對手。',
      signature: ['吻別', '情網', '一路上有你', '秋意濃', '每天愛你多一些']
    },
    cheung1993b: {
      title: '祝褔',
      alt: '國語',
      en: 'Blessings',
      blurb: '吻別之後的接力。〈祝福〉把離別寫成祝願，〈回頭太難〉是KTV時代的國歌級作品。',
      signature: ['祝福', '回頭太難', '情到深處']
    },
    cheung1993c: {
      title: '我與你',
      alt: '',
      en: 'You and I',
      blurb: '〈祗想一生跟你走〉是這張的心臟，〈等你等到我心痛〉與〈忘記他〉補足粵語戰線。',
      signature: ['祗想一生跟你走', '等你等到我心痛', '忘記他', '舊情綿綿']
    },
    cheung1994a: {
      title: '偷心',
      alt: '國語',
      en: 'Steal My Heart',
      blurb: '同名曲把「偷」字寫出溫度，〈別問〉與〈你冷得像風〉維持國語情歌的高水位。',
      signature: ['偷心', '別問', '你冷得像風']
    },
    cheung1994b: {
      title: '這個冬天不太冷',
      alt: '',
      en: 'Warm This Winter',
      blurb: '〈我等到花兒也謝了〉成為年度金曲，〈望月〉與〈野貓之戀〉一柔一野。',
      signature: ['我等到花兒也謝了', '這個冬天不太冷', '望月', '野貓之戀']
    },
    cheung1994c: {
      title: '餓狼傳說',
      alt: '',
      en: 'Legend of the Wolf',
      blurb: '他最「熱」的一張。同名曲的野性與〈來來回回〉的流暢，證明情歌之王也能唱搖滾。',
      signature: ['餓狼傳說', '來來回回', '當愛變成習慣', '非常夏日']
    },
    cheung1995a: {
      title: '擁友',
      alt: '國語',
      en: 'A Friend in Embrace',
      blurb: '〈情願〉與〈人在雨中〉延續國語高峰，〈潮水的諾言〉把諾言寫進潮汐。',
      signature: ['擁有', '情願', '人在雨中', '潮水的諾言']
    },
    cheung1995b: {
      title: '過敏世界',
      alt: '',
      en: 'Allergic World',
      blurb: '〈離開以後〉拿下年獎，〈這麼近(那麼遠)〉是都市疏離感的極致，同名曲戲謔世界。',
      signature: ['過敏世界', '離開以後', '這麼近(那麼遠)', '剎那愛']
    },
    cheung1996: {
      title: '忘記你我做不到',
      alt: '國語',
      en: "Can't Forget You",
      blurb: '國語黃金期的延續。同名曲與〈情書〉〈慢慢〉三連，是那個年代失恋歌的標配。',
      signature: ['忘記你我做不到', '情書', '慢慢', '左右為難']
    },
    cheung1997a: {
      title: '想和你去吹吹風',
      alt: '國語',
      en: 'Take a Walk in the Wind',
      blurb: '同名曲吹散了情歌的沉重，〈三天兩夜〉與〈台北不是傷心地〉把場景寫回城市。',
      signature: ['想和你去吹吹風', '三天兩夜', '台北不是傷心地']
    },
    cheung1997b: {
      title: '不老的傳說',
      alt: '',
      en: 'Everlasting Legend',
      blurb: '音樂劇《雪狼湖》的歌曲先行收錄。〈愛是永恆〉成為他粵語作品裡最莊重的一首。',
      signature: ['愛是永恆', '不老的傳說', '怎麼捨得你', '原來只要共你活一天']
    },
    cheung1998a: {
      title: '釋放自已',
      alt: '',
      en: 'Set Myself Free',
      blurb: '〈頭髮亂了〉玩節奏布吉，同名曲談釋懷，〈One Shining Moment〉留下英文的閃光。',
      signature: ['釋放自已', '頭髮亂了', 'One Shining Moment', '想哭']
    },
    cheung1998b: {
      title: '不後悔',
      alt: '國語',
      en: 'No Regret',
      blurb: '〈深海〉〈不後悔〉與對唱〈你最珍貴〉同張，〈離人〉後來被林志炫唱成另一個經典。',
      signature: ['不後悔', '深海', '你最珍貴', '離人']
    },
    cheung1999a: {
      title: '有個人',
      alt: '',
      en: 'Someone',
      blurb: '千禧年前的粵語之作。同名曲安定，〈寂寞的男人〉與〈逃亡〉寫成年男性的心事。',
      signature: ['有個人', '我應該', '寂寞的男人', '逃亡']
    },
    cheung1999b: {
      title: '走過1999',
      alt: '',
      en: 'Through 1999',
      blurb: '〈心如刀割〉與〈她來聽我的演唱會〉雙金曲，後者成為他演唱會上萬人合唱的固定橋段。',
      signature: ['心如刀割', '她來聽我的演唱會', '你好毒', '走過1999']
    },
    cheung2000: {
      title: 'Touch Of Love',
      alt: '',
      en: 'Touch of Love',
      blurb: '英文專輯實驗。〈Touch Of Love〉與〈Every Time A Good Time〉證明他的聲線不吃語言。',
      signature: ['Touch Of Love', 'Every Time A Good Time', 'Lost Christmas', 'Corazon de Melao']
    },
    cheung2001a: {
      title: '天下第一流',
      alt: '',
      en: 'Top Notch',
      blurb: '同名曲自嘲式幽默，〈有病呻吟〉與〈失戀事小〉把都市人的小情緒寫得舉重若輕。',
      signature: ['天下第一流', '有病呻吟', '失戀事小', '樓上來的聲音']
    },
    cheung2001b: {
      title: '學友.熱',
      alt: '',
      en: 'Hot',
      blurb: '〈如果這都不算愛〉與〈我真的受傷了〉兩首日後被無數人翻唱的作品同在這張。',
      signature: ['如果這都不算愛', '我真的受傷了', '天氣這麼熱', '算命']
    },
    cheung2002: {
      title: '他在那裡',
      alt: '',
      en: 'He Is There',
      blurb: '〈相愛很難〉與梅豔芳的對唱成為絕響級合作，同名曲與〈日與夜〉維持水準。',
      signature: ['他在那裡', '相愛很難', '咖啡', '日與夜']
    },
    cheung2004a: {
      title: '黑與白',
      alt: '新曲加精選',
      en: 'Black & White',
      blurb: '新歌加精選的階段總結。〈黑白畫映〉等新作領銜，〈她來聽我的演唱會〉等舊作重新收錄。',
      signature: ['黑白畫映', '我不明白', 'Sorry', '忘了哭']
    },
    cheung2004b: {
      title: 'Life Is Like a Dream',
      alt: '',
      en: 'Life Is Like a Dream',
      blurb: '參與創作比例最高的一張。〈給朋友〉寫給離世的朋友，同名曲把人生唱成半夢半醒。',
      signature: ['Life Is Like a Dream', '給朋友', '講妳知', '慢條斯理']
    },
    cheung2007: {
      title: '在你身邊',
      alt: '',
      en: 'By Your Side',
      blurb: '〈好久不見〉成為又一首街頭金曲，同名曲溫厚，〈煩惱歌〉難得地輕快。',
      signature: ['在你身邊', '好久不見', '聽天由命', '煩惱歌']
    },
    cheung2010: {
      title: 'Private Corner',
      alt: '',
      en: 'Private Corner',
      blurb: '爵士專輯。〈迷你〉〈十二個音〉把粵語流行唱進爵士和聲，是他晚期最具音樂性的一張。',
      signature: ['迷你', 'Double Trouble', '不只有缘', '十二個音']
    },
    cheung2014: {
      title: 'Wake Up Dreaming',
      alt: '',
      en: 'Wake Up Dreaming',
      blurb:
        '目前最後一張錄音室專輯。〈用餘生去愛〉與〈時間有淚〉唱的是時間本身，〈我醒著做夢〉回望初心。',
      signature: ['用餘生去愛', '時間有淚', '我醒著做夢', '白自在']
    }
  }
};
