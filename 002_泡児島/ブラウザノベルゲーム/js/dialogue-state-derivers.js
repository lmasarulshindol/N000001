// 泡児島ノベルゲーム - セリフ条件用 派生ステータス（純関数）
// 仕様: docs/セリフ条件ステータス仕様.md
//
// すべての関数は副作用を持たない。引数のみから決定論的に値を返す。
// セリフプール選択・条件分岐ロジックはこのファイルの戻り値だけを参照する。

const DialogueStateDerivers = {
    // ─────────────────────────────────────────────
    // 6.1 relationshipPhase
    // ─────────────────────────────────────────────
    PHASE_BOUNDS: { stranger: 30, acquaintance: 50, friend: 70, intimate: 90 },

    /**
     * 好感度を5段階の関係性ラベルに変換する。
     * stranger(0-29) / acquaintance(30-49) / friend(50-69) / intimate(70-89) / devoted(90-100)
     * @param {number} affection
     * @returns {'stranger'|'acquaintance'|'friend'|'intimate'|'devoted'}
     */
    relationshipPhase(affection) {
        const a = Number(affection) || 0;
        const b = DialogueStateDerivers.PHASE_BOUNDS;
        if (a < b.stranger) return 'stranger';
        if (a < b.acquaintance) return 'acquaintance';
        if (a < b.friend) return 'friend';
        if (a < b.intimate) return 'intimate';
        return 'devoted';
    },

    // ─────────────────────────────────────────────
    // 6.2 arousalTier
    // ─────────────────────────────────────────────
    AROUSAL_BOUNDS: { warm: 25, hot: 55, burning: 85 },

    /**
     * 興奮度(pleasure)を4段階に変換する。
     * @param {number} pleasure
     * @returns {'calm'|'warm'|'hot'|'burning'}
     */
    arousalTier(pleasure) {
        const p = Number(pleasure) || 0;
        const b = DialogueStateDerivers.AROUSAL_BOUNDS;
        if (p < b.warm) return 'calm';
        if (p < b.hot) return 'warm';
        if (p < b.burning) return 'hot';
        return 'burning';
    },

    // ─────────────────────────────────────────────
    // 6.3 scenePrivacy
    // ─────────────────────────────────────────────
    /**
     * 場所×時間帯から「人目の多さ」を導出する。
     * @param {string} spotId
     * @param {string} timeOfDay
     * @returns {'public'|'semi_private'|'private'}
     */
    scenePrivacy(spotId, timeOfDay) {
        const spot = spotId || 'port';
        const time = timeOfDay || 'morning';

        // 屋内（旅館・温泉）は時間帯問わず private
        if (spot === 'inn' || spot === 'onsen') {
            return 'private';
        }

        // 屋外（船着き場・砂浜・展望台・森の祠）は時間帯に依存
        const daylight = (time === 'morning' || time === 'afternoon');
        const dusk = (time === 'evening');
        const dark = (time === 'night' || time === 'midnight');

        if (spot === 'port') {
            // 港は人通りが基本多い
            if (daylight) return 'public';
            if (dusk) return 'semi_private';
            return 'semi_private';
        }
        if (spot === 'beach') {
            if (daylight) return 'public';
            if (dusk) return 'semi_private';
            return 'private';
        }
        if (spot === 'observatory') {
            if (daylight) return 'semi_private';
            if (dusk) return 'semi_private';
            return 'private';
        }
        if (spot === 'forest_shrine') {
            if (dark) return 'private';
            return 'semi_private';
        }
        return 'semi_private';
    },

    // ─────────────────────────────────────────────
    // 6.4 repeatFamiliarity
    // ─────────────────────────────────────────────
    /**
     * アクション選択回数を「慣れ」段階に変換する。
     * 入力: actionCounts に格納された値（applyForeplayAction 後の値、つまり1始まり）
     * @param {number} count 0=未選択, 1=今回が初回, 2=2回目, ...
     * @returns {'first_time'|'second_time'|'third_time'|'repeated'}
     */
    repeatFamiliarity(count) {
        const c = Math.max(0, Math.floor(Number(count) || 0));
        if (c <= 1) return 'first_time';
        if (c === 2) return 'second_time';
        if (c === 3) return 'third_time';
        return 'repeated';
    },

    // ─────────────────────────────────────────────
    // 6.5 shameLevel
    // ─────────────────────────────────────────────
    /**
     * 羞恥度を計算する。virgin + mainDone なしなら high。
     * creampie 経験あり、または何度も同じ行動なら low。
     * @param {string} experience virgin / experienced
     * @param {{main?:boolean, creampie?:boolean}|null} routeProgress
     * @param {number} repeatCount 同一行動の選択回数
     * @returns {'high'|'medium'|'low'}
     */
    shameLevel(experience, routeProgress, repeatCount = 0) {
        const r = routeProgress || {};
        if (r.creampie) return 'low';
        if (repeatCount >= 5) return 'low';
        if (experience === 'virgin' && !r.main) return 'high';
        return 'medium';
    },

    // ─────────────────────────────────────────────
    // 6.6 trustTier
    // ─────────────────────────────────────────────
    /**
     * 同意・信頼段階。重い話題（結婚・将来）の解放判定に使う。
     * @param {number} affection
     * @param {{main?:boolean, creampie?:boolean}|null} routeProgress
     * @returns {'wary'|'open'|'dedicated'}
     */
    trustTier(affection, routeProgress) {
        const a = Number(affection) || 0;
        const r = routeProgress || {};
        if (a >= 70 && r.creampie) return 'dedicated';
        if (a >= 30 || r.main) return 'open';
        return 'wary';
    },

    // ─────────────────────────────────────────────
    // 6.7 timeMood
    // ─────────────────────────────────────────────
    /**
     * 時間帯から雰囲気タグを得る。
     * @param {string} timeOfDay
     * @returns {'fresh'|'active'|'sentimental'|'bold'|'secret'}
     */
    timeMood(timeOfDay) {
        switch (timeOfDay) {
            case 'morning': return 'fresh';
            case 'afternoon': return 'active';
            case 'evening': return 'sentimental';
            case 'night': return 'bold';
            case 'midnight': return 'secret';
            default: return 'active';
        }
    },

    // ─────────────────────────────────────────────
    // 6.8 isPreferredSpot
    // ─────────────────────────────────────────────
    /**
     * キャラのお気に入り場所か判定。
     * @param {object} character
     * @param {string} spotId
     * @returns {boolean}
     */
    isPreferredSpot(character, spotId) {
        if (!character || !spotId) return false;
        const list = character?.stats?.preferredSpots || character?.preferredSpots || [];
        return list.includes(spotId);
    },

    // ─────────────────────────────────────────────
    // 6.9 dateContext
    // ─────────────────────────────────────────────
    /**
     * 現在のシーンがデート合流中か通常遭遇か判定。
     * @param {object} gameState
     * @returns {'date'|'normal'}
     */
    dateContext(gameState) {
        const ad = gameState?.flags?.activeDate;
        if (!ad || !ad.characterId) return 'normal';
        if (ad.spotId && gameState.currentSpot && ad.spotId !== gameState.currentSpot) {
            return 'normal';
        }
        return 'date';
    },

    // ─────────────────────────────────────────────
    // 6.10 postFinishMood
    // ─────────────────────────────────────────────
    /**
     * フィニッシュ後の満足度。preferredFinish 一致は satisfied、forbidden は disappointed。
     * @param {string|null} finishedAction
     * @param {object|null} profile
     * @param {number} affection
     * @returns {'satisfied'|'mixed'|'disappointed'}
     */
    postFinishMood(finishedAction, profile, affection) {
        if (!finishedAction) return 'mixed';
        const pref = profile?.finishPreference || {};
        if (pref.preferredFinish === finishedAction) return 'satisfied';
        const consentKey = finishedAction === 'oral_swallow' || finishedAction === 'oral_spit'
            ? 'oralSwallow'
            : finishedAction;
        if (pref[consentKey] === 'forbidden') return 'disappointed';
        if ((Number(affection) || 0) < 30) return 'mixed';
        return 'satisfied';
    },

    // ─────────────────────────────────────────────
    // 6.11 riskLevel
    // ─────────────────────────────────────────────
    /**
     * 「見つかる危険・背徳感」レベル。privacy と時間帯の組み合わせで導出。
     * @param {string} spotId
     * @param {string} timeOfDay
     * @returns {'safe'|'risky'|'forbidden'}
     */
    riskLevel(spotId, timeOfDay) {
        const p = DialogueStateDerivers.scenePrivacy(spotId, timeOfDay);
        if (p === 'private') return 'safe';
        if (p === 'semi_private') return 'risky';
        return 'forbidden';
    },

    // ─────────────────────────────────────────────
    // 一括取得ヘルパー
    // ─────────────────────────────────────────────
    /**
     * セリフ条件分岐用に派生ステータスを一括取得する。
     *
     * @param {{character:object, profile?:object, gameState?:object, session?:object, actionId?:string}} args
     * @returns {object} 派生ステータスのスナップショット
     */
    snapshot({ character, profile = null, gameState = {}, session = null, actionId = null } = {}) {
        const charId = character?.id;
        const affection = (gameState.characterAffections && charId)
            ? (gameState.characterAffections[charId] ?? 0)
            : 0;
        const routeProgress = (gameState.routeProgress && charId)
            ? (gameState.routeProgress[charId] || {})
            : {};
        const pleasure = session?.pleasure ?? 0;
        const repeatCount = (actionId && session?.actionCounts)
            ? (session.actionCounts.foreplay?.[actionId]
                || session.actionCounts.piston?.[actionId]
                || session.actionCounts.oral?.[actionId]
                || 0)
            : 0;
        const spotId = gameState.currentSpot;
        const timeOfDay = gameState.timeOfDay;

        return {
            phase: DialogueStateDerivers.relationshipPhase(affection),
            arousal: DialogueStateDerivers.arousalTier(pleasure),
            privacy: DialogueStateDerivers.scenePrivacy(spotId, timeOfDay),
            familiarity: DialogueStateDerivers.repeatFamiliarity(repeatCount),
            shame: DialogueStateDerivers.shameLevel(character?.stats?.experience, routeProgress, repeatCount),
            trust: DialogueStateDerivers.trustTier(affection, routeProgress),
            timeMood: DialogueStateDerivers.timeMood(timeOfDay),
            isPreferred: DialogueStateDerivers.isPreferredSpot(character, spotId),
            date: DialogueStateDerivers.dateContext(gameState),
            risk: DialogueStateDerivers.riskLevel(spotId, timeOfDay),
            postFinish: DialogueStateDerivers.postFinishMood(
                session?.finishedAction,
                profile,
                affection
            )
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DialogueStateDerivers };
}
