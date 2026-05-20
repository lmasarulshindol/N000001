/**
 * 好感度システム・エンディング条件のユニットテスト（Node.js）
 * 実行: node tests/run-affection-tests.mjs
 */
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(__dirname, '..', 'js');

function loadScript(name) {
    const code = fs.readFileSync(path.join(jsDir, name), 'utf8');
    vm.runInThisContext(code, { filename: name });
}

loadScript('character-data.js');
loadScript('affection-system.js');
loadScript('intimate-scene-system.js');
loadScript('intimate-scenes-data.js');
loadScript('ending-data.js');

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

function createState() {
    const gameState = {
        day: 1,
        timeOfDay: 'morning',
        energy: 100,
        actionsToday: 0,
        characterAffections: {},
        metCharacters: {},
        routeProgress: {},
        affectionHistory: [],
        flags: { prologueSeen: false, endingSeen: false, endingCharacterId: null }
    };
    AffectionSystem.resetGameProgress(gameState);
    return gameState;
}

console.log('\n=== 好感度ランク ===');
{
    assert(AffectionSystem.getRank(0).id === 'stranger', '0は知人');
    assert(AffectionSystem.getRank(30).id === 'friend', '30は友達');
    assert(AffectionSystem.getRank(100).id === 'bond', '100は心の絆');
}

console.log('\n=== プロローグボーナス ===');
{
    const gs = createState();
    const results = AffectionSystem.applyPrologueBonuses(gs, ['minagi', 'kokoa']);
    assert(results.length === 2, '初遭遇2人');
    assert(AffectionSystem.getAffection(gs, 'minagi') === 8, 'お出迎え+8');
    const again = AffectionSystem.applyPrologueBonuses(gs, ['minagi']);
    assert(again.length === 0, '再会はボーナスなし');
}

console.log('\n=== 会ったキャラ一覧 ===');
{
    const gs = createState();
    AffectionSystem.markMet(gs, 'minagi', 0);
    AffectionSystem.markMet(gs, 'hinata', 0);
    const ids = AffectionSystem.getMetCharacterIds(gs);
    assert(ids.length === 2, 'metは2人');
    assert(ids.includes('minagi') && ids.includes('hinata'), 'met ID');
}

console.log('\n=== H好感度加算 ===');
{
    assert(AffectionSystem.getIntimateAffection('main') === 10, '子作り完了+10');
    assert(AffectionSystem.getIntimateAffection('aftercare') === 8, '余韻+8');
    const gs = createState();
    AffectionSystem.markMet(gs, 'minagi', 0);
    AffectionSystem.changeAffection(gs, 'minagi', AffectionSystem.getIntimateAffection('mainChoice'));
    assert(AffectionSystem.getAffection(gs, 'minagi') === 5, 'mainChoice加算');
}

console.log('\n=== 行動・日数（5段階時間帯） ===');
{
    const gs = createState();
    const r1 = AffectionSystem.spendAction(gs);
    assert(r1.timeAdvanced === true, '1行動で時間帯遷移');
    assert(gs.actionsToday === 0, '行動リセット');
    assert(gs.timeOfDay === 'afternoon', '午前→午後');

    AffectionSystem.spendAction(gs);
    assert(gs.timeOfDay === 'evening', '午後→夕方');
    AffectionSystem.spendAction(gs);
    assert(gs.timeOfDay === 'night', '夕方→夜');
    AffectionSystem.spendAction(gs);
    assert(gs.timeOfDay === 'midnight', '夜→深夜');
    const r5 = AffectionSystem.spendAction(gs);
    assert(r5.dayEnded === true, '深夜→翌日（dayEnded）');
    assert(gs.day === 2 && gs.timeOfDay === 'morning', '翌日 午前から');
}

console.log('\n=== エンディング候補 ===');
{
    const gs = createState();
    gs.characterAffections.minagi = 100;
    AffectionSystem.markRouteProgress(gs, 'minagi', 'main');
    assert(AffectionSystem.hasCompletedMain(gs, 'minagi'), 'hasCompletedMain');
    const c = AffectionSystem.getEndingCandidate(gs);
    assert(c?.type === 'heroine' && c.id === 'minagi', '100+子作りでヒロイン候補');
    assert(AffectionSystem.shouldTriggerEnding(gs, 'minagi'), 'shouldTriggerEnding true');
    assert(AffectionSystem.hasCompletedMain(gs, 'minagi'), 'hasCompletedMain');

    const gsNoMain = createState();
    gsNoMain.characterAffections.minagi = 100;
    AffectionSystem.markRouteProgress(gsNoMain, 'minagi', 'aftercare');
    assert(!AffectionSystem.shouldTriggerEnding(gsNoMain, 'minagi'), '余韻のみではエンド不可');

    const gs2 = createState();
    gs2.day = 6;
    gs2.characterAffections.hinata = 45;
    const t = AffectionSystem.getEndingCandidate(gs2);
    assert(t?.type === 'timeout', '6日目はタイムアウト');
    const ending = getEndingForCandidate(t);
    assert(ending?.title === '別れのターミナル', 'タイムアウト台本');

    const gs3 = createState();
    gs3.day = 6;
    const island = AffectionSystem.getEndingCandidate(gs3);
    assert(island?.type === 'island', '誰もいなければ島エンド');
}

console.log('\n=== intimate-scenes ===');
{
    const scene = getCharacterIntimateScene('minagi');
    assert(scene.foreplay.actions.length >= 4, '海凪前戯');
    assert(scene.positions.missionary.climax.length >= 1, '海凪絶頂台詞');
    const aoi = getCharacterIntimateScene('aoi');
    assert(aoi.positions.cowgirl, '全キャラ騎乗位');
}

console.log('\n=== エンディングデータ ===');
{
    const e = getEndingForCandidate({
        type: 'heroine',
        id: 'sakura',
        affection: 100,
        character: CHARACTERS.sakura
    });
    assert(e?.title === '雪のように', 'さくらエンドタイトル');
    assert(e.beats.length >= 2, 'ビート数');
}

console.log(`\n--- 結果: ${passed} 成功, ${failed} 失敗 ---\n`);
process.exit(failed > 0 ? 1 : 0);
