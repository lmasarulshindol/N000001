/**
 * セリフ条件用 派生ステータス（DialogueStateDerivers）のテスト
 * 実行: node tests/run-dialogue-state-tests.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const require = createRequire(import.meta.url);

const { DialogueStateDerivers } = require(path.join(root, 'js', 'dialogue-state-derivers.js'));
const cd = require(path.join(root, 'js', 'character-data.js'));
const profiles = require(path.join(root, 'js', 'character-intimacy-profiles.js'));

let passed = 0;
let failed = 0;
function assert(c, msg) {
    if (c) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

const D = DialogueStateDerivers;

console.log('\n=== A: relationshipPhase ===');
assert(D.relationshipPhase(0) === 'stranger', 'A1: 0→stranger');
assert(D.relationshipPhase(29) === 'stranger', 'A2: 29→stranger');
assert(D.relationshipPhase(30) === 'acquaintance', 'A3: 30→acquaintance');
assert(D.relationshipPhase(49) === 'acquaintance', 'A4: 49→acquaintance');
assert(D.relationshipPhase(50) === 'friend', 'A5: 50→friend');
assert(D.relationshipPhase(69) === 'friend', 'A6: 69→friend');
assert(D.relationshipPhase(70) === 'intimate', 'A7: 70→intimate');
assert(D.relationshipPhase(89) === 'intimate', 'A8: 89→intimate');
assert(D.relationshipPhase(90) === 'devoted', 'A9: 90→devoted');
assert(D.relationshipPhase(100) === 'devoted', 'A10: 100→devoted');
assert(D.relationshipPhase(undefined) === 'stranger', 'A11: undefined→stranger');

console.log('\n=== B: arousalTier ===');
assert(D.arousalTier(0) === 'calm', 'B1: 0→calm');
assert(D.arousalTier(24) === 'calm', 'B2: 24→calm');
assert(D.arousalTier(25) === 'warm', 'B3: 25→warm');
assert(D.arousalTier(54) === 'warm', 'B4: 54→warm');
assert(D.arousalTier(55) === 'hot', 'B5: 55→hot（フィニッシュ解禁ライン）');
assert(D.arousalTier(84) === 'hot', 'B6: 84→hot');
assert(D.arousalTier(85) === 'burning', 'B7: 85→burning');
assert(D.arousalTier(100) === 'burning', 'B8: 100→burning');

console.log('\n=== C: scenePrivacy ===');
assert(D.scenePrivacy('inn', 'morning') === 'private', 'C1: inn は時間帯問わずprivate');
assert(D.scenePrivacy('inn', 'midnight') === 'private', 'C2: inn midnight→private');
assert(D.scenePrivacy('onsen', 'afternoon') === 'private', 'C3: onsen→private');
assert(D.scenePrivacy('port', 'morning') === 'public', 'C4: port morning→public');
assert(D.scenePrivacy('port', 'night') === 'semi_private', 'C5: port night→semi_private');
assert(D.scenePrivacy('beach', 'afternoon') === 'public', 'C6: beach 昼→public');
assert(D.scenePrivacy('beach', 'midnight') === 'private', 'C7: beach midnight→private');
assert(D.scenePrivacy('observatory', 'night') === 'private', 'C8: observatory night→private');
assert(D.scenePrivacy('forest_shrine', 'midnight') === 'private', 'C9: forest 深夜→private');
assert(D.scenePrivacy('forest_shrine', 'morning') === 'semi_private', 'C10: forest 朝→semi');

console.log('\n=== D: repeatFamiliarity ===');
assert(D.repeatFamiliarity(0) === 'first_time', 'D1: 0→first');
assert(D.repeatFamiliarity(1) === 'first_time', 'D2: 1→first（applyForeplay 後の初回）');
assert(D.repeatFamiliarity(2) === 'second_time', 'D3: 2→second');
assert(D.repeatFamiliarity(3) === 'third_time', 'D4: 3→third');
assert(D.repeatFamiliarity(4) === 'repeated', 'D5: 4→repeated');
assert(D.repeatFamiliarity(10) === 'repeated', 'D6: 10→repeated');

console.log('\n=== E: shameLevel ===');
assert(D.shameLevel('virgin', {}, 0) === 'high', 'E1: virgin+main未経験→high');
assert(D.shameLevel('virgin', { main: true }, 0) === 'medium', 'E2: virgin+mainあり→medium');
assert(D.shameLevel('experienced', {}, 0) === 'medium', 'E3: 経験者→medium');
assert(D.shameLevel('virgin', { creampie: true }, 0) === 'low', 'E4: creampie経験→low');
assert(D.shameLevel('virgin', {}, 6) === 'low', 'E5: 同行動5回+→low');

console.log('\n=== F: trustTier ===');
assert(D.trustTier(0, {}) === 'wary', 'F1: 低好感度+未経験→wary');
assert(D.trustTier(35, {}) === 'open', 'F2: 中好感度→open');
assert(D.trustTier(10, { main: true }) === 'open', 'F3: 低好感度でもmainあり→open');
assert(D.trustTier(80, { creampie: true }) === 'dedicated', 'F4: 高好感度+creampie→dedicated');
assert(D.trustTier(80, {}) === 'open', 'F5: 高好感度のみ→open');

console.log('\n=== G: timeMood ===');
assert(D.timeMood('morning') === 'fresh', 'G1: morning→fresh');
assert(D.timeMood('afternoon') === 'active', 'G2: afternoon→active');
assert(D.timeMood('evening') === 'sentimental', 'G3: evening→sentimental');
assert(D.timeMood('night') === 'bold', 'G4: night→bold');
assert(D.timeMood('midnight') === 'secret', 'G5: midnight→secret');
assert(D.timeMood('unknown') === 'active', 'G6: 未知→activeフォールバック');

console.log('\n=== H: isPreferredSpot ===');
assert(D.isPreferredSpot(cd.CHARACTERS.minagi, 'beach') === true, 'H1: minagi beach→true');
assert(D.isPreferredSpot(cd.CHARACTERS.minagi, 'onsen') === false, 'H2: minagi onsen→false');
assert(D.isPreferredSpot(cd.CHARACTERS.aoi, 'onsen') === true, 'H3: aoi onsen→true');
assert(D.isPreferredSpot(null, 'beach') === false, 'H4: char null→false');

console.log('\n=== I: dateContext ===');
assert(D.dateContext({}) === 'normal', 'I1: flags なし→normal');
assert(D.dateContext({ flags: { activeDate: null } }) === 'normal', 'I2: activeDate null→normal');
assert(
    D.dateContext({
        flags: { activeDate: { characterId: 'minagi', spotId: 'beach' } },
        currentSpot: 'beach'
    }) === 'date',
    'I3: 場所一致→date'
);
assert(
    D.dateContext({
        flags: { activeDate: { characterId: 'minagi', spotId: 'beach' } },
        currentSpot: 'port'
    }) === 'normal',
    'I4: 場所不一致→normal'
);

console.log('\n=== J: postFinishMood ===');
{
    const profMinagi = profiles.CHARACTER_INTIMACY_PROFILES?.minagi || {};
    // minagi の preferredFinish が 'inside' と仮定
    const insideMood = D.postFinishMood('inside', { finishPreference: { preferredFinish: 'inside' } }, 80);
    assert(insideMood === 'satisfied', 'J1: preferredFinish一致→satisfied');
    const forbiddenMood = D.postFinishMood('face', { finishPreference: { face: 'forbidden' } }, 80);
    assert(forbiddenMood === 'disappointed', 'J2: forbidden→disappointed');
    const lowAffMood = D.postFinishMood('outside', { finishPreference: {} }, 10);
    assert(lowAffMood === 'mixed', 'J3: 低好感度→mixed');
    const noFinish = D.postFinishMood(null, profMinagi, 50);
    assert(noFinish === 'mixed', 'J4: 未確定→mixed');
}

console.log('\n=== K: riskLevel ===');
assert(D.riskLevel('inn', 'midnight') === 'safe', 'K1: inn midnight→safe');
assert(D.riskLevel('port', 'morning') === 'forbidden', 'K2: port morning→forbidden');
assert(D.riskLevel('beach', 'evening') === 'risky', 'K3: beach evening→risky');
assert(D.riskLevel('observatory', 'night') === 'safe', 'K4: observatory night→safe');

console.log('\n=== L: snapshot（一括取得） ===');
{
    const character = cd.CHARACTERS.minagi;
    const gameState = {
        currentSpot: 'beach',
        timeOfDay: 'evening',
        characterAffections: { minagi: 75 },
        routeProgress: { minagi: { main: true } },
        flags: { activeDate: { characterId: 'minagi', spotId: 'beach' } }
    };
    const session = {
        pleasure: 60,
        actionCounts: { foreplay: { kiss: 3 }, piston: {}, oral: {} },
        finishedAction: null
    };
    const snap = D.snapshot({ character, gameState, session, actionId: 'kiss' });

    assert(snap.phase === 'intimate', 'L1: phase=intimate(aff=75)');
    assert(snap.arousal === 'hot', 'L2: arousal=hot(pl=60)');
    assert(snap.privacy === 'semi_private', 'L3: privacy=semi(beach evening)');
    assert(snap.familiarity === 'third_time', 'L4: kiss 3回目→third_time');
    assert(snap.shame === 'medium', 'L5: main経験あり virgin→medium');
    assert(snap.trust === 'open', 'L6: aff75 + main→open');
    assert(snap.timeMood === 'sentimental', 'L7: evening→sentimental');
    assert(snap.isPreferred === true, 'L8: minagi beach は preferred');
    assert(snap.date === 'date', 'L9: activeDate一致→date');
    assert(snap.risk === 'risky', 'L10: beach evening→risky');
    assert(snap.postFinish === 'mixed', 'L11: finishedActionなし→mixed');
}

console.log('\n=== M: snapshot エッジケース ===');
{
    const emptySnap = D.snapshot({ character: cd.CHARACTERS.minagi });
    assert(emptySnap.phase === 'stranger', 'M1: gameState空→phase=stranger');
    assert(emptySnap.arousal === 'calm', 'M2: session空→arousal=calm');
    assert(emptySnap.familiarity === 'first_time', 'M3: actionCounts空→first_time');
    assert(emptySnap.date === 'normal', 'M4: flags なし→normal');
}

console.log(`\n--- 派生ステータス: ${passed} 成功, ${failed} 失敗 ---\n`);
process.exit(failed > 0 ? 1 : 0);
