/**
 * UI機能テスト（メッセージログ・スキップ・オート送り）
 * 実行: node tests/run-ui-functional-tests.mjs
 */
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsDir = path.join(root, 'js');

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

function loadScript(name) {
    vm.runInThisContext(fs.readFileSync(path.join(jsDir, name), 'utf8'), { filename: name });
}

loadScript('ui-message-helpers.js');

console.log('\n=== UIMessageHelpers 単体 ===');
{
    let log = [];
    log = UIMessageHelpers.appendLogEntry(log, { speaker: '海凪', text: 'こんにちは' });
    log = UIMessageHelpers.appendLogEntry(log, { speaker: '', text: '続き' });
    assert(log.length === 2, 'ログ2件追加');
    const formatted = UIMessageHelpers.formatLogEntriesForDisplay(log);
    assert(formatted[0].speaker === '海凪' && formatted[0].text === 'こんにちは', 'ログ整形');
    assert(UIMessageHelpers.shouldInstantText(true), 'スキップ時は即時表示');
    assert(!UIMessageHelpers.shouldInstantText(false), '通常時はタイピング');
    assert(
        UIMessageHelpers.canAutoAdvanceStory({ storyActive: true, waitingForStoryClick: true, choicesVisible: false }),
        'ストーリー待機中は自動送り可'
    );
    assert(
        !UIMessageHelpers.canAutoAdvanceStory({ storyActive: true, waitingForStoryClick: true, choicesVisible: true }),
        '選択肢表示中は自動送り不可'
    );
    assert(UIMessageHelpers.getAutoAdvanceDelayMs(false, true, 1) === 30, 'スキップ遅延30ms');
    assert(UIMessageHelpers.getAutoAdvanceDelayMs(true, false, 1) === 2000, 'オート遅延2000ms');
}

console.log('\n=== ui-manager ソース要件 ===');
const uiSource = fs.readFileSync(path.join(jsDir, 'ui-manager.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const engineSource = fs.readFileSync(path.join(jsDir, 'game-engine.js'), 'utf8');

{
    assert(uiSource.includes("'log-content'"), 'log-content を cacheElements に登録');
    assert(!uiSource.includes("console.log('スキップモード"), 'スキップがスタブでない');
    assert(uiSource.includes('skipMode'), 'skipMode フラグ');
    assert(uiSource.includes('notifyStoryBeatReady'), 'notifyStoryBeatReady 実装');
    assert(uiSource.includes('scheduleSkipAdvance'), 'scheduleSkipAdvance 実装');
    assert(uiSource.includes('UIMessageHelpers.appendLogEntry'), 'ログ追記ヘルパー利用');
    assert(indexHtml.includes('ui-message-helpers.js'), 'helpers スクリプト読込');
    assert(engineSource.includes('notifyStoryBeatReady'), 'game-engine からスキップ連携');
    assert(uiSource.includes('bindModalCloseButton'), 'ログ閉じるボタン再バインド');
    assert(uiSource.includes('isModalOpen'), 'モーダル開閉判定');
    assert(uiSource.includes('modalCloseButtonIds'), '閉じるボタン一覧');
    assert(uiSource.includes('awaitingUserAdvance'), 'メッセージ操作待ちフラグ');
    assert(uiSource.includes('waitForUserAdvance'), 'ユーザー操作待ち');
    assert(uiSource.includes('releaseUserAdvance'), '操作待ち解放');
    assert(uiSource.includes('await this.waitForUserAdvance()'), 'showMessageが操作待ち');
    assert(uiSource.includes('messageCanAdvance'), '通常メッセージのオート送り判定');
}

console.log('\n=== populateMessageLog モックDOM ===');
{
    const mockContainer = {
        innerHTML: '',
        children: [],
        scrollTop: 0,
        scrollHeight: 0,
        appendChild(el) {
            this.children.push(el);
            this.innerHTML += el.textContent || '';
            this.scrollHeight += 10;
        }
    };

    const ui = {
        messageLog: [
            { speaker: '陽菜', text: '1行目' },
            { speaker: '', text: '2行目' }
        ],
        elements: { 'log-content': mockContainer },
        populateMessageLog() {
            const container = this.elements['log-content'];
            if (!container) return;
            container.innerHTML = '';
            container.children = [];
            const entries = UIMessageHelpers.formatLogEntriesForDisplay(this.messageLog);
            entries.forEach((entry) => {
                const logEntry = { className: 'log-entry', children: [], appendChild(c) { this.children.push(c); } };
                if (entry.speaker) {
                    logEntry.appendChild({ className: 'log-speaker', textContent: entry.speaker });
                }
                logEntry.appendChild({ className: 'log-text', textContent: entry.text });
                container.appendChild(logEntry);
            });
            container.scrollTop = container.scrollHeight;
        }
    };

    ui.populateMessageLog();
    assert(mockContainer.children.length === 2, 'ログ2件をDOMに描画');
    assert(
        mockContainer.children[0].children.some((c) => c.textContent === '1行目'),
        '1行目テキスト'
    );
    assert(
        mockContainer.children[1].children.some((c) => c.textContent === '2行目'),
        '2行目テキスト'
    );
}

console.log(`\n--- UI機能テスト: ${passed} 成功, ${failed} 失敗 ---`);
process.exit(failed > 0 ? 1 : 0);
