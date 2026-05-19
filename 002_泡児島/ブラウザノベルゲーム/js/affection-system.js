// 泡児島ノベルゲーム - 好感度システム
// オープニング（プロローグ）→ 探索 → ルート進行 → エンディング

const AFFECTION_CONFIG = {
    min: 0,
    max: 100,
    endingThreshold: 100,
    maxDays: 5,
    actionsPerDay: 3,
    energyCostPerAction: 34,
    prologueMeetBonus: 8,
    /** H・子作り各段階の好感度加算（会話と同様に上昇） */
    intimateAffection: {
        skinship: 3,
        foreplay: 6,
        foreplayChoice: 4,
        main: 10,
        mainChoice: 5,
        aftercare: 8
    },
    /** フェーズ解放しきい値（ランク表示用・ゲートには不使用） */
    thresholds: {
        skinship: 30,
        intimate: 50,
        foreplay: 65,
        main: 80,
        endingReady: 90
    },
    ranks: [
        { id: 'stranger', min: 0, max: 29, label: '知人', color: '#9ca3af' },
        { id: 'friend', min: 30, max: 49, label: '友達', color: '#60a5fa' },
        { id: 'close', min: 50, max: 69, label: '親しい', color: '#34d399' },
        { id: 'special', min: 70, max: 89, label: '特別', color: '#f472b6' },
        { id: 'bond', min: 90, max: 100, label: '心の絆', color: '#fbbf24' }
    ]
};

/** キャラ別会話選択肢（好感度変動つき） */
const CHARACTER_DIALOGUES = {
    minagi: [
        { id: 'cheer', text: '元気なね、好きだよ', affection: 4, response: 'えへへ、おにーさんも最高！' },
        { id: 'island', text: '島のこと教えて', affection: 3, response: '海がきれいでしょ？あたし毎日泳いでるの！' },
        { id: 'okinawa', text: '沖縄の話を聞く', affection: 5, response: 'おばぁのこと……でも、ここも好きになったよ。' },
        { id: 'rush', text: '急かす', affection: -2, response: '……ちょっと、ひどい。' }
    ],
    hinata: [
        { id: 'reliable', text: '頼りになるね', affection: 4, response: 'せやろ？任せとき！' },
        { id: 'family', text: '家族のこと', affection: 5, response: '弟たちのため……でも、ここでも頑張るわ。' },
        { id: 'cook', text: '料理が上手そう', affection: 3, response: '見てたん？ええな、今度作ったるわ。' }
    ],
    sakura: [
        { id: 'gentle', text: '優しく話しかける', affection: 5, response: '……ありがとう。少し、安心しました。' },
        { id: 'quiet', text: '静かな場所へ誘う', affection: 4, response: 'いいですね……一緒に行きましょう。' },
        { id: 'loud', text: '大きな声を出す', affection: -3, response: 'ひっ……や、やめてください。' }
    ],
    aoi: [
        { id: 'respect', text: '敬意を持って接する', affection: 5, response: '……分かってくれる人、珍しいわ。' },
        { id: 'intellect', text: '深い話題を振る', affection: 4, response: 'そういう話、好き。もっと聞かせて。' },
        { id: 'childish', text: '子供扱いする', affection: -4, response: '……失礼ね。' }
    ],
    miyu: [
        { id: 'slow', text: 'のんびり合わせる', affection: 4, response: 'そうそう、焦らんとよかばい。' },
        { id: 'nature', text: '自然の話', affection: 3, response: '島の花、きれいでしょ？' },
        { id: 'hurry', text: '急ぐ', affection: -2, response: 'はよせんと、困るばい。' }
    ],
    rin: [
        { id: 'sport', text: '一緒に運動しよう', affection: 5, response: '勝負だ！負けないよ！' },
        { id: 'praise', text: '活発さを褒める', affection: 3, response: '当然！あたし最強！' },
        { id: 'bore', text: 'つまらなそうにする', affection: -3, response: 'なんだよ、もう帰れよ。' }
    ],
    momoka: [
        { id: 'tea', text: 'お茶の話', affection: 4, response: 'お抹茶、淹れましょうか。' },
        { id: 'polite', text: '丁寧に接する', affection: 5, response: '……嬉しいです。' },
        { id: 'rude', text: '下品な冗談', affection: -4, response: '失礼です。' }
    ],
    kaede: [
        { id: 'help', text: '手伝いを申し出る', affection: 5, response: 'ありがとう……助かる。' },
        { id: 'meal', text: 'ご飯の話', affection: 4, response: '今夜、特別な料理作るね。' },
        { id: 'ignore', text: '無視する', affection: -3, response: '……そう。' }
    ],
    yuki: [
        { id: 'kind', text: '優しく微笑む', affection: 5, response: '……わたし、嬉しい。' },
        { id: 'apple', text: 'りんごの話', affection: 4, response: 'おじいちゃんと、畑の話、聞く？' },
        { id: 'scare', text: '怖がらせる', affection: -5, response: 'やだ……いや……' }
    ],
    nagisa: [
        { id: 'listen', text: '静かに聞く', affection: 5, response: '……あなたといると、落ち着く。' },
        { id: 'sea', text: '海の話', affection: 4, response: 'この島の海は、嘘みたいに青い。' },
        { id: 'push', text: '迫りすぎる', affection: -3, response: '……距離、守って。' }
    ],
    kokoa: [
        { id: 'dance', text: '踊りを褒める', affection: 4, response: '見て見て！あたしの得意なやつ！' },
        { id: 'guide', text: '島案内を頼む', affection: 3, response: '任せて！最高のコース教える！' },
        { id: 'boring', text: 'つまらない', affection: -2, response: 'えー、つまんないの？' }
    ]
};

const DEFAULT_DIALOGUES = [
    { id: 'nice', text: '優しく話す', affection: 3, response: '……ありがとう。' },
    { id: 'island', text: '島の感想を聞く', affection: 2, response: 'きれいな島ですよね。' },
    { id: 'cold', text: 'そっけない', affection: -2, response: 'そう、ですか……' }
];

class AffectionSystem {
    static getRank(affection) {
        const value = AffectionSystem.clamp(affection);
        return AFFECTION_CONFIG.ranks.find(
            (r) => value >= r.min && value <= r.max
        ) || AFFECTION_CONFIG.ranks[0];
    }

    static clamp(value) {
        return Math.max(AFFECTION_CONFIG.min, Math.min(AFFECTION_CONFIG.max, value));
    }

    static getAffection(gameState, characterId) {
        return gameState.characterAffections[characterId] || 0;
    }

    static changeAffection(gameState, characterId, delta) {
        if (!gameState.characterAffections) {
            gameState.characterAffections = {};
        }
        const before = AffectionSystem.getAffection(gameState, characterId);
        const after = AffectionSystem.clamp(before + delta);
        gameState.characterAffections[characterId] = after;

        if (!gameState.affectionHistory) {
            gameState.affectionHistory = [];
        }
        gameState.affectionHistory.push({
            characterId,
            delta,
            before,
            after,
            day: gameState.day,
            time: gameState.timeOfDay
        });

        return { before, after, delta: after - before };
    }

    static getUnlockedPhase(affection) {
        const a = affection;
        const t = AFFECTION_CONFIG.thresholds;
        if (a >= t.main) return 'main';
        if (a >= t.foreplay) return 'foreplay';
        if (a >= t.intimate) return 'intimate';
        if (a >= t.skinship) return 'skinship';
        return 'conversation';
    }

    static getPhaseLabel(phase) {
        const labels = {
            conversation: '会話',
            skinship: 'スキンシップ',
            intimate: '親密',
            foreplay: '前戯',
            main: '本番',
            aftercare: '余韻'
        };
        return labels[phase] || phase;
    }

    static canAdvanceToPhase(currentPhase, affection, targetPhase) {
        const order = ['conversation', 'skinship', 'intimate', 'foreplay', 'main', 'aftercare'];
        const unlocked = AffectionSystem.getUnlockedPhase(affection);
        const unlockedIdx = order.indexOf(unlocked);
        const targetIdx = order.indexOf(targetPhase);
        return targetIdx <= unlockedIdx + 1;
    }

    static getDialogues(characterId) {
        return CHARACTER_DIALOGUES[characterId] || DEFAULT_DIALOGUES;
    }

    static markMet(gameState, characterId, bonus = 0) {
        if (!gameState.metCharacters) {
            gameState.metCharacters = {};
        }
        if (!gameState.metCharacters[characterId]) {
            gameState.metCharacters[characterId] = true;
            if (bonus > 0) {
                return AffectionSystem.changeAffection(gameState, characterId, bonus);
            }
        }
        return null;
    }

    static applyPrologueBonuses(gameState, characterIds) {
        const results = [];
        characterIds.forEach((id) => {
            const r = AffectionSystem.markMet(
                gameState,
                id,
                AFFECTION_CONFIG.prologueMeetBonus
            );
            if (r) results.push({ characterId: id, ...r });
        });
        return results;
    }

    static spendAction(gameState) {
        if (!gameState.actionsToday) {
            gameState.actionsToday = 0;
        }
        gameState.actionsToday += 1;
        gameState.energy = Math.max(
            0,
            (gameState.energy || 100) - AFFECTION_CONFIG.energyCostPerAction
        );

        const dayEnded = AffectionSystem.advanceTimeIfNeeded(gameState);
        return { dayEnded, actionsToday: gameState.actionsToday };
    }

    static advanceTimeIfNeeded(gameState) {
        if (gameState.actionsToday < AFFECTION_CONFIG.actionsPerDay) {
            return false;
        }

        const times = ['morning', 'noon', 'evening', 'night'];
        let idx = times.indexOf(gameState.timeOfDay);
        if (idx < 0) idx = 0;

        if (idx < times.length - 1) {
            gameState.timeOfDay = times[idx + 1];
        } else {
            gameState.day += 1;
            gameState.timeOfDay = 'morning';
        }

        gameState.actionsToday = 0;
        gameState.energy = 100;
        return true;
    }

    static isLastDay(gameState) {
        return gameState.day >= AFFECTION_CONFIG.maxDays;
    }

    static shouldForceEnding(gameState) {
        return gameState.day > AFFECTION_CONFIG.maxDays;
    }

    static getHighestAffectionCharacter(gameState) {
        let bestId = null;
        let best = -1;
        Object.entries(gameState.characterAffections || {}).forEach(([id, val]) => {
            if (val > best) {
                best = val;
                bestId = id;
            }
        });
        return best > 0 && bestId
            ? { id: bestId, affection: best, character: CHARACTERS[bestId] }
            : null;
    }

    static getEndingCandidate(gameState) {
        const entries = Object.entries(gameState.characterAffections || {})
            .filter(([, v]) => v >= AFFECTION_CONFIG.endingThreshold)
            .sort((a, b) => b[1] - a[1]);

        if (entries.length > 0) {
            const [id, affection] = entries[0];
            return { type: 'heroine', id, affection, character: CHARACTERS[id] };
        }

        if (AffectionSystem.shouldForceEnding(gameState)) {
            const top = AffectionSystem.getHighestAffectionCharacter(gameState);
            if (top) {
                return { type: 'timeout', id: top.id, affection: top.affection, character: top.character };
            }
            return { type: 'island', id: null, affection: 0, character: null };
        }

        return null;
    }

    static markRouteProgress(gameState, characterId, phase) {
        if (!gameState.routeProgress) {
            gameState.routeProgress = {};
        }
        if (!gameState.routeProgress[characterId]) {
            gameState.routeProgress[characterId] = {};
        }
        gameState.routeProgress[characterId][phase] = true;
    }

    static getIntimateAffection(key) {
        return AFFECTION_CONFIG.intimateAffection[key] ?? 0;
    }

    static hasCompletedMain(gameState, characterId) {
        const p = gameState.routeProgress?.[characterId];
        return !!(p && p.main);
    }

    /** @deprecated 互換用 */
    static hasCompletedRoute(gameState, characterId) {
        return AffectionSystem.hasCompletedMain(gameState, characterId);
    }

    static getMetCharacterIds(gameState) {
        return Object.keys(gameState.metCharacters || {}).filter(
            (id) => gameState.metCharacters[id]
        );
    }

    static shouldTriggerEnding(gameState, characterId) {
        const affection = AffectionSystem.getAffection(gameState, characterId);
        return (
            affection >= AFFECTION_CONFIG.endingThreshold &&
            AffectionSystem.hasCompletedMain(gameState, characterId) &&
            !gameState.flags?.endingSeen
        );
    }

    static createInitialProgress() {
        return {
            metCharacters: {},
            routeProgress: {},
            affectionHistory: [],
            actionsToday: 0,
            endingSeen: false,
            endingCharacterId: null
        };
    }

    static resetGameProgress(gameState) {
        Object.assign(gameState, {
            day: 1,
            timeOfDay: 'morning',
            energy: 100,
            actionsToday: 0,
            characterAffections: {},
            metCharacters: {},
            routeProgress: {},
            affectionHistory: [],
            flags: {
                prologueSeen: false,
                endingSeen: false,
                endingCharacterId: null
            }
        });
        Object.keys(CHARACTERS).forEach((id) => {
            gameState.characterAffections[id] = 0;
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AFFECTION_CONFIG,
        AffectionSystem,
        CHARACTER_DIALOGUES,
        DEFAULT_DIALOGUES
    };
}
