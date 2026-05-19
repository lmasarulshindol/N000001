// 泡児島ノベルゲーム - 性行為シーン・ステートマシン

const INTIMATE_STAGE_LABELS = {
    foreplay: '前戯',
    insert: '挿入',
    piston: '交尾',
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
            finished: false
        };
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

    static applyForeplayAction(session, action) {
        session.foreplayCount += 1;
        const pleasureGain = action.pleasure ?? 12;
        IntimateSceneSystem.addPleasure(session, pleasureGain);
        return {
            lines: action.lines || [{ speaker: 'heroine', text: action.response }],
            affection: action.affection ?? AffectionSystem.getIntimateAffection('foreplayChoice'),
            goInsert: !!action.goInsert,
            stayForeplay: !action.goInsert
        };
    }

    static applyPistonAction(session, action, scene) {
        session.pistonCount += 1;
        const pleasureGain = action.pleasure ?? 15;
        IntimateSceneSystem.addPleasure(session, pleasureGain);

        const position = scene.positions?.[session.position];
        const linePool = position?.piston?.[action.lineKey]
            || position?.piston?.default
            || scene.stages?.piston?.default
            || ['……んっ、あっ……！'];
        const text = linePool[session.pistonCount % linePool.length];

        const result = {
            lines: [{ speaker: 'heroine', text }],
            affection: action.affection ?? INTIMATE_CONFIG.pistonAffectionPerTurn,
            autoClimax: session.pleasure >= INTIMATE_CONFIG.pleasureMax
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
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        INTIMATE_CONFIG,
        INTIMATE_STAGE_LABELS,
        IntimateSceneSystem
    };
}
