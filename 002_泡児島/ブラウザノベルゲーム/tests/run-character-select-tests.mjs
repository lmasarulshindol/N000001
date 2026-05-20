/**
 * キャラ選択（3人ページング・確認フロー）テスト
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

const engineSource = fs.readFileSync(path.join(jsDir, 'game-engine.js'), 'utf8');

let passed = 0;
let failed = 0;

function assert(c, msg) {
    if (c) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

console.log('\n=== キャラ選択 UI フロー ===');
assert(engineSource.includes('CHARACTER_SELECT_PAGE_SIZE'), 'ページサイズ定数');
assert(engineSource.includes('showCharacterSelectionPage'), 'ページ表示');
assert(engineSource.includes('previewCharacterSelection'), '自己紹介プレビュー');
assert(engineSource.includes('confirmCharacterSelection'), '確定処理');
assert(engineSource.includes('この子を選びますか？'), '確認メッセージ');
assert(engineSource.includes('他の子を選ぶ'), 'ページ切替');
assert(engineSource.includes('getCharacterIntroText'), '自己紹介文');

const chars = Object.values(CHARACTERS);
const pageSize = 3;
const totalPages = Math.ceil(chars.length / pageSize);
assert(chars.length > pageSize, 'テスト用に候補が4人以上');
assert(totalPages >= 2, '2ページ以上になる');

console.log(`\n--- キャラ選択: ${passed} 成功, ${failed} 失敗 ---\n`);
process.exit(failed > 0 ? 1 : 0);
