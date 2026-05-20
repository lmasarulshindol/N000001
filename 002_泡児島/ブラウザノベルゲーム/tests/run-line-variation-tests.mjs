/**
 * 連続選択時のセリフバリエーション仕様テスト
 * 実行: node tests/run-line-variation-tests.mjs
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
loadScript('intimate-contextual-lines.js');
loadScript('intimate-scene-system.js');
loadScript('intimate-scenes-data.js');

let passed = 0;
let failed = 0;
function assert(c, msg) {
    if (c) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

const linesToText = (lines) => lines.map((l) => l.text).join('\n');

console.log('\n=== A: session.actionCounts 初期化 ===');
{
    const s = IntimateSceneSystem.createSession('minagi', 'foreplay');
    assert(!!s.actionCounts, 'A1: actionCounts 存在');
    assert(typeof s.actionCounts.foreplay === 'object', 'A2: foreplay バケット');
    assert(typeof s.actionCounts.piston === 'object', 'A3: piston バケット');
    assert(typeof s.actionCounts.oral === 'object', 'A4: oral バケット');
}

console.log('\n=== B: ensureActionCounts: 旧 session を補強 ===');
{
    const legacy = { stage: 'foreplay' };
    const counts = IntimateSceneSystem.ensureActionCounts(legacy);
    assert(!!counts.foreplay, 'B1: foreplay 補強');
    assert(!!counts.piston, 'B2: piston 補強');
    assert(!!counts.oral, 'B3: oral 補強');
}

console.log('\n=== C: pickVariantLines 動作 ===');
{
    // 新形式: variant の配列
    const v0 = IntimateSceneSystem.pickVariantLines([
        [{ speaker: 'heroine', text: 'A' }],
        [{ speaker: 'heroine', text: 'B' }],
        [{ speaker: 'heroine', text: 'C' }]
    ], 0);
    const v1 = IntimateSceneSystem.pickVariantLines([
        [{ speaker: 'heroine', text: 'A' }],
        [{ speaker: 'heroine', text: 'B' }],
        [{ speaker: 'heroine', text: 'C' }]
    ], 1);
    const v3 = IntimateSceneSystem.pickVariantLines([
        [{ speaker: 'heroine', text: 'A' }],
        [{ speaker: 'heroine', text: 'B' }],
        [{ speaker: 'heroine', text: 'C' }]
    ], 3);
    assert(v0[0].text === 'A', 'C1: variant 0 = A');
    assert(v1[0].text === 'B', 'C2: variant 1 = B');
    assert(v3[0].text === 'A', 'C3: variant 3 は modulo で A');

    // 旧形式: フラットな行配列
    const flat = IntimateSceneSystem.pickVariantLines(
        [{ speaker: 'heroine', text: 'X' }, { speaker: 'heroine', text: 'Y' }],
        5
    );
    assert(flat.length === 2 && flat[0].text === 'X' && flat[1].text === 'Y', 'C4: 旧形式は全行返却');
}

console.log('\n=== D: foreplay 連続キスでセリフ変化 ===');
{
    const scene = getCharacterIntimateScene('minagi');
    const kissAction = scene.foreplay.actions.find((a) => a.id === 'kiss');
    assert(!!kissAction, 'D0: kiss アクション存在');
    assert(Array.isArray(kissAction.linePool) && kissAction.linePool.length >= 3, 'D1: linePool 3つ以上');

    const s = IntimateSceneSystem.createSession('minagi', 'foreplay');
    const r1 = IntimateSceneSystem.applyForeplayAction(s, kissAction, 'minagi');
    const r2 = IntimateSceneSystem.applyForeplayAction(s, kissAction, 'minagi');
    const r3 = IntimateSceneSystem.applyForeplayAction(s, kissAction, 'minagi');

    // ヒロインセリフのみ抽出（ナレーション除く）
    const heroine1 = r1.lines.filter((l) => l.speaker === 'heroine').map((l) => l.text).join('\n');
    const heroine2 = r2.lines.filter((l) => l.speaker === 'heroine').map((l) => l.text).join('\n');
    const heroine3 = r3.lines.filter((l) => l.speaker === 'heroine').map((l) => l.text).join('\n');

    assert(heroine1 !== heroine2, 'D2: 1回目と2回目は異なるヒロイン台詞');
    assert(heroine2 !== heroine3, 'D3: 2回目と3回目も異なる');
    assert(heroine1 !== heroine3, 'D4: 1回目と3回目も異なる');
    assert(s.actionCounts.foreplay.kiss === 3, 'D5: カウンタが3に進んでいる');
}

console.log('\n=== E: 連続選択ナレーション ===');
{
    const scene = getCharacterIntimateScene('hinata');
    const touchAction = scene.foreplay.actions.find((a) => a.id === 'touch');
    const s = IntimateSceneSystem.createSession('hinata', 'foreplay');

    const r1 = IntimateSceneSystem.applyForeplayAction(s, touchAction, 'hinata');
    const r2 = IntimateSceneSystem.applyForeplayAction(s, touchAction, 'hinata');
    const r3 = IntimateSceneSystem.applyForeplayAction(s, touchAction, 'hinata');
    const r4 = IntimateSceneSystem.applyForeplayAction(s, touchAction, 'hinata');

    assert(!r1.lines.some((l) => l.text.includes('二度目')), 'E1: 1回目は二度目ナレーションなし');
    assert(r2.lines.some((l) => l.text.includes('二度目')), 'E2: 2回目に二度目ナレーション');
    assert(r3.lines.some((l) => l.text.includes('三度目')), 'E3: 3回目に三度目ナレーション');
    assert(r4.lines.some((l) => l.text.includes('境界')), 'E4: 4回目以降は境界ナレーション');
}

console.log('\n=== F: 異なるアクション選択ではカウンタ独立 ===');
{
    const scene = getCharacterIntimateScene('aoi');
    const kissAction = scene.foreplay.actions.find((a) => a.id === 'kiss');
    const touchAction = scene.foreplay.actions.find((a) => a.id === 'touch');
    const s = IntimateSceneSystem.createSession('aoi', 'foreplay');

    IntimateSceneSystem.applyForeplayAction(s, kissAction, 'aoi');
    IntimateSceneSystem.applyForeplayAction(s, touchAction, 'aoi');
    IntimateSceneSystem.applyForeplayAction(s, kissAction, 'aoi');

    assert(s.actionCounts.foreplay.kiss === 2, 'F1: kissカウンタ=2');
    assert(s.actionCounts.foreplay.touch === 1, 'F2: touchカウンタ=1');
}

console.log('\n=== G: piston 連続 slow でセリフ変化 ===');
{
    const scene = getCharacterIntimateScene('minagi');
    const slowAction = { id: 'slow', lineKey: 'slow', pleasure: 14, affection: 4 };
    const s = IntimateSceneSystem.createSession('minagi', 'main');
    s.stage = 'piston';

    const r1 = IntimateSceneSystem.applyPistonAction(s, slowAction, scene, 'minagi');
    const r2 = IntimateSceneSystem.applyPistonAction(s, slowAction, scene, 'minagi');
    const r3 = IntimateSceneSystem.applyPistonAction(s, slowAction, scene, 'minagi');

    const t1 = r1.lines.filter((l) => l.speaker === 'heroine').map((l) => l.text).join('\n');
    const t2 = r2.lines.filter((l) => l.speaker === 'heroine').map((l) => l.text).join('\n');
    const t3 = r3.lines.filter((l) => l.speaker === 'heroine').map((l) => l.text).join('\n');

    assert(t1 !== t2, 'G1: slow 1回目と2回目は異なる');
    assert(t2 !== t3, 'G2: slow 2回目と3回目も異なる');
    assert(s.actionCounts.piston.slow === 3, 'G3: カウンタ=3');
}

console.log('\n=== H: piston slow と fast はカウンタ独立 ===');
{
    const scene = getCharacterIntimateScene('rin');
    const slow = { id: 'slow', lineKey: 'slow', pleasure: 14, affection: 4 };
    const fast = { id: 'fast', lineKey: 'fast', pleasure: 24, affection: 5 };
    const s = IntimateSceneSystem.createSession('rin', 'main');
    s.stage = 'piston';

    IntimateSceneSystem.applyPistonAction(s, slow, scene, 'rin');
    IntimateSceneSystem.applyPistonAction(s, fast, scene, 'rin');
    IntimateSceneSystem.applyPistonAction(s, slow, scene, 'rin');

    assert(s.actionCounts.piston.slow === 2, 'H1: slow=2');
    assert(s.actionCounts.piston.fast === 1, 'H2: fast=1');
    assert(s.pistonCount === 3, 'H3: 全piston=3');
}

console.log('\n=== I: oral アクションもプール化 ===');
{
    const scene = getCharacterIntimateScene('momoka');
    const oralAct = scene.oral.actions[0];
    assert(Array.isArray(oralAct.linePool) && oralAct.linePool.length >= 2, 'I1: oral linePool 2つ以上');

    const s = IntimateSceneSystem.createSession('momoka', 'foreplay');
    s.stage = 'oral';

    const r1 = IntimateSceneSystem.applyOralAction(s, oralAct, 'momoka');
    const r2 = IntimateSceneSystem.applyOralAction(s, oralAct, 'momoka');
    const t1 = r1.lines.filter((l) => l.speaker === 'heroine').map((l) => l.text).join('\n');
    const t2 = r2.lines.filter((l) => l.speaker === 'heroine').map((l) => l.text).join('\n');
    assert(t1 !== t2, 'I2: oral 連続選択でセリフが変わる');
    assert(s.actionCounts.oral[oralAct.id] === 2, 'I3: カウンタ=2');
}

console.log('\n=== J: 全キャラに linePool 整備済み ===');
{
    Object.keys(CHARACTERS).forEach((id) => {
        const sc = getCharacterIntimateScene(id);
        const kiss = sc.foreplay.actions.find((a) => a.id === 'kiss');
        assert(
            kiss && Array.isArray(kiss.linePool) && kiss.linePool.length >= 3,
            `J: ${id} kiss linePool 3+`
        );
    });
}

console.log(`\n--- 連続選択バリエーション: ${passed} 成功, ${failed} 失敗 ---\n`);
process.exit(failed > 0 ? 1 : 0);
