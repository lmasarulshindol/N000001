/**
 * 時間帯5段階 & お誘い／デート抽選テスト
 */
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(__dirname, '..', 'js');

function loadScript(name) {
    vm.runInThisContext(fs.readFileSync(path.join(jsDir, name), 'utf8'), { filename: name });
}

loadScript('character-data.js');
loadScript('affection-system.js');
loadScript('invitation-system.js');

let passed = 0;
let failed = 0;
function assert(c, msg) {
    if (c) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

// --- 時間帯5段階 ---
console.log('\n=== 5段階時間帯 ===');
assert(TIME_OF_DAY_ORDER.length === 5, 'TIME_OF_DAY_ORDER は5段階');
['morning', 'afternoon', 'evening', 'night', 'midnight'].forEach((id, idx) => {
    assert(TIME_OF_DAY_ORDER[idx] === id, `${idx}番目は ${id}`);
});
assert(TIME_OF_DAY_LABELS.morning === '午前', 'morning ラベル');
assert(TIME_OF_DAY_LABELS.afternoon === '午後', 'afternoon ラベル');
assert(TIME_OF_DAY_LABELS.midnight === '深夜', 'midnight ラベル');
assert(AffectionSystem.normalizeTimeOfDay('noon') === 'afternoon',
    '旧 noon → afternoon に正規化');
assert(AffectionSystem.normalizeTimeOfDay('unknown') === 'morning',
    '不正値は morning にフォールバック');
assert(AffectionSystem.getTimeLabel('midnight') === '深夜', 'getTimeLabel midnight');
assert(AffectionSystem.getTimeLabel('noon') === '午後', 'getTimeLabel noon→午後');

// --- spendAction で時間帯進行 ---
console.log('\n=== spendAction の時間進行 ===');
{
    const state = {
        day: 1,
        timeOfDay: 'morning',
        energy: 100,
        actionsToday: 0,
        characterAffections: {},
        metCharacters: {},
        flags: {}
    };
    const r1 = AffectionSystem.spendAction(state);
    assert(state.timeOfDay === 'afternoon', '1回行動で morning→afternoon');
    assert(r1.timeAdvanced === true, 'timeAdvanced フラグ');
    assert(!r1.dayEnded, '1日目はまだ終わらない');

    AffectionSystem.spendAction(state); // afternoon→evening
    AffectionSystem.spendAction(state); // evening→night
    AffectionSystem.spendAction(state); // night→midnight
    assert(state.timeOfDay === 'midnight', '4回行動で midnight に到達');
    const r5 = AffectionSystem.spendAction(state); // midnight→next day morning
    assert(state.day === 2, '5回行動で日が進む');
    assert(state.timeOfDay === 'morning', '翌日は morning から');
    assert(r5.dayEnded === true, 'dayEnded フラグ');
}

// --- お誘い候補抽出 ---
console.log('\n=== pickInvitationCandidates ===');
{
    const gs = {
        characterAffections: { minagi: 90, hinata: 50, aoi: 85, miyu: 79 },
        metCharacters: { minagi: true, hinata: true, aoi: true, miyu: true },
        flags: {}
    };
    const cands = pickInvitationCandidates(gs);
    assert(cands.includes('minagi'), '好感度90 は候補');
    assert(cands.includes('aoi'), '好感度85 は候補');
    assert(!cands.includes('hinata'), '好感度50 は候補外');
    assert(!cands.includes('miyu'), '好感度79 は閾値未満で候補外');
}

// --- 確率計算 ---
console.log('\n=== calculateInvitationProbability ===');
assert(Math.abs(calculateInvitationProbability(80) - 0.30) < 1e-9, '80%→0.30');
assert(Math.abs(calculateInvitationProbability(90) - 0.50) < 1e-9, '90%→0.50');
assert(Math.abs(calculateInvitationProbability(100) - 0.70) < 1e-9, '100%→0.70');
assert(calculateInvitationProbability(79) === 0, '79%→0');
assert(calculateInvitationProbability(50) === 0, '50%→0');

// --- tryRollInvitation（確率制御テスト） ---
console.log('\n=== tryRollInvitation ===');
function makeRng(values) {
    let i = 0;
    return () => values[i++ % values.length];
}

{
    const gs = {
        day: 1,
        timeOfDay: 'evening',
        characterAffections: { minagi: 95 },
        metCharacters: { minagi: true },
        flags: {}
    };
    // 1回目:候補抽選=0(minagi), 2回目:確率判定=0.0(=必ず発動), 3回目:spot抽選=0, 4回目:line抽選=0
    const inv = tryRollInvitation(gs, 'evening', {
        rng: makeRng([0, 0, 0, 0]),
        charactersMap: CHARACTERS
    });
    assert(inv !== null, 'お誘いが発動する');
    assert(inv.characterId === 'minagi', '抽選キャラ=みなぎ');
    assert(inv.timeOfDay === 'evening', '時間帯=夕方');
    assert(typeof inv.line === 'string' && inv.line.length > 0, '誘い文句が入る');
    assert(typeof inv.spotId === 'string', 'デート場所抽選');
}

{
    const gs = {
        day: 1,
        timeOfDay: 'morning',
        characterAffections: { minagi: 80 },
        metCharacters: { minagi: true },
        flags: {}
    };
    // 確率判定 0.5 → 80%閾値の確率(0.30)を超えてるので発動しない
    const inv = tryRollInvitation(gs, 'morning', {
        rng: makeRng([0, 0.5]),
        charactersMap: CHARACTERS
    });
    assert(inv === null, '確率外なら null');
}

{
    // 既にこの時間帯でお誘い済みなら null
    const gs = {
        day: 2,
        timeOfDay: 'night',
        characterAffections: { minagi: 100 },
        metCharacters: { minagi: true },
        flags: { invitedAt_2_night: true }
    };
    const inv = tryRollInvitation(gs, 'night', {
        rng: makeRng([0, 0, 0, 0]),
        charactersMap: CHARACTERS
    });
    assert(inv === null, '同時間帯2回目は null');
}

{
    // 連続同人除外: minagi が前回 inviter, 他にも候補がいる場合は別の子を選ぶ
    const gs = {
        day: 1,
        timeOfDay: 'afternoon',
        characterAffections: { minagi: 95, aoi: 90 },
        metCharacters: { minagi: true, aoi: true },
        flags: { lastInviterId: 'minagi' }
    };
    const inv = tryRollInvitation(gs, 'afternoon', {
        rng: makeRng([0, 0, 0, 0]),
        charactersMap: CHARACTERS
    });
    assert(inv !== null && inv.characterId === 'aoi',
        '前回 minagi だった場合は別の候補を優先');
}

// --- pickDateSpot がキャラ preferredSpots と交差すること ---
console.log('\n=== pickDateSpot ===');
{
    const theme = INVITATION_THEMES.evening;
    const aoi = CHARACTERS.aoi; // preferredSpots: ['onsen', 'inn', 'forest_shrine']
    const spot = pickDateSpot(theme, aoi, () => 0);
    // theme.evening.spots = ['observatory', 'beach', 'port', 'inn'] と交差すると 'inn' のみ
    assert(spot === 'inn', 'あおい × 夕方 = inn');
}

// --- ファイル統合 ---
console.log('\n=== index.html / game-engine.js 統合 ===');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(indexHtml.includes('invitation-system.js'), 'index.html に invitation-system.js を読込');

const engineSource = fs.readFileSync(path.join(jsDir, 'game-engine.js'), 'utf8');
assert(engineSource.includes('maybeTriggerInvitation'), 'game-engine: maybeTriggerInvitation');
assert(engineSource.includes('runInvitationFlow'), 'game-engine: runInvitationFlow');
assert(engineSource.includes('runDateMeetingIntro'), 'game-engine: runDateMeetingIntro');
assert(engineSource.includes('activeDate'), 'game-engine: activeDate フラグ管理');
assert(engineSource.includes('normalizeTimeOfDay'),
    'game-engine: migrate で時間帯正規化');

const uiSource = fs.readFileSync(path.join(jsDir, 'ui-manager.js'), 'utf8');
assert(uiSource.includes('深夜'), 'ui-manager: 深夜ラベル');
assert(uiSource.includes('午後'), 'ui-manager: 午後ラベル');

const affSource = fs.readFileSync(path.join(jsDir, 'affection-system.js'), 'utf8');
assert(/actionsPerDay:\s*1/.test(affSource), 'actionsPerDay = 1');

console.log(`\n=== 結果: ${passed} passed / ${failed} failed ===`);
if (failed > 0) {
    process.exit(1);
}
