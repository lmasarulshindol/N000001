/**
 * プレイヤー名入力・置換テスト
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

loadScript('ui-message-helpers.js');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
    if (cond) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

console.log('\n=== UIMessageHelpers.normalizePlayerName ===');
assert(UIMessageHelpers.normalizePlayerName('') === 'ユウマ', '空文字は既定ユウマ');
assert(UIMessageHelpers.normalizePlayerName('   ') === 'ユウマ', '空白のみは既定');
assert(UIMessageHelpers.normalizePlayerName('タロウ') === 'タロウ', '通常名そのまま');
assert(UIMessageHelpers.normalizePlayerName('  サクラ  ') === 'サクラ', 'trim');
assert(UIMessageHelpers.normalizePlayerName('長すぎる名前のテスト用文字列') === '長すぎる名前のテ', '8文字に切り詰め');
assert(UIMessageHelpers.normalizePlayerName(null, 'デフォ') === 'デフォ', 'fallback引数');

console.log('\n=== UIMessageHelpers.applyPlayerName ===');
assert(UIMessageHelpers.applyPlayerName('${playerName}さん', 'タロウ') === 'タロウさん', '${playerName}置換');
assert(UIMessageHelpers.applyPlayerName('{playerName}おにーさん', 'ユウマ') === 'ユウマおにーさん', '{playerName}置換');
assert(UIMessageHelpers.applyPlayerName('{あなた}を呼んで', 'カイ') === 'カイを呼んで', '{あなた}置換');
assert(UIMessageHelpers.applyPlayerName('置換なし', 'X') === '置換なし', '対象なしはそのまま');
assert(UIMessageHelpers.applyPlayerName('${playerName} と ${playerName}', 'A') === 'A と A', '複数置換');
assert(UIMessageHelpers.applyPlayerName('${playerName}', '') === 'ユウマ', '空名は既定置換');
assert(UIMessageHelpers.applyPlayerName('', 'X') === '', '空文字入力はそのまま');

console.log('\n=== ファイル要件 ===');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(html.includes('id="name-input-screen"'), '名前入力モーダル');
assert(html.includes('id="player-name-input"'), '入力フィールド');
assert(html.includes('id="player-name-confirm-btn"'), '確定ボタン');
assert(html.includes('ユウマ'), 'プレースホルダー');

const uiSrc = fs.readFileSync(path.join(jsDir, 'ui-manager.js'), 'utf8');
assert(uiSrc.includes('promptPlayerName'), '名前入力プロンプト関数');
assert(uiSrc.includes('applyPlayerName'), 'showMessageで置換');
assert(uiSrc.includes("startNewGame(playerName)"), 'startNewGame に名前渡し');

const engineSrc = fs.readFileSync(path.join(jsDir, 'game-engine.js'), 'utf8');
assert(/startNewGame\(playerName\s*=\s*['"]ユウマ['"]\)/.test(engineSrc), 'startNewGame デフォルトユウマ');
assert(engineSrc.includes('normalizePlayerName'), 'engine側でも正規化');

const prologueSrc = fs.readFileSync(path.join(jsDir, 'prologue-data.js'), 'utf8');
assert(prologueSrc.includes('{playerName}'), 'プロローグに名前トークン');

console.log(`\n--- プレイヤー名: ${passed} 成功, ${failed} 失敗 ---\n`);
process.exit(failed > 0 ? 1 : 0);
