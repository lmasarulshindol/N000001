/**
 * 性行為シーンシステムのユニットテスト
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
loadScript('intimate-scene-system.js');
loadScript('intimate-scenes-data.js');

let passed = 0;
let failed = 0;

function assert(c, msg) {
    if (c) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

console.log('\n=== セッション生成 ===');
{
    const s = IntimateSceneSystem.createSession('minagi', 'main');
    assert(s.stage === 'insert', 'main開始はinsert');
    const f = IntimateSceneSystem.createSession('hinata', 'foreplay');
    assert(f.stage === 'foreplay', 'foreplay開始');
}

console.log('\n=== 快感・絶頂 ===');
{
    const s = IntimateSceneSystem.createSession('sakura', 'main');
    IntimateSceneSystem.addPleasure(s, 60);
    assert(IntimateSceneSystem.canClimax(s), '55以上で射精可');
    const scene = getCharacterIntimateScene('minagi');
    const act = { id: 'fast', lineKey: 'fast', pleasure: 50 };
    IntimateSceneSystem.applyPistonAction(s, act, scene);
    assert(s.pistonCount === 1, 'ピストン回数');

    const slowAct = { id: 'slow', lineKey: 'slow', pleasure: 14 };
    const slowResult = IntimateSceneSystem.applyPistonAction(
        IntimateSceneSystem.createSession('minagi', 'foreplay'),
        slowAct,
        scene
    );
    assert(slowResult.lines.length >= 1, 'ゆっくり: 台詞あり');
    assert(
        typeof slowResult.lines[0].text === 'string',
        'ゆっくり: textは文字列'
    );
    assert(slowResult.lines[0].text.length > 0, 'ゆっくり: 台詞が空でない');
}

console.log('\n=== 全キャラ台本 ===');
{
    Object.keys(CHARACTERS).forEach((id) => {
        const sc = getCharacterIntimateScene(id);
        assert(sc?.foreplay?.actions?.length >= 4, `${id} 前戯`);
        assert(sc?.positions?.missionary, `${id} 体位`);
    });
}

console.log(`\n--- 結果: ${passed} 成功, ${failed} 失敗 ---\n`);
process.exit(failed > 0 ? 1 : 0);
