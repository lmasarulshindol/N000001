// 泡児島ノベルゲーム - 子作り・Hシーン台詞データ

const DEFAULT_MAIN_INTRO = '二人きりの空間に、熱が滲んでいく……';

const DEFAULT_MAIN_CHOICES = [
    {
        id: 'gentle',
        text: 'ゆっくり愛し合う',
        affection: 5,
        response: '……ん、優しいの……もっと、感じたい。'
    },
    {
        id: 'passion',
        text: '激しく求める',
        affection: 6,
        response: 'あっ……だめ、声……出ちゃう……！'
    },
    {
        id: 'whisper',
        text: '耳元で囁く',
        affection: 4,
        response: '……ずるい。そんなことされたら、逃げられない。'
    }
];

const DEFAULT_FOREPLAY_INTRO = '肌が触れ合うたび、吐息が混ざっていく……';

const DEFAULT_FOREPLAY_CHOICES = [
    {
        id: 'kiss',
        text: '深くキスする',
        affection: 4,
        response: '……ちゅ、ん……もう、我慢できない……'
    },
    {
        id: 'touch',
        text: 'ゆっくり愛撫する',
        affection: 5,
        response: 'ひゃ……そこ、敏感なの……'
    },
    {
        id: 'to_main',
        text: 'このまま子作りへ',
        affection: 6,
        response: '……いいよ。あなたとなら、どこでも。',
        goMain: true
    }
];

const CHARACTER_MAIN_SCENES = {
    minagi: {
        intro: '海凪は照れながらも、あなたの腕の中に身を預けた。',
        choices: [
            { id: 'beach', text: '波の音を聞きながら', affection: 6, response: 'おにーさん……最高、だよ……' },
            { id: 'hold', text: 'ぎゅっと抱きしめる', affection: 5, response: 'んっ……離さないでね。' }
        ]
    },
    hinata: {
        intro: 'ひなたは関西弁を交えながら、火照った頬を寄せてくる。',
        choices: [
            { id: 'bold', text: '大胆に迫る', affection: 6, response: '……ほんま、ええわ。もっと。' }
        ]
    },
    sakura: {
        intro: 'さくらは小さな声で、あなたの名を呼んだ。',
        choices: [
            { id: 'soft', text: '静かに包む', affection: 5, response: '……怖くない。あなたとなら。' }
        ]
    }
};

const CHARACTER_FOREPLAY_SCENES = {
    minagi: {
        intro: '潮風の匂いと、彼女の体温が近づく。',
        choices: [
            { id: 'cheek', text: '頬に触れる', affection: 4, response: 'えへへ……ドキドキする。' }
        ]
    }
};

function getMainSceneIntro(characterId) {
    return CHARACTER_MAIN_SCENES[characterId]?.intro || DEFAULT_MAIN_INTRO;
}

function getMainSceneChoices(characterId) {
    const custom = CHARACTER_MAIN_SCENES[characterId]?.choices;
    return custom?.length ? custom : DEFAULT_MAIN_CHOICES;
}

function getForeplaySceneIntro(characterId) {
    return CHARACTER_FOREPLAY_SCENES[characterId]?.intro || DEFAULT_FOREPLAY_INTRO;
}

function getForeplaySceneChoices(characterId) {
    const custom = CHARACTER_FOREPLAY_SCENES[characterId]?.choices;
    return custom?.length ? custom : DEFAULT_FOREPLAY_CHOICES;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getMainSceneIntro,
        getMainSceneChoices,
        getForeplaySceneIntro,
        getForeplaySceneChoices
    };
}
