/**
 * 場所×好感度×キャラ別セリフ仕様テスト
 * 実行: node tests/run-contextual-lines-tests.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const require = createRequire(import.meta.url);

const cd = require(path.join(root, 'js', 'character-data.js'));
const cl = require(path.join(root, 'js', 'intimate-contextual-lines.js'));

const mock = { CHARACTERS: cd.CHARACTERS };
const {
    CONTEXTUAL_INTIMATE_LINES,
    AFFECTION_TIER_BOUNDS,
    resolveAffectionTier,
    getContextualLines,
    hasContextualSpot
} = cl;

let passed = 0;
let failed = 0;
function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

console.log('\n=== A: 構造確認 ===');
assert(typeof CONTEXTUAL_INTIMATE_LINES === 'object', 'A1: CONTEXTUAL_INTIMATE_LINES が存在');
assert(typeof getContextualLines === 'function', 'A2: getContextualLines 関数');
assert(typeof resolveAffectionTier === 'function', 'A3: resolveAffectionTier 関数');
assert(typeof hasContextualSpot === 'function', 'A4: hasContextualSpot 関数');

console.log('\n=== B: 11キャラすべてに定義あり ===');
const expected = ['minagi', 'hinata', 'sakura', 'aoi', 'miyu', 'rin', 'momoka', 'kaede', 'yuki', 'nagisa', 'kokoa'];
expected.forEach((id) => {
    assert(!!CONTEXTUAL_INTIMATE_LINES[id], `B: ${id} のセリフセット存在`);
});

console.log('\n=== C: 各キャラに preferredSpots + default ===');
expected.forEach((id) => {
    const char = mock.CHARACTERS[id];
    const spots = char?.stats?.preferredSpots || char?.preferredSpots || [];
    const table = CONTEXTUAL_INTIMATE_LINES[id];
    assert(!!table.default, `C: ${id} に default あり`);
    spots.forEach((spot) => {
        assert(!!table[spot], `C: ${id}.${spot} あり`);
    });
});

console.log('\n=== D: 各場所×tier に4キーすべて存在 ===');
const requiredKeys = ['foreplayIntro', 'insertReady', 'climaxLine', 'aftercareLine'];
const tiers = ['early', 'mid', 'late'];
expected.forEach((id) => {
    const table = CONTEXTUAL_INTIMATE_LINES[id];
    Object.keys(table).forEach((spot) => {
        tiers.forEach((tier) => {
            assert(!!table[spot][tier], `D: ${id}.${spot}.${tier} あり`);
            if (table[spot][tier]) {
                requiredKeys.forEach((k) => {
                    const v = table[spot][tier][k];
                    if (k === 'foreplayIntro') {
                        assert(Array.isArray(v) && v.length >= 2, `D: ${id}.${spot}.${tier}.${k} は配列(2+)`);
                    } else {
                        assert(typeof v === 'string' && v.length > 0, `D: ${id}.${spot}.${tier}.${k} は非空文字列`);
                    }
                });
            }
        });
    });
});

console.log('\n=== E: resolveAffectionTier 境界 ===');
assert(resolveAffectionTier(0) === 'early', 'E: 0→early');
assert(resolveAffectionTier(49) === 'early', 'E: 49→early');
assert(resolveAffectionTier(50) === 'mid', 'E: 50→mid');
assert(resolveAffectionTier(79) === 'mid', 'E: 79→mid');
assert(resolveAffectionTier(80) === 'late', 'E: 80→late');
assert(resolveAffectionTier(100) === 'late', 'E: 100→late');

console.log('\n=== F: getContextualLines 動作 ===');
const minagi_beach_late = getContextualLines('minagi', 'beach', 90);
assert(!!minagi_beach_late.foreplayIntro, 'F: minagi/beach/late foreplayIntro 取得');
assert(typeof minagi_beach_late.insertReady === 'string', 'F: minagi/beach/late insertReady 取得');
assert(typeof minagi_beach_late.climaxLine === 'string', 'F: minagi/beach/late climaxLine 取得');

console.log('\n=== G: フォールバック ===');
const fallbackSpot = getContextualLines('minagi', 'unknown_spot', 50);
assert(!!fallbackSpot.foreplayIntro, 'G: 未知spot→default にフォールバック');
const fallbackTier = getContextualLines('minagi', 'beach', 0);
assert(!!fallbackTier.foreplayIntro, 'G: 好感度0→early でデータ取得');

console.log('\n=== H: hasContextualSpot ===');
assert(hasContextualSpot('minagi', 'beach') === true, 'H: minagi/beach あり');
assert(hasContextualSpot('minagi', 'onsen') === false, 'H: minagi/onsen なし');
assert(hasContextualSpot('aoi', 'onsen') === true, 'H: aoi/onsen あり');

console.log('\n=== I: tier別でセリフが異なる ===');
expected.forEach((id) => {
    const char = mock.CHARACTERS[id];
    const spots = char?.stats?.preferredSpots || [];
    const spot = spots[0];
    const early = getContextualLines(id, spot, 10).climaxLine;
    const late = getContextualLines(id, spot, 90).climaxLine;
    assert(early !== late, `I: ${id}/${spot} early と late で異なる climaxLine`);
});

console.log('\n=== J: 場所別でセリフが異なる ===');
expected.forEach((id) => {
    const char = mock.CHARACTERS[id];
    const spots = char?.stats?.preferredSpots || [];
    if (spots.length < 2) return;
    const spotA = spots[0];
    const spotB = spots[1];
    const lineA = getContextualLines(id, spotA, 70).foreplayIntro;
    const lineB = getContextualLines(id, spotB, 70).foreplayIntro;
    assert(JSON.stringify(lineA) !== JSON.stringify(lineB), `J: ${id} ${spotA} vs ${spotB} で異なる foreplayIntro`);
});

console.log(`\n--- 場所×好感度×キャラセリフ: ${passed} 成功, ${failed} 失敗 ---\n`);
process.exit(failed > 0 ? 1 : 0);
