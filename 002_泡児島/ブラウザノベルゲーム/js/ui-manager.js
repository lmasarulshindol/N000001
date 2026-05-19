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

        // マップスポット設定
        this.mapSpots = {
            terminal: { name: 'ターミナル', icon: '🏢', available: true },
            beach: { name: 'ビーチ', icon: '🏖️', available: true },
            beachbar: { name: 'ビーチバー', icon: '🍹', available: true },
            cottage: { name: 'コテージ', icon: '🏡', available: true },
            hotel: { name: 'ホテル', icon: '🏨', available: true },
            restaurant: { name: 'レストラン', icon: '🍽️', available: true },
            garden: { name: 'ガーデン', icon: '🌺', available: true },
            library: { name: 'ライブラリー', icon: '📚', available: true },
            sports_area: { name: 'スポーツエリア', icon: '⚽', available: true }
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
            'auto-btn', 'skip-btn', 'log-btn',
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

        // メッセージウィンドウ
        if (this.elements['message-window']) {
            this.elements['message-window'].addEventListener('click', (e) => {
                if (e.target === this.elements['message-window'] || e.target === this.elements['message-text']) {
                    this.advanceMessage();
                }
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

        // モーダルの閉じるボタン
        ['close-save-load', 'close-settings', 'close-character-detail', 'close-message-log',
            'close-affection-status', 'close-game-menu'].forEach(btnId => {
            if (this.elements[btnId]) {
                this.elements[btnId].addEventListener('click', () => this.closeModal());
            }
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

        // モーダル背景クリックで閉じる
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
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
        this.showMainGame(false);
        if (gameEngine) {
            await gameEngine.startNewGame();
        }
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

        // メッセージログに追加
        this.messageLog.push({
            speaker: speaker,
            text: text,
            timestamp: new Date(),
            emotion: emotion
        });

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
        return this.typeText(text);
    }

    hideMessage() {
        if (this.elements['message-window']) {
            this.elements['message-window'].style.display = 'none';
        }
    }

    async typeText(text) {
        if (!this.elements['message-text']) return Promise.resolve();

        const displayText = text.replace(/\n/g, '\n');

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

    advanceMessage() {
        // タイピング中なら即座に全文表示
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

        // プロローグ／シナリオ再生中
        if (gameEngine && gameEngine.storyActive && gameEngine.waitingForStoryClick) {
            gameEngine.onStoryAdvance();
            return;
        }

        // 会話フェーズ中（将来拡張）
        if (gameEngine && gameEngine.currentPhase) {
            gameEngine.advanceCurrentPhase();
        }
    }

    // 選択肢関連
    showChoices(choices) {
        if (!this.elements['choices-container'] || !choices || choices.length === 0) return;

        const container = this.elements['choices-container'];
        container.innerHTML = '';

        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.textContent = choice.text;
            button.className = 'choice-button';
            button.addEventListener('click', () => {
                this.selectChoice(choice, index);
            });
            container.appendChild(button);
        });

        container.style.display = 'block';
    }

    hideChoices() {
        if (this.elements['choices-container']) {
            this.elements['choices-container'].style.display = 'none';
        }
    }

    selectChoice(choice, index) {
        this.hideChoices();
        if (gameEngine && choice.action) {
            choice.action();
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
                morning: '朝',
                noon: '昼',
                evening: '夕方',
                night: '夜'
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
    showModal(modalId) {
        // 全モーダルを非表示
        ['save-load-screen', 'settings-screen', 'character-detail-screen', 'message-log-screen',
            'affection-status-screen', 'game-menu-screen'].forEach(id => {
            if (this.elements[id]) {
                this.elements[id].style.display = 'none';
            }
        });

        // 指定モーダルを表示
        if (this.elements[modalId]) {
            this.elements[modalId].style.display = 'flex';
        }
    }

    closeModal() {
        ['save-load-screen', 'settings-screen', 'character-detail-screen', 'message-log-screen',
            'affection-status-screen', 'game-menu-screen'].forEach(id => {
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
        // スキップモードの実装
        console.log('スキップモード切り替え');
    }

    // キー操作
    handleKeyPress(event) {
        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.advanceMessage();
                break;
            case 'Escape':
                event.preventDefault();
                if (this.currentScreen === 'main-game') {
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