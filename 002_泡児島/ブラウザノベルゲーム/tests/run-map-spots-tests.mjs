/**
 * マップスポット6ヶ所構成テスト
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

let passed = 0;
let failed = 0;
function assert(c, msg) {
    if (c) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

console.log('\n=== SPOTS 定義（6ヶ所） ===');
const expectedIds = ['port', 'inn', 'onsen', 'observatory', 'beach', 'forest_shrine'];
assert(Object.keys(SPOTS).length === 6, `SPOTS が6件（実際: ${Object.keys(SPOTS).length}）`);
expectedIds.forEach((id) => {
    assert(SPOTS[id], `${id} 定義済み`);
});
assert(!SPOTS.terminal, '旧 terminal は無い');
assert(!SPOTS.beachbar, '旧 beachbar は無い');
assert(!SPOTS.cottage, '旧 cottage は無い');
assert(!SPOTS.hotel, '旧 hotel は無い');
assert(!SPOTS.restaurant, '旧 restaurant は無い');
assert(!SPOTS.library, '旧 library は無い');
assert(!SPOTS.garden, '旧 garden は無い');
assert(!SPOTS.sports_area, '旧 sports_area は無い');

console.log('\n=== SPOT_ALIASES が旧IDを吸収 ===');
const legacyIds = ['terminal', 'beachbar', 'cottage', 'hotel', 'restaurant', 'library', 'garden', 'sports_area'];
legacyIds.forEach((legacy) => {
    const target = SPOT_ALIASES[legacy];
    assert(expectedIds.includes(target), `${legacy} → ${target}（現行ID）`);
});

console.log('\n=== preferredSpots が現行ID／エイリアスで解決可能 ===');
Object.values(CHARACTERS).forEach((char) => {
    char.stats.preferredSpots.forEach((spot) => {
        const resolved = SPOTS[spot] ? spot : (SPOT_ALIASES[spot] || null);
        assert(resolved && SPOTS[resolved],
            `${char.id}: ${spot} → ${resolved || '解決不可'}`);
    });
});

console.log('\n=== 各スポット最低1キャラが配置されている ===');
expectedIds.forEach((spotId) => {
    const count = Object.values(CHARACTERS).filter((char) => {
        return char.stats.preferredSpots.some((s) => {
            const resolved = SPOTS[s] ? s : SPOT_ALIASES[s];
            return resolved === spotId;
        });
    }).length;
    assert(count >= 1, `${spotId}: ${count}キャラ配置`);
});

console.log('\n=== index.html ===');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
expectedIds.forEach((id) => {
    assert(indexHtml.includes(`data-spot="${id}"`), `data-spot="${id}" がHTMLにある`);
});
assert(!indexHtml.includes('data-spot="terminal"'), 'data-spot="terminal" は無い');
assert(!indexHtml.includes('data-spot="hotel"'), 'data-spot="hotel" は無い');
assert(!indexHtml.includes('data-spot="sports_area"'), 'data-spot="sports_area" は無い');
const mapSpotMatches = indexHtml.match(/data-spot="/g) || [];
assert(mapSpotMatches.length === 6, `data-spot 属性が6個（実際: ${mapSpotMatches.length}）`);

console.log('\n=== ui-manager.js: mapSpots 初期値 ===');
const uiSource = fs.readFileSync(path.join(jsDir, 'ui-manager.js'), 'utf8');
expectedIds.forEach((id) => {
    assert(new RegExp(`${id}\\s*:\\s*\\{\\s*name`).test(uiSource), `mapSpots.${id} が定義`);
});
assert(!/terminal\s*:\s*\{\s*name/.test(uiSource), 'mapSpots に terminal は無い');

console.log('\n=== game-engine.js: 背景・初期スポット ===');
const engineSource = fs.readFileSync(path.join(jsDir, 'game-engine.js'), 'utf8');
expectedIds.forEach((id) => {
    assert(engineSource.includes(`${id}:`), `gradients.${id} 定義`);
});
assert(/currentSpot:\s*['"]port['"]/.test(engineSource), '初期 currentSpot = port');
assert(engineSource.includes('getSpotIntroMessage'), 'getSpotIntroMessage 実装');
assert(engineSource.includes('SPOT_ALIASES['), 'changeBackground でエイリアス解決');

console.log(`\n=== 結果: ${passed} passed / ${failed} failed ===`);
if (failed > 0) {
    process.exit(1);
}
