// 泡児島ノベルゲーム - エンディングシナリオ

const ENDING_TYPES = {
    heroine: 'ヒロインエンド',
    timeout: 'タイムアウトエンド',
    island: '島の終わり'
};

const ENDINGS = {
    minagi: {
        id: 'minagi',
        title: '南風の約束',
        type: 'heroine',
        beats: [
            {
                background: 'sea',
                speaker: '',
                text: '最終日の夕暮れ。ターミナルの先、海は黄金色に染まっていた。'
            },
            {
                background: 'beach',
                characterId: 'minagi',
                speaker: '渡真利海凪',
                text: 'おにーさん……来てくれたんだ。\nあたし、ずっと待ってた。'
            },
            {
                background: 'beach',
                characterId: 'minagi',
                speaker: '渡真利海凪',
                text: 'おばぁの借金、もう少しで返せるの。\nでもね、いちばん嬉しいのは……おにーさんに会えたこと。'
            },
            {
                background: 'beach',
                hideCharacter: true,
                speaker: '',
                text: '波の音が、二人の約束を運んでいく。\n「また来てね」——小さな手が、強く握り返した。'
            },
            {
                background: 'sea',
                speaker: '',
                text: '泡児島は、楽園のまま海に浮かんでいる。\nあなたの胸には、消えない南風が残った。'
            }
        ]
    },
    hinata: {
        id: 'hinata',
        title: '関西の夕焼け',
        type: 'heroine',
        beats: [
            { background: 'restaurant', characterId: 'hinata', speaker: '柚木ひなた', text: '……おにーさん、ほんまに来てくれたんやな。' },
            { background: 'restaurant', characterId: 'hinata', speaker: '柚木ひなた', text: '弟たちの分まで、あんたに恩返ししたい。\nこの島で、あんただけの味覚、覚えたるわ。' },
            { background: 'sea', hideCharacter: true, speaker: '', text: '夕焼けのレストランで、笑い声が響いた。泡児島の夜は、やさしく終わった。' }
        ]
    },
    sakura: {
        id: 'sakura',
        title: '雪のように',
        type: 'heroine',
        beats: [
            { background: 'library', characterId: 'sakura', speaker: '白石さくら', text: '……離れたくない、です。' },
            { background: 'library', characterId: 'sakura', speaker: '白石さくら', text: 'あなたがいてくれたから、ここが「故郷」みたいに感じられました。' },
            { background: 'sea', hideCharacter: true, speaker: '', text: '静かなエンディング。白い砂に、小さな足跡が二列並んだ。' }
        ]
    },
    aoi: { id: 'aoi', title: '静かな契り', type: 'heroine', beats: [
        { background: 'hotel', characterId: 'aoi', speaker: '星野あおい', text: '……認めてあげる。あなたは、特別。' },
        { background: 'sea', hideCharacter: true, speaker: '', text: '高級ホテルのテラスで、二人だけの夜が明けた。' }
    ]},
    miyu: { id: 'miyu', title: '風のゆくえ', type: 'heroine', beats: [
        { background: 'garden', characterId: 'miyu', speaker: '南条みゆ', text: 'あんたといた時間、忘れんとよ。' },
        { background: 'sea', hideCharacter: true, speaker: '', text: '花の香るガーデンに、のんびりした余韻が残った。' }
    ]},
    rin: { id: 'rin', title: '勝利の夕暮れ', type: 'heroine', beats: [
        { background: 'sports_area', characterId: 'rin', speaker: '月島りん', text: '最後のレース、あたしの勝ち！……でも、手、離さないで。' },
        { background: 'sea', hideCharacter: true, speaker: '', text: 'スポーツエリアの灯りが、海風に揺れた。' }
    ]},
    momoka: { id: 'momoka', title: '茶の湯', type: 'heroine', beats: [
        { background: 'library', characterId: 'momoka', speaker: '桐谷ももか', text: '最後の一杯を、あなたと。' },
        { background: 'sea', hideCharacter: true, speaker: '', text: '抹茶の香りが、夜の泡児島に溶けていった。' }
    ]},
    kaede: { id: 'kaede', title: '温かい夕食', type: 'heroine', beats: [
        { background: 'restaurant', characterId: 'kaede', speaker: '橘かえで', text: '家族みたい……いえ、もっと特別な気がする。' },
        { background: 'sea', hideCharacter: true, speaker: '', text: 'キッチンから漂う匂いが、心を満たした。' }
    ]},
    yuki: { id: 'yuki', title: '白い約束', type: 'heroine', beats: [
        { background: 'garden', characterId: 'yuki', speaker: '雪村ゆき', text: 'また、会える？　約束、して？' },
        { background: 'sea', hideCharacter: true, speaker: '', text: '青い海と白い肌。小さな約束が、大きく光った。' }
    ]},
    nagisa: { id: 'nagisa', title: '水平線', type: 'heroine', beats: [
        { background: 'beach', characterId: 'nagisa', speaker: '島田なぎさ', text: 'あなたといると、未来が見える気がする。' },
        { background: 'sea', hideCharacter: true, speaker: '', text: '水平線の向こうに、新しい朝が待っていた。' }
    ]},
    kokoa: { id: 'kokoa', title: '島の歌', type: 'heroine', beats: [
        { background: 'beachbar', characterId: 'kokoa', speaker: '天野ここあ', text: '最後の歌、あんただけに歌うね！' },
        { background: 'sea', hideCharacter: true, speaker: '', text: 'ビーチバーに、拍手と潮音が重なった。' }
    ]},
    timeout: {
        id: 'timeout',
        title: '別れのターミナル',
        type: 'timeout',
        beats: [
            { background: 'terminal', speaker: '', text: '滞在的最終日。荷物をまとめながら、ターミナルへ向かう。' },
            { background: 'terminal', speaker: '', text: '会えた時間は短かった。けれど、誰かの笑顔は確かに胸に残っている。' },
            { background: 'ship', speaker: '', text: '船が動き出す。泡児島は小さくなり、やがて水平線の彼方へ消えた。' }
        ]
    },
    island: {
        id: 'island',
        title: '楽園は続く',
        type: 'island',
        beats: [
            { background: 'sea', speaker: '', text: '五日間の滞在は終わった。' },
            { background: 'terminal', speaker: '', text: '島は変わらず、次の船を待っている。\n笑顔の少女たちは、新しい客を迎えるだろう。' },
            { background: 'ship', speaker: '', text: 'あなたは波の音を背に、本土へ戻った。' }
        ]
    }
};

function getEndingForCandidate(candidate) {
    if (!candidate) return null;
    if (candidate.type === 'heroine' && ENDINGS[candidate.id]) {
        return ENDINGS[candidate.id];
    }
    if (candidate.type === 'timeout') {
        const base = { ...ENDINGS.timeout };
        if (candidate.character) {
            base.beats = [
                ENDINGS.timeout.beats[0],
                {
                    background: 'terminal',
                    characterId: candidate.id,
                    speaker: candidate.character.name,
                    text: `「また来てね」——${candidate.character.nickname || candidate.character.name}の声が、風に溶けた。`
                },
                ENDINGS.timeout.beats[2]
            ];
        }
        return base;
    }
    return ENDINGS.island;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ENDINGS, ENDING_TYPES, getEndingForCandidate };
}
