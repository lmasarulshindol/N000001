// 泡児島ノベルゲーム - プロローグ＆港到着シナリオ
// 「新しくはじめる」選択時に再生

const PROLOGUE_SCRIPT = [
    // --- プロローグ ---
    {
        phase: 'prologue',
        background: 'ship',
        text: '――ここは、九州のはるか南に浮かぶ人工島、「泡児島」。\n通称、子作り観光特区。',
        speaker: ''
    },
    {
        phase: 'prologue',
        background: 'ship',
        text: '出生率が限界まで落ち込んだこの国が、最後の賭けとして建設した楽園。\n表向きは、どこにでもある南国リゾートだ。',
        speaker: ''
    },
    {
        phase: 'prologue',
        background: 'ship',
        text: 'あなたは会員証を胸ポケットにしまい、初めてその岸壁へ向かう。\n船の汽笛が、遠い陸地に別れを告げる。',
        speaker: ''
    },

    // --- 船上・島が見える ---
    {
        phase: 'arrival',
        background: 'ship',
        text: '高速船「ISLA NOVA」のデッキに立つ。\n白い船体が陽光を反射し、潮風が頬を叩いた。',
        speaker: ''
    },
    {
        phase: 'arrival',
        background: 'ship',
        text: '乗客は皆、男たちだ。誰も目を合わせない。\n互いの存在を認めたくないのか、認めれば自分が何をしに行くのか直視しなければならないからか。',
        speaker: ''
    },
    {
        phase: 'arrival',
        background: 'sea',
        text: 'ふと顔を上げると、水平線の上に白い輪郭が浮かんでいた。\n泡児島――',
        speaker: ''
    },
    {
        phase: 'arrival',
        background: 'sea',
        text: '白い砂浜が弧を描き、ヤシの木が風に揺れる。\nガラス張りのホテルが輝き、海はターコイズブルーに光っている。\nどこから見ても、完璧な楽園だ。',
        speaker: ''
    },
    {
        phase: 'arrival',
        background: 'sea',
        text: 'その美しさと、この船の目的地が示す現実とのあいだで、胸の奥がざわつく。\nそれでも、あなたはデッキの手すりから、島に近づいていく。',
        speaker: ''
    },

    // --- 港着・ターミナル ---
    {
        phase: 'arrival',
        background: 'terminal',
        text: '船がゆっくりと桟橋にすれて止まった。\nドアが開くと、湿った熱気と南国の花の香りが一気に流れ込む。',
        speaker: ''
    },
    {
        phase: 'arrival',
        background: 'terminal',
        text: 'あなたは胸の会員証を見つめた。\n名前――{playerName}。\nこの島で、新しい自分が始まる気がした。',
        speaker: ''
    },
    {
        phase: 'arrival',
        background: 'terminal',
        text: '白い大理石の床、ガラス張りの天井。\n空調の効いた涼しい空間に、ボサノバが静かに流れている。\nまるで、国際空港の到着ロビーのようだ。',
        speaker: ''
    },

    // --- 女の子たちのお出迎え ---
    {
        phase: 'welcome',
        background: 'terminal',
        text: '出口の先で、少女たちが笑顔を向けていた。\n水着やミニ浴衣姿。年齢は十代前半――どう見ても子どもたちだ。',
        speaker: ''
    },
    {
        phase: 'welcome',
        background: 'terminal',
        characterId: 'minagi',
        speaker: '渡真利海凪',
        text: 'やっほー！　いらっしゃーい！\nあたし、渡真利海凪！　みんなはみーちゃんって呼ぶよ！\nおにーさん、はじめて？'
    },
    {
        phase: 'welcome',
        background: 'terminal',
        characterId: 'kokoa',
        speaker: '天野ここあ',
        text: 'はじめまして〜！　ここあだよ！\n初めてのお客さん？　だったらあたしたちが島のことなんでも教えてあげる！'
    },
    {
        phase: 'welcome',
        background: 'terminal',
        characterId: 'hinata',
        speaker: '柚木ひなた',
        text: 'よう来たな。柚木ひなたや。\nええ顔してはるやん。ほな、楽しんでいってな。'
    },
    {
        phase: 'welcome',
        background: 'terminal',
        characterId: 'sakura',
        hideCharacter: false,
        speaker: '白石さくら',
        text: 'あの……ようこそ、泡児島へ……\n白石さくら、です……\n初めての方でも、大丈夫ですから……'
    },
    {
        phase: 'welcome',
        background: 'terminal',
        characterId: 'aoi',
        speaker: '星野あおい',
        text: '星野あおい。よろしく。\n緊張しなくていいわ。この島は、笑顔のためにあるの。'
    },
    {
        phase: 'welcome',
        background: 'terminal',
        characterId: 'miyu',
        speaker: '南条みゆ',
        text: 'ようこそばい！　南条みゆっちゅうもんやけど、みゆでええよ。\nのんびりしていってね。'
    },
    {
        phase: 'welcome',
        background: 'terminal',
        characterId: 'rin',
        speaker: '月島りん',
        text: 'おにーさん、元気そうじゃん！　月島りん！\n海とか泳ぐの、得意だから一緒に遊ぼうよ！'
    },
    {
        phase: 'welcome',
        background: 'terminal',
        characterId: 'nagisa',
        speaker: '島田なぎさ',
        text: '島田なぎさ。ようこそ。\n初日は無理しなくていい。あなたのペースで、島を味わって。'
    },
    {
        phase: 'welcome',
        background: 'terminal',
        hideCharacter: true,
        text: '少女たちの声が、ロビーに弾んでいく。\n天真爛漫な笑顔、照れた微笑み、堂々とした挨拶。\n太陽の下で輝く、泡児島の「お出迎え」だった。',
        speaker: ''
    },
    {
        phase: 'welcome',
        background: 'terminal',
        characterId: 'minagi',
        speaker: '渡真利海凪',
        text: 'ねぇねぇ、おにーさん！\nこのあと島の中、好きなとこ行けるんだよ！\nあたしたち、どこでも待ってるからさー！'
    },
    {
        phase: 'welcome',
        background: 'terminal',
        hideCharacter: true,
        speaker: 'コンシェルジュ',
        text: 'ようこそ泡児島へ、{playerName}様。チェックインは済んでおります。\n島内マップから、お好きな場所へお向かいください。\nどうぞ、楽園をお楽しみください。'
    }
];
