// 泡児島ノベルゲーム - フィニッシュ（射精）アクション定義
// docs/フィニッシュ仕様.md F1〜F2 に対応

/**
 * フィニッシュ着弾先カタログ
 * - allowedStages: 出現できる stage 配列（無指定=どこでも）
 * - allowedPositions: 出現できる position 配列
 * - minAffection: 必要好感度
 * - isEndurance: 我慢系（プレイ続行）フラグ
 * - maxConsecutive: 連続使用上限（我慢用）
 */
const FINISH_ACTIONS = {
    inside: {
        id: 'inside',
        label: '中に出す',
        affection: 12,
        ending: 'creampie',
        requiresConsent: 'inside',
        minAffection: 50
    },
    outside: {
        id: 'outside',
        label: '外に出す',
        affection: 6
    },
    oral_swallow: {
        id: 'oral_swallow',
        label: '口の中に出す（飲んでもらう）',
        affection: 14,
        allowedStages: ['oral'],
        minAffection: 60
    },
    oral_spit: {
        id: 'oral_spit',
        label: '口の中に出す（出してもらう）',
        affection: 8,
        allowedStages: ['oral'],
        minAffection: 30
    },
    face: {
        id: 'face',
        label: '顔にかける',
        affection: 7,
        minAffection: 50
    },
    chest: {
        id: 'chest',
        label: '胸にかける',
        affection: 8,
        minAffection: 40
    },
    belly: {
        id: 'belly',
        label: 'お腹にかける',
        affection: 6
    },
    back: {
        id: 'back',
        label: '背中にかける',
        affection: 7,
        allowedPositions: ['doggy'],
        minAffection: 40
    },
    butt: {
        id: 'butt',
        label: 'お尻にかける',
        affection: 7,
        allowedPositions: ['doggy', 'cowgirl_reverse'],
        minAffection: 40
    },
    hold_on: {
        id: 'hold_on',
        label: '我慢する（プレイ続行）',
        isEndurance: true,
        pleasureDelta: -10,
        maxConsecutive: 3
    }
};

/**
 * 体位／ステージ別の出現候補マトリクス
 * キー: `${stage}/${position}` または stage 単独
 */
const FINISH_OPTIONS_BY_CONTEXT = {
    'piston/missionary': ['inside', 'outside', 'chest', 'face', 'belly', 'hold_on'],
    'piston/cowgirl': ['inside', 'outside', 'belly', 'chest', 'hold_on'],
    'piston/doggy': ['inside', 'outside', 'back', 'butt', 'hold_on'],
    oral: ['oral_swallow', 'oral_spit', 'face', 'chest', 'outside', 'hold_on'],
    paizuri: ['chest', 'face', 'outside', 'hold_on']
};

/**
 * 現状で出すべきフィニッシュ選択肢を返す
 *
 * @param {object} session  - intimate session
 * @param {object} profile  - キャラ profile（finishPreference 含む）
 * @param {object} gameState - characterAffections / routeProgress を参照
 * @returns {Array<object>} FINISH_ACTIONS のサブセット
 */
function getFinishOptions(session, profile, gameState) {
    const stage = session?.stage;
    const position = session?.position;
    const cid = session?.characterId;
    const affection = (gameState?.characterAffections?.[cid]) || 0;
    const consents = gameState?.routeProgress?.[cid] || {};
    const consecutive = session?.enduranceCount || 0;
    const pref = profile?.finishPreference || {};

    let candidateIds = [];
    if (stage === 'oral') {
        candidateIds = FINISH_OPTIONS_BY_CONTEXT.oral;
    } else if (stage === 'paizuri') {
        candidateIds = FINISH_OPTIONS_BY_CONTEXT.paizuri;
    } else {
        candidateIds = FINISH_OPTIONS_BY_CONTEXT[`piston/${position}`]
            || FINISH_OPTIONS_BY_CONTEXT['piston/missionary'];
    }

    return candidateIds
        .map((id) => FINISH_ACTIONS[id])
        .filter((action) => {
            if (!action) return false;
            if (action.allowedStages && !action.allowedStages.includes(stage)) return false;
            if (action.allowedPositions && !action.allowedPositions.includes(position)) return false;
            if (typeof action.minAffection === 'number' && affection < action.minAffection) {
                // consent 済みなら最低好感度ゲートを緩和
                if (!(action.id === 'inside' && consents.consentInside)) {
                    return false;
                }
            }
            if (action.id === 'inside' && pref.inside === 'forbidden') return false;
            if (action.id === 'oral_swallow' && pref.oralSwallow === 'forbidden') return false;
            if (action.id === 'face' && pref.face === 'forbidden') return false;
            if (action.id === 'hold_on' && consecutive >= (action.maxConsecutive || 3)) return false;
            return true;
        });
}

/**
 * 着弾先の地の文（共通）
 */
function buildFinishDescriptive(actionId, character) {
    const name = character.nickname || character.name;
    switch (actionId) {
        case 'inside':
            return `${name}の最奥に、熱が叩きつけられる。子宮を満たすように、何度も、何度も――`;
        case 'outside':
            return `引き抜いた瞬間、${name}の白い肌の上に、白濁が飛び散った。`;
        case 'oral_swallow':
            return `${name}は喉を鳴らし、こくり、と全てを飲み下した。`;
        case 'oral_spit':
            return `${name}は唇を離し、ぐったりと吐息を漏らした。口の端から、白い雫がひと筋。`;
        case 'face':
            return `${name}の顔に、白い飛沫がかかる。睫毛と頬を濡らして――`;
        case 'chest':
            return `${name}の胸に、ねっとりと白濁が落ちていく。`;
        case 'belly':
            return `${name}の柔らかなお腹に、温かい滴が広がっていった。`;
        case 'back':
            return `${name}の背筋に、白い線が描かれる。`;
        case 'butt':
            return `${name}の腰に、白濁が伝い落ちる。`;
        default:
            return '――熱が、放たれた。';
    }
}

/**
 * フィニッシュアクションの台詞配列を組み立てる
 */
function buildFinishLines(actionId, character, reactionLine, isPreferred) {
    const beats = [
        { speaker: 'narrator', text: '限界が、すぐそこまで迫っている。身体の奥から、抗えない衝動がせり上がる。' },
        { speaker: 'narrator', text: buildFinishDescriptive(actionId, character) }
    ];
    if (reactionLine) {
        beats.unshift({ speaker: 'heroine', text: reactionLine });
    }
    if (isPreferred) {
        beats.push({ speaker: 'narrator', text: '彼女の表情が、満ち足りたものに変わっていく。' });
    }
    return beats;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FINISH_ACTIONS,
        FINISH_OPTIONS_BY_CONTEXT,
        getFinishOptions,
        buildFinishDescriptive,
        buildFinishLines
    };
}
