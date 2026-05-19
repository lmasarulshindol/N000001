// 泡児島ノベルゲーム - 性行為シーン台本（全キャラ）

const INTIMATE_ACTIONS = {
    piston: [
        { id: 'slow', text: 'ゆっくり腰を動かす', lineKey: 'slow', pleasure: 14, affection: 4 },
        { id: 'fast', text: '激しく求める', lineKey: 'fast', pleasure: 24, affection: 5 },
        { id: 'deep', text: '奥まで突き上げる', lineKey: 'deep', pleasure: 20, affection: 6 },
        { id: 'kiss', text: 'キスしながら愛撫', lineKey: 'kiss', pleasure: 10, affection: 7 },
        { id: 'switch', text: '体位を変える', switchPosition: true, pleasure: 5, affection: 3 },
        { id: 'climax', text: '射精する', climaxAction: true }
    ],
    foreplayCommon: [
        { id: 'kiss', text: '深くキスする', pleasure: 10, affection: 4 },
        { id: 'touch', text: '敏感な所を愛撫', pleasure: 14, affection: 5 },
        { id: 'whisper', text: '耳元で愛を囁く', pleasure: 8, affection: 6 },
        { id: 'undress', text: '服を脱がせる', pleasure: 16, affection: 4 }
    ]
};

function lines(speaker, texts) {
    return texts.map((text) => ({ speaker, text }));
}

function buildPistonLines(virgin, name) {
    const n = name.split(/[\s・]/)[0] || name;
    if (virgin) {
        return {
            slow: lines('heroine', [
                `んっ……${n}さん、ゆっくり……痛くない、から……`,
                'はぁ……中、熱い……慣れてきた、かも……'
            ]),
            fast: lines('heroine', [
                'あっ、あっ……だめ、速いの……頭、真っ白……',
                'んぁっ……もう、我慢できない……！'
            ]),
            deep: lines('heroine', [
                'ひゃうっ……深い、とこ……届いてる……',
                '……っ、泣いちゃう、のに……気持ちいい……'
            ]),
            kiss: lines('heroine', [
                'ちゅ……ん、キス、しながら……だめ、溶けちゃう……',
                '……好き、って言って……もっと、聞きたい……'
            ]),
            default: lines('heroine', ['んっ……あっ……はぁ……'])
        };
    }
    return {
        slow: lines('heroine', [
            'ん……いいわ、そのまま……ゆっくり、感じさせて……',
            'はぁ……体、覚えてるの……あなたの形……'
        ]),
        fast: lines('heroine', [
            'あっ、あっ、そこっ……！　ダメ、イきそう……',
            'んあぁっ……激しいの、好き……もっと、壊して……'
        ]),
        deep: lines('heroine', [
            'ひゃうんっ……そこ、一番……奥、ずんずん……',
            '……っ、子宮、押されてる……とろけちゃう……'
        ]),
        kiss: lines('heroine', [
            'ちゅ……キス、しながら……ん、頭、ぼーっとする……',
            '……ねえ、見て……今の顔、恥ずかしい……'
        ]),
        default: lines('heroine', ['んっ……あぁ……はぁん……'])
    };
}

function buildCharacterIntimateScene(char) {
    const virgin = char.stats.experience === 'virgin';
    const name = char.nickname || char.name;
    const piston = buildPistonLines(virgin, char.name);

    const insertVirgin = lines('narrator', [
        `${char.name}の脚を優しく開く。未踏の入口が、震えながらあなたを待っていた。`,
        `「……怖いけど、${name}なら……いい」`
    ]);
    const insertExp = lines('narrator', [
        `${char.name}は慣れたように腰を浮かせ、あなたを受け入れる準備を整えた。`,
        '「……来て。今夜は、逃がさないから」'
    ]);

    return {
        foreplay: {
            intro: lines('narrator', [
                `${char.name}との距離がゼロになる。吐息が混ざり、肌の温度だけが世界を満たした。`
            ]),
            actions: INTIMATE_ACTIONS.foreplayCommon.map((a) => ({
                ...a,
                lines: lines('heroine', [
                    foreplayResponse(char, a.id),
                    foreplayResponse(char, a.id, 2)
                ])
            })).concat([
                {
                    id: 'to_insert',
                    text: 'このまま挿入する',
                    pleasure: 20,
                    affection: 6,
                    goInsert: true,
                    lines: lines('heroine', [foreplayToInsertLine(char)])
                }
            ])
        },
        positions: {
            missionary: {
                label: '正常位',
                insert: virgin ? insertVirgin : insertExp,
                piston,
                climax: lines('heroine', climaxLines(char, 'missionary'))
            },
            cowgirl: {
                label: '騎乗位',
                insert: lines('narrator', [
                    `${char.name}が跨り、自分のペースで腰を沈めていく……`,
                    virgin
                        ? '「……見ないで、恥ずかしい、から……んっ」'
                        : '「……今度は、あたしが動く番ね……ん、んっ」'
                ]),
                piston: {
                    ...piston,
                    slow: lines('heroine', [
                        'ん……上から、ゆっくり……全部、感じる……',
                        'はぁ……揺れ、止まらない……'
                    ]),
                    fast: lines('heroine', [
                        'あっ、あっ、自分で、動いちゃう……！',
                        'んぁっ……ダメ、止められない……！'
                    ])
                },
                climax: lines('heroine', climaxLines(char, 'cowgirl'))
            }
        },
        stages: {
            insert: virgin ? insertVirgin : insertExp,
            climax: lines('heroine', climaxLines(char, 'default'))
        },
        aftercare: {
            intro: lines('narrator', [
                `荒い息が重なる。${char.name}の体が、小さく震えながらあなたに寄り添った。`
            ]),
            actions: [
                {
                    id: 'hold',
                    text: '抱きしめて休む',
                    affection: 8,
                    lines: lines('heroine', [aftercareLine(char, 'hold')])
                },
                {
                    id: 'wipe',
                    text: '体を拭いてあげる',
                    affection: 6,
                    lines: lines('heroine', [aftercareLine(char, 'wipe')])
                },
                {
                    id: 'promise',
                    text: 'また求めると囁く',
                    affection: 7,
                    lines: lines('heroine', [aftercareLine(char, 'promise')])
                }
            ]
        }
    };
}

function foreplayResponse(char, actionId, variant = 1) {
    const map = {
        kiss: ['……ちゅ、ん……もう、溶けそう……', '唇、とけちゃう……'],
        touch: ['ひゃ……そこ、だめ……敏感、なの……', 'んっ……指、温かい……'],
        whisper: ['……耳、くすぐったい……でも、嬉しい……', '声、震えちゃう……'],
        undress: ['見ないで……恥ずかしい、から……', '……脱がせないで、じっと見るの……']
    };
    const arr = map[actionId] || ['……ん、続けて……'];
    return arr[(variant - 1) % arr.length];
}

function foreplayToInsertLine(char) {
    if (char.stats.experience === 'virgin') {
        return '……いいよ。あなたの、全部……受け止める';
    }
    return '……来て。待ってた、のに……我慢、できなかった……';
}

function climaxLines(char, position) {
    const base = [
        '……いくっ、いくっ……んあぁぁっ……！！',
        'はぁ……はぁ……まだ、余韻……止まらない……'
    ];
    if (char.id === 'minagi') {
        return ['おにーさんっ……だめ、イっちゃう……んあぁっ……！！', '……すごかった。泡児島、一番……'];
    }
    if (char.id === 'hinata') {
        return ['んあっ……ほんま、ええ……もう、足、抜けるわ……', '……あんた、最高や。'];
    }
    if (char.id === 'sakura') {
        return ['……っ、イく……怖いのに……気持ち、いい……', '……涙、止まらない。嬉しい、の……'];
    }
    return base;
}

function aftercareLine(char, type) {
    const m = {
        hold: '……もう少し、このまま。離れたく、ない……',
        wipe: '……ありがとう。そんなこと、され慣れてない、から……',
        promise: '……うん。また、いっぱい……しよう？'
    };
    if (char.id === 'minagi' && type === 'promise') {
        return '……うん！　おにーさんと、何回でも！';
    }
    if (char.id === 'hinata' && type === 'hold') {
        return '……しんどいくせに、抱きしめられたら安心するわ。';
    }
    return m[type] || m.hold;
}

/** キャラ別の台本上書き（抜きゲー用・濃厚描写） */
const CHARACTER_INTIMATE_OVERRIDES = {
    minagi: {
        foreplay: {
            intro: lines('narrator', [
                '海凪は小麦色の肌を照らす夕日の中、恥ずかしそうにシャツの裾を握った。',
                '「おにーさん……ここ、誰もいないとこ、じゃないと、だめだよ？」'
            ])
        },
        positions: {
            missionary: {
                insert: lines('narrator', [
                    '波打ち際の砂の上、海凪の小さな体があなたの下に沈む。',
                    '「んっ……おにーさん、大きい……でも、嫌じゃない……」'
                ]),
                climax: lines('heroine', [
                    'おにーさんっ……だめ、イっちゃう……んあぁぁっ……！！',
                    '……海、きれい。おにーさんと、一番……幸せ……'
                ])
            }
        }
    },
    hinata: {
        foreplay: {
            intro: lines('narrator', [
                'ひなたは関西弁を交えつつ、火照った体をあなたに預けた。',
                '「……ほんま、ムラムラしてしもうた。せえから、責任、取ってな」'
            ])
        }
    },
    sakura: {
        foreplay: {
            intro: lines('narrator', [
                'さくらは震える指であなたの胸に触れ、小さく頷いた。',
                '「……怖くない、と言いたいのに。でも、あなたとなら……」'
            ])
        }
    },
    aoi: {
        foreplay: {
            intro: lines('narrator', [
                'あおいは上品な仮面を外し、潤んだ瞳であなただけを見つめた。',
                '「……認めてあげる。今夜だけは、逃がさないわ」'
            ])
        }
    },
    rin: {
        foreplay: {
            intro: lines('narrator', [
                'りんは勝負のように笑い、あなたをベッドに押し倒した。',
                '「負けないから！　……でも、キスなら、してもいい」'
            ])
        }
    },
    nagisa: {
        foreplay: {
            intro: lines('narrator', [
                'なぎさは潮風に髪を靡かせ、静かに唇を重ねてきた。',
                '「……音を、消して。二人だけの夜にしよう」'
            ])
        }
    }
};

function deepMergeScene(base, override) {
    if (!override) return base;
    const out = { ...base, ...override };
    if (override.foreplay) {
        out.foreplay = { ...base.foreplay, ...override.foreplay };
    }
    if (override.positions) {
        out.positions = { ...base.positions };
        Object.keys(override.positions).forEach((k) => {
            out.positions[k] = { ...base.positions[k], ...override.positions[k] };
        });
    }
    if (override.aftercare) {
        out.aftercare = { ...base.aftercare, ...override.aftercare };
    }
    return out;
}

const CHARACTER_INTIMATE_SCENES = {};

function initIntimateScenes() {
    if (typeof CHARACTERS === 'undefined') return;
    Object.keys(CHARACTERS).forEach((id) => {
        const base = buildCharacterIntimateScene(CHARACTERS[id]);
        CHARACTER_INTIMATE_SCENES[id] = deepMergeScene(
            base,
            CHARACTER_INTIMATE_OVERRIDES[id]
        );
    });
}

initIntimateScenes();

function getCharacterIntimateScene(characterId) {
    if (!CHARACTER_INTIMATE_SCENES[characterId] && typeof CHARACTERS !== 'undefined') {
        CHARACTER_INTIMATE_SCENES[characterId] = buildCharacterIntimateScene(CHARACTERS[characterId]);
    }
    return CHARACTER_INTIMATE_SCENES[characterId];
}

function getPistonActions() {
    return INTIMATE_ACTIONS.piston.map((a) => ({ ...a }));
}

function resolveSpeaker(line, character) {
    if (line.speaker === 'heroine') return character.name;
    if (line.speaker === 'narrator') return '';
    return line.speaker || '';
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCharacterIntimateScene,
        getPistonActions,
        resolveSpeaker,
        buildCharacterIntimateScene,
        CHARACTER_INTIMATE_SCENES
    };
}
