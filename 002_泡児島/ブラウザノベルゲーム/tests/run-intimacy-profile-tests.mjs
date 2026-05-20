/**
 * キャラ別 性格・性感帯・好みプレイ テスト
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
loadScript('intimate-scene-system.js');
loadScript('intimate-scenes-data.js');

let passed = 0;
let failed = 0;
function assert(c, msg) {
    if (c) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

console.log('\n=== プロファイル定義（全11キャラ） ===');
const expected = ['minagi','hinata','sakura','aoi','miyu','rin','momoka','kaede','yuki','nagisa','kokoa'];
expected.forEach((id) => {
    const p = getIntimacyProfile(id);
    assert(p && p.voiceTone, `${id}: voiceTone`);
    assert(p.kink, `${id}: kink`);
    assert(p.sensitivities && Object.keys(p.sensitivities).length > 0, `${id}: 性感帯`);
    assert(Array.isArray(p.preferredActions) && p.preferredActions.length > 0, `${id}: 好みプレイ`);
    assert(p.specialAction && p.specialAction.line, `${id}: 専用アクション`);
    assert(p.flavorLines && p.flavorLines.climax, `${id}: クライマックス台詞`);
});

console.log('\n=== applyIntimacyModifiers ===');
{
    const minagi = getIntimacyProfile('minagi');
    const kissAction = { id: 'kiss', lineKey: 'kiss', zone: 'lips', pleasure: 10, affection: 4 };
    const r = applyIntimacyModifiers(minagi, kissAction);
    assert(r.isPreferred === true, 'みなぎ: キスは好み');
    assert(r.pleasure > 10, 'みなぎ: キスで快感ブースト');
    assert(r.affection === 5, 'みなぎ: キスで好感度+1');

    const fastAction = { id: 'fast', lineKey: 'fast', pleasure: 24, affection: 5 };
    const f = applyIntimacyModifiers(minagi, fastAction);
    assert(f.isDisliked === true, 'みなぎ: 激しいは嫌い');
    assert(f.pleasure < 24, 'みなぎ: 激しいで快感ダウン');
    assert(f.affection === 4, 'みなぎ: 激しいで好感度-1');

    const rin = getIntimacyProfile('rin');
    const slow = { id: 'slow', lineKey: 'slow', pleasure: 14, affection: 4 };
    const rs = applyIntimacyModifiers(rin, slow);
    assert(rs.isDisliked === true, 'りん: ゆっくりは嫌い');

    const rf = applyIntimacyModifiers(rin, fastAction);
    assert(rf.isPreferred === true, 'りん: 激しいは好み');
}

console.log('\n=== 性感帯感度 ===');
{
    const sakura = getIntimacyProfile('sakura');
    const lipsAction = { id: 'kiss', lineKey: 'kiss', zone: 'lips', pleasure: 10, affection: 4 };
    const r = applyIntimacyModifiers(sakura, lipsAction);
    assert(r.sensitivityBoost === 1.4, 'さくら: 唇は1.4倍');
    assert(r.pleasure >= 14, 'さくら: 唇で快感増（+好みも）');

    const noZone = { id: 'undress', pleasure: 16, affection: 4 };
    const r2 = applyIntimacyModifiers(sakura, noZone);
    assert(r2.sensitivityBoost === 1, '性感帯なしは倍率1');
}

console.log('\n=== シーン生成にプロファイル反映 ===');
{
    const scene = getCharacterIntimateScene('hinata');
    assert(scene.profile?.kink === 'command', 'ひなた: kink反映');
    const ids = scene.foreplay.actions.map((a) => a.id);
    assert(ids.includes('bite_neck'), 'ひなた: 専用アクション bite_neck');

    const minagiScene = getCharacterIntimateScene('minagi');
    const minagiIds = minagiScene.foreplay.actions.map((a) => a.id);
    assert(minagiIds.includes('whisper_dialect'), 'みなぎ: 専用アクション whisper_dialect');

    const sakuraScene = getCharacterIntimateScene('sakura');
    const sakuraIds = sakuraScene.foreplay.actions.map((a) => a.id);
    assert(sakuraIds.includes('praise_kiss'), 'さくら: 専用アクション praise_kiss');
}

console.log('\n=== applyForeplayAction 統合 ===');
{
    const session = IntimateSceneSystem.createSession('rin', 'foreplay');
    const fastAction = { id: 'fast', lineKey: 'fast', pleasure: 24, affection: 5, lines: [{ speaker: 'heroine', text: 'んっ' }] };
    const r = IntimateSceneSystem.applyForeplayAction(session, fastAction, 'rin');
    assert(r.isPreferred === true, 'りんに激しい=好み');
    assert(r.pleasureGain > 24, '快感ブースト適用');
    assert(r.lines.some((l) => l.text.includes('好き')), '好きなプレイの演出台詞');
}

console.log('\n=== applyPistonAction 統合 ===');
{
    const session = IntimateSceneSystem.createSession('aoi', 'main');
    const scene = getCharacterIntimateScene('aoi');
    const slow = { id: 'slow', lineKey: 'slow', pleasure: 14, affection: 4 };
    const r = IntimateSceneSystem.applyPistonAction(session, slow, scene, 'aoi');
    assert(r.isPreferred === true, 'あおいにゆっくり=好み');
    assert(r.lines.some((l) => l.text.includes('合う')), '合うテンポの演出台詞');
}

console.log(`\n--- 親密度プロファイル: ${passed} 成功, ${failed} 失敗 ---\n`);
process.exit(failed > 0 ? 1 : 0);
