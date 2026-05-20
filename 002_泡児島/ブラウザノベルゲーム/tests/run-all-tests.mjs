/**
 * 全自動テスト実行
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const node = process.execPath;
const root = path.join(__dirname, '..');

const SUITES = [
    { file: 'run-ui-functional-tests.mjs', label: 'UI機能（ログ・スキップ）' },
    { file: 'run-affection-tests.mjs', label: '好感度システム' },
    { file: 'run-intimate-scene-tests.mjs', label: '性行為システム' },
    { file: 'run-character-select-tests.mjs', label: 'キャラ選択（3人ページ）' },
    { file: 'run-player-name-tests.mjs', label: 'プレイヤー名入力' },
    { file: 'run-intimacy-profile-tests.mjs', label: '性格・性感帯・好みプレイ' },
    { file: 'run-ux-spec-tests.mjs', label: 'UI操作感仕様' },
    { file: 'run-finish-spec-tests.mjs', label: 'フィニッシュ仕様' },
    { file: 'run-map-spots-tests.mjs', label: 'マップ6スポット構成' },
    { file: 'run-invitation-tests.mjs', label: '時間帯5段階＋お誘いシステム' },
    { file: 'run-contextual-lines-tests.mjs', label: '場所×好感度×キャラセリフ' },
    { file: 'run-line-variation-tests.mjs', label: '連続選択セリフバリエーション' },
    { file: 'run-explicit-transition-tests.mjs', label: '明示選択フェーズ遷移' },
    { file: 'run-dialogue-state-tests.mjs', label: 'セリフ条件 派生ステータス' }
];

let allOk = true;
console.log('########################################');
console.log('# 泡児島ノベルゲーム 全テスト');
console.log('########################################\n');

SUITES.forEach(({ file, label }) => {
    console.log(`\n>>> ${label}`);
    const res = spawnSync(node, [path.join(__dirname, file)], { encoding: 'utf8', cwd: root });
    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
    if (res.status !== 0) allOk = false;
});

console.log('\n########################################');
console.log(allOk ? '# 全テスト PASS' : '# 一部 FAIL');
console.log('########################################\n');
process.exit(allOk ? 0 : 1);
