/*  meta.mjs — terry-lin 的编辑层。
 *  事实在 albums-raw.json（机器可抓取、可重建），这里是唯一的手写层。
 *
 *  说明：录音室专辑收录（含两张翻唱专辑《擦聲而過》與《擦聲而過Ⅱ》）；
 *  《單身情歌.超炫精選》为新歌加精选混合，按目录原貌收录并在介绍里说明；
 *  《ONEtake 2.0》为一次收音的现场录音专辑，是他艺术人格的核心，破例收录并如实说明。
 *  精選《至情志炫》《Terry Lin Classics》與豪華典藏版重發不收。
 *  代表曲必须与目录里的曲目名逐字一致。
 */
export default {
  id: 'terry-lin',
  name: '林志炫',
  en: 'Terry Lin',
  seal: '林',
  tagline: '錄音室專輯全集',
  taglineEn: 'Studio Albums',
  intro: '十張錄音室專輯、一百二十六首作品，1997 至 2020。一把清亮的嗓子，把現場唱成錄音室的水準。',

  /* 主題層：青瓷色。他的聲線清亮乾淨，青瓷是這個氣質的顏色。
   * 明度約 0.58，印深墨字。 */
  theme: {
    accent: '#7FA895',
    accentOn: '#08080A',
    motif: 'aria',
    heroTitle: '純淨之聲'
  },

  kanjiFix: [],
  phraseFix: [],
  collabFix: [],

  heroFan: ['lin1998', 'lin2020', 'lin2001', 'lin1997', 'lin2005a'],

  eras: [
    {
      key: 'solo',
      from: 1997,
      to: 1999,
      title: '單飛',
      en: 'Going Solo',
      note: '離開優客李林後的三年四張。〈散了吧〉與〈蒙娜麗莎的眼淚〉立起單飛後的聲音形象。'
    },
    {
      key: 'cover',
      from: 2001,
      to: 2005,
      title: '翻唱與熟成',
      en: 'Covers & Maturity',
      note: '兩張擦聲而過把別人的歌唱成自己的，〈熟情歌〉與〈原聲之旅〉則交出成熟期的創作與重錄。'
    },
    {
      key: 'onetake',
      from: 2008,
      to: 2020,
      title: '一次收音',
      en: 'One Take',
      note: '把「一次唱完」變成方法論的十二年。〈ONEtake 2.0〉是這套美學的完整答案。'
    }
  ],

  albums: {
    lin1997: {
      title: '散了吧',
      alt: '單飛首張',
      en: 'Let It Go',
      blurb: '單飛後的第一張。同名曲與〈懂事〉把離別與體面唱得克制，〈暗戀你〉是暗湧的深情。',
      signature: ['散了吧', '懂事', '暗戀你']
    },
    lin1998: {
      title: '蒙娜麗莎的眼淚',
      alt: '',
      en: 'Tears of Mona Lisa',
      blurb:
        '他傳唱度最高的一張。同名曲把名畫請進情歌，〈Coming Home〉的溫度與〈冬〉的清冷兩極並存。',
      signature: ['蒙娜麗莎的眼淚', 'Coming Home', '這就是愛']
    },
    lin1999a: {
      title: 'True Live 林志炫',
      alt: '',
      en: 'True Live',
      blurb: '強調真實收音的一張。〈每天想你一遍〉與〈默契〉延續水準，〈剛剛好〉把分寸感寫進情歌。',
      signature: ['每天想你一遍', '剛剛好', '默契']
    },
    lin1999b: {
      title: '單身情歌.超炫精選',
      alt: '新歌加精選',
      en: 'Single Love Song',
      blurb:
        '新歌加精選。同名曲〈單身情歌〉成為他最廣為人知的作品，精選部分一次收攏單飛前三張的精華。',
      signature: ['單身情歌', '認錯', '我也不想這樣']
    },
    lin2001: {
      title: '擦聲而過',
      alt: '翻唱專輯',
      en: 'Voices Passing By',
      blurb:
        '第一張翻唱輯。〈離人〉成為比原唱更流傳的版本，〈花房姑娘〉與〈野百合也有春天〉都被他的嗓子重新上色。',
      signature: ['離人', '花房姑娘', '野百合也有春天', '愛情釀的酒']
    },
    lin2002: {
      title: '時間的味道',
      alt: '',
      en: 'The Taste of Time',
      blurb: '同名曲把時間唱成味覺，〈心上〉與〈只為你唱〉溫柔收尾，是原創與翻唱之外的第三條路。',
      signature: ['時間的味道', '心上', '只為你唱']
    },
    lin2005a: {
      title: '熟情歌',
      alt: '',
      en: 'Mature Love Songs',
      blurb:
        '写给成熟年纪的情歌。〈鱷魚的眼淚〉反諷，〈我們還是朋友嗎〉誠實，〈鳳凰花開的路口〉成為畢業季的固定曲目。',
      signature: ['鱷魚的眼淚', '熟男情歌', '鳳凰花開的路口', '我們還是朋友嗎']
    },
    lin2005b: {
      title: '原聲之旅',
      alt: '',
      en: 'Acoustic Journey',
      blurb:
        '原聲樂器編制的重訪之旅。〈輸了你 贏了世界又如何〉與〈出嫁〉以更素的面貌重唱，比原版更見嗓子。',
      signature: ['輸了你 贏了世界又如何', '出嫁', '走了', '漂鳥']
    },
    lin2008: {
      title: '擦聲而過Ⅱ',
      alt: '翻唱專輯',
      en: 'Voices Passing By II',
      blurb:
        "翻唱輯第二彈，挑戰全面升級。〈She's Gone (中文版)〉的搖滾高音、〈沒離開過〉的長句推進，都是他的招牌考題。",
      signature: ["She's Gone (中文版)", '沒離開過', '落葉歸根', '離歌']
    },
    lin2020: {
      title: 'ONEtake 2.0',
      alt: '一次收音現場',
      en: 'ONEtake 2.0',
      blurb:
        '把「一次唱完」做成專輯。十三首現場一次收音，〈Writing’s On The Wall〉與〈Feeling Good〉零修音呈現，是这套美学的完整答案。',
      signature: ['Writing’s On The Wall', 'Feeling Good', 'Somebody To Love', '瞬間永恆']
    }
  }
};
