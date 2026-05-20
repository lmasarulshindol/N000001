/**
 * フィニッシュ仕様テスト（docs/フィニッシュ仕様.md F1〜F7 準拠）
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
loadScript('character-intimacy-profiles.js');
loadScript('affection-system.js');
loadScript('intimate-finish-data.js');
loadScript('intimate-scene-system.js');
loadScript('intimate-scenes-data.js');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

// --- F1: FINISH_ACTIONS の定義 ---
console.log('\n=== F1: FINISH_ACTIONS 定義 ===');
assert(typeof FINISH_ACTIONS === 'object', 'FINISH_ACTIONS が存在する');
['inside', 'outside', 'oral_swallow', 'oral_spit', 'face', 'chest', 'belly', 'back', 'butt', 'hold_on']
    .forEach((id) => assert(!!FINISH_ACTIONS[id], `${id} 定義済み`));
assert(FINISH_ACTIONS.hold_on.isEndurance === true, 'hold_on は isEndurance');
assert(FINISH_ACTIONS.inside.requiresConsent === 'inside', 'inside は同意必須');
assert(FINISH_ACTIONS.oral_swallow.allowedStages?.includes('oral'), 'oral_swallow は oral 限定');
assert(FINISH_ACTIONS.back.allowedPositions?.includes('doggy'), 'back は doggy 限定');

// --- F2: getFinishOptions ---
console.log('\n=== F2: 体位/ステージ別フィルタ ===');
function makeSession(cid, stage, position = 'missionary', extra = {}) {
    const s = IntimateSceneSystem.createSession(cid, 'main');
    s.stage = stage;
    s.position = position;
    Object.assign(s, extra);
    return s;
}

function gs(cid, aff, route = {}) {
    return {
        characterAffections: { [cid]: aff },
        routeProgress: { [cid]: { ...route } }
    };
}

{
    // ひなた: position=missionary、好感70、未consent
    const session = makeSession('hinata', 'piston', 'missionary');
    const opts = getFinishOptions(session, getIntimacyProfile('hinata'), gs('hinata', 70));
    const ids = opts.map((o) => o.id);
    assert(ids.includes('inside'), 'ひなた missionary: inside 選択肢あり（unlocked）');
    assert(ids.includes('outside'), '正常位: outside 候補あり');
    assert(ids.includes('face'), '好感70: 顔射候補あり');
    assert(ids.includes('hold_on'), '我慢候補あり');
    assert(!ids.includes('back'), '正常位では back 候補なし');
    assert(!ids.includes('oral_swallow'), '正常位では oral_swallow なし');
}

{
    // doggy 体位: back / butt が選択肢に登場
    const session = makeSession('hinata', 'piston', 'doggy');
    const opts = getFinishOptions(session, getIntimacyProfile('hinata'), gs('hinata', 70));
    const ids = opts.map((o) => o.id);
    assert(ids.includes('back'), 'doggy: back 候補');
    assert(ids.includes('butt'), 'doggy: butt 候補');
    assert(!ids.includes('chest'), 'doggy: chest なし');
}

{
    // oral ステージ: oral 系候補が出る
    const session = makeSession('hinata', 'oral');
    const opts = getFinishOptions(session, getIntimacyProfile('hinata'), gs('hinata', 70));
    const ids = opts.map((o) => o.id);
    assert(ids.includes('oral_swallow'), 'oral: 飲精候補');
    assert(ids.includes('oral_spit'), 'oral: 口外候補');
    assert(ids.includes('face'), 'oral: 顔射候補');
    assert(!ids.includes('inside'), 'oral: 中出しなし');
}

// --- F3: キャラ別 finishPreference ---
console.log('\n=== F3: キャラ別好み ===');
{
    const yukiPref = getIntimacyProfile('yuki').finishPreference;
    assert(yukiPref.inside === 'forbidden', 'ゆき: inside 禁止');
    assert(yukiPref.face === 'forbidden', 'ゆき: face 禁止');
    const session = makeSession('yuki', 'piston', 'missionary');
    const opts = getFinishOptions(session, getIntimacyProfile('yuki'), gs('yuki', 99, { consentInside: true }));
    const ids = opts.map((o) => o.id);
    assert(!ids.includes('inside'), 'ゆき: forbidden なら consentInside でも中出し不可');
    assert(!ids.includes('face'), 'ゆき: 顔射不可');
    assert(ids.includes('belly'), 'ゆき: お腹かけ可');
}

{
    // rin: 顔射 preferred=face なら affection bonus
    const session = makeSession('rin', 'piston', 'missionary');
    session.pleasure = 60;
    const r = IntimateSceneSystem.applyFinishAction(
        session,
        'face',
        CHARACTERS.rin,
        gs('rin', 70)
    );
    assert(r.type === 'finish', 'rin face: finish 結果');
    assert(r.affection >= 10, 'rin preferredFinish=face で好感度ボーナス（base 7 + 3 = 10）');
    assert(r.isPreferred === true, 'isPreferred フラグ');
}

// --- F4: applyFinishAction 効果 ---
console.log('\n=== F4: applyFinishAction ===');
{
    const session = makeSession('hinata', 'piston', 'missionary');
    session.pleasure = 80;
    const state = gs('hinata', 70);
    const r = IntimateSceneSystem.applyFinishAction(session, 'inside', CHARACTERS.hinata, state);
    assert(r.type === 'finish', 'inside: finish');
    assert(r.affection >= 12, 'inside: 好感度+12 以上');
    assert(session.finished === true, 'session.finished フラグ');
    assert(session.finishedAction === 'inside', 'finishedAction 記録');
    assert(state.routeProgress.hinata.creampie === true, 'creampie 永続化');
    assert(state.routeProgress.hinata.consentInside === true, 'consentInside 永続化');
}

{
    // hold_on: 我慢系
    const session = makeSession('hinata', 'piston', 'missionary');
    session.pleasure = 80;
    const r = IntimateSceneSystem.applyFinishAction(session, 'hold_on', CHARACTERS.hinata, gs('hinata', 70));
    assert(r.type === 'endure', '我慢: type=endure');
    assert(session.finished === false, '我慢: 未フィニッシュ');
    assert(session.pleasure < 80, '我慢: 快感低下');
    assert(session.enduranceCount === 1, '我慢: カウンタ +1');
}

{
    // hold_on の連続上限
    const session = makeSession('hinata', 'piston', 'missionary');
    session.pleasure = 80;
    session.enduranceCount = 3;
    const opts = getFinishOptions(session, getIntimacyProfile('hinata'), gs('hinata', 70));
    assert(!opts.some((o) => o.id === 'hold_on'), '3回連続で我慢不可');
}

// --- F5: oral ステージ ---
console.log('\n=== F5: oral ステージ ===');
assert(INTIMATE_STAGE_LABELS.oral === '口での奉仕', 'INTIMATE_STAGE_LABELS.oral');
assert(typeof IntimateSceneSystem.applyOralAction === 'function', 'applyOralAction が存在');
{
    const sakuraScene = getCharacterIntimateScene('sakura');
    assert(sakuraScene.oral && Array.isArray(sakuraScene.oral.actions), 'sakura.oral.actions が存在');
    assert(sakuraScene.oral.actions.length >= 3, '口奉仕アクション3件以上');

    const session = IntimateSceneSystem.createSession('sakura', 'main');
    session.stage = 'oral';
    const r = IntimateSceneSystem.applyOralAction(
        session,
        sakuraScene.oral.actions[0],
        'sakura'
    );
    assert(r.pleasureGain > 0, '口奉仕: pleasureGain >0');
    assert(session.oralCount === 1, 'oralCount +1');
}

{
    // 前戯メニューに「口でしてもらう」が含まれる
    const scene = getCharacterIntimateScene('hinata');
    const ids = scene.foreplay.actions.map((a) => a.id);
    assert(ids.includes('to_oral'), '前戯メニューに to_oral 追加');
    const action = scene.foreplay.actions.find((a) => a.id === 'to_oral');
    assert(action.requires?.affectionMin === 30, 'to_oral 必要好感度30');
}

// --- F6: UI 仕様 ---
console.log('\n=== F6: UI compact-choices ===');
const cssMain = fs.readFileSync(path.join(__dirname, '..', 'css', 'main.css'), 'utf8');
assert(cssMain.includes('compact-choices'), 'CSS に compact-choices クラス存在');
assert(cssMain.includes('choices-compact'), 'CSS に choices-compact レイアウト存在');

const uiSource = fs.readFileSync(path.join(jsDir, 'ui-manager.js'), 'utf8');
assert(uiSource.includes('compact-choices'), 'ui-manager.js: compact-choices 切替');
assert(/showChoices\s*\(\s*choices\s*,\s*options\s*=\s*\{\s*\}\s*\)/.test(uiSource),
    'showChoices(choices, options = {}) シグネチャ');

const engineSource = fs.readFileSync(path.join(jsDir, 'game-engine.js'), 'utf8');
assert(engineSource.includes('showFinishMenu'), 'game-engine: showFinishMenu 定義');
assert(engineSource.includes('confirmInsideFinish'), 'game-engine: confirmInsideFinish 定義');
assert(engineSource.includes('runOralStage'), 'game-engine: runOralStage 定義');
assert(/showChoices\([^)]*\{\s*compact:\s*true\s*\}\)/.test(engineSource),
    'engine: compact:true で showChoices 呼び出し');

// --- F7: index.html の読み込み ---
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(indexHtml.includes('intimate-finish-data.js'), 'index.html に finish-data 読込');

// --- 完了 ---
console.log(`\n=== 結果: ${passed} passed / ${failed} failed ===`);
if (failed > 0) {
    process.exit(1);
}
