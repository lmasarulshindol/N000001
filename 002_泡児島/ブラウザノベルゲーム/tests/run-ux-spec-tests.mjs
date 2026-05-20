/**
 * UI操作感仕様テスト
 * 実行: node tests/run-ux-spec-tests.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const uiSource = fs.readFileSync(path.join(root, 'js', 'ui-manager.js'), 'utf8');
const cssSource = fs.readFileSync(path.join(root, 'css', 'main.css'), 'utf8');

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

console.log('\n=== UI操作感仕様 ===');

assert(uiSource.includes('awaitingUserAdvance'), 'A1: 通常メッセージ操作待ちフラグ');
assert(uiSource.includes('await this.waitForUserAdvance()'), 'A1/A3: showMessage後にユーザー操作待ち');
assert(uiSource.includes('if (this.typingTimeout)'), 'A2: タイピング中クリックは全文表示');
assert(uiSource.includes("hint.classList.add('waiting')"), 'A4: 操作待ちヒント状態');
assert(cssSource.includes('.message-hint.waiting'), 'A4: 操作待ちヒントCSS');
assert(uiSource.includes('storyAdvanceLocked'), 'A6/G3: ストーリー多重進行ガード');

assert(uiSource.includes('this.stopAutoAndSkip();\n        this.choiceLocked = false;'), 'B3: 選択肢表示時に自動送り停止');
assert(uiSource.includes('this.choiceLocked = true'), 'B4: 選択肢連打ロック');
assert(uiSource.includes('button.disabled = true'), 'B4: 選択肢ボタンdisabled');
assert(uiSource.includes("button.setAttribute('aria-disabled', 'true')"), 'B4: aria-disabled設定');
assert(uiSource.includes("container.style.display = 'flex'"), 'B1: flex中央配置を保つ');
assert(uiSource.includes('selectChoiceByNumber'), 'D: 数字キー選択');
assert(uiSource.includes('/^[1-9]$/.test(event.key)'), 'D: 1〜9キー検出');

assert(uiSource.includes('stopAutoAndSkip()'), 'C3/C5: オート・スキップ停止関数');
assert(uiSource.includes('gameEngine.settings.autoMode = false'), 'C5: autoMode停止');
assert(uiSource.includes('this.skipMode = false'), 'C5: skipMode停止');
assert(uiSource.includes("skipButton.textContent = 'スキップ'"), 'C5: スキップ表示リセット');
assert(uiSource.includes("autoButton.textContent = 'オート'"), 'C5: オート表示リセット');
assert(uiSource.includes('if (this.areChoicesVisible() || this.isModalOpen() || this.isNameInputOpen()) return;'), 'C3/E3: 選択肢・モーダル中は自動モード開始不可');

const modalIdsBlock = uiSource.match(/this\.modalIds\s*=\s*\[([\s\S]*?)\];/)?.[1] || '';
assert(!modalIdsBlock.includes('name-input-screen'), 'E4: 名前入力モーダルは通常modalIdsから除外');
assert(uiSource.includes("if (e.target.id === 'name-input-screen')"), 'E4: 名前入力背景クリック無効');
assert(uiSource.includes('isNameInputOpen()'), 'E4: 名前入力open判定');
assert(uiSource.includes("if (event.key === 'Escape')"), 'E4/C5: Esc制御');

console.log('\n=== F: 画面全体クリックで進行 ===');
assert(uiSource.includes('shouldAdvanceFromClick'), 'F1: 進行可否判定メソッド存在');
assert(uiSource.includes("this.elements['main-game'].addEventListener('click'"), 'F2: main-game にクリック委譲');
assert(uiSource.includes("'button, input, select, textarea, label, a, .map-spot, .choice-button, [data-no-advance]'"), 'F3: ボタン等は進行除外');
assert(uiSource.includes('if (this.areChoicesVisible()) return false;'), 'F4: 選択肢表示中は進行不可');
assert(uiSource.includes('if (this.isModalOpen()) return false;'), 'F4: モーダル中は進行不可');
assert(uiSource.includes('if (this.isNameInputOpen()) return false;'), 'F4: 名前入力中は進行不可');
assert(uiSource.includes("if (this.currentScreen !== 'main-game') return false;"), 'F4: main-game以外は進行不可');

console.log('\n=== F: shouldAdvanceFromClick 動作シミュレーション ===');

class FakeElement {
    constructor({ tag = 'div', cls = '', attrs = {}, parent = null } = {}) {
        this.tagName = tag.toUpperCase();
        this.classList = new Set(cls.split(/\s+/).filter(Boolean));
        this.attrs = attrs;
        this.parentNode = parent;
    }
    closest(selector) {
        const selectors = selector.split(',').map(s => s.trim());
        let node = this;
        while (node) {
            for (const sel of selectors) {
                if (sel.startsWith('[') && sel.endsWith(']')) {
                    const attrName = sel.slice(1, -1);
                    if (node.attrs && attrName in node.attrs) return node;
                } else if (sel.startsWith('.')) {
                    if (node.classList && node.classList.has(sel.slice(1))) return node;
                } else {
                    if (node.tagName === sel.toUpperCase()) return node;
                }
            }
            node = node.parentNode;
        }
        return null;
    }
}
Object.setPrototypeOf(FakeElement.prototype, { constructor: FakeElement });

const stubUI = {
    currentScreen: 'main-game',
    _choicesVisible: false,
    _modalOpen: false,
    _nameInputOpen: false,
    areChoicesVisible() { return this._choicesVisible; },
    isModalOpen() { return this._modalOpen; },
    isNameInputOpen() { return this._nameInputOpen; },
};

const { shouldAdvanceFromClick } = (() => {
    const src = uiSource.match(/shouldAdvanceFromClick\(target\)\s*\{[\s\S]*?\n {4}\}/)?.[0];
    if (!src) return { shouldAdvanceFromClick: null };
    const factory = new Function('Element', `return function ${src}`);
    return { shouldAdvanceFromClick: factory(FakeElement) };
})();

if (!shouldAdvanceFromClick) {
    failed += 1;
    console.error('  ✗ shouldAdvanceFromClick の取り出しに失敗');
} else {
    const divTarget = new FakeElement({ tag: 'div' });
    assert(shouldAdvanceFromClick.call(stubUI, divTarget) === true, 'F5: 通常のdivクリックは進行する');

    const btnTarget = new FakeElement({ tag: 'button' });
    assert(shouldAdvanceFromClick.call(stubUI, btnTarget) === false, 'F5: ボタンクリックは進行しない');

    const inputTarget = new FakeElement({ tag: 'input' });
    assert(shouldAdvanceFromClick.call(stubUI, inputTarget) === false, 'F5: inputクリックは進行しない');

    const mapSpot = new FakeElement({ tag: 'div', cls: 'map-spot' });
    assert(shouldAdvanceFromClick.call(stubUI, mapSpot) === false, 'F5: マップスポットは進行しない');

    const choiceBtn = new FakeElement({ tag: 'div', cls: 'choice-button' });
    assert(shouldAdvanceFromClick.call(stubUI, choiceBtn) === false, 'F5: 選択肢ボタンは進行しない');

    const dataNoAdvance = new FakeElement({ tag: 'div', attrs: { 'data-no-advance': '' } });
    assert(shouldAdvanceFromClick.call(stubUI, dataNoAdvance) === false, 'F5: data-no-advance は進行しない');

    const btnParent = new FakeElement({ tag: 'button' });
    const spanInBtn = new FakeElement({ tag: 'span', parent: btnParent });
    assert(shouldAdvanceFromClick.call(stubUI, spanInBtn) === false, 'F5: ボタン内のspan子要素は進行しない');

    const stubChoices = { ...stubUI, _choicesVisible: true,
        areChoicesVisible() { return true; },
        isModalOpen() { return false; },
        isNameInputOpen() { return false; },
    };
    assert(shouldAdvanceFromClick.call(stubChoices, divTarget) === false, 'F5: 選択肢表示中は進行しない');

    const stubModal = { ...stubUI,
        areChoicesVisible() { return false; },
        isModalOpen() { return true; },
        isNameInputOpen() { return false; },
    };
    assert(shouldAdvanceFromClick.call(stubModal, divTarget) === false, 'F5: モーダル中は進行しない');

    const stubTitle = { ...stubUI,
        currentScreen: 'title-screen',
        areChoicesVisible() { return false; },
        isModalOpen() { return false; },
        isNameInputOpen() { return false; },
    };
    assert(shouldAdvanceFromClick.call(stubTitle, divTarget) === false, 'F5: タイトル画面では進行しない');
}

console.log(`\n--- UI操作感仕様: ${passed} 成功, ${failed} 失敗 ---\n`);
process.exit(failed > 0 ? 1 : 0);
