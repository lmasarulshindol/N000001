// 泡児島ノベルゲーム - 性行為シーン・ステートマシン

const INTIMATE_STAGE_LABELS = {
    foreplay: '前戯',
    insert: '挿入',
    piston: '交尾',
    oral: '口での奉仕',
    paizuri: '胸での奉仕',
    climax: '絶頂',
    aftercare: '余韻'
};

const INTIMATE_CONFIG = {
    pleasureMax: 100,
    pleasureClimaxMin: 55,
    foreplayToInsertPleasure: 25,
    climaxAffectionBonus: 12,
    pistonAffectionPerTurn: 4
};

class IntimateSceneSystem {
    static createSession(characterId, entryMode = 'main') {
        let stage = 'foreplay';
        if (entryMode === 'main') {
            stage = 'insert';
        } else if (entryMode === 'aftercare') {
            stage = 'aftercare';
        } else if (entryMode === 'piston') {
            stage = 'piston';
        }

        return {
            characterId,
            entryMode,
            stage,
            pleasure: entryMode === 'main' ? 20 : 0,
            position: 'missionary',
            pistonCount: 0,
            climaxCount: 0,
            foreplayCount: 0,
            oralCount: 0,
            enduranceCount: 0,
            finished: false,
            finishedAction: null,
            previousStage: null,
            // アクション別カウンタ。同一アクション連続選択時にセリフを変化させるため。
            actionCounts: { foreplay: {}, piston: {}, oral: {} }
        };
    }

    /** session.actionCounts が無い古い session を補強する */
    static ensureActionCounts(session) {
        if (!session.actionCounts) {
            session.actionCounts = { foreplay: {}, piston: {}, oral: {} };
        }
        ['foreplay', 'piston', 'oral'].forEach((k) => {
            if (!session.actionCounts[k]) session.actionCounts[k] = {};
        });
        return session.actionCounts;
    }

    static getStageLabel(stage) {
        return INTIMATE_STAGE_LABELS[stage] || stage;
    }

    static getPositionLabel(positionId, scene) {
        const pos = scene?.positions?.[positionId];
        return pos?.label || positionId;
    }

    static canClimax(session) {
        return session.pleasure >= INTIMATE_CONFIG.pleasureClimaxMin;
    }

    static addPleasure(session, amount) {
        session.pleasure = Math.min(
            INTIMATE_CONFIG.pleasureMax,
            Math.max(0, session.pleasure + amount)
        );
        return session.pleasure;
    }

    static advanceStage(session, nextStage) {
        session.stage = nextStage;
        return session;
    }

    static nextPosition(session, scene) {
        const ids = Object.keys(scene.positions || { missionary: {} });
        if (!ids.length) return session.position;
        const idx = ids.indexOf(session.position);
        session.position = ids[(idx + 1) % ids.length];
        return session.position;
    }

    static applyForeplayAction(session, action, characterId = null) {
        session.foreplayCount += 1;
        const counts = IntimateSceneSystem.ensureActionCounts(session);
        counts.foreplay[action.id] = (counts.foreplay[action.id] || 0) + 1;
        const variantIndex = counts.foreplay[action.id] - 1;

        const profile = (characterId && typeof getIntimacyProfile === 'function')
            ? getIntimacyProfile(characterId)
            : null;
        const mod = (profile && typeof applyIntimacyModifiers === 'function')
            ? applyIntimacyModifiers(profile, action)
            : null;

        const pleasureGain = mod ? mod.pleasure : (action.pleasure ?? 12);
        const affectionGain = mod
            ? mod.affection
            : (action.affection ?? (typeof AffectionSystem !== 'undefined'
                ? AffectionSystem.getIntimateAffection('foreplayChoice')
                : 5));

        IntimateSceneSystem.addPleasure(session, pleasureGain);

        // バリエーションプール優先。無ければ既存 action.lines を使用。
        let reactionLines;
        if (Array.isArray(action.linePool) && action.linePool.length > 0) {
            reactionLines = IntimateSceneSystem.pickVariantLines(action.linePool, variantIndex);
        } else {
            reactionLines = [...(action.lines || [{ speaker: 'heroine', text: action.response }])];
        }

        // 連続選択時の漸進的ナレーション（同じアクションを繰り返した時の体感変化）
        if (variantIndex === 1) {
            reactionLines.push({ speaker: 'narrator', text: '──二度目は、さっきよりも素直に応えてくれた。' });
        } else if (variantIndex === 2) {
            reactionLines.push({ speaker: 'narrator', text: '──三度目。彼女の身体は、もうあなたの手つきを覚えてしまっていた。' });
        } else if (variantIndex >= 3) {
            reactionLines.push({ speaker: 'narrator', text: '──同じ行為を重ねるたび、二人の境界がにじんでいく。' });
        }
        if (mod?.isPreferred) {
            reactionLines.push({ speaker: 'narrator', text: '彼女の吐息が一段と甘くなる。こういうのが好きらしい。' });
        }
        if (mod?.isDisliked) {
            reactionLines.push({ speaker: 'narrator', text: '少しだけ、表情が硬くなった。' });
        }
        if (mod?.sensitivityBoost && mod.sensitivityBoost >= 1.3) {
            reactionLines.push({ speaker: 'narrator', text: '触れた瞬間、小さく身体が震えた。' });
        }
        if (action.isSpecial) {
            reactionLines.push({ speaker: 'narrator', text: 'ぴくん、と大きく跳ねた。ここが、弱いんだ。' });
        }

        return {
            lines: reactionLines,
            affection: affectionGain,
            pleasureGain,
            goInsert: !!action.goInsert,
            goOral: !!action.goOral,
            goPaizuri: !!action.goPaizuri,
            stayForeplay: !action.goInsert && !action.goOral && !action.goPaizuri,
            isPreferred: !!mod?.isPreferred,
            isDisliked: !!mod?.isDisliked,
            sensitivityBoost: mod?.sensitivityBoost ?? 1
        };
    }

    /** 台詞プールの要素を { speaker, text } に正規化 */
    static normalizeIntimateLine(entry, fallbackSpeaker = 'heroine') {
        if (typeof entry === 'string') {
            return { speaker: fallbackSpeaker, text: entry };
        }
        if (entry && typeof entry.text === 'string') {
            return {
                speaker: entry.speaker || fallbackSpeaker,
                text: entry.text
            };
        }
        return { speaker: fallbackSpeaker, text: '……' };
    }

    static pickLinesFromPool(pool, index = 0) {
        if (!pool) {
            return [IntimateSceneSystem.normalizeIntimateLine('……んっ、あっ……！')];
        }
        if (Array.isArray(pool)) {
            if (pool.length === 0) {
                return [IntimateSceneSystem.normalizeIntimateLine('……')];
            }
            const picked = pool[index % pool.length];
            return [IntimateSceneSystem.normalizeIntimateLine(picked)];
        }
        return [IntimateSceneSystem.normalizeIntimateLine(pool)];
    }

    /**
     * バリエーション配列から index に応じた1バリエーション（複数行可）を取り出す。
     * 旧形式（フラット行配列）も透過処理する。
     *
     * 形式判定:
     *   - 新形式: [[{speaker,text},...], [{speaker,text},...]]  ← variant の配列
     *   - 旧形式: [{speaker,text}, {speaker,text}]              ← 行の配列
     *
     * @param {Array} pool
     * @param {number} variantIndex
     * @param {string} fallbackSpeaker
     * @returns {Array<{speaker:string,text:string}>}
     */
    static pickVariantLines(pool, variantIndex = 0, fallbackSpeaker = 'heroine') {
        if (!pool) {
            return [{ speaker: fallbackSpeaker, text: '……んっ、あっ……！' }];
        }
        if (!Array.isArray(pool)) {
            return [IntimateSceneSystem.normalizeIntimateLine(pool, fallbackSpeaker)];
        }
        if (pool.length === 0) {
            return [{ speaker: fallbackSpeaker, text: '……' }];
        }
        if (Array.isArray(pool[0])) {
            const variant = pool[variantIndex % pool.length];
            return variant.map((e) => IntimateSceneSystem.normalizeIntimateLine(e, fallbackSpeaker));
        }
        return pool.map((e) => IntimateSceneSystem.normalizeIntimateLine(e, fallbackSpeaker));
    }

    static applyPistonAction(session, action, scene, characterId = null) {
        session.pistonCount += 1;
        const counts = IntimateSceneSystem.ensureActionCounts(session);
        const key = action.lineKey || action.id || 'default';
        counts.piston[key] = (counts.piston[key] || 0) + 1;
        const variantIndex = counts.piston[key] - 1;

        const profile = (characterId && typeof getIntimacyProfile === 'function')
            ? getIntimacyProfile(characterId)
            : null;
        const mod = (profile && typeof applyIntimacyModifiers === 'function')
            ? applyIntimacyModifiers(profile, action)
            : null;

        const pleasureGain = mod ? mod.pleasure : (action.pleasure ?? 15);
        const affectionGain = mod
            ? mod.affection
            : (action.affection ?? INTIMATE_CONFIG.pistonAffectionPerTurn);

        IntimateSceneSystem.addPleasure(session, pleasureGain);

        const position = scene.positions?.[session.position];
        const linePool = position?.piston?.[key]
            || position?.piston?.default
            || scene.stages?.piston?.default;

        const lines = IntimateSceneSystem.pickVariantLines(linePool, variantIndex);

        // 同じテンポを連続選択した場合のナレーション
        if (variantIndex === 2) {
            lines.push({ speaker: 'narrator', text: '──同じテンポが、二人だけのリズムになっていく。' });
        } else if (variantIndex >= 4) {
            lines.push({ speaker: 'narrator', text: '──繰り返すたびに、彼女の輪郭が淡くなっていく。' });
        }
        if (mod?.isPreferred) {
            lines.push({ speaker: 'narrator', text: '息が合う。彼女のリズムが、こちらに重なっていく。' });
        }
        if (mod?.isDisliked) {
            lines.push({ speaker: 'narrator', text: 'かすかに眉が寄る。少し、辛そうだ。' });
        }

        const result = {
            lines,
            affection: affectionGain,
            pleasureGain,
            autoClimax: session.pleasure >= INTIMATE_CONFIG.pleasureMax,
            isPreferred: !!mod?.isPreferred,
            isDisliked: !!mod?.isDisliked
        };

        if (action.switchPosition) {
            IntimateSceneSystem.nextPosition(session, scene);
            result.lines.push({
                speaker: 'narrator',
                text: `体位を変えた。（${IntimateSceneSystem.getPositionLabel(session.position, scene)}）`
            });
        }

        return result;
    }

    static buildClimaxResult(session, scene) {
        session.climaxCount += 1;
        const position = scene.positions?.[session.position];
        const lines = position?.climax
            || scene.stages?.climax
            || [{ speaker: 'heroine', text: '……いくっ……んあぁっ……！' }];

        return {
            lines: Array.isArray(lines) ? lines : [lines],
            affection: INTIMATE_CONFIG.climaxAffectionBonus,
            nextStage: 'aftercare'
        };
    }

    static isSessionComplete(session) {
        return session.finished || session.stage === 'done';
    }

    /**
     * 口での奉仕アクションを適用する（F5）。
     */
    static applyOralAction(session, action, characterId = null) {
        session.oralCount = (session.oralCount || 0) + 1;
        const counts = IntimateSceneSystem.ensureActionCounts(session);
        counts.oral[action.id] = (counts.oral[action.id] || 0) + 1;
        const variantIndex = counts.oral[action.id] - 1;

        const profile = (characterId && typeof getIntimacyProfile === 'function')
            ? getIntimacyProfile(characterId)
            : null;
        const mod = (profile && typeof applyIntimacyModifiers === 'function')
            ? applyIntimacyModifiers(profile, action)
            : null;

        const pleasureGain = mod ? mod.pleasure : (action.pleasure ?? 14);
        const affectionGain = mod ? mod.affection : (action.affection ?? 3);
        IntimateSceneSystem.addPleasure(session, pleasureGain);

        let lines;
        if (Array.isArray(action.linePool) && action.linePool.length > 0) {
            lines = IntimateSceneSystem.pickVariantLines(action.linePool, variantIndex);
        } else {
            lines = [...(action.lines || [])];
        }
        if (mod?.isPreferred) {
            lines.push({ speaker: 'narrator', text: '唇の間から、甘い吐息が漏れる。嫌がってはいない。' });
        }
        if (mod?.isDisliked) {
            lines.push({ speaker: 'narrator', text: '小さく咳き込む。少し、無理をさせてしまった。' });
        }

        return {
            lines,
            affection: affectionGain,
            pleasureGain,
            autoClimax: session.pleasure >= INTIMATE_CONFIG.pleasureMax,
            isPreferred: !!mod?.isPreferred,
            isDisliked: !!mod?.isDisliked
        };
    }

    /**
     * フィニッシュアクション適用（F4）。
     *
     * @param {object} session    intimate session
     * @param {string} finishId   FINISH_ACTIONS のキー
     * @param {object} character  CHARACTERS の要素
     * @param {object} [gameState] routeProgress / characterAffections 参照
     */
    static applyFinishAction(session, finishId, character, gameState = null) {
        const finishAction = (typeof FINISH_ACTIONS !== 'undefined') ? FINISH_ACTIONS[finishId] : null;
        if (!finishAction) {
            return null;
        }

        const profile = (character?.id && typeof getIntimacyProfile === 'function')
            ? getIntimacyProfile(character.id)
            : null;
        const pref = profile?.finishPreference || {};

        // 我慢系: プレイ続行
        if (finishAction.isEndurance) {
            session.enduranceCount = (session.enduranceCount || 0) + 1;
            IntimateSceneSystem.addPleasure(session, finishAction.pleasureDelta || -10);
            return {
                type: 'endure',
                finishId,
                pleasureDelta: finishAction.pleasureDelta || -10,
                enduranceCount: session.enduranceCount,
                lines: [
                    { speaker: 'narrator', text: '──まだ、終わらせない。あと少しだけ、この時間を引き延ばす。' },
                    { speaker: 'narrator', text: '深く息を吐き、波打つ快感をやり過ごした。' }
                ]
            };
        }

        // 通常射精
        session.enduranceCount = 0;
        session.finished = true;
        session.finishedAction = finishId;

        const isPreferred = pref.preferredFinish === finishId;
        let affGain = finishAction.affection || 5;
        if (isPreferred) affGain += 3;

        // route progress: 中出しは consent 永続化
        if (gameState && finishId === 'inside') {
            if (!gameState.routeProgress) gameState.routeProgress = {};
            if (!gameState.routeProgress[character.id]) gameState.routeProgress[character.id] = {};
            gameState.routeProgress[character.id].creampie = true;
            gameState.routeProgress[character.id].consentInside = true;
        }

        const reactionLine = pref.reactionTone?.[finishId] || null;
        const lines = (typeof buildFinishLines === 'function')
            ? buildFinishLines(finishId, character, reactionLine, isPreferred)
            : [{ speaker: 'narrator', text: '熱が、放たれた。' }];

        return {
            type: 'finish',
            finishId,
            affection: affGain,
            isPreferred,
            lines
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        INTIMATE_CONFIG,
        INTIMATE_STAGE_LABELS,
        IntimateSceneSystem
    };
}
