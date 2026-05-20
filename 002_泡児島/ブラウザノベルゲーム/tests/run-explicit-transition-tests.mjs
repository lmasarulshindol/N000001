/**
 * 明示選択でのみフェーズ遷移する仕様テスト。
 * 愛撫 → 口奉仕 → 挿入 → 射精 はすべてユーザー選択がトリガー。
 * 実行: node tests/run-explicit-transition-tests.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const engineSrc = fs.readFileSync(path.join(root, 'js', 'game-engine.js'), 'utf8');

let passed = 0;
let failed = 0;
function assert(c, msg) {
    if (c) { passed++; console.log(`  ✓ ${msg}`); }
    else { failed++; console.error(`  ✗ ${msg}`); }
}

console.log('\n=== A: 前戯→挿入は明示選択のみ ===');
{
    // 自動遷移条件（pleasure>=foreplayToInsertPleasure）が消えていること
    assert(
        !engineSrc.includes('|| this.intimateSession.pleasure >= INTIMATE_CONFIG.foreplayToInsertPleasure'),
        'A1: 快感蓄積による自動挿入遷移が削除されている'
    );
    // goInsert（明示「このまま挿入する」選択）は維持
    assert(
        engineSrc.includes('if (result.goInsert)'),
        'A2: goInsert（ユーザー選択）による挿入遷移は残っている'
    );
    // 「このまま挿入する」（to_insert アクション）の明示選択肢が存在
    const dataSrc = fs.readFileSync(path.join(root, 'js', 'intimate-scenes-data.js'), 'utf8');
    assert(
        dataSrc.includes("id: 'to_insert'") && dataSrc.includes("text: 'このまま挿入する'"),
        'A3: 「このまま挿入する」明示遷移アクションが存在'
    );
    // 旧「挿入へ進む」重複ボタンが game-engine.js から削除されている
    assert(
        !engineSrc.includes("text: '挿入へ進む'"),
        'A3b: 旧「挿入へ進む」重複ボタンが削除されている'
    );
}

console.log('\n=== B: 挿入後→ピストンは明示選択のみ ===');
{
    // runInsertStage が advanceStage(session, 'piston') を直接呼ばないこと
    const insertStageBlock = engineSrc.match(/async runInsertStage\(scene, character\)[\s\S]*?\n {4}\}/)?.[0] || '';
    const directPistonJump = /IntimateSceneSystem\.advanceStage\(session,\s*'piston'\)/m.test(insertStageBlock);
    // 直接遷移は selectorアクション内（クロージャ）でしか起こらないはず
    assert(
        insertStageBlock.includes("text: '動き始める'"),
        'B1: 挿入後「動き始める」選択肢が出る'
    );
    assert(
        insertStageBlock.includes('もう少し、このまま') || insertStageBlock.includes('まだ、このまま'),
        'B2: 「もう少し、このまま」選択肢が出る'
    );
    assert(
        insertStageBlock.includes('前戯に戻る'),
        'B3: 「前戯に戻る」選択肢が出る'
    );
    assert(
        insertStageBlock.includes("text: 'メニューに戻る'"),
        'B4: 「メニューに戻る」選択肢が出る'
    );
}

console.log('\n=== C: ピストン→フィニッシュは明示選択のみ ===');
{
    // result.autoClimax で showFinishMenu を直接呼ばないこと
    const pistonBlock = engineSrc.match(/async runPistonStage\(scene, character\)[\s\S]*?\n {4}\}/)?.[0] || '';
    // autoClimax 単体での自動メニュー呼び出しが無いこと
    assert(
        !/if \(result\.autoClimax\) \{\s*await this\.showFinishMenu/.test(pistonBlock),
        'C1: autoClimax での自動 showFinishMenu 呼び出しがない'
    );
    // ヒント表示への置換が確認できる
    assert(
        pistonBlock.includes('「フィニッシュする」を選べば') || pistonBlock.includes('そろそろフィニッシュ'),
        'C2: フィニッシュ可能時にヒントメッセージを表示'
    );
    // 「フィニッシュする ▼」明示選択時のみ showFinishMenu
    assert(
        pistonBlock.includes('if (action.finishMenu)') && pistonBlock.includes('await this.showFinishMenu'),
        'C3: action.finishMenu（明示選択）でのみ showFinishMenu'
    );
}

console.log('\n=== D: 口奉仕→フィニッシュは明示選択のみ ===');
{
    const oralBlock = engineSrc.match(/async runOralStage\(scene, character\)[\s\S]*?\n {4}\}/)?.[0] || '';
    assert(
        !/if \(result\.autoClimax\) \{\s*await this\.showFinishMenu/.test(oralBlock),
        'D1: autoClimax での自動 showFinishMenu 呼び出しがない'
    );
    assert(
        oralBlock.includes('「フィニッシュする」を選べば') || oralBlock.includes('そろそろフィニッシュ'),
        'D2: フィニッシュ可能時にヒントメッセージ'
    );
    // 「フィニッシュする ▼」「挿入に切り替える」「前戯に戻る」明示選択肢が存続
    assert(
        oralBlock.includes('フィニッシュする ▼') || oralBlock.includes('フィニッシュする'),
        'D3: 「フィニッシュする」明示選択肢が存在'
    );
    assert(oralBlock.includes('挿入に切り替える'), 'D4: 「挿入に切り替える」明示選択肢');
    assert(oralBlock.includes('前戯に戻る'), 'D5: 「前戯に戻る」明示選択肢');
}

console.log('\n=== E: 前戯から口奉仕への遷移はユーザー選択 ===');
{
    // foreplay の to_oral action（「口でしてもらう」）が明示選択
    const dataSrc = fs.readFileSync(path.join(root, 'js', 'intimate-scenes-data.js'), 'utf8');
    assert(
        dataSrc.includes("id: 'to_oral'") && dataSrc.includes("text: '口でしてもらう'"),
        'E1: 「口でしてもらう」アクションが存在'
    );
    assert(dataSrc.includes('goOral: true'), 'E2: goOral フラグで遷移トリガー');
    // foreplayBlock で result.goOral 時のみ oral 遷移
    const foreplayBlock = engineSrc.match(/async runForeplayStage\(scene, character\)[\s\S]*?\n {4}\}/)?.[0] || '';
    assert(
        foreplayBlock.includes('if (result.goOral)'),
        'E3: goOral でのみ oral 遷移'
    );
}

console.log('\n=== F: 各フェーズに「メニューに戻る」escape あり ===');
{
    const foreplayBlock = engineSrc.match(/async runForeplayStage\(scene, character\)[\s\S]*?\n {4}\}/)?.[0] || '';
    const pistonBlock = engineSrc.match(/async runPistonStage\(scene, character\)[\s\S]*?\n {4}\}/)?.[0] || '';
    const insertBlock = engineSrc.match(/async runInsertStage\(scene, character\)[\s\S]*?\n {4}\}/)?.[0] || '';
    const oralBlock = engineSrc.match(/async runOralStage\(scene, character\)[\s\S]*?\n {4}\}/)?.[0] || '';

    assert(foreplayBlock.includes("text: 'メニューに戻る'"), 'F1: foreplay に「メニューに戻る」');
    assert(pistonBlock.includes("text: 'メニューに戻る'"), 'F2: piston に「メニューに戻る」');
    assert(insertBlock.includes("text: 'メニューに戻る'"), 'F3: insert に「メニューに戻る」');
    // oral にも「前戯に戻る」あり（メニュー戻りはなくてもOK）
    assert(oralBlock.includes('前戯に戻る'), 'F4: oral に「前戯に戻る」（escape）');
}

console.log(`\n--- 明示遷移仕様: ${passed} 成功, ${failed} 失敗 ---\n`);
process.exit(failed > 0 ? 1 : 0);
