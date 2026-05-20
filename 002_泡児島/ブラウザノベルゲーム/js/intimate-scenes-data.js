// 泡児島ノベルゲーム - 性行為シーン台本（全キャラ）

const INTIMATE_ACTIONS = {
    piston: [
        { id: 'slow', text: 'ゆっくり腰を動かす', lineKey: 'slow', pleasure: 14, affection: 4 },
        { id: 'fast', text: '激しく求める', lineKey: 'fast', pleasure: 24, affection: 5 },
        { id: 'deep', text: '奥まで突き上げる', lineKey: 'deep', pleasure: 20, affection: 6 },
        { id: 'kiss', text: 'キスしながら愛撫', lineKey: 'kiss', pleasure: 10, affection: 7 },
        { id: 'switch', text: '体位を変える', switchPosition: true, pleasure: 5, affection: 3 },
        { id: 'finish_menu', text: 'フィニッシュする ▼', finishMenu: true }
    ],
    foreplayCommon: [
        { id: 'kiss', text: '深くキスする', lineKey: 'kiss', zone: 'lips', pleasure: 10, affection: 4 },
        { id: 'touch', text: '敏感な所を愛撫', lineKey: 'touch', pleasure: 14, affection: 5 },
        { id: 'whisper', text: '耳元で愛を囁く', lineKey: 'whisper', zone: 'ears', pleasure: 8, affection: 6 },
        { id: 'undress', text: '服を脱がせる', lineKey: 'undress', pleasure: 16, affection: 4 }
    ],
    oralCommon: [
        { id: 'oral_slow', text: 'ゆっくり奉仕してもらう', pleasure: 14, affection: 3 },
        { id: 'oral_deep', text: '深く咥えてもらう', pleasure: 22, affection: 4, requires: { affectionMin: 40 } },
        { id: 'oral_tip', text: '先端を集中して舐めてもらう', pleasure: 16, affection: 4 },
        { id: 'oral_with_hand', text: '手と口で同時に', pleasure: 20, affection: 5, requires: { affectionMin: 30 } }
    ]
};

/** 「口でしてもらう」を前戯メニューに出すべきか判定（F5 のフィルタ条件） */
function canOfferOralService(char, profile, gameState) {
    if (!profile) return false;
    const aff = gameState?.characterAffections?.[char.id] ?? 0;
    if (aff < 30) return false;
    if (profile.finishPreference?.oralSwallow === 'forbidden'
        && profile.sensitivities?.lips < 1) return false;
    return true;
}

function buildOralActionsForCharacter(char) {
    const profile = typeof getIntimacyProfile === 'function'
        ? getIntimacyProfile(char.id)
        : null;
    return INTIMATE_ACTIONS.oralCommon.map((a) => ({
        ...a,
        lines: lines('heroine', [oralResponse(char, a.id, profile)]),
        linePool: buildOralLinePool(char, a.id, profile)
    }));
}

/**
 * 口奉仕アクションの連続選択用バリエーションプール。
 * @returns {Array<Array<{speaker:string,text:string}>>}
 */
function buildOralLinePool(char, actionId, profile) {
    const defaults = {
        oral_slow: [
            ['……ん、ふぅ……これで、いいの……？'],
            ['ん、んむ……二度目は、少し慣れた……'],
            ['ふぅ……上手に、なってきた……かも……']
        ],
        oral_deep: [
            ['……ん、ぐっ……奥まで、苦しい、けど……あなたのため、なら……'],
            ['んぐっ……二度目は、もう少し、奥まで……'],
            ['ん、んぐっ……もう、限界、近い、かも……']
        ],
        oral_tip: [
            ['……ちゅ、ぺろ……先っぽ、ぴくぴくしてる……'],
            ['ん……ここ、二度目だと、もっと反応するんだね……'],
            ['ふ、ぁ……先っぽ、もう、ふやけちゃう……']
        ],
        oral_with_hand: [
            ['ん、んっ……手と一緒に、こう……？'],
            ['んむ……二度目は、リズム、合わせる……'],
            ['ふぅ……手も、口も、止まらない……']
        ]
    };
    const flavor = profile?.flavorLines?.oral?.[actionId];
    const variants = [];
    if (flavor) {
        variants.push(lines('heroine', [flavor]));
    }
    const def = defaults[actionId] || [['……ん、続けるね……']];
    def.forEach((pair) => variants.push(lines('heroine', pair)));
    return variants;
}

function oralResponse(char, actionId, profile) {
    if (profile?.flavorLines?.oral?.[actionId]) {
        return profile.flavorLines.oral[actionId];
    }
    const map = {
        oral_slow: ['……ん、ふぅ……これで、いいの……？', 'ん、んむ……上手く、できてるかな……'],
        oral_deep: ['……ん、ぐっ……奥まで、苦しい、けど……あなたのため、なら……', 'んぐっ、ふぅ……いっぱい、咥えるよ……'],
        oral_tip: ['……ちゅ、ぺろ……先っぽ、ぴくぴくしてる……', 'んっ、ここが、感じるんだ……？'],
        oral_with_hand: ['ん、んっ……手と一緒に、こう……？', '……上手く、できてる、よね……？']
    };
    const arr = map[actionId] || ['……ん、続けるね……'];
    return arr[0];
}

function lines(speaker, texts) {
    return texts.map((text) => ({ speaker, text }));
}

function buildPistonLines(virgin, char) {
    const n = char.nickname || char.name;
    if (virgin) {
        return {
            slow: [
                lines('heroine', ['んっ……ゆっくり……痛くない、から……', 'はぁ……中、熱い……慣れてきた、かも……']),
                lines('heroine', ['ん……二度目、もう少し慣れた……', 'はぁ……奥、ぽかぽか、する……']),
                lines('heroine', ['ふ……身体、覚えてきちゃう……', 'ん、このリズム、好きかも……'])
            ],
            fast: [
                lines('heroine', ['あっ、あっ……だめ、速いの……頭、真っ白……', 'んぁっ……もう、我慢できない……！']),
                lines('heroine', ['ひゃっ、また速い……だめ、追いつかない……', 'んっ、んっ……壊れちゃう……']),
                lines('heroine', ['もう……止まらないでっ……んあぁっ……！', 'はぁっ……溶ける、もうダメ、なの……'])
            ],
            deep: [
                lines('heroine', ['ひゃうっ……深い、とこ……届いてる……', '……っ、泣いちゃう、のに……気持ちいい……']),
                lines('heroine', ['んあぁっ……また、奥に……お腹、震えるの……', 'はぁ……届いて、ない、はずなのに……']),
                lines('heroine', ['ふぅ……奥、もう、あなたの形……', 'んっ、ここ、私の一番、深い場所……'])
            ],
            kiss: [
                lines('heroine', ['ちゅ……ん、キス、しながら……だめ、溶けちゃう……', '……好き、って言って……もっと、聞きたい……']),
                lines('heroine', ['ん、んむ……唇、離さないで……', '……二度目のキス、もっと、長く……']),
                lines('heroine', ['ふ、ぁ……息、混ざる……', 'ん……このまま、一つになっちゃいたい……'])
            ],
            default: [
                lines('heroine', ['んっ……あっ……はぁ……']),
                lines('heroine', ['んぅ……ふぁ……あ……']),
                lines('heroine', ['はぁ……あ……んっ……'])
            ]
        };
    }
    return {
        slow: [
            lines('heroine', ['ん……そのまま……ゆっくり、感じさせて……', 'はぁ……体が、覚えてるの……あなたの、形……']),
            lines('heroine', ['ふぅ……このペース、好き……ずっと、続けて……', 'ん……身体の奥が、しっとり、馴染んでいく……']),
            lines('heroine', ['んっ……このまま、溶けちゃいそう……', 'はぁ……ゆっくりが、一番、効くの……'])
        ],
        fast: [
            lines('heroine', ['あっ、あっ、そこっ……！　だめ、イきそう……', 'んあぁっ……激しいの……もっと……']),
            lines('heroine', ['また、激しいっ……！　頭、ぐちゃぐちゃ……', 'んぅっ……速い、速いってばっ……！']),
            lines('heroine', ['もう、限界……壊して、いいから……！', 'はぁっ、はぁっ……追いつけない、よぉ……'])
        ],
        deep: [
            lines('heroine', ['ひゃうんっ……そこ、一番……奥、ずんずん……', '……っ、奥、押されてる……とろけちゃう……']),
            lines('heroine', ['んあっ……また奥、当たって……ぴくっ、てなる……', '……奥が、もう、あなたを覚えてる……']),
            lines('heroine', ['ふ、ぁ……奥が、勝手にきゅんって……', 'ん、深いとこ、ぐりぐりされると、もう……'])
        ],
        kiss: [
            lines('heroine', ['ちゅ……キス、しながら……ん、頭、ぼーっとする……', '……ねえ、見て……今の顔、恥ずかしい……']),
            lines('heroine', ['ん、んむ……まだ、唇、離れないで……', '……あなたの息、もっと、ちょうだい……']),
            lines('heroine', ['ふ、ぁ……唇、ぴりぴりして、痺れちゃう……', 'ん……キスで、イけそう、なくらい……'])
        ],
        default: [
            lines('heroine', ['んっ……あぁ……はぁん……']),
            lines('heroine', ['ふぅ……ん……はぁ……']),
            lines('heroine', ['はぁ……あ……んっ……'])
        ]
    };
}

/**
 * 場所×好感度別の context lines を取得。
 * intimate-contextual-lines.js が読み込まれていれば呼び出す。
 * @returns {{foreplayIntro:string[]|null, insertReady:string|null, climaxLine:string|null, aftercareLine:string|null}|null}
 */
function resolveContextualLines(charId, context) {
    if (typeof getContextualLines !== 'function') return null;
    if (!context || !context.spotId) return null;
    const aff = typeof context.affection === 'number' ? context.affection : 0;
    return getContextualLines(charId, context.spotId, aff);
}

function buildCharacterIntimateScene(char, context = null) {
    const virgin = char.stats.experience === 'virgin';
    const n = char.nickname || char.name;
    const piston = buildPistonLines(virgin, char);
    const profile = typeof getIntimacyProfile === 'function'
        ? getIntimacyProfile(char.id)
        : null;
    const ctx = resolveContextualLines(char.id, context);

    const insertVirginDefault = lines('narrator', [
        `${char.name}の脚を優しく開く。未踏の入口が、震えながらあなたを待っていた。`,
        `「……怖いけど、あなたなら……いい」`
    ]);
    const insertExpDefault = lines('narrator', [
        `${n}は慣れたように腰を浮かせ、あなたを受け入れる準備を整えた。`,
        '「……来て。今夜は、逃がさないから」'
    ]);
    const insertVirgin = ctx?.insertReady
        ? lines('narrator', [`${char.name}の脚を優しく開く。未踏の入口が、震えながらあなたを待っていた。`, `「${ctx.insertReady}」`])
        : insertVirginDefault;
    const insertExp = ctx?.insertReady
        ? lines('narrator', [`${n}は静かに身を預け、あなたを迎え入れる準備を整えた。`, `「${ctx.insertReady}」`])
        : insertExpDefault;

    const baseForeplayActions = INTIMATE_ACTIONS.foreplayCommon.map((a) => {
        const flavor = profile?.flavorLines?.[a.lineKey];
        return {
            ...a,
            // 互換用: 旧 lines も維持
            lines: lines('heroine', [
                flavor || foreplayResponse(char, a.id),
                foreplayResponse(char, a.id, 2)
            ]),
            // 新形式: 連続選択時のバリエーション
            linePool: buildForeplayLinePool(char, a.id, profile)
        };
    });

    if (profile?.specialAction) {
        const sp = profile.specialAction;
        baseForeplayActions.push({
            id: sp.id,
            text: sp.text,
            lineKey: sp.id,
            zone: sp.zone || null,
            pleasure: sp.pleasure ?? 18,
            affection: sp.affection ?? 7,
            isSpecial: true,
            lines: lines('heroine', [sp.line])
        });
    }

    baseForeplayActions.push({
        id: 'to_oral',
        text: '口でしてもらう',
        goOral: true,
        pleasure: 4,
        affection: 3,
        requires: { affectionMin: 30 },
        lines: lines('heroine', [oralRequestResponse(char, profile)])
    });

    baseForeplayActions.push({
        id: 'to_insert',
        text: 'このまま挿入する',
        pleasure: 20,
        affection: 6,
        goInsert: true,
        lines: lines('heroine', [foreplayToInsertLine(char, profile)])
    });

    const oralActions = buildOralActionsForCharacter(char);

    const foreplayIntro = ctx?.foreplayIntro
        ? lines('narrator', ctx.foreplayIntro)
        : lines('narrator', [
            `${n}との距離がゼロになる。吐息が混ざり、肌の温度だけが世界を満たした。`
        ]);

    const climaxMissionary = ctx?.climaxLine
        ? lines('heroine', [ctx.climaxLine, 'はぁ……はぁ……まだ、余韻が……'])
        : lines('heroine', climaxLines(char, 'missionary'));
    const climaxCowgirl = ctx?.climaxLine
        ? lines('heroine', [ctx.climaxLine, 'はぁ……はぁ……上から、もう……動けない……'])
        : lines('heroine', climaxLines(char, 'cowgirl'));
    const climaxDefault = ctx?.climaxLine
        ? lines('heroine', [ctx.climaxLine, 'はぁ……はぁ……ぜんぶ、持っていかれた……'])
        : lines('heroine', climaxLines(char, 'default'));

    const aftercareHoldLine = ctx?.aftercareLine || aftercareLine(char, 'hold');

    return {
        profile,
        foreplay: {
            intro: foreplayIntro,
            actions: baseForeplayActions
        },
        oral: {
            intro: lines('narrator', [
                `${n}は小さく頷き、ゆっくりと身を屈めていった。`,
                '指先と唇の感触に、世界が縮んでいく――'
            ]),
            actions: oralActions
        },
        positions: {
            missionary: {
                label: '正常位',
                insert: virgin ? insertVirgin : insertExp,
                piston,
                climax: climaxMissionary
            },
            cowgirl: {
                label: '騎乗位',
                insert: lines('narrator', [
                    `${n}が跨り、自分のペースで腰を沈めていく……`,
                    virgin
                        ? '「……見ないで、恥ずかしい、から……んっ」'
                        : '「……今度は、あたしが動く番ね……ん、んっ」'
                ]),
                piston: {
                    ...piston,
                    slow: [
                        lines('heroine', ['ん……上から、ゆっくり……全部、感じる……', 'はぁ……揺れ、止まらない……']),
                        lines('heroine', ['ふ……二度目は、もっと上手に動ける、かも……', 'はぁ……身体、覚えちゃう……']),
                        lines('heroine', ['ん……もう、自分で動かないと、寂しい……', 'はぁ……腰、勝手に、揺れちゃう……'])
                    ],
                    fast: [
                        lines('heroine', ['あっ、あっ、自分で、動いちゃう……！', 'んぁっ……ダメ、止められない……！']),
                        lines('heroine', ['ま、また……腰、勝手に弾んじゃう……', 'んあぁっ……スピード、抑えられない……']),
                        lines('heroine', ['もう……壊れちゃう……自分でっ……！', 'はぁっ、はぁっ……限界、見えない……'])
                    ]
                },
                climax: climaxCowgirl
            }
        },
        stages: {
            insert: virgin ? insertVirgin : insertExp,
            climax: climaxDefault
        },
        aftercare: {
            intro: lines('narrator', [
                `荒い息が重なる。${n}の体が、小さく震えながらあなたに寄り添った。`
            ]),
            actions: [
                {
                    id: 'hold',
                    text: '抱きしめて休む',
                    affection: 8,
                    lines: lines('heroine', [aftercareHoldLine])
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

/**
 * 前戯アクションの「連続選択用バリエーションプール」を生成。
 * variant 0 → 初々しい、variant 1 → 慣れてきた、variant 2 → 求めて止まらない、の3段階。
 * profile.flavorLines があれば variant 0 に組み込む。
 * @returns {Array<Array<{speaker:string,text:string}>>}
 */
function buildForeplayLinePool(char, actionId, profile) {
    const defaults = {
        kiss: [
            ['……ちゅ、ん……もう、溶けそう……', '唇、とけちゃう……'],
            ['ん、んむ……もう一度、して？　離れたく、ない……', '……キスだけで、心臓、おかしくなりそう……'],
            ['ふ、ぁ……唇、ぴりぴりする……', '……三度目は、もっと深く、して……']
        ],
        touch: [
            ['ひゃ……そこ、だめ……敏感、なの……', 'んっ……指、温かい……'],
            ['ん……また、そこ……？　くすぐったい、けど……', 'はぁ……身体、あなたの指、覚えてきちゃう……'],
            ['もう、だめ……そこばっかり、触られたら……', 'ふぅっ……指の動き、追っちゃう……']
        ],
        whisper: [
            ['……耳、くすぐったい……でも、嬉しい……', '声、震えちゃう……'],
            ['ん……もう、耳に息、かけないで……溶けちゃう……', 'はぁ……二度目は、もっと、低い声で……'],
            ['だめ、耳ばっかり……腰、抜けちゃう……', 'ふ……あなたの声で、世界が遠くなる……']
        ],
        undress: [
            ['見ないで……恥ずかしい、から……', '……脱がせないで、じっと見るの……'],
            ['ん……二度目は、自分で、脱ぐ……から……', '……あなたの視線、気にしないように、する……'],
            ['もう、全部、見て……隠す気、なくなっちゃった……', 'はぁ……視られるだけで、ぞくぞくする……']
        ]
    };
    const flavor = profile?.flavorLines?.[actionId];
    const variants = [];
    if (flavor) {
        variants.push(lines('heroine', [flavor]));
    }
    const def = defaults[actionId] || [['……ん、続けて……']];
    def.forEach((pair) => variants.push(lines('heroine', pair)));
    return variants;
}

function foreplayResponse(char, actionId, variant = 1) {
    const profile = typeof getIntimacyProfile === 'function'
        ? getIntimacyProfile(char.id)
        : null;
    if (profile?.flavorLines?.[actionId] && variant === 1) {
        return profile.flavorLines[actionId];
    }
    const map = {
        kiss: ['……ちゅ、ん……もう、溶けそう……', '唇、とけちゃう……'],
        touch: ['ひゃ……そこ、だめ……敏感、なの……', 'んっ……指、温かい……'],
        whisper: ['……耳、くすぐったい……でも、嬉しい……', '声、震えちゃう……'],
        undress: ['見ないで……恥ずかしい、から……', '……脱がせないで、じっと見るの……']
    };
    const arr = map[actionId] || ['……ん、続けて……'];
    return arr[(variant - 1) % arr.length];
}

function foreplayToInsertLine(char, profile) {
    if (profile?.flavorLines?.insertLine) {
        return profile.flavorLines.insertLine;
    }
    if (char.stats.experience === 'virgin') {
        return '……いいよ。あなたの、全部……受け止める';
    }
    return '……来て。待ってた、のに……我慢、できなかった……';
}

function oralRequestResponse(char, profile) {
    if (profile?.flavorLines?.oralRequest) {
        return profile.flavorLines.oralRequest;
    }
    if (char.stats.experience === 'virgin') {
        return '……えっ、わたし、上手くないかも……でも、やってみる、ね……';
    }
    return '……ふっ、お望みなら。じっとしててね？';
}

function climaxLines(char, position) {
    const profile = typeof getIntimacyProfile === 'function'
        ? getIntimacyProfile(char.id)
        : null;
    if (profile?.flavorLines?.climax) {
        return [
            profile.flavorLines.climax,
            'はぁ……はぁ……まだ、余韻……止まらない……'
        ];
    }
    const virgin = char.stats.experience === 'virgin';
    if (virgin) {
        return [
            '……だめ、もう……イっちゃう……んっ、ぁぁ……！',
            'はぁ……はぁ……初めて、なのに……こんなに、気持ちいい……'
        ];
    }
    return [
        'んっ、あっ……イく、イくっ……あぁぁっ……！',
        'はぁ……はぁ……まだ、体が……びくびく、してる……'
    ];
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
    if (char.id === 'aoi' && type === 'hold') {
        return '……認めるわ。あなたの腕の中、悪くない。';
    }
    if (char.id === 'aoi' && type === 'promise') {
        return '……ふぅん。じゃあ、次は私から誘ってあげるわ。';
    }
    if (char.id === 'rin' && type === 'hold') {
        return '……試合終了。……でも、もうちょっとだけ、こうしてて。';
    }
    if (char.id === 'rin' && type === 'wipe') {
        return '……拭いてくれるとか、お兄さん紳士だね。……ちょっと嬉しい。';
    }
    if (char.id === 'momoka' && type === 'hold') {
        return '……こうして抱かれてると、お茶のお点前、忘れてしまいますわ……';
    }
    if (char.id === 'momoka' && type === 'promise') {
        return '……はしたない、けど……また、お側に置いてくださいな。';
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
                'りんは勝負のように笑い、勢いよくあなたを押し倒した。',
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
    },
    miyu: {
        foreplay: {
            intro: lines('narrator', [
                'みゆはふわりと微笑み、おっとりした仕草で体を預けてきた。',
                '「……お兄さん、みゆのこと、大事に、してくれるん？」'
            ])
        }
    },
    momoka: {
        foreplay: {
            intro: lines('narrator', [
                'ももかは静かに帯を解き、恥じらいの中にも凛とした佇まいを崩さなかった。',
                '「……はしたない真似、どすけど……あなたになら、見せてもええ、どす」'
            ])
        }
    },
    kaede: {
        foreplay: {
            intro: lines('narrator', [
                'かえでは「まず温かいもの、飲む？」と訊いてから、はにかんで首を振った。',
                '「……ごめん、今は……お世話じゃなくて、甘えたい、かも」'
            ])
        }
    },
    yuki: {
        foreplay: {
            intro: lines('narrator', [
                'ゆきは小さな手であなたの指を握り、おずおずと顔を上げた。',
                '「……ゆき、こわくないよ。あなたが、一緒だから……」'
            ])
        }
    },
    kokoa: {
        foreplay: {
            intro: lines('narrator', [
                'ここあは鼻歌を止め、照れたように笑ってあなたの胸に飛び込んだ。',
                '「みーちゃんには内緒さー……ここあだけ、見て？」'
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

/**
 * シーン取得。context（spotId, affection）が渡された場合はその場で再生成し、
 * 場所×好感度に応じた contextual lines を反映する。
 * context なしの場合は事前構築済み（場所中立な）シーンを返す。
 * @param {string} characterId
 * @param {{spotId?:string, affection?:number}|null} context
 */
function getCharacterIntimateScene(characterId, context = null) {
    if (context && (context.spotId || typeof context.affection === 'number')) {
        if (typeof CHARACTERS !== 'undefined' && CHARACTERS[characterId]) {
            const base = buildCharacterIntimateScene(CHARACTERS[characterId], context);
            return deepMergeScene(base, CHARACTER_INTIMATE_OVERRIDES[characterId]);
        }
    }
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
