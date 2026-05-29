// 泡児島ノベルゲーム - お誘い／デート抽選システム
// 各時間帯（午前・午後・夕方・夜・深夜）の開始時に、好感度80%以上のキャラから
// 確率でデートのお誘いが発生する。

const INVITATION_CONFIG = {
    /** 候補入りに必要な好感度（%） */
    minAffection: 80,
    /** 80% で 0.30 → 100% で 0.70 の線形補間 */
    probAt80: 0.30,
    probAt100: 0.70,
    /** 直前にお誘いを成立させたキャラは次の時間帯で除外（同人連続防止） */
    avoidConsecutiveSameInviter: true
};

/**
 * 時間帯ごとのデートテーマ
 * spots は「キャラの preferredSpots と交差」させて最終的にデート場所を決める。
 */
/**
 * 性格タイプ定義
 * tryRollInvitation で CHARACTERS[id].personality を参照してセリフを振り分ける
 */
const PERSONALITY_MAP = {
    minagi: 'active', hinata: 'active', rin: 'active', kokoa: 'active',
    sakura: 'shy', miyu: 'shy', kaede: 'shy', yuki: 'shy',
    aoi: 'cool', nagisa: 'cool',
    momoka: 'elegant'
};

const INVITATION_THEMES = {
    morning: {
        label: '午前デート',
        mood: '朝の散歩や朝食を楽しむ穏やかな時間',
        spots: ['inn', 'beach', 'port', 'observatory'],
        invitationsByPersonality: {
            active: [
                'おはよっ！朝の散歩、一緒に行こ！',
                '朝ごはん食べた？　あたしと競争しよ！',
                '波打ち際、走りに行かない？　気持ちいいよ！'
            ],
            shy: [
                'おはようございます……朝の散歩、ご一緒してもいいですか？',
                '朝食、一緒にどうですか？　起きたら……顔が見たくて。',
                'あの……朝の海、きれいで。一緒に見ませんか。'
            ],
            cool: [
                '散歩、付き合って。朝の空気は好き。',
                '起きてた？　少し歩かない。',
                '海沿い、行くけど。来る？'
            ],
            elegant: [
                'おはようございます。朝の散歩にお付き合い願えますか？',
                '朝食をご一緒にいかが？　素敵な朝ですし。',
                '潮風が心地よい朝ですね。ご一緒しません？'
            ]
        }
    },
    afternoon: {
        label: '午後デート',
        mood: '陽射しの中で活発に動くデート',
        spots: ['beach', 'observatory', 'forest_shrine', 'port'],
        invitationsByPersonality: {
            active: [
                '暇でしょ！？　付き合ってよ！',
                '海行こっ！今日めっちゃいい天気！',
                '展望台まで競争ね！負けたらジュース奢り！'
            ],
            shy: [
                'あの……お暇でしたら、少し付き合ってもらえますか。',
                '海を……見に行きたいのですが、一人だと少し。',
                '展望台から景色を見たいんです。ご一緒に……。'
            ],
            cool: [
                '暇？　ちょっと付き合って。',
                '海、見に行く。来るなら一緒に。',
                '展望台。景色がいいらしい。'
            ],
            elegant: [
                '午後のひととき、ご一緒にいかが？',
                '海が美しい時間ですわ。ご覧になりません？',
                '展望台からの眺め、お見せしたいの。'
            ]
        }
    },
    evening: {
        label: '夕方デート',
        mood: '夕焼けに染まる告白の時間帯',
        spots: ['observatory', 'beach', 'port', 'inn'],
        invitationsByPersonality: {
            active: [
                '夕焼け見よっ！あんたと見たいの！',
                '今夜の前にさ、ちょっとだけ時間ちょうだい！',
                '展望台来て！話したいことあるんだ！'
            ],
            shy: [
                '夕焼けを……一緒に見たい人がいるんです。来てくれますか？',
                'あの、少しだけ……ふたりの時間がほしくて。',
                '展望台に来てほしいんです。お話ししたいことが……。'
            ],
            cool: [
                '夕焼け、一緒に見ない。',
                '少し話がある。今夜の前に。',
                '展望台に来て。待ってる。'
            ],
            elegant: [
                '夕映えの海を、ご一緒に眺めません？',
                '今宵の前に、少しお時間をいただけますか。',
                '展望台で、お待ちしております。'
            ]
        }
    },
    night: {
        label: '夜デート',
        mood: '夜風と灯りに包まれる大人の時間',
        spots: ['inn', 'onsen', 'observatory', 'beach'],
        invitationsByPersonality: {
            active: [
                '今夜さ、二人で話そうよ！来て！',
                '星、見に行こ！部屋にも寄ってく？',
                'ねえねえ、夜の海って最高なんだよ！'
            ],
            shy: [
                '今夜……二人きりでお話ししたいです。来てくれますか？',
                '星を……一緒に見ませんか。',
                'あの……お部屋に、来てもらっても……いいですか。'
            ],
            cool: [
                '今夜、話がある。来て。',
                '星でも見に行く？',
                '部屋にいる。来たいなら。'
            ],
            elegant: [
                '今宵、おふたりでお話ししません？',
                '星が美しい夜ですわ。ご一緒に。',
                'お部屋にご案内してもよろしいかしら。'
            ]
        },
        onsenInvitations: {
            active: ['お風呂上がり！　湯気の中で待ってるね！'],
            shy: ['お風呂のあと……待っています。湯気ごしに、ね。'],
            cool: ['風呂上がり。湯気ごしに、話そう。'],
            elegant: ['湯上りにお待ちしております。']
        }
    },
    midnight: {
        label: '深夜の密会',
        mood: '誰にも見られない、ふたりだけの世界',
        spots: ['inn', 'onsen', 'forest_shrine'],
        invitationsByPersonality: {
            active: [
                '……眠れなくて。会いに来てよ。',
                '内緒で抜け出してきちゃった。ね、一緒にいて。',
                'こんな時間にごめん！でも、あんたじゃないとダメで。'
            ],
            shy: [
                '……眠れないんです。会いに来て……くれますか？',
                '誰にも見つからないところで……待ってます。',
                'こんな時間にごめんなさい。今夜は……あなたじゃないと。'
            ],
            cool: [
                '……眠れない。来て。',
                '誰にも見つからない場所にいる。',
                'こんな時間に悪い。でも、今はあなたがいい。'
            ],
            elegant: [
                '……眠れませんの。お側に来てくださる？',
                '人目のない場所でお待ちしております。',
                'こんな時刻に申し訳ございません。あなたでなくては。'
            ]
        },
        onsenInvitations: {
            active: ['お風呂で待ってる……誰もいない今がチャンスでしょ！'],
            shy: ['温泉に……います。二人きり、です。'],
            cool: ['温泉にいる。来るなら今。'],
            elegant: ['湯殿にてお待ちしております。']
        }
    }
};

/**
 * お誘い候補キャラ（好感度しきい値以上 & 既に会っている）を返す
 */
function pickInvitationCandidates(gameState) {
    if (!gameState || !gameState.characterAffections) return [];
    return Object.keys(gameState.characterAffections).filter((id) => {
        if (!gameState.metCharacters?.[id]) return false;
        const aff = gameState.characterAffections[id] || 0;
        return aff >= INVITATION_CONFIG.minAffection;
    });
}

/**
 * 好感度（80〜100）から発動確率を線形補間で算出。
 * 80% → 30%, 90% → 50%, 100% → 70%。
 */
function calculateInvitationProbability(affection) {
    if (affection < INVITATION_CONFIG.minAffection) return 0;
    const clamped = Math.min(100, affection);
    const t = (clamped - INVITATION_CONFIG.minAffection)
        / (100 - INVITATION_CONFIG.minAffection);
    return INVITATION_CONFIG.probAt80
        + (INVITATION_CONFIG.probAt100 - INVITATION_CONFIG.probAt80) * t;
}

/**
 * 時間帯テーマとキャラ嗜好からデート場所を1つ抽選。
 */
function pickDateSpot(theme, character, rng = Math.random) {
    const preferred = character?.stats?.preferredSpots || [];
    const intersection = theme.spots.filter((s) => preferred.includes(s));
    const pool = intersection.length ? intersection
        : (preferred.length ? preferred : theme.spots);
    if (!pool.length) return 'inn';
    return pool[Math.floor(rng() * pool.length)];
}

/**
 * 1時間帯1回だけお誘い抽選を行う本体。
 * - 既にこの時間帯でお誘い済みなら null。
 * - 候補から1人選び、確率に当たれば Invitation オブジェクトを返す。
 *
 * @param {object} gameState
 * @param {string} timeOfDay
 * @param {object} [opts]  rng / charactersMap を差し替え可能（テスト用）
 * @returns {object|null} { characterId, character, spotId, timeOfDay, theme, line }
 */
function tryRollInvitation(gameState, timeOfDay, opts = {}) {
    const rng = opts.rng || Math.random;
    const charactersMap = opts.charactersMap
        || (typeof CHARACTERS !== 'undefined' ? CHARACTERS : null);
    const theme = INVITATION_THEMES[timeOfDay];
    if (!theme || !gameState || !charactersMap) return null;

    const slotKey = `invitedAt_${gameState.day}_${timeOfDay}`;
    if (gameState.flags?.[slotKey]) return null;
    if (gameState.flags?.endingSeen) return null;

    let candidates = pickInvitationCandidates(gameState);
    if (!candidates.length) return null;

    if (INVITATION_CONFIG.avoidConsecutiveSameInviter) {
        const last = gameState.flags?.lastInviterId;
        const eligible = candidates.filter((id) => id !== last);
        if (eligible.length) candidates = eligible;
    }

    const pickedId = candidates[Math.floor(rng() * candidates.length)];
    const affection = gameState.characterAffections[pickedId] || 0;
    const prob = calculateInvitationProbability(affection);
    if (rng() >= prob) return null;

    const character = charactersMap[pickedId];
    if (!character) return null;

    const spotId = pickDateSpot(theme, character, rng);

    // personality（11種）はそのままだと invitationsByPersonality の4キーに合わないため、
    // 4バケット（active/shy/cool/elegant）へ正規化してから口調を選ぶ。
    const personality = (typeof getPersonalityBucket === 'function')
        ? getPersonalityBucket(character)
        : (PERSONALITY_MAP[pickedId] || 'shy');
    let line;

    if (theme.onsenInvitations && spotId === 'onsen') {
        const onsenPool = theme.onsenInvitations[personality] || theme.onsenInvitations.shy;
        line = onsenPool[Math.floor(rng() * onsenPool.length)];
    } else {
        const pool = theme.invitationsByPersonality?.[personality]
            || theme.invitationsByPersonality?.shy
            || ['……一緒に、いてくれる？'];
        line = pool[Math.floor(rng() * pool.length)];
    }

    return {
        characterId: pickedId,
        character,
        spotId,
        timeOfDay,
        theme,
        line
    };
}

/**
 * デート確定後にゲーム側で立てるフラグを返すヘルパー。
 */
function buildInvitationFlags(invitation) {
    return {
        slotKey: `invitedAt_${invitation.timeOfDay}`,
        lastInviterId: invitation.characterId,
        activeDate: {
            characterId: invitation.characterId,
            spotId: invitation.spotId,
            timeOfDay: invitation.timeOfDay
        }
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        INVITATION_CONFIG,
        INVITATION_THEMES,
        PERSONALITY_MAP,
        pickInvitationCandidates,
        calculateInvitationProbability,
        pickDateSpot,
        tryRollInvitation,
        buildInvitationFlags
    };
}
