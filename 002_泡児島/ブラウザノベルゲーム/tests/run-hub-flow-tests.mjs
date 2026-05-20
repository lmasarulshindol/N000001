/**
 * ハブ選択肢ロジック（画面設計書 v2.0）
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

const engineSource = fs.readFileSync(path.join(jsDir, 'game-engine.js'), 'utf8');
const uiSource = fs.readFileSync(path.join(jsDir, 'ui-manager.js'), 'utf8');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed += 1;
        console.log(`  ✓ ${message}`);
    } else {
        failed += 1;
        console.error(`  ✗ ${message}`);
    }
}

console.log('\n=== ハブ選択肢 v2.0 ===');

assert(engineSource.includes('buildHubChoices'), 'buildHubChoices 定義');
assert(engineSource.includes("startIntimateScene('foreplay')"), '子作り=foreplay');
assert(!engineSource.includes("text: '前戯から始める'"), '前戯から始めるボタン廃止');
assert(engineSource.includes('hasCompletedMain'), '余韻ゲート');
assert(uiSource.includes('choices-active'), '選択肢レイアウト class');

function hubChoiceCount(mainDone) {
    const gs = {
        characterAffections: { minagi: 50 },
        routeProgress: {}
    };
    if (mainDone) {
        AffectionSystem.markRouteProgress(gs, 'minagi', 'main');
    }
    let n = 2;
    if (AffectionSystem.hasCompletedMain(gs, 'minagi')) n += 1;
    n += 1;
    return n;
}

assert(hubChoiceCount(false) === 3, '未子作り: 会話・子作り・マップ');
assert(hubChoiceCount(true) === 4, '子作り済: 会話・子作り・余韻・マップ');

console.log(`\n--- ハブフロー: ${passed} 成功, ${failed} 失敗 ---`);
process.exit(failed > 0 ? 1 : 0);
