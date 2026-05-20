// 泡児島ノベルゲーム - キャラ別 性格・性感帯・好みプレイ定義
// intimate-scenes-data.js / intimate-scene-system.js から参照される

/**
 * 性感帯ID（共通辞書）
 * 値は基本ラベル。各キャラの sensitivities でこのキーを参照する。
 */
const EROGENOUS_ZONES = {
    ears: '耳',
    neck: '首筋',
    lips: '唇',
    chest: '胸',
    waist: '腰',
    thigh: '太もも',
    back: '背中',
    fingertip: '指先'
};

/**
 * プレイ（アクション）の共通ID
 * intimate-scenes-data.js の foreplayCommon / piston と対応する。
 */
const PLAY_ACTIONS = {
    kiss: 'キス',
    touch: '愛撫',
    whisper: '囁き',
    undress: '脱がせる',
    slow: 'ゆっくり',
    fast: '激しく',
    deep: '深く',
    tease: '焦らす'
};

/**
 * 弱点キーワード（kink）
 * - praise: 褒められると弱い
 * - cherish: 大切に扱われると弱い
 * - challenge: 勝負・挑発に弱い
 * - tease: 焦らしに弱い
 * - forbidden: 禁忌・背徳に弱い
 * - command: 命令されると弱い
 */
const KINK_TYPES = {
    praise: '褒められると弱い',
    cherish: '大切に扱われると弱い',
    challenge: '勝負・挑発に弱い',
    tease: '焦らしに弱い',
    forbidden: '禁忌・背徳に弱い',
    command: '命令されると弱い'
};

/**
 * 台詞トーン
 * scene builder で台詞の語尾・テンションを切り替える。
 */
const VOICE_TONES = {
    sunny: '明るく屈託ない',
    timid: 'おどおど内気',
    cool: '冷静で大人びた',
    gentle: 'のんびり穏やか',
    sporty: '気合い系・素直',
    elegant: '上品・古風',
    sweet: '甘えん坊',
    mature: '落ち着いた大人'
};

/**
 * キャラ毎の親密度プロファイル
 *
 * 各フィールド:
 * - pace: 好むテンポ（'gentle' | 'fast' | 'slow' | 'balanced'）
 * - voiceTone: VOICE_TONES のキー
 * - kink: KINK_TYPES のキー
 * - sensitivities: { zoneId: 倍率 } 性感帯ごとの感度倍率（1.0=普通、>1.0=敏感）
 * - preferredActions: 好きなプレイ ID 配列（pleasure +30%, affection +1）
 * - dislikedActions: 嫌いなプレイ ID 配列（pleasure -20%, affection -1）
 * - specialAction: 専用フォアプレイ（好感度・快感とも高い、台詞付き）
 * - flavorLines: { kiss, touch, whisper, undress, slow, fast, deep, climax }
 *   そのキャラ独自の反応台詞（個性反映）
 */
const CHARACTER_INTIMACY_PROFILES = {
    minagi: {
        pace: 'gentle',
        voiceTone: 'sunny',
        kink: 'cherish',
        sensitivities: { ears: 1.5, back: 1.4, lips: 1.2, neck: 1.1 },
        preferredActions: ['kiss', 'slow', 'whisper'],
        dislikedActions: ['fast'],
        specialAction: {
            id: 'whisper_dialect',
            text: '耳元で「だいじょぶ」と囁く',
            zone: 'ears',
            pleasure: 18,
            affection: 8,
            line: 'おにーさん……ずるい。それ言われたら、何でも許しちゃう……'
        },
        flavorLines: {
            kiss: 'ちゅ……んっ、おにーさんの唇、しょっぱい……海みたいだぁ……',
            touch: 'ひゃっ……そ、そこは……擦り傷あるのに……',
            whisper: '耳、くすぐったいさぁ……でも、もっと聞きたい……',
            undress: '見ないで……日焼け、変じゃない……？',
            slow: 'ゆっくりで、いい……海凪、初めてだから……',
            fast: 'んっ、待って……速いの、こわい……ちょっとだけ、ゆっくり……',
            deep: 'ひゃうっ……奥、当たってる……すごい……',
            climax: 'おにーさんっ、海凪……イっちゃう……んあぁっ！'
        },
        finishPreference: {
            inside: 'requiresConsent',
            oralSwallow: 'shy',
            face: 'shy',
            preferredFinish: 'inside',
            reactionTone: {
                inside: '中で、出てる……あったかい……海凪、いっぱい、もらった、さぁ……',
                outside: '……顔、見てぇ。海凪、ちゃんと受け止めたよ……？',
                oral_swallow: 'おにーさん……すごく、いっぱい……ふぁ、苦かったぁ……',
                oral_spit: 'んっ、ぷはぁ……海凪、初めて、だから……許して、ね……',
                face: 'やぁ……顔に、いっぱい……海凪、汚れちゃった、さぁ……',
                chest: 'えへへ……胸、あったかい……みーちゃん、嬉しい、かも……',
                belly: 'おっきい、いっぱい……海凪、お腹いっぱい、だぁ……'
            }
        }
    },

    hinata: {
        pace: 'fast',
        voiceTone: 'mature',
        kink: 'command',
        sensitivities: { neck: 1.5, waist: 1.4, ears: 1.2, chest: 1.1 },
        preferredActions: ['deep', 'fast', 'kiss'],
        dislikedActions: ['tease'],
        specialAction: {
            id: 'bite_neck',
            text: '首筋に甘く噛みつく',
            zone: 'neck',
            pleasure: 20,
            affection: 7,
            line: 'あかんっ……そこ噛まれたら、ほんま、力抜けるって……'
        },
        flavorLines: {
            kiss: 'ちゅぅ……ふぅ、舌、絡めるん……うちもやり返すで……',
            touch: 'ん、もっと強く触ってええんやで……気ぃ遣わんと……',
            whisper: 'ふっ、関西弁で囁くん？　えらい色っぽいやん……',
            undress: '見られるん、慣れてへんわ……あんま、見んといて……',
            slow: 'なんでそんなにゆっくりやねん……はよ、奥まで……',
            fast: 'そや、それ……うちが欲しかった速さや……もっと……！',
            deep: 'ひゃうっ……奥、突かれてる……壊して、ええで……',
            climax: 'んあっ……あんた、ほんま最高や……うちも、イくっ……！'
        },
        finishPreference: {
            inside: 'unlocked',
            oralSwallow: 'eager',
            face: 'ok',
            preferredFinish: 'inside',
            reactionTone: {
                inside: 'ほんま……奥に出てる……うち、満たされてもうた……',
                outside: 'もったいない……次は、ちゃんと中で頼むわ？',
                oral_swallow: 'ふぅ……全部、いただいたで。男前な味、しよったわ……',
                oral_spit: 'ぷはっ……はぁ、濃いなぁ……気持ち、伝わってきたわ……',
                face: 'んっ、顔にかかった……熱っ、でも嫌いやないで……',
                chest: '胸の上、たぷたぷ……あんたの匂い、染みついてもうた……',
                belly: 'お腹、熱っ……うち、ちゃんと女として、見てもろうたんやな……'
            }
        }
    },

    sakura: {
        pace: 'slow',
        voiceTone: 'timid',
        kink: 'praise',
        sensitivities: { fingertip: 1.6, lips: 1.4, ears: 1.2 },
        preferredActions: ['kiss', 'whisper', 'slow'],
        dislikedActions: ['fast', 'undress'],
        specialAction: {
            id: 'praise_kiss',
            text: '「きれいだよ」と囁いて唇に触れる',
            zone: 'lips',
            pleasure: 16,
            affection: 9,
            line: '……っ、そんな、こと、言われたら……涙、出ちゃう……'
        },
        flavorLines: {
            kiss: '……ん、ちゅ……あの、わたし、初めて……上手く、できなくて……',
            touch: 'ひゃ……指、つめたい……でも、嬉しい……',
            whisper: '……声、ぞくぞくする……もっと、聞きたい、です……',
            undress: 'まっ……まだ、こころの、準備が……',
            slow: 'ゆっくり、で、お願い……まだ、痛い……',
            fast: 'こ、怖い……お願い、もっと、優しく……',
            deep: '……っ、深いの、苦しい、けど……あったかい……',
            climax: '……っ、こわい、のに……気持ち、いい……んっ、ぁ……！'
        },
        finishPreference: {
            inside: 'requiresConsent',
            oralSwallow: 'reluctant',
            face: 'forbidden',
            preferredFinish: 'belly',
            reactionTone: {
                inside: '……っ、中、いっぱい……怖い、はずなのに……あったかい……',
                outside: '……ありがとう……ちゃんと、考えてくれて……',
                oral_swallow: '……っ、ん、ん……ぷはぁ……上手く、できなかった、ですか……？',
                oral_spit: '……ふぅ……ごめんなさい、最後まで、できなくて……',
                chest: '……あ、胸……ぬるい、けど……嫌、じゃない……です……',
                belly: '……っ、おなかに……たくさん……わたし、女の子になれた、かも……'
            }
        }
    },

    aoi: {
        pace: 'slow',
        voiceTone: 'cool',
        kink: 'tease',
        sensitivities: { neck: 1.4, ears: 1.3, fingertip: 1.2, waist: 1.1 },
        preferredActions: ['slow', 'kiss', 'tease'],
        dislikedActions: ['fast'],
        specialAction: {
            id: 'tease_collarbone',
            text: '焦らすように鎖骨をなぞる',
            zone: 'neck',
            pleasure: 19,
            affection: 8,
            line: '……ふぅ、わざと焦らしてるでしょ。……いい度胸ね、続けて。'
        },
        flavorLines: {
            kiss: 'ん……ちゅ。……上手いわね、もっと深く、して。',
            touch: 'ふ……指、上手く動くじゃない……感心したわ……',
            whisper: '……いい声ね。私だけに、聞かせて。',
            undress: '……見ていいわ。ただし、私の許す範囲で、ね。',
            slow: '……このまま、私が満足するまで。あなたのペースじゃ、ダメ。',
            fast: '……乱暴ね。もう少し、頭を使いなさい。',
            deep: '……っ、奥、まで……認めるわ、悪くない……',
            climax: '……ばか、見ないで……っ、見ないでって……んっ……！'
        },
        finishPreference: {
            inside: 'unlocked',
            oralSwallow: 'ok',
            face: 'ok',
            preferredFinish: 'inside',
            reactionTone: {
                inside: '……ふぅ……ちゃんと、奥まで届いたわね。私の身体、覚えてくれた？',
                outside: '……抜く必要、あったかしら。次は、許さないわよ？',
                oral_swallow: '……ん、ふっ……あなたの味、覚えておくわ。',
                oral_spit: '……はぁ、結構な量ね。次は、もう少し堪えてみて？',
                face: '……顔にまで、ね。あなた、案外乱暴ね。嫌いじゃないけど。',
                chest: '……胸、汚れたわ。責任、取って拭いてくれる？',
                belly: '……お腹に、温かいの。なんだか、満たされた気分よ。'
            }
        }
    },

    miyu: {
        pace: 'gentle',
        voiceTone: 'gentle',
        kink: 'cherish',
        sensitivities: { thigh: 1.5, chest: 1.3, ears: 1.2 },
        preferredActions: ['kiss', 'slow', 'touch'],
        dislikedActions: ['fast'],
        specialAction: {
            id: 'stroke_thigh',
            text: '太ももの内側をゆっくりなでる',
            zone: 'thigh',
            pleasure: 17,
            affection: 7,
            line: 'やぁ……みゆの、太もも、内側は、だめばい……力、入らんくなる……'
        },
        flavorLines: {
            kiss: 'ん、ちゅ……ふぅ……お兄さんの唇、あったかかぁ……',
            touch: 'ひゃっ……そ、そぎゃんとこ、触ったら……',
            whisper: 'ん……耳、こそばゆかー……でも、嬉しか……',
            undress: '見ないでぇ……お腹、ふっくらしとるけん……',
            slow: 'ゆっくり……みゆ、急かされるん、苦手で……',
            fast: 'はやか……はやかとよ……ちょっと、待って……',
            deep: 'はぁん……奥、ジンとする……溶けてしまうばい……',
            climax: 'お兄さんっ、みゆ、もう……イくっ……んあぁっ！'
        },
        finishPreference: {
            inside: 'requiresConsent',
            oralSwallow: 'shy',
            face: 'shy',
            preferredFinish: 'chest',
            reactionTone: {
                inside: 'お兄さん……奥で、出してくれたとね……みゆ、お嫁さんになれるかも……',
                outside: 'んん……外も、いいけんね。みゆの肌、いっぱい汚して……',
                oral_swallow: 'んぐっ……ぷはぁ……苦かばってん、お兄さんのだから、嫌じゃなか……',
                oral_spit: 'んっ、ぷっ……はぁ、こんなにいっぱい……',
                face: 'やぁ……顔は、お嫁にいけんくなる、よぉ……',
                chest: 'たぷん、って音、するばい……みゆの胸、お兄さんでいっぱい……',
                belly: 'おなか、ぽかぽかするばい……お兄さんの、ぬくもり……'
            }
        }
    },

    rin: {
        pace: 'fast',
        voiceTone: 'sporty',
        kink: 'challenge',
        sensitivities: { thigh: 1.5, back: 1.4, waist: 1.2 },
        preferredActions: ['fast', 'deep', 'touch'],
        dislikedActions: ['slow'],
        specialAction: {
            id: 'wrestle_back',
            text: '背中の筋肉を強く揉みほぐす',
            zone: 'back',
            pleasure: 18,
            affection: 7,
            line: 'んあっ……そこ、毎日酷使してるとこ……ずるい、効きすぎ……！'
        },
        flavorLines: {
            kiss: 'ちゅ……ふぅ、勝負みたいに、もっと激しく、いこ……！',
            touch: 'んっ、力強い手……運動部の手とちがう、優しい手だ……',
            whisper: 'ふっ……耳元、攻めるとか、ずるい技だな……',
            undress: 'いいよ、見て。鍛えてんだから、自信ある……っ、でも恥ずい！',
            slow: 'うー、もどかしいって！　もっと、ガンガン来てよ……！',
            fast: 'そうそう、それっ……負けないから、もっと速く……！',
            deep: 'ひゃっ、深い……奥、ガンガン突かれて、勝てない……！',
            climax: 'んっ、負けるっ……あたし、イくっ、んあぁぁっ……！'
        },
        finishPreference: {
            inside: 'requiresConsent',
            oralSwallow: 'eager',
            face: 'ok',
            preferredFinish: 'face',
            reactionTone: {
                inside: '中、来た……っ、これ、すごっ……あたし、負けたかも……',
                outside: 'もー、お兄さんも我慢ばかりだな……試合終了、ってこと？',
                oral_swallow: 'んぐっ、んっ……ふは、栄養ドリンクみたい……ごちそうさま！',
                oral_spit: 'ぷはっ、はぁ、結構出るね……運動部の汗より塩辛い、かも……',
                face: 'おお、顔に直撃……これ、ハイスコアじゃん……！',
                chest: 'んん、胸、汗だくなのに、お兄さんでもベタベタになっちゃった……',
                belly: 'お腹、熱っ……試合後のアイシングが必要かも、なんてね……'
            }
        }
    },

    momoka: {
        pace: 'slow',
        voiceTone: 'elegant',
        kink: 'forbidden',
        sensitivities: { neck: 1.4, fingertip: 1.4, ears: 1.2 },
        preferredActions: ['kiss', 'slow', 'whisper'],
        dislikedActions: ['fast', 'undress'],
        specialAction: {
            id: 'kiss_nape',
            text: 'うなじにそっと唇を寄せる',
            zone: 'neck',
            pleasure: 18,
            affection: 8,
            line: 'あぁ……うなじは……はしたない、けど……はぁ、力入らんようになって……'
        },
        flavorLines: {
            kiss: 'ん……はしたない真似、どすなぁ……でも、嫌い、やない……',
            touch: 'やぁ……お止めやす……そんな、お行儀の悪い……',
            whisper: '……耳元で囁くんは、ようない、どすえ……ぞくぞくしてしまう……',
            undress: 'やめておくれやす……着物の方が、安心、どす……',
            slow: '……どす、お上手。ゆっくり、味わいとうて……',
            fast: 'ひゃっ……そないに、あらあらしい真似は……',
            deep: 'んっ、奥……ようけ、来てはる……はしたない、けど……',
            climax: 'あ、あかん……ももか、もうあかんどす……んっ、ぁ……！'
        },
        finishPreference: {
            inside: 'requiresConsent',
            oralSwallow: 'shy',
            face: 'forbidden',
            preferredFinish: 'inside',
            reactionTone: {
                inside: '……んっ、奥で……ようけ、いただいて、おしまい……ももか、嬉しゅうて……',
                outside: '……はしたない真似、させてしもうて……ようおすか、こんな姿で……',
                oral_swallow: '……ふっ、ん……お味、覚えました、どす……',
                oral_spit: '……っ、ふぅ……お行儀よう、できなんで……堪忍どす……',
                chest: '……お胸に、こんな……ももか、はしたない女、どすなぁ……',
                belly: '……おなかが、ぽっと、熱おすなぁ……',
            }
        }
    },

    kaede: {
        pace: 'gentle',
        voiceTone: 'sweet',
        kink: 'cherish',
        sensitivities: { waist: 1.5, ears: 1.3, lips: 1.2 },
        preferredActions: ['kiss', 'touch', 'whisper'],
        dislikedActions: ['fast'],
        specialAction: {
            id: 'embrace_waist',
            text: '腰を後ろから抱きしめる',
            zone: 'waist',
            pleasure: 17,
            affection: 8,
            line: 'やぁ……お腰、ぎゅってされたら……かえで、お料理できなくなっちゃう……'
        },
        flavorLines: {
            kiss: 'ん、ちゅ……はぁ、唇の味、覚えちゃった……',
            touch: 'ひゃ……手が、おっきい……守られてる、みたい……',
            whisper: 'ん、耳元……だめ、お料理のレシピ、飛んじゃう……',
            undress: '……みんなに見せられないとこ、見られちゃってる……',
            slow: 'ゆっくり、好き……かえで、お世話されるの、慣れてないから……',
            fast: 'はやっ……待って、心臓、追いつかないっ……',
            deep: 'はぁん……奥、温かい……かえでの、満たされちゃう……',
            climax: 'んっ、ぁ……かえで、もうっ、いっぱい……んあぁっ……！'
        },
        finishPreference: {
            inside: 'requiresConsent',
            oralSwallow: 'reluctant',
            face: 'shy',
            preferredFinish: 'belly',
            reactionTone: {
                inside: '……あったかいの、お腹いっぱい……かえで、ちゃんとお嫁さん、できるかな？',
                outside: '……拭いてあげるから、じっとしててね？　もう、世話焼かせちゃって。',
                oral_swallow: 'んぅ……ふぁ、はぁ……お料理の味見、よりずっと……熱い、ね……',
                oral_spit: 'ぷはっ、ふぅ……かえで、上手にできた、かな……？',
                face: 'やだぁ、顔は……写真撮らないで、絶対だよ……？',
                chest: '胸、たぷん、ってしてる……かえでの体、覚えてくれた？',
                belly: 'おなか、ぽかぽか……これ、お料理してあげたい気分になる、ね……'
            }
        }
    },

    yuki: {
        pace: 'slow',
        voiceTone: 'timid',
        kink: 'praise',
        sensitivities: { lips: 1.5, fingertip: 1.5, ears: 1.3 },
        preferredActions: ['kiss', 'whisper', 'slow'],
        dislikedActions: ['fast', 'deep'],
        specialAction: {
            id: 'gentle_lips',
            text: '指先で唇をそっとなぞる',
            zone: 'lips',
            pleasure: 16,
            affection: 9,
            line: '……ゆきの、唇、なぞられただけで……ふやん……'
        },
        flavorLines: {
            kiss: 'ちゅっ……はぁ、ふわふわするだじゃ……',
            touch: 'ひゃっ……ゆきの、こんな小さい体、こわれちゃうだじゃ……',
            whisper: 'ん、耳……りんごの香り、するかな……？',
            undress: 'やだぁ……ゆき、まだちっちゃいのに……',
            slow: 'ゆっくり……ゆき、急なの、こわい、だから……',
            fast: 'こわいよぉ……ゆっくり、して……',
            deep: '……っ、深いの、苦しい……でも、あったかい……',
            climax: '……っ、ゆきっ、もう、ふやん……んっ、ぁぁ……！'
        },
        finishPreference: {
            inside: 'forbidden',
            oralSwallow: 'forbidden',
            face: 'forbidden',
            preferredFinish: 'belly',
            reactionTone: {
                outside: '……っ、ゆきの、お外に……あったかい、だじゃ……',
                chest: 'ふやぁ……ゆきの胸、まだちっちゃいのに……ぬるぬる、しちゃってる……',
                belly: 'お、お腹……あったかぁい……ゆき、お腹、いっぱい……'
            }
        }
    },

    nagisa: {
        pace: 'slow',
        voiceTone: 'mature',
        kink: 'tease',
        sensitivities: { neck: 1.4, back: 1.4, fingertip: 1.2 },
        preferredActions: ['deep', 'slow', 'kiss'],
        dislikedActions: ['fast'],
        specialAction: {
            id: 'trace_spine',
            text: '背筋を指でつーっとなぞる',
            zone: 'back',
            pleasure: 19,
            affection: 8,
            line: '……ふっ、背筋、ぞくぞくする……あなた、覚えがあるのね……'
        },
        flavorLines: {
            kiss: 'ん……ちゅ。……長いキスは、好きよ。覚えておいて。',
            touch: '……指、上手。あなた、こういうの慣れてるの？',
            whisper: '……いい声。波音みたいに、私を満たしてくれる。',
            undress: '……見ていいわ。私は、見られる方が好きだから。',
            slow: 'そう……そのまま、ゆっくり……時間、もう気にしないで。',
            fast: '……荒っぽいのは、好きじゃない。落ち着きなさい。',
            deep: '……ふぅ、奥まで、届いてる。あなたの形、覚えるわ……',
            climax: '……っ、なぎさ、イく……んっ、覚えてて、この声……'
        },
        finishPreference: {
            inside: 'unlocked',
            oralSwallow: 'ok',
            face: 'ok',
            preferredFinish: 'inside',
            reactionTone: {
                inside: '……ふぅ、奥まで来てるわ。あなたの形、ちゃんと覚えたから。',
                outside: '……抜くの、もったいなかったわね。次は、許さないから。',
                oral_swallow: '……ん、ふっ……潮の味みたい。あなた、海の男ね。',
                oral_spit: '……ふぅ、ごめんなさい、最後まで上手くできなかった。',
                face: '……ふっ、顔射ね。なかなか、男前な真似するじゃない。',
                chest: '……胸、こんなに濡らされて。責任、取ってもらうわよ？',
                belly: '……お腹、温かい。波音みたいに、心地いいわ。'
            }
        }
    },

    kokoa: {
        pace: 'fast',
        voiceTone: 'sunny',
        kink: 'challenge',
        sensitivities: { neck: 1.4, waist: 1.3, ears: 1.2 },
        preferredActions: ['fast', 'kiss', 'touch'],
        dislikedActions: ['slow'],
        specialAction: {
            id: 'sing_in_ear',
            text: '耳元で「ここあのうた」を口ずさむ',
            zone: 'ears',
            pleasure: 18,
            affection: 8,
            line: 'やぁんっ……うたいながら、なんてずるいさー……ここあ、勝てんっ……'
        },
        flavorLines: {
            kiss: 'ちゅっ、ちゅぅっ……ここあ、キスいっぱい好きさー！',
            touch: 'ふぁっ……そこ、ダンスのときに使う筋肉だじゃ……ずるい……',
            whisper: 'んっ、耳……お歌、止まっちゃう……',
            undress: 'みーちゃんには内緒さー……ここあだけ、見て……',
            slow: 'えー、もっと激しくしてもいいんだよ？　ここあ、元気だから！',
            fast: 'そうそう、それぐらいがいいさー！　もっとっ、もっと……！',
            deep: 'ひゃうっ……奥、お歌、忘れちゃう……！',
            climax: 'やぁんっ……ここあ、イくっ、おうたみたいに、んあぁっ……！'
        },
        finishPreference: {
            inside: 'requiresConsent',
            oralSwallow: 'eager',
            face: 'ok',
            preferredFinish: 'chest',
            reactionTone: {
                inside: '中、来たさー……ここあのお腹、お兄さんのでいっぱいだじゃ……',
                outside: 'もー、外なんてもったいないさー！　次は中で、ね？',
                oral_swallow: 'ふぅ、ごっくん……塩っぱくて、お兄さんの味さー！',
                oral_spit: 'ぷはっ……ここあ、初めて、だから、許してね……？',
                face: 'やぁんっ、顔に直撃さー！　お歌、汚れちゃった……',
                chest: 'やったぁ、お胸にいっぱい！　ここあ、これが一番うれしいさー！',
                belly: 'おなか、ぽかぽかさー……お兄さん、いっぱい出したね？'
            }
        }
    }
};

/**
 * プロファイル取得（未定義キャラはデフォルト返却）
 * @param {string} characterId
 * @returns {object}
 */
function getIntimacyProfile(characterId) {
    return CHARACTER_INTIMACY_PROFILES[characterId] || {
        pace: 'balanced',
        voiceTone: 'gentle',
        kink: 'cherish',
        sensitivities: {},
        preferredActions: [],
        dislikedActions: [],
        specialAction: null,
        flavorLines: {}
    };
}

/**
 * アクションへの効果計算（快感・好感度の最終値）
 *
 * @param {object} profile - intimacy profile
 * @param {object} action - { id, lineKey, pleasure, affection, zone? }
 * @returns {{ pleasure: number, affection: number, isPreferred: boolean, isDisliked: boolean, sensitivityBoost: number }}
 */
function applyIntimacyModifiers(profile, action) {
    if (!profile) return {
        pleasure: action.pleasure || 0,
        affection: action.affection || 0,
        isPreferred: false,
        isDisliked: false,
        sensitivityBoost: 1
    };

    const actionKey = action.lineKey || action.id;
    const isPreferred = (profile.preferredActions || []).includes(actionKey);
    const isDisliked = (profile.dislikedActions || []).includes(actionKey);

    const zoneId = action.zone || null;
    const sensitivityBoost = zoneId && profile.sensitivities?.[zoneId]
        ? profile.sensitivities[zoneId]
        : 1;

    let pleasure = (action.pleasure || 0) * sensitivityBoost;
    let affection = action.affection || 0;

    if (isPreferred) {
        pleasure *= 1.3;
        affection += 1;
    }
    if (isDisliked) {
        pleasure *= 0.8;
        affection = Math.max(0, affection - 1);
    }

    return {
        pleasure: Math.round(pleasure),
        affection,
        isPreferred,
        isDisliked,
        sensitivityBoost
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EROGENOUS_ZONES,
        PLAY_ACTIONS,
        KINK_TYPES,
        VOICE_TONES,
        CHARACTER_INTIMACY_PROFILES,
        getIntimacyProfile,
        applyIntimacyModifiers
    };
}
