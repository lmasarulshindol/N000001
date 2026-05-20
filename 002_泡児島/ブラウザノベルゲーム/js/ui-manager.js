// 泡児島ノベルゲーム - UIマネージャー
// UI要素の管理と連携処理

class UIManager {
    constructor() {
        this.currentScreen = 'loading';
        this.isInitialized = false;
        this.messageLog = [];
        this.elements = {};
        
        // アニメーション管理
        this.fadeTimeout = null;
        this.typingTimeout = null;
        this.pendingFullText = '';
        this.pendingResolve = null;
        this.intimateLogEntries = [];
        this.skipMode = false;
        this.skipAdvanceTimer = null;
        // 通常メッセージのユーザー操作待ち（クリック/Enter/Space で解放）
        this.awaitingUserAdvance = false;
        this.advanceWaiters = [];
        this.storyAdvanceLocked = false;
        this.choiceLocked = false;
        this.modalIds = [
            'save-load-screen', 'settings-screen', 'character-detail-screen',
            'message-log-screen', 'affection-status-screen', 'game-menu-screen'
        ];
        this.modalCloseButtonIds = [
            'close-save-load', 'close-settings', 'close-character-detail',
            'close-message-log', 'close-affection-status', 'close-game-menu'
        ];

        // マップスポット設定（6ヶ所構成）
        this.mapSpots = {
            port: { name: '船着き場', icon: '⛴️', available: true },
            inn: { name: '旅館「潮汐亭」', icon: '🏯', available: true },
            onsen: { name: '温泉「波音の湯」', icon: '♨️', available: true },
            observatory: { name: '展望台', icon: '🌅', available: true },
            beach: { name: '砂浜', icon: '🏖️', available: true },
            forest_shrine: { name: '森の祠', icon: '⛩️', available: true }
        };
    }

    // UI初期化
    async initialize() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            await this.showLoadingScreen();
            
            // 初期化完了後にタイトル画面を表示
            setTimeout(() => {
                this.showTitleScreen();
            }, 2000);
            
            this.isInitialized = true;
            console.log('UIManager初期化完了');
            
        } catch (error) {
            console.error('UIManager初期化エラー:', error);
            this.showError('UIの初期化に失敗しました');
        }
    }

    // DOM要素をキャッシュ
    cacheElements() {
        const elementIds = [
            'loading-screen', 'title-screen', 'main-game',
            'name-input-screen', 'player-name-input', 'player-name-confirm-btn',
            'save-load-screen', 'settings-screen', 'character-detail-screen', 'message-log-screen',
            'new-game-btn', 'continue-game-btn', 'load-game-btn', 'title-settings-btn',
            'background-image', 'character-image', 'map-container', 'message-window',
            'speaker-name', 'message-text', 'choices-container',
            'current-spot', 'time-display', 'day-display', 'energy-display', 'actions-display',
            'affection-hud', 'affection-hud-name', 'affection-hud-fill', 'affection-hud-text', 'affection-toast',
            'affection-status-screen', 'affection-status-list', 'close-affection-status',
            'ending-screen', 'ending-title', 'ending-subtitle', 'ending-to-title-btn',
            'intimate-hud', 'intimate-stage-label', 'intimate-position-label',
            'intimate-pleasure-fill', 'intimate-pleasure-text', 'intimate-log',
            'game-menu-screen', 'close-game-menu', 'menu-affection-btn', 'menu-save-btn',
            'menu-load-btn', 'menu-settings-btn', 'menu-title-btn',
            'menu-button', 'save-button', 'load-button', 'settings-button',
            'auto-btn', 'skip-btn', 'log-btn', 'log-content',
            'close-save-load', 'close-settings', 'close-character-detail', 'close-message-log',
            'text-speed', 'content-level', 'bgm-volume', 'se-volume', 'auto-speed',
            'reset-settings', 'save-settings'
        ];
        
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            }
        });

        // マップスポット要素
        this.elements.mapSpots = document.querySelectorAll('.map-spot');
    }

    // イベントリスナー設定
    setupEventListeners() {
        // タイトル画面
        if (this.elements['new-game-btn']) {
            this.elements['new-game-btn'].addEventListener('click', () => this.startNewGame());
        }
        if (this.elements['continue-game-btn']) {
            this.elements['continue-game-btn'].addEventListener('click', () => this.continueGame());
        }
        if (this.elements['load-game-btn']) {
            this.elements['load-game-btn'].addEventListener('click', () => this.showLoadScreen());
        }
        if (this.elements['title-settings-btn']) {
            this.elements['title-settings-btn'].addEventListener('click', () => this.showSettingsScreen());
        }

        // メインUI
        if (this.elements['menu-button']) {
            this.elements['menu-button'].addEventListener('click', () => this.showMenu());
        }
        if (this.elements['save-button']) {
            this.elements['save-button'].addEventListener('click', () => this.showSaveScreen());
        }
        if (this.elements['load-button']) {
            this.elements['load-button'].addEventListener('click', () => this.showLoadScreen());
        }
        if (this.elements['settings-button']) {
            this.elements['settings-button'].addEventListener('click', () => this.showSettingsScreen());
        }

        // 画面全体クリックでメッセージ進行（ボタン等の機能要素はスキップ）
        if (this.elements['main-game']) {
            this.elements['main-game'].addEventListener('click', (e) => {
                if (!this.shouldAdvanceFromClick(e.target)) return;
                this.advanceMessage();
            });
        }

        if (this.elements['auto-btn']) {
            this.elements['auto-btn'].addEventListener('click', () => this.toggleAutoMode());
        }
        if (this.elements['skip-btn']) {
            this.elements['skip-btn'].addEventListener('click', () => this.toggleSkipMode());
        }
        if (this.elements['log-btn']) {
            this.elements['log-btn'].addEventListener('click', () => this.showMessageLog());
        }

        // マップスポット
        if (this.elements.mapSpots) {
            this.elements.mapSpots.forEach(spot => {
                spot.addEventListener('click', () => {
                    const spotId = spot.dataset.spot;
                    this.selectSpot(spotId);
                });
            });
        }

        // モーダル閉じる（イベント委譲で確実に捕捉）
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.addEventListener('click', (e) => {
                if (e.target.id === 'name-input-screen') {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                const closeBtn = e.target.closest('.close-btn');
                if (closeBtn?.id && this.modalCloseButtonIds.includes(closeBtn.id)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeModal();
                    return;
                }
                if (e.target.classList.contains('modal')) {
                    this.closeModal();
                }
            });
        }

        this.modalCloseButtonIds.forEach((btnId) => {
            this.bindModalCloseButton(btnId);
        });

        if (this.elements['menu-affection-btn']) {
            this.elements['menu-affection-btn'].addEventListener('click', () => {
                this.closeModal();
                this.showAffectionStatus();
            });
        }
        if (this.elements['menu-save-btn']) {
            this.elements['menu-save-btn'].addEventListener('click', () => {
                this.closeModal();
                this.showSaveScreen();
            });
        }
        if (this.elements['menu-load-btn']) {
            this.elements['menu-load-btn'].addEventListener('click', () => {
                this.closeModal();
                this.showLoadScreen();
            });
        }
        if (this.elements['menu-settings-btn']) {
            this.elements['menu-settings-btn'].addEventListener('click', () => {
                this.closeModal();
                this.showSettingsScreen();
            });
        }
        if (this.elements['menu-title-btn']) {
            this.elements['menu-title-btn'].addEventListener('click', () => {
                this.closeModal();
                this.showTitleScreen();
            });
        }
        if (this.elements['ending-to-title-btn']) {
            this.elements['ending-to-title-btn'].addEventListener('click', () => this.showTitleScreen());
        }

        // 設定項目
        if (this.elements['save-settings']) {
            this.elements['save-settings'].addEventListener('click', () => this.saveSettings());
        }
        if (this.elements['reset-settings']) {
            this.elements['reset-settings'].addEventListener('click', () => this.resetSettings());
        }

        // 音量スライダーの値表示更新
        ['bgm-volume', 'se-volume'].forEach(sliderId => {
            if (this.elements[sliderId]) {
                this.elements[sliderId].addEventListener('input', (e) => {
                    const valueElement = e.target.parentNode.querySelector('.volume-value');
                    if (valueElement) {
                        valueElement.textContent = e.target.value + '%';
                    }
                });
            }
        });

        // キーボードショートカット
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

    }

    bindModalCloseButton(btnId) {
        const btn = this.elements[btnId] || document.getElementById(btnId);
        if (!btn) return;
        btn.type = 'button';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeModal();
        };
    }

    // 画面表示メソッド群
    async showLoadingScreen() {
        this.switchScreen('loading-screen');
    }

    showTitleScreen() {
        if (this.elements['ending-screen']) {
            this.elements['ending-screen'].style.display = 'none';
        }
        this.hideAffectionHud();
        this.switchScreen('title-screen');
    }

    showMainGame(showMapImmediately = true) {
        this.switchScreen('main-game');
        this.updateGameInfo();
        this.hideMessage();
        if (showMapImmediately) {
            this.showMap();
        } else {
            this.hideMap();
        }
    }

    switchScreen(screenId) {
        // 全画面を非表示
        ['loading-screen', 'title-screen', 'main-game'].forEach(id => {
            if (this.elements[id]) {
                this.elements[id].style.display = 'none';
            }
        });

        // 指定画面を表示
        if (this.elements[screenId]) {
            this.elements[screenId].style.display = 'flex';
            this.currentScreen = screenId;
        }
    }

    // ゲーム開始・継続
    async startNewGame() {
        const playerName = await this.promptPlayerName();
        this.showMainGame(false);
        if (gameEngine) {
            await gameEngine.startNewGame(playerName);
        }
    }

    /**
     * プレイヤー名入力モーダルを表示し、入力確定まで待つ。
     * 未入力・空白のみの場合は「ユウマ」を返す。
     * @returns {Promise<string>}
     */
    promptPlayerName() {
        return new Promise((resolve) => {
            const modal = this.elements['name-input-screen']
                || document.getElementById('name-input-screen');
            const input = this.elements['player-name-input']
                || document.getElementById('player-name-input');
            const confirmBtn = this.elements['player-name-confirm-btn']
                || document.getElementById('player-name-confirm-btn');

            if (!modal || !input || !confirmBtn) {
                resolve('ユウマ');
                return;
            }

            input.value = '';
            input.placeholder = 'ユウマ';
            modal.style.display = 'flex';
            setTimeout(() => input.focus(), 0);

            const finalize = () => {
                const name = (typeof UIMessageHelpers !== 'undefined')
                    ? UIMessageHelpers.normalizePlayerName(input.value)
                    : ((input.value || '').trim() || 'ユウマ');

                confirmBtn.removeEventListener('click', onConfirm);
                input.removeEventListener('keydown', onKey);
                modal.style.display = 'none';
                resolve(name);
            };

            const onConfirm = (e) => {
                e.preventDefault();
                e.stopPropagation();
                finalize();
            };
            const onKey = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    finalize();
                }
            };

            confirmBtn.addEventListener('click', onConfirm);
            input.addEventListener('keydown', onKey);
        });
    }

    continueGame() {
        const saved = localStorage.getItem('awaji_novel_autosave');
        if (!saved) {
            this.showError('継続データが見つかりません');
            return;
        }
        if (gameEngine) {
            gameEngine.loadAutoSave();
            gameEngine.migrateGameState();
            this.showMainGame();
            gameEngine.showMap();
        }
    }

    // マップ関連
    showMap() {
        this.hideMessage();
        this.hideChoices();
        if (this.elements['map-container']) {
            this.elements['map-container'].style.display = 'block';
        }
    }

    hideMap() {
        if (this.elements['map-container']) {
            this.elements['map-container'].style.display = 'none';
        }
    }

    async selectSpot(spotId) {
        if (!this.mapSpots[spotId] || !this.mapSpots[spotId].available) return;
        this.hideMap();
        try {
            if (gameEngine) {
                await gameEngine.changeSpot(spotId);
            }
        } catch (error) {
            console.error('スポット移動エラー:', error);
            await this.showMessage('移動中にエラーが発生しました。マップに戻ります。', 'システム');
            this.showMap();
        }
        this.updateGameInfo();
    }

    updateSpotAvailability(spotId, available) {
        if (this.mapSpots[spotId]) {
            this.mapSpots[spotId].available = available;
            const spotElement = document.querySelector(`[data-spot="${spotId}"]`);
            if (spotElement) {
                if (available) {
                    spotElement.classList.remove('disabled');
                } else {
                    spotElement.classList.add('disabled');
                }
            }
        }
    }

    // メッセージ関連
    async showMessage(text, speaker = '', emotion = 'normal') {
        if (!this.elements['message-window'] || !this.elements['message-text']) return;

        const playerName = (typeof gameEngine !== 'undefined' && gameEngine?.gameState?.playerName)
            ? gameEngine.gameState.playerName
            : 'ユウマ';
        const resolvedText = (typeof UIMessageHelpers !== 'undefined')
            ? UIMessageHelpers.applyPlayerName(text, playerName)
            : text;
        text = resolvedText;

        if (typeof UIMessageHelpers !== 'undefined') {
            this.messageLog = UIMessageHelpers.appendLogEntry(this.messageLog, { speaker, text, emotion });
        } else {
            this.messageLog.push({ speaker, text, timestamp: new Date(), emotion });
        }

        this.hideChoices();
        if (typeof gameEngine !== 'undefined' && gameEngine && gameEngine.storyActive) {
            this.hideMap();
        }
        this.elements['message-window'].style.display = 'block';

        // 話者名設定
        if (this.elements['speaker-name']) {
            this.elements['speaker-name'].textContent = speaker;
            this.elements['speaker-name'].style.display = speaker ? 'block' : 'none';
        }

        // テキスト表示
        await this.typeText(text);

        // ストーリー再生中はランナー側が次beatを制御するため待機しない
        if (typeof gameEngine !== 'undefined' && gameEngine?.storyActive) {
            this.notifyMessageDisplayed();
            return;
        }

        // 通常メッセージはユーザー操作（クリック/Enter/Space）を待つ
        this.awaitingUserAdvance = true;
        this.updateMessageHint();
        this.notifyMessageDisplayed();
        await this.waitForUserAdvance();
        this.updateMessageHint();
    }

    waitForUserAdvance() {
        if (!this.awaitingUserAdvance) return Promise.resolve();
        return new Promise((resolve) => {
            this.advanceWaiters.push(resolve);
        });
    }

    releaseUserAdvance() {
        if (!this.awaitingUserAdvance && this.advanceWaiters.length === 0) return false;
        const waiters = this.advanceWaiters;
        this.advanceWaiters = [];
        this.awaitingUserAdvance = false;
        clearTimeout(this.skipAdvanceTimer);
        this.skipAdvanceTimer = null;
        waiters.forEach((resolve) => {
            try { resolve(); } catch (err) { console.warn(err); }
        });
        return true;
    }

    stopAutoAndSkip() {
        clearTimeout(this.skipAdvanceTimer);
        this.skipAdvanceTimer = null;
        this.skipMode = false;
        if (gameEngine?.settings) {
            gameEngine.settings.autoMode = false;
        }

        const skipButton = this.elements['skip-btn'];
        if (skipButton) {
            skipButton.classList.remove('active');
            skipButton.textContent = 'スキップ';
        }

        const autoButton = this.elements['auto-btn'];
        if (autoButton) {
            autoButton.classList.remove('active');
            autoButton.textContent = 'オート';
        }
    }

    updateMessageHint() {
        const hint = this.elements['message-hint'] || document.getElementById('message-hint');
        if (!hint) return;
        if (this.awaitingUserAdvance) {
            hint.textContent = 'クリック / Enter で進む';
            hint.classList.add('waiting');
        } else {
            hint.classList.remove('waiting');
        }
    }

    hideMessage() {
        if (this.elements['message-window']) {
            this.elements['message-window'].style.display = 'none';
        }
    }

    async typeText(text) {
        if (!this.elements['message-text']) return Promise.resolve();

        const displayText = text.replace(/\n/g, '\n');
        const instant = typeof UIMessageHelpers !== 'undefined'
            ? UIMessageHelpers.shouldInstantText(this.skipMode)
            : this.skipMode;

        if (instant) {
            this.elements['message-text'].textContent = displayText;
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const element = this.elements['message-text'];
            element.textContent = '';
            this.pendingFullText = displayText;
            this.pendingResolve = resolve;

            let index = 0;
            const speed = gameEngine ? [50, 30, 10][gameEngine.settings.textSpeed] : 30;

            const typing = () => {
                if (index < displayText.length) {
                    element.textContent += displayText[index];
                    index++;
                    this.typingTimeout = setTimeout(typing, speed);
                } else {
                    this.typingTimeout = null;
                    this.pendingFullText = '';
                    this.pendingResolve = null;
                    resolve();
                }
            };

            typing();
        });
    }

    /**
     * クリック位置から進行可能か判定する。
     * ボタン・入力欄・選択肢・マップスポット・モーダル中・名前入力中は進行しない。
     * `[data-no-advance]` 属性を持つ要素配下もスキップする。
     * @param {EventTarget} target
     * @returns {boolean}
     */
    shouldAdvanceFromClick(target) {
        if (!target || !(target instanceof Element)) return false;
        if (target.closest('button, input, select, textarea, label, a, .map-spot, .choice-button, [data-no-advance]')) {
            return false;
        }
        if (this.areChoicesVisible()) return false;
        if (this.isModalOpen()) return false;
        if (this.isNameInputOpen()) return false;
        if (this.currentScreen !== 'main-game') return false;
        return true;
    }

    advanceMessage() {
        // タイピング中なら即座に全文表示（操作待ちはまだ解放しない）
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
            if (this.elements['message-text'] && this.pendingFullText) {
                this.elements['message-text'].textContent = this.pendingFullText;
            }
            if (this.pendingResolve) {
                this.pendingResolve();
                this.pendingResolve = null;
                this.pendingFullText = '';
            }
            return;
        }

        // 通常メッセージのユーザー操作待ちを最優先で解放
        if (this.awaitingUserAdvance) {
            this.releaseUserAdvance();
            return;
        }

        // プロローグ／シナリオ再生中
        if (gameEngine && gameEngine.storyActive && gameEngine.waitingForStoryClick) {
            if (this.storyAdvanceLocked) return;
            this.storyAdvanceLocked = true;
            Promise.resolve(gameEngine.onStoryAdvance())
                .finally(() => {
                    this.storyAdvanceLocked = false;
                });
            return;
        }

        // 会話フェーズ中（将来拡張）
        if (gameEngine && gameEngine.currentPhase && typeof gameEngine.advanceCurrentPhase === 'function') {
            gameEngine.advanceCurrentPhase();
            return;
        }

        this.scheduleAutoAdvanceIfNeeded();
    }

    areChoicesVisible() {
        const el = this.elements['choices-container'];
        return !!(el && el.style.display !== 'none' && el.children.length > 0);
    }

    notifyMessageDisplayed() {
        this.scheduleAutoAdvanceIfNeeded();
    }

    notifyStoryBeatReady() {
        this.scheduleAutoAdvanceIfNeeded();
    }

    scheduleAutoAdvanceIfNeeded() {
        if (!gameEngine) return;
        const delay = typeof UIMessageHelpers !== 'undefined'
            ? UIMessageHelpers.getAutoAdvanceDelayMs(
                gameEngine.settings?.autoMode,
                this.skipMode,
                gameEngine.settings?.textSpeed
            )
            : (this.skipMode ? 30 : (gameEngine.settings?.autoMode ? 2000 : null));
        if (delay == null) return;

        const storyCanAdvance = typeof UIMessageHelpers !== 'undefined'
            ? UIMessageHelpers.canAutoAdvanceStory({
                storyActive: gameEngine.storyActive,
                waitingForStoryClick: gameEngine.waitingForStoryClick,
                choicesVisible: this.areChoicesVisible()
            })
            : (gameEngine.storyActive && gameEngine.waitingForStoryClick && !this.areChoicesVisible());

        const messageCanAdvance = this.awaitingUserAdvance && !this.areChoicesVisible();

        if (!storyCanAdvance && !messageCanAdvance) return;
        this.scheduleSkipAdvance(delay);
    }

    scheduleSkipAdvance(delay = 30) {
        clearTimeout(this.skipAdvanceTimer);
        this.skipAdvanceTimer = setTimeout(() => {
            this.skipAdvanceTimer = null;
            const storyOK = gameEngine?.storyActive && gameEngine.waitingForStoryClick && !this.areChoicesVisible();
            const msgOK = this.awaitingUserAdvance && !this.areChoicesVisible();
            if (storyOK || msgOK) {
                this.advanceMessage();
            }
        }, delay);
    }

    // 選択肢関連
    showChoices(choices, options = {}) {
        if (!this.elements['choices-container'] || !choices || choices.length === 0) return;

        this.stopAutoAndSkip();
        this.choiceLocked = false;
        const container = this.elements['choices-container'];
        container.innerHTML = '';
        container.classList.toggle('compact-choices', !!options.compact);

        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.textContent = choice.text;
            button.className = 'choice-button';
            button.addEventListener('click', () => {
                this.selectChoice(choice, index, button);
            });
            container.appendChild(button);
        });

        container.style.display = 'flex';
        this.setChoicesLayoutActive(true, !!options.compact);
    }

    hideChoices() {
        if (this.elements['choices-container']) {
            this.elements['choices-container'].style.display = 'none';
            this.elements['choices-container'].classList.remove('compact-choices');
        }
        this.setChoicesLayoutActive(false, false);
    }

    setChoicesLayoutActive(active, compact = false) {
        const main = this.elements['main-game'];
        if (main) {
            main.classList.toggle('choices-active', active);
            main.classList.toggle('choices-compact', active && compact);
        }
    }

    selectChoiceByNumber(number) {
        if (this.choiceLocked) return;
        const container = this.elements['choices-container'];
        if (!container || container.style.display === 'none') return;
        const buttons = Array.from(container.querySelectorAll('.choice-button'));
        const button = buttons[number - 1];
        if (button && !button.disabled) {
            button.click();
        }
    }

    async selectChoice(choice, index, sourceButton = null) {
        if (this.choiceLocked) return;
        this.choiceLocked = true;
        const container = this.elements['choices-container'];
        if (container) {
            Array.from(container.querySelectorAll('.choice-button')).forEach((button) => {
                button.disabled = true;
                button.setAttribute('aria-disabled', 'true');
            });
        }
        this.hideChoices();
        if (!gameEngine || !choice.action) return;
        try {
            await Promise.resolve(choice.action());
        } catch (error) {
            console.error('選択肢の実行エラー:', error);
            this.showError('操作の処理中にエラーが発生しました。');
            if (typeof gameEngine.recoverFromChoiceError === 'function') {
                await gameEngine.recoverFromChoiceError();
            }
        }
    }

    // キャラクター画像
    showCharacterImage(characterId, emotion = 'normal') {
        if (this.elements['character-image']) {
            this.elements['character-image'].style.backgroundImage = 
                `url('assets/images/characters/${characterId}_${emotion}.png'), url('assets/images/characters/${characterId}.png')`;
            this.elements['character-image'].style.display = 'block';
        }
    }

    hideCharacterImage() {
        if (this.elements['character-image']) {
            this.elements['character-image'].style.display = 'none';
        }
    }

    // 背景画像
    changeBackground(spotId) {
        if (this.elements['background-image']) {
            this.elements['background-image'].style.backgroundImage = 
                `url('assets/images/backgrounds/${spotId}.jpg')`;
        }
    }

    // ゲーム情報表示更新
    updateGameInfo() {
        if (!gameEngine) return;

        const state = gameEngine.gameState;
        
        if (this.elements['current-spot']) {
            const spotName = this.mapSpots[state.currentSpot]?.name || state.currentSpot;
            this.elements['current-spot'].textContent = spotName;
        }
        
        if (this.elements['time-display']) {
            const timeNames = {
                morning: '午前',
                afternoon: '午後',
                noon: '午後',
                evening: '夕方',
                night: '夜',
                midnight: '深夜'
            };
            this.elements['time-display'].textContent = timeNames[state.timeOfDay] || state.timeOfDay;
        }
        
        if (this.elements['day-display']) {
            const maxDays = typeof AFFECTION_CONFIG !== 'undefined'
                ? AFFECTION_CONFIG.maxDays
                : 5;
            this.elements['day-display'].textContent = `${state.day}日目 / ${maxDays}日`;
        }

        if (this.elements['energy-display']) {
            this.elements['energy-display'].textContent = `体力 ${state.energy ?? 100}`;
        }

        if (this.elements['actions-display'] && typeof AFFECTION_CONFIG !== 'undefined') {
            const used = state.actionsToday ?? 0;
            this.elements['actions-display'].textContent =
                `行動 ${used}/${AFFECTION_CONFIG.actionsPerDay}`;
        }
    }

    showAffectionHud(characterId) {
        const char = CHARACTERS[characterId];
        if (!char || !this.elements['affection-hud']) return;

        const affection = AffectionSystem.getAffection(gameEngine.gameState, characterId);
        const rank = AffectionSystem.getRank(affection);

        if (this.elements['affection-hud-name']) {
            this.elements['affection-hud-name'].textContent = char.name;
            this.elements['affection-hud-name'].style.color = rank.color;
        }
        this.updateAffectionHud(characterId, affection);
        this.elements['affection-hud'].style.display = 'block';
    }

    updateAffectionHud(characterId, affection) {
        const rank = AffectionSystem.getRank(affection);
        if (this.elements['affection-hud-fill']) {
            this.elements['affection-hud-fill'].style.width = `${affection}%`;
            this.elements['affection-hud-fill'].style.background = rank.color;
        }
        if (this.elements['affection-hud-text']) {
            this.elements['affection-hud-text'].textContent = `${affection} (${rank.label})`;
        }
    }

    hideAffectionHud() {
        if (this.elements['affection-hud']) {
            this.elements['affection-hud'].style.display = 'none';
        }
    }

    showIntimateHud(session, character) {
        if (!this.elements['intimate-hud']) return;
        this.intimateLogEntries = [];
        if (this.elements['intimate-log']) {
            this.elements['intimate-log'].innerHTML = '';
        }
        this.elements['intimate-hud'].style.display = 'block';
        this.updateIntimateHud(session, character);
    }

    updateIntimateHud(session, character) {
        if (!session || !this.elements['intimate-hud']) return;

        const scene = typeof getCharacterIntimateScene === 'function'
            ? getCharacterIntimateScene(session.characterId)
            : null;

        if (this.elements['intimate-stage-label']) {
            this.elements['intimate-stage-label'].textContent =
                IntimateSceneSystem.getStageLabel(session.stage);
        }
        if (this.elements['intimate-position-label'] && scene) {
            this.elements['intimate-position-label'].textContent =
                IntimateSceneSystem.getPositionLabel(session.position, scene);
        }
        if (this.elements['intimate-pleasure-fill']) {
            this.elements['intimate-pleasure-fill'].style.width = `${session.pleasure}%`;
        }
        if (this.elements['intimate-pleasure-text']) {
            this.elements['intimate-pleasure-text'].textContent = `快感 ${session.pleasure}%`;
        }
    }

    hideIntimateHud() {
        if (this.elements['intimate-hud']) {
            this.elements['intimate-hud'].style.display = 'none';
        }
        this.intimateLogEntries = [];
    }

    pushIntimateLog(speaker, text) {
        if (!this.elements['intimate-log']) return;
        this.intimateLogEntries.push({ speaker, text });
        if (this.intimateLogEntries.length > 8) {
            this.intimateLogEntries.shift();
        }
        this.elements['intimate-log'].innerHTML = this.intimateLogEntries
            .map((e) => {
                const who = e.speaker ? `<span class="log-speaker">${e.speaker}</span> ` : '';
                return `<div class="intimate-log-entry">${who}${e.text}</div>`;
            })
            .join('');
        this.elements['intimate-log'].scrollTop = this.elements['intimate-log'].scrollHeight;
    }

    showAffectionDelta(result) {
        if (!result || !this.elements['affection-toast']) return;
        const sign = result.delta >= 0 ? '+' : '';
        const toast = this.elements['affection-toast'];
        toast.textContent = `好感度 ${sign}${result.delta}（${result.after}）`;
        toast.classList.add('visible');
        clearTimeout(this.affectionToastTimer);
        this.affectionToastTimer = setTimeout(() => {
            toast.classList.remove('visible');
        }, 1800);
    }

    showAffectionStatus() {
        if (!gameEngine?.gameState) return;
        const list = this.elements['affection-status-list'];
        if (!list) return;

        list.innerHTML = '';
        Object.keys(CHARACTERS).forEach((id) => {
            const char = CHARACTERS[id];
            const affection = AffectionSystem.getAffection(gameEngine.gameState, id);
            const rank = AffectionSystem.getRank(affection);
            const met = gameEngine.gameState.metCharacters?.[id];
            const route = gameEngine.gameState.routeProgress?.[id] || {};
            let routeLabel = '未進行';
            if (route.main) {
                routeLabel = '子作り済';
                if (route.aftercare) routeLabel += '・余韻済';
            } else if (route.foreplay) {
                routeLabel = '前戯まで';
            } else if (Object.keys(route).some((k) => route[k])) {
                routeLabel = Object.keys(route).filter((k) => route[k]).join(' → ');
            }

            const row = document.createElement('div');
            row.className = 'affection-status-row';
            row.innerHTML = `
                <div class="affection-status-name">${char.name}${met ? '' : '（未遭遇）'}</div>
                <div class="affection-status-bar"><div class="affection-status-fill" style="width:${affection}%;background:${rank.color}"></div></div>
                <div class="affection-status-meta">${affection} / ${rank.label}</div>
                <div class="affection-status-route">${routeLabel}</div>
            `;
            list.appendChild(row);
        });

        this.showModal('affection-status-screen');
    }

    showEndingScreen(meta) {
        this.hideMap();
        this.hideAffectionHud();
        this.hideMessage();
        this.hideChoices();

        if (this.elements['ending-title']) {
            this.elements['ending-title'].textContent = meta.title || 'エンディング';
        }
        if (this.elements['ending-subtitle']) {
            const typeLabel = ENDING_TYPES?.[meta.type] || meta.type || '';
            const name = meta.characterName ? ` — ${meta.characterName}` : '';
            this.elements['ending-subtitle'].textContent = `${typeLabel}${name}`;
        }
        if (this.elements['ending-screen']) {
            this.elements['ending-screen'].style.display = 'flex';
        }
        this.currentScreen = 'ending';
    }

    // モーダル管理
    isModalOpen() {
        return this.modalIds.some((id) => {
            const el = this.elements[id];
            return el && el.style.display !== 'none';
        });
    }

    isNameInputOpen() {
        const el = this.elements['name-input-screen'];
        return !!(el && el.style.display !== 'none');
    }

    showModal(modalId) {
        this.stopAutoAndSkip();
        this.modalIds.forEach((id) => {
            if (this.elements[id]) {
                this.elements[id].style.display = 'none';
            }
        });

        if (this.elements[modalId]) {
            this.elements[modalId].style.display = 'flex';
        }
    }

    closeModal() {
        this.stopAutoAndSkip();
        this.modalIds.forEach((id) => {
            if (this.elements[id]) {
                this.elements[id].style.display = 'none';
            }
        });
    }

    // 個別モーダル表示
    showMenu() {
        this.showModal('game-menu-screen');
    }

    showSaveScreen() {
        this.showModal('save-load-screen');
        if (this.elements['save-load-title']) {
            this.elements['save-load-title'].textContent = 'セーブ';
        }
        this.populateSaveSlots('save');
    }

    showLoadScreen() {
        this.showModal('save-load-screen');
        if (this.elements['save-load-title']) {
            this.elements['save-load-title'].textContent = 'ロード';
        }
        this.populateSaveSlots('load');
    }

    showSettingsScreen() {
        this.showModal('settings-screen');
        this.loadCurrentSettings();
    }

    showMessageLog() {
        this.showModal('message-log-screen');
        this.populateMessageLog();
        this.bindModalCloseButton('close-message-log');
    }

    // セーブスロット生成
    populateSaveSlots(mode) {
        const container = document.querySelector('.save-slots');
        if (!container || !saveSystem) return;

        container.innerHTML = '';
        const slots = saveSystem.getSaveSlots();

        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = `save-slot ${slot.exists ? '' : 'empty'}`;
            
            slotElement.innerHTML = `
                <div class="slot-thumbnail">
                    ${slot.exists ? '📷' : '空'}
                </div>
                <div class="slot-info">
                    <h4>スロット ${slot.slotNumber}</h4>
                    <div class="slot-details">
                        ${slot.exists ? 
                            `${slot.playerName}<br>${slot.formattedTimestamp}<br>${slot.currentSpot}` :
                            '空のスロット'
                        }
                    </div>
                </div>
            `;

            slotElement.addEventListener('click', () => {
                if (mode === 'save') {
                    this.saveToSlot(slot.slotNumber);
                } else if (mode === 'load' && slot.exists) {
                    this.loadFromSlot(slot.slotNumber);
                }
            });

            container.appendChild(slotElement);
        });
    }

    // 設定読み込み・保存
    loadCurrentSettings() {
        if (!gameEngine) return;

        const settings = gameEngine.settings;
        
        if (this.elements['text-speed']) {
            this.elements['text-speed'].value = settings.textSpeed;
        }
        if (this.elements['content-level']) {
            this.elements['content-level'].value = settings.contentLevel;
        }
        if (this.elements['bgm-volume']) {
            this.elements['bgm-volume'].value = Math.round(settings.bgmVolume * 100);
        }
        if (this.elements['se-volume']) {
            this.elements['se-volume'].value = Math.round(settings.seVolume * 100);
        }

        // 音量表示更新
        ['bgm-volume', 'se-volume'].forEach(sliderId => {
            if (this.elements[sliderId]) {
                const valueElement = this.elements[sliderId].parentNode.querySelector('.volume-value');
                if (valueElement) {
                    valueElement.textContent = this.elements[sliderId].value + '%';
                }
            }
        });
    }

    saveSettings() {
        if (!gameEngine) return;

        if (this.elements['text-speed']) {
            gameEngine.settings.textSpeed = parseInt(this.elements['text-speed'].value);
        }
        if (this.elements['content-level']) {
            gameEngine.settings.contentLevel = parseInt(this.elements['content-level'].value);
        }
        if (this.elements['bgm-volume']) {
            gameEngine.settings.bgmVolume = parseInt(this.elements['bgm-volume'].value) / 100;
        }
        if (this.elements['se-volume']) {
            gameEngine.settings.seVolume = parseInt(this.elements['se-volume'].value) / 100;
        }

        gameEngine.saveSettings();
        this.closeModal();
        this.showMessage('設定を保存しました', 'システム');
    }

    resetSettings() {
        const defaults = {
            textSpeed: 1,
            contentLevel: 1,
            bgmVolume: 0.7,
            seVolume: 0.8,
            autoMode: false
        };

        Object.keys(defaults).forEach(key => {
            if (gameEngine) {
                gameEngine.settings[key] = defaults[key];
            }
        });

        this.loadCurrentSettings();
    }

    // メッセージログ
    populateMessageLog() {
        const container = this.elements['log-content'];
        if (!container) return;

        container.innerHTML = '';
        
        this.messageLog.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            logEntry.innerHTML = `
                ${entry.speaker ? `<div class="log-speaker">${entry.speaker}</div>` : ''}
                <div class="log-text">${entry.text}</div>
            `;
            
            container.appendChild(logEntry);
        });

        // 最新メッセージまでスクロール
        container.scrollTop = container.scrollHeight;
    }

    // セーブ・ロード操作
    saveToSlot(slotNumber) {
        if (gameEngine && saveSystem) {
            const result = saveSystem.saveGame(slotNumber, gameEngine.gameState);
            if (result.success) {
                this.closeModal();
                this.showMessage(`スロット${slotNumber}にセーブしました`, 'システム');
            } else {
                this.showError(result.message);
            }
        }
    }

    loadFromSlot(slotNumber) {
        if (gameEngine && saveSystem) {
            const result = saveSystem.loadGame(slotNumber);
            if (result.success) {
                gameEngine.gameState = result.data.gameState;
                gameEngine.migrateGameState();
                gameEngine.restoreGameState();
                this.closeModal();
                this.showMessage(`スロット${slotNumber}からロードしました`, 'システム');
            } else {
                this.showError(result.message);
            }
        }
    }

    // オート・スキップモード
    toggleAutoMode() {
        if (this.areChoicesVisible() || this.isModalOpen() || this.isNameInputOpen()) return;
        if (gameEngine) {
            gameEngine.settings.autoMode = !gameEngine.settings.autoMode;
            const button = this.elements['auto-btn'];
            if (button) {
                button.textContent = gameEngine.settings.autoMode ? 'オート停止' : 'オート';
                button.classList.toggle('active', gameEngine.settings.autoMode);
            }
        }
    }

    toggleSkipMode() {
        if (this.areChoicesVisible() || this.isModalOpen() || this.isNameInputOpen()) return;
        this.skipMode = !this.skipMode;
        const button = this.elements['skip-btn'];
        if (button) {
            button.classList.toggle('active', this.skipMode);
            button.textContent = this.skipMode ? 'スキップ中' : 'スキップ';
        }
        if (this.typingTimeout) {
            this.advanceMessage();
            return;
        }
        if (this.skipMode) {
            if (gameEngine?.waitingForStoryClick || this.awaitingUserAdvance) {
                this.advanceMessage();
            } else {
                this.scheduleAutoAdvanceIfNeeded();
            }
        } else {
            clearTimeout(this.skipAdvanceTimer);
            this.skipAdvanceTimer = null;
        }
    }

    // キー操作
    handleKeyPress(event) {
        if (this.isNameInputOpen()) {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
            }
            return;
        }

        if (this.isModalOpen() && event.key !== 'Escape') {
            return;
        }

        if (/^[1-9]$/.test(event.key) && this.areChoicesVisible()) {
            event.preventDefault();
            this.selectChoiceByNumber(Number(event.key));
            return;
        }

        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (this.areChoicesVisible()) return;
                this.advanceMessage();
                break;
            case 'Escape':
                event.preventDefault();
                this.stopAutoAndSkip();
                if (this.isModalOpen()) {
                    this.closeModal();
                } else if (this.currentScreen === 'main-game') {
                    this.showMenu();
                } else {
                    this.closeModal();
                }
                break;
            case 's':
            case 'S':
                if (event.ctrlKey) {
                    event.preventDefault();
                    if (gameEngine) {
                        gameEngine.quickSave();
                    }
                }
                break;
            case 'l':
            case 'L':
                if (event.ctrlKey) {
                    event.preventDefault();
                    if (gameEngine) {
                        gameEngine.quickLoad();
                    }
                }
                break;
        }
    }

    // エラー表示
    showError(message) {
        alert(`エラー: ${message}`);
    }

    // 通知表示
    showNotification(message, duration = 3000) {
        // 通知バナーの実装（簡易版）
        console.log(`通知: ${message}`);
    }

    // UIの破棄
    destroy() {
        // タイムアウトのクリア
        if (this.fadeTimeout) {
            clearTimeout(this.fadeTimeout);
        }
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // イベントリスナーの削除（必要に応じて）
        console.log('UIManager破棄完了');
    }
}

// グローバルインスタンス
const uiManager = new UIManager();