// 泡児島ノベルゲーム - メインゲームエンジン
// シーン管理・選択肢処理・フェーズ管理を統括

class GameEngine {
    constructor() {
        this.currentScene = null;
        this.gameState = {
            currentSpot: 'port',
            timeOfDay: 'morning', // morning, noon, evening, night
            day: 1,
            playerName: 'ユウマ',
            energy: 100,
            characterAffections: {},
            unlockedEvents: [],
            completedScenarios: [],
            flags: {}
        };
        this.settings = {
            textSpeed: 1, // 0-2 (0:slow, 1:normal, 2:fast)
            contentLevel: 1, // 0:soft, 1:normal, 2:adult
            bgmVolume: 0.7,
            seVolume: 0.8,
            autoMode: false
        };
        this.saveSlots = 10;
        this.isInitialized = false;
        
        // DOM要素の参照
        this.elements = {};
        
        // イベントリスナー
        this.eventListeners = new Map();
        
        // 現在のフェーズ管理
        this.currentPhase = null;
        this.phaseData = null;

        // プロローグ／シナリオ再生
        this.storyQueue = [];
        this.storyActive = false;
        this.storyMode = null; // 'prologue' | 'ending'
        this.waitingForStoryClick = false;
        this.activeCharacterId = null;
        this.intimateSession = null;
        this.characterSelectionState = null;
        this.CHARACTER_SELECT_PAGE_SIZE = 3;
    }

    // 初期化
    async initialize() {
        try {
            // DOM要素の取得
            this.elements = {
                gameContainer: document.getElementById('game-container'),
                messageWindow: document.getElementById('message-window'),
                messageText: document.getElementById('message-text'),
                speakerName: document.getElementById('speaker-name'),
                choicesContainer: document.getElementById('choices-container'),
                mapContainer: document.getElementById('map-container'),
                characterImage: document.getElementById('character-image'),
                backgroundImage: document.getElementById('background-image'),
                uiControls: document.getElementById('ui-controls'),
                menuButton: document.getElementById('menu-button'),
                saveButton: document.getElementById('save-button'),
                loadButton: document.getElementById('load-button'),
                settingsButton: document.getElementById('settings-button')
            };

            // 設定の読み込み
            this.loadSettings();
            
            // ゲーム状態の読み込み（オートセーブがあれば）
            this.loadAutoSave();
            this.migrateGameState();

            // キャラクターデータの初期化
            this.initializeCharacterData();
            
            // イベントリスナーの設定
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('ゲームエンジン初期化完了');
            
        } catch (error) {
            console.error('ゲームエンジン初期化エラー:', error);
            this.showError('ゲームの初期化に失敗しました');
        }
    }

    // キャラクターデータの初期化
    initializeCharacterData() {
        Object.keys(CHARACTERS).forEach(charId => {
            if (!this.gameState.characterAffections[charId]) {
                this.gameState.characterAffections[charId] = 0;
            }
        });
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // メッセージウィンドウのクリック（テキスト進行）
        if (this.elements.messageWindow) {
            this.addEventListner(this.elements.messageWindow, 'click', () => {
                this.advanceText();
            });
        }

        // メニューボタン
        if (this.elements.menuButton) {
            this.addEventListner(this.elements.menuButton, 'click', () => {
                this.showMenu();
            });
        }

        // セーブボタン
        if (this.elements.saveButton) {
            this.addEventListner(this.elements.saveButton, 'click', () => {
                this.showSaveScreen();
            });
        }

        // ロードボタン
        if (this.elements.loadButton) {
            this.addEventListner(this.elements.loadButton, 'click', () => {
                this.showLoadScreen();
            });
        }

        // 設定ボタン
        if (this.elements.settingsButton) {
            this.addEventListner(this.elements.settingsButton, 'click', () => {
                this.showSettings();
            });
        }

        // キーボードイベント
        this.addEventListner(document, 'keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    // イベントリスナー管理（メモリリーク対策）
    addEventListner(element, event, handler) {
        element.addEventListener(event, handler);
        const key = `${element.id || 'document'}_${event}`;
        this.eventListeners.set(key, { element, event, handler });
    }

    // イベントリスナーの削除
    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
    }

    // 新規ゲーム開始
    async startNewGame(playerName = 'ユウマ') {
        const normalized = (typeof UIMessageHelpers !== 'undefined')
            ? UIMessageHelpers.normalizePlayerName(playerName)
            : ((playerName || '').toString().trim() || 'ユウマ');
        this.gameState = {
            currentSpot: 'port',
            timeOfDay: 'morning',
            day: 1,
            playerName: normalized,
            energy: 100,
            actionsToday: 0,
            characterAffections: {},
            metCharacters: {},
            routeProgress: {},
            affectionHistory: [],
            unlockedEvents: [],
            completedScenarios: [],
            flags: {
                prologueSeen: false,
                endingSeen: false,
                endingCharacterId: null
            }
        };
        this.initializeCharacterData();
        if (typeof AffectionSystem !== 'undefined') {
            AffectionSystem.resetGameProgress(this.gameState);
            this.gameState.flags.prologueSeen = false;
        }
        await this.playPrologue();
    }

    // プロローグ再生（港到着〜お出迎え）
    async playPrologue() {
        if (typeof PROLOGUE_SCRIPT === 'undefined' || !PROLOGUE_SCRIPT.length) {
            await this.finishPrologueAndOpenMap();
            return;
        }

        this.storyActive = true;
        this.storyMode = 'prologue';
        this.storyQueue = PROLOGUE_SCRIPT.map((beat) => ({ ...beat }));
        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.hideMap();
            uiManager.hideChoices();
        }
        await this.runNextStoryBeat();
    }

    async runNextStoryBeat() {
        if (!this.storyQueue.length) {
            if (this.storyMode === 'ending') {
                await this.finishEndingSequence();
            } else {
                await this.finishPrologueAndOpenMap();
            }
            return;
        }

        const beat = this.storyQueue.shift();

        if (beat.background) {
            await this.changeBackground(beat.background);
        }

        if (beat.hideCharacter) {
            this.hideCharacterImage();
        } else if (beat.characterId) {
            this.showCharacterImage(beat.characterId);
        }

        const speaker = beat.speaker
            || (beat.characterId && CHARACTERS[beat.characterId]
                ? CHARACTERS[beat.characterId].name
                : '');

        await this.showMessage(beat.text, speaker);
        this.waitingForStoryClick = true;
        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.notifyStoryBeatReady();
        }
    }

    async onStoryAdvance() {
        if (!this.storyActive || !this.waitingForStoryClick) {
            return;
        }
        if (this.storyMode === 'tutorial') {
            this.waitingForStoryClick = false;
            await this.onTutorialAcknowledged();
            return;
        }
        this.waitingForStoryClick = false;
        await this.runNextStoryBeat();
    }

    async finishPrologueAndOpenMap() {
        this.storyActive = false;
        this.storyMode = null;
        this.waitingForStoryClick = false;
        this.gameState.flags.prologueSeen = true;
        this.gameState.currentSpot = 'port';
        this.hideCharacterImage();

        if (typeof AffectionSystem !== 'undefined') {
            AffectionSystem.applyPrologueBonuses(this.gameState, [
                'minagi', 'kokoa', 'hinata', 'sakura', 'aoi', 'miyu', 'rin', 'nagisa'
            ]);
        }

        await this.changeBackground('port');
        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.updateGameInfo();
            await uiManager.showMessage(
                '【システム】お出迎えの少女たちと顔合わせした。\n一度会った子とは、島のどこにいても一緒に過ごせる。\n会話をしたり、二人きりの時間を楽しんだり――距離の縮め方はあなた次第。（1日5回行動・全5日）',
                'システム'
            );
            this.waitingForStoryClick = true;
            this.storyActive = true;
            this.storyMode = 'tutorial';
            uiManager.notifyStoryBeatReady();
            return;
        }

        this.autoSave();
        this.showMap();
    }

    async onTutorialAcknowledged() {
        if (this.storyMode !== 'tutorial') return;
        this.storyActive = false;
        this.storyMode = null;
        this.waitingForStoryClick = false;
        this.autoSave();
        this.showMap();
    }

    // スポット移動
    async changeSpot(spotId) {
        if (this.gameState.flags?.endingSeen) {
            await this.showMessage('物語は完結しました。タイトルから新しく始められます。', 'システム');
            this.showMap();
            return;
        }

        if (!SPOTS[spotId]) {
            console.error('無効なスポットID:', spotId);
            await this.showMessage('このエリアにはまだ行けません。', 'システム');
            this.showMap();
            return;
        }

        this.gameState.currentSpot = spotId;

        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.updateGameInfo();
            uiManager.hideMap();
        }
        
        // 背景画像の変更
        await this.changeBackground(spotId);
        
        // スポット固有の処理
        await this.processSpotEvents(spotId);
        
        // オートセーブ
        this.autoSave();
    }

    // 背景画像の変更（画像未配置時はグラデーション）
    async changeBackground(spotId) {
        const gradients = {
            ship: 'linear-gradient(180deg, #1e3c72 0%, #2a5298 40%, #7ec8e3 100%)',
            sea: 'linear-gradient(180deg, #4facfe 0%, #00f2fe 35%, #a8e6cf 70%, #f5d76e 100%)',
            port: 'linear-gradient(180deg, #1e3c72 0%, #4a76a8 40%, #7ec8e3 70%, #c8e6f0 100%)',
            inn: 'linear-gradient(180deg, #6d4c41 0%, #b08562 45%, #f4e1c1 100%)',
            onsen: 'linear-gradient(180deg, #2c3e50 0%, #6b7d92 35%, #d9c5b0 70%, #f0d8be 100%)',
            observatory: 'linear-gradient(180deg, #ff7e5f 0%, #feb47b 40%, #ffe29f 70%, #fff1c1 100%)',
            beach: 'linear-gradient(180deg, #4facfe 0%, #00f2fe 45%, #f5d76e 100%)',
            forest_shrine: 'linear-gradient(180deg, #2c5530 0%, #5a8a4d 40%, #9bc191 70%, #d4e5a4 100%)'
        };
        // 旧 ID は SPOT_ALIASES で現行 ID に解決（背景タグ互換用）
        const resolvedId = (typeof SPOT_ALIASES !== 'undefined' && SPOT_ALIASES[spotId])
            ? SPOT_ALIASES[spotId]
            : spotId;
        const el = document.getElementById('background-image');
        if (!el) return;
        el.style.backgroundColor = '#1a4d6d';
        el.style.backgroundImage = gradients[resolvedId] || gradients.port;
        el.style.backgroundSize = 'cover';
    }

    // スポット固有のイベント処理
    async processSpotEvents(spotId) {
        const introMsg = this.getSpotIntroMessage(spotId);
        if (introMsg) {
            await this.showMessage(introMsg.text, introMsg.speaker || 'システム');
        }

        // デート中なら直接そのキャラに合流
        const activeDate = this.gameState.flags?.activeDate;
        if (activeDate && activeDate.spotId === spotId) {
            const charId = activeDate.characterId;
            this.gameState.flags.activeDate = null;
            await this.runDateMeetingIntro(charId, spotId, activeDate.timeOfDay);
            await this.startCharacterInteraction(charId, false, spotId);
            return;
        }

        // スポットに応じたキャラクター遭遇判定
        const availableCharacters = this.getAvailableCharacters(spotId);

        if (availableCharacters.length > 0) {
            await this.showCharacterSelection(availableCharacters, spotId);
        } else {
            const metCount = AffectionSystem.getMetCharacterIds(this.gameState).length;
            const msg = metCount === 0
                ? 'まだ誰とも会っていません。島を探索して出会いましょう。'
                : 'このエリアに新しく会える子はいないようです。会った子はどこからでも呼べます。';
            await this.showMessage(msg, 'システム');
            this.showMap();
        }
    }

    /** 各スポットの導入テキストを返す（初回 / 再訪を簡易判定） */
    getSpotIntroMessage(spotId) {
        const visited = this.gameState.flags?.[`visited_${spotId}`];
        const introMap = {
            port: {
                first: { speaker: 'コンシェルジュ', text: '潮の香りが鼻先をくすぐる船着き場。出迎えと見送り、すべての出会いはここから始まる。' },
                revisit: { speaker: 'システム', text: '船着き場。波の音と汽笛だけが時を刻んでいる。' }
            },
            inn: {
                first: { speaker: '女将', text: 'ようこそ「潮汐亭」へ。お部屋、お食事、ご休憩――島の旅、まるごとお任せくださいませ。' },
                revisit: { speaker: 'システム', text: '旅館「潮汐亭」。畳の匂いと、低く流れる三味線の音。' }
            },
            onsen: {
                first: { speaker: 'システム', text: '湯気が立ち込める「波音の湯」。岩風呂の向こうから、潮騒がうっすらと聞こえてくる。' },
                revisit: { speaker: 'システム', text: '温泉「波音の湯」。今日も湯気が、肌に纏わりつくように立ち昇っている。' }
            },
            observatory: {
                first: { speaker: 'システム', text: '島を一望できる展望台。眼下に海、頭上に星――時間ごとに表情を変える特等席。' },
                revisit: { speaker: 'システム', text: '展望台。風が頬を撫で、遥か水平線を眺めるだけで時間を忘れてしまう。' }
            },
            beach: {
                first: { speaker: 'システム', text: 'プライベートビーチ。誰の目もない真っ白な砂浜が、ふたりだけの世界を約束する。' },
                revisit: { speaker: 'システム', text: '砂浜。足跡をひとつ残すたびに、波がそっと洗い消していく。' }
            },
            forest_shrine: {
                first: { speaker: 'システム', text: '森の奥、苔むした石段の上に建つ古い祠。木漏れ日と虫の声だけが、静寂を彩る。' },
                revisit: { speaker: 'システム', text: '森の祠。鳥居をくぐると、外界の音がふっと遠ざかる。' }
            }
        };
        const entry = introMap[spotId];
        if (!entry) return null;
        if (!visited) {
            if (!this.gameState.flags) this.gameState.flags = {};
            this.gameState.flags[`visited_${spotId}`] = true;
            return entry.first;
        }
        return entry.revisit;
    }

    characterMatchesSpot(char, spotId) {
        return char.stats.preferredSpots.some((preferred) => {
            if (preferred === spotId) return true;
            if (typeof SPOT_ALIASES !== 'undefined' && SPOT_ALIASES[preferred] === spotId) {
                return true;
            }
            return false;
        });
    }

    getMetCharacters() {
        return Object.values(CHARACTERS).filter(
            (char) => this.gameState.metCharacters?.[char.id]
        );
    }

    getFirstEncounterCandidates(spotId) {
        return Object.values(CHARACTERS).filter(
            (char) => !this.gameState.metCharacters?.[char.id]
                && this.characterMatchesSpot(char, spotId)
        );
    }

    getAvailableCharacters(spotId) {
        const seen = new Set();
        const list = [];
        [...this.getMetCharacters(), ...this.getFirstEncounterCandidates(spotId)].forEach((char) => {
            if (!seen.has(char.id)) {
                seen.add(char.id);
                list.push(char);
            }
        });
        return list;
    }

    async showCharacterSelection(characters, spotId) {
        this.characterSelectionState = {
            characters: [...characters],
            spotId,
            page: 0,
            pageSize: this.CHARACTER_SELECT_PAGE_SIZE,
            pendingId: null,
            pendingFirstMeet: false
        };
        await this.showCharacterSelectionPage();
    }

    getCharacterIntroText(character) {
        const meta = [
            character.age != null ? `${character.age}歳` : '',
            character.origin || ''
        ].filter(Boolean).join('・');
        const body = character.description || `${character.name}です。`;
        return meta ? `【${meta}】\n${body}` : body;
    }

    formatCharacterChoiceLabel(char) {
        const isFirstMeet = !this.gameState.metCharacters?.[char.id];
        const namePart = char.nickname ? `${char.name}（${char.nickname}）` : char.name;
        return isFirstMeet ? `${namePart} ★初対面` : namePart;
    }

    async showCharacterSelectionPage() {
        const state = this.characterSelectionState;
        if (!state?.characters?.length) {
            this.showMap();
            return;
        }

        const { characters, pageSize } = state;
        const totalPages = Math.ceil(characters.length / pageSize);
        const safePage = ((state.page % totalPages) + totalPages) % totalPages;
        state.page = safePage;

        const pageChars = characters.slice(
            safePage * pageSize,
            safePage * pageSize + pageSize
        );

        const metCount = AffectionSystem.getMetCharacterIds(this.gameState).length;
        const pageLabel = totalPages > 1 ? `（${safePage + 1}／${totalPages}）` : '';
        const prompt = metCount > 0
            ? `誰と過ごしますか？${pageLabel}\n一度に3人まで表示。ほかの子は「他の子を選ぶ」で切り替え。`
            : `誰と過ごしますか？${pageLabel}`;

        await this.showMessage(prompt, '');

        const choices = pageChars.map((char) => ({
            text: this.formatCharacterChoiceLabel(char),
            action: () => this.previewCharacterSelection(char.id)
        }));

        if (totalPages > 1) {
            choices.push({
                text: '他の子を選ぶ',
                action: async () => {
                    state.page = (state.page + 1) % totalPages;
                    this.hideCharacterImage();
                    await this.showCharacterSelectionPage();
                }
            });
        }

        choices.push({
            text: 'マップに戻る',
            action: () => {
                this.characterSelectionState = null;
                this.hideCharacterImage();
                this.showMap();
            }
        });

        this.showChoices(choices);
    }

    async previewCharacterSelection(characterId) {
        const character = CHARACTERS[characterId];
        if (!character) return;

        const state = this.characterSelectionState;
        if (!state) return;

        state.pendingId = characterId;
        state.pendingFirstMeet = !this.gameState.metCharacters?.[characterId];

        this.showCharacterImage(characterId);
        await this.showMessage(this.getCharacterIntroText(character), character.name);
        await this.showMessage('この子を選びますか？', 'システム');

        this.showChoices([
            {
                text: 'はい、この子に決める',
                action: () => this.confirmCharacterSelection()
            },
            {
                text: 'いいえ、別の子を見る',
                action: async () => {
                    state.pendingId = null;
                    this.hideCharacterImage();
                    await this.showCharacterSelectionPage();
                }
            }
        ]);
    }

    async confirmCharacterSelection() {
        const state = this.characterSelectionState;
        if (!state?.pendingId) return;

        const characterId = state.pendingId;
        const isFirstMeet = state.pendingFirstMeet;
        const spotId = state.spotId;

        this.characterSelectionState = null;
        await this.startCharacterInteraction(characterId, isFirstMeet, spotId);
    }

    async startCharacterInteraction(characterId, isFirstMeet = false, spotId = null) {
        const character = CHARACTERS[characterId];
        if (!character) {
            console.error('無効なキャラクターID:', characterId);
            return;
        }

        if (isFirstMeet && typeof AffectionSystem !== 'undefined') {
            AffectionSystem.markMet(this.gameState, characterId, 3);
        } else if (typeof AffectionSystem !== 'undefined') {
            AffectionSystem.markMet(this.gameState, characterId, 0);
        }

        this.activeCharacterId = characterId;
        this.showCharacterImage(characterId);

        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.showAffectionHud(characterId);
        }

        if (isFirstMeet) {
            const nn = character.nickname || character.name;
            await this.showMessage(
                `${nn}と初めて会った。\nこれからは、島のどこにいても一緒に過ごせるようになる。`,
                character.name
            );
        }

        await this.showInteractionHub(characterId);
    }

    async showInteractionHub(characterId) {
        const character = CHARACTERS[characterId];
        const affection = AffectionSystem.getAffection(this.gameState, characterId);
        const rank = AffectionSystem.getRank(affection);
        const mainDone = AffectionSystem.hasCompletedMain(this.gameState, characterId);
        const nn = character.nickname || character.name;

        this.currentPhase = 'hub';
        this.phaseData = {
            characterId,
            character,
            phaseType: 'hub'
        };

        const rankLines = {
            stranger: `${nn}はまだ少し距離を感じさせる表情をしている。`,
            acquaintance: `${nn}は柔らかい笑みをこちらに向けた。`,
            friend: `${nn}は嬉しそうに駆け寄ってきた。`,
            close: `${nn}は甘えるように腕に触れてきた。`,
            lover: `${nn}はそっと指を絡めてきた。`
        };
        const rankLine = rankLines[rank.id] || rankLines.acquaintance;

        await this.showMessage(
            `${nn}と二人きりになった。\n${rankLine}`,
            character.name
        );

        this.showChoices(this.buildHubChoices(characterId));
    }

    /** インタラクションハブの選択肢（画面設計書 v2.0） */
    buildHubChoices(characterId) {
        const mainDone = AffectionSystem.hasCompletedMain(this.gameState, characterId);
        const choices = [
            { text: '会話する', action: () => this.startPhase('conversation', characterId) },
            { text: '二人の時間を過ごす', action: () => this.startIntimateScene('foreplay') }
        ];
        if (mainDone) {
            choices.push({
                text: '一緒にまどろむ',
                action: () => this.startIntimateScene('aftercare')
            });
        }
        choices.push({
            text: 'この場を離れる',
            action: () => this.leaveToMap()
        });
        return choices;
    }

    leaveToMap() {
        this.endIntimateScene(false);
        this.characterSelectionState = null;
        this.hideCharacterImage();
        this.activeCharacterId = null;
        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.hideAffectionHud();
            uiManager.hideIntimateHud();
        }
        this.currentPhase = null;
        this.phaseData = null;
        this.showMap();
    }

    showPostActivityChoices(characterId) {
        this.showChoices([
            {
                text: 'この子と続ける（メニューへ）',
                action: () => this.showInteractionHub(characterId)
            },
            {
                text: '今日はここまで（行動終了）',
                action: () => this.endInteraction()
            }
        ]);
    }

    // フェーズ開始
    async startPhase(phaseType, characterId) {
        this.currentPhase = phaseType;
        this.phaseData = {
            characterId: characterId,
            character: CHARACTERS[characterId],
            phaseType: phaseType
        };

        switch (phaseType) {
            case 'conversation':
                await this.conversationPhase();
                break;
            case 'skinship':
            case 'intimate':
                await this.startIntimateScene('foreplay');
                break;
            case 'foreplay':
                await this.startIntimateScene('foreplay');
                break;
            case 'main':
                await this.startIntimateScene('main');
                break;
            case 'aftercare':
                await this.startIntimateScene('aftercare');
                break;
            case 'hub':
                await this.showInteractionHub(characterId);
                break;
        }
    }

    async conversationPhase() {
        const character = this.phaseData.character;
        const nn = character.nickname || character.name;

        await this.showMessage(
            `${nn}がこちらを見つめている。何を話そう？`,
            character.name
        );

        const dialogues = AffectionSystem.getDialogues(character.id);
        const choices = dialogues.map((d) => ({
            text: d.text,
            action: () => this.processDialogueChoice(d)
        }));

        choices.push({
            text: 'メニューに戻る',
            action: () => this.showInteractionHub(character.id)
        });

        this.showChoices(choices);
    }

    async processDialogueChoice(dialogue) {
        const character = this.phaseData.character;
        const nn = character.nickname || character.name;
        this.changeAffection(character.id, dialogue.affection);
        await this.showMessage(dialogue.response, character.name);
        await this.showMessage(`${nn}の表情が少し和らいだ気がする。`, 'システム');
        this.showPostActivityChoices(character.id);
    }

    // --- 性行為シーン（抜きゲー・ステートマシン） ---

    async startIntimateScene(entryMode = 'main') {
        const characterId = this.phaseData?.characterId || this.activeCharacterId;
        if (!characterId) return;

        this.currentPhase = 'intimate';
        this.phaseData = {
            characterId,
            character: CHARACTERS[characterId],
            phaseType: 'intimate'
        };

        this.intimateSession = IntimateSceneSystem.createSession(characterId, entryMode);
        this.gameState.intimateSession = this.intimateSession;

        AffectionSystem.markRouteProgress(this.gameState, characterId, 'foreplay');

        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.showIntimateHud(this.intimateSession, this.phaseData.character);
        }

        await this.runIntimateStage();
    }

    endIntimateScene(clearState = true) {
        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.hideIntimateHud();
        }
        if (clearState) {
            this.intimateSession = null;
            if (this.gameState) {
                this.gameState.intimateSession = null;
            }
        }
    }

    async playIntimateLines(lineList, character) {
        const nn = character.nickname || character.name;
        for (const line of lineList) {
            const speaker = typeof resolveSpeaker === 'function'
                ? resolveSpeaker(line, character)
                : (line.speaker === 'heroine' ? nn : '');
            await this.showMessage(line.text, speaker);
            if (typeof uiManager !== 'undefined' && uiManager) {
                uiManager.pushIntimateLog(speaker, line.text);
            }
        }
    }

    updateIntimateHud() {
        if (typeof uiManager !== 'undefined' && uiManager && this.intimateSession) {
            uiManager.updateIntimateHud(this.intimateSession, this.phaseData.character);
        }
    }

    /** 場所×好感度の context をシーン取得に渡すためのヘルパー */
    buildIntimateSceneContext(characterId) {
        return {
            spotId: this.gameState?.currentSpot || null,
            affection: this.gameState?.characterAffections?.[characterId] ?? 0
        };
    }

    async runIntimateStage() {
        const session = this.intimateSession;
        const character = this.phaseData.character;
        const scene = getCharacterIntimateScene(
            session.characterId,
            this.buildIntimateSceneContext(session.characterId)
        );
        if (!scene) return;

        this.updateIntimateHud();

        switch (session.stage) {
            case 'foreplay':
                await this.runForeplayStage(scene, character);
                break;
            case 'insert':
                await this.runInsertStage(scene, character);
                break;
            case 'piston':
                await this.runPistonStage(scene, character);
                break;
            case 'oral':
                await this.runOralStage(scene, character);
                break;
            case 'climax':
                await this.runClimaxStage(scene, character);
                break;
            case 'aftercare':
                await this.runAftercareStage(scene, character);
                break;
            default:
                break;
        }
    }

    /** 行動の requires をチェックする共通ヘルパー */
    intimateActionAllowed(action, characterId) {
        const req = action?.requires;
        if (!req) return true;
        if (typeof req.affectionMin === 'number') {
            const aff = this.gameState?.characterAffections?.[characterId] ?? 0;
            if (aff < req.affectionMin) return false;
        }
        return true;
    }

    async runForeplayStage(scene, character) {
        if (this.intimateSession.foreplayCount === 0) {
            await this.playIntimateLines(scene.foreplay.intro, character);
        }

        const availableActions = scene.foreplay.actions
            .filter((a) => this.intimateActionAllowed(a, character.id));

        const choices = availableActions.map((action) => ({
            text: action.text,
            action: async () => {
                const result = IntimateSceneSystem.applyForeplayAction(
                    this.intimateSession,
                    action,
                    character.id
                );
                this.changeAffection(character.id, result.affection);
                await this.playIntimateLines(result.lines, character);
                this.updateIntimateHud();

                if (result.goOral) {
                    this.intimateSession.previousStage = 'foreplay';
                    IntimateSceneSystem.advanceStage(this.intimateSession, 'oral');
                    await this.runIntimateStage();
                    return;
                }

                if (result.goInsert) {
                    IntimateSceneSystem.advanceStage(this.intimateSession, 'insert');
                    await this.runIntimateStage();
                    return;
                }

                await this.runForeplayStage(scene, character);
            }
        }));

        choices.push({
            text: 'メニューに戻る',
            action: () => {
                this.endIntimateScene();
                this.showInteractionHub(character.id);
            }
        });

        this.showChoices(choices);
    }

    async runInsertStage(scene, character) {
        const session = this.intimateSession;
        const position = scene.positions?.[session.position] || scene.positions?.missionary;
        const insertLines = position?.insert || scene.stages?.insert || [];

        await this.playIntimateLines(insertLines, character);
        await this.showMessage(
            `（${IntimateSceneSystem.getPositionLabel(session.position, scene)}へ）`,
            'システム'
        );

        // 自動でpistonには進めず、ユーザーが行動を選ぶまで待つ
        const choices = [
            {
                text: '動き始める',
                action: async () => {
                    IntimateSceneSystem.advanceStage(session, 'piston');
                    await this.runIntimateStage();
                }
            },
            {
                text: 'もう少し、このまま',
                action: async () => {
                    await this.playIntimateLines([
                        { speaker: 'narrator', text: '繋がった熱を確かめるように、しばらく動かずに抱きしめた。' }
                    ], character);
                    await this.runInsertStageWaiting(scene, character);
                }
            },
            {
                text: '前戯に戻る',
                action: async () => {
                    IntimateSceneSystem.advanceStage(session, 'foreplay');
                    await this.runIntimateStage();
                }
            },
            {
                text: 'メニューに戻る',
                action: () => {
                    this.endIntimateScene();
                    this.showInteractionHub(character.id);
                }
            }
        ];
        this.showChoices(choices, { compact: true });
    }

    /** 挿入直後の「もう少し、このまま」を選んだ後の選択肢を再提示 */
    async runInsertStageWaiting(scene, character) {
        const session = this.intimateSession;
        const choices = [
            {
                text: '動き始める',
                action: async () => {
                    IntimateSceneSystem.advanceStage(session, 'piston');
                    await this.runIntimateStage();
                }
            },
            {
                text: 'まだ、このまま',
                action: async () => {
                    await this.playIntimateLines([
                        { speaker: 'narrator', text: '心臓の鼓動だけが響く。互いの吐息で時間が満ちていく。' }
                    ], character);
                    await this.runInsertStageWaiting(scene, character);
                }
            },
            {
                text: '前戯に戻る',
                action: async () => {
                    IntimateSceneSystem.advanceStage(session, 'foreplay');
                    await this.runIntimateStage();
                }
            },
            {
                text: 'メニューに戻る',
                action: () => {
                    this.endIntimateScene();
                    this.showInteractionHub(character.id);
                }
            }
        ];
        this.showChoices(choices, { compact: true });
    }

    async recoverFromChoiceError() {
        if (!this.intimateSession || !this.phaseData?.character) return;
        const character = this.phaseData.character;
        const scene = getCharacterIntimateScene(
            this.intimateSession.characterId,
            this.buildIntimateSceneContext(this.intimateSession.characterId)
        );
        if (!scene) return;

        switch (this.intimateSession.stage) {
            case 'foreplay':
                await this.runForeplayStage(scene, character);
                break;
            case 'piston':
                await this.runPistonStage(scene, character);
                break;
            case 'aftercare':
                await this.runAftercareStage(scene, character);
                break;
            default:
                await this.showInteractionHub(character.id);
                break;
        }
    }

    async runPistonStage(scene, character) {
        const session = this.intimateSession;

        if (session.pistonCount === 0) {
            await this.showMessage(
                '律動が始まる。快楽のメーターが上昇していく……',
                'システム'
            );
        }

        const canClimax = IntimateSceneSystem.canClimax(session);
        const actions = getPistonActions()
            // 快感不足の状態では「フィニッシュする ▼」を表示しない（押せても何も起きないため冗長）
            .filter((a) => !a.finishMenu || canClimax);
        const choices = actions.map((action) => ({
            text: action.text,
            action: async () => {
                if (action.finishMenu) {
                    await this.showFinishMenu(scene, character);
                    return;
                }

                const wasAtClimaxBefore = IntimateSceneSystem.canClimax(session);
                const result = IntimateSceneSystem.applyPistonAction(
                    session,
                    action,
                    scene,
                    character.id
                );
                this.changeAffection(character.id, result.affection);
                await this.playIntimateLines(result.lines, character);
                this.updateIntimateHud();

                // 自動でフィニッシュに進めず、限界到達時はヒントだけ表示。
                // ユーザーが「フィニッシュする ▼」を明示選択するまで遷移しない。
                if (result.autoClimax && !wasAtClimaxBefore) {
                    await this.showMessage(
                        '──限界が近い。「フィニッシュする」を選べば射精できる。',
                        'システム'
                    );
                } else if (!wasAtClimaxBefore && IntimateSceneSystem.canClimax(session)) {
                    await this.showMessage(
                        '──そろそろフィニッシュできる。',
                        'システム'
                    );
                }

                await this.runPistonStage(scene, character);
            }
        }));

        choices.push({
            text: 'メニューに戻る',
            action: () => {
                this.endIntimateScene();
                this.showInteractionHub(character.id);
            }
        });

        this.showChoices(choices);
    }

    /** F5: 口での奉仕ステージ */
    async runOralStage(scene, character) {
        const session = this.intimateSession;
        const oralScene = scene.oral;

        if (!oralScene) {
            IntimateSceneSystem.advanceStage(session, session.previousStage || 'foreplay');
            await this.runIntimateStage();
            return;
        }

        if ((session.oralCount || 0) === 0) {
            await this.playIntimateLines(oralScene.intro, character);
        }

        const canClimax = IntimateSceneSystem.canClimax(session);
        const allowedActions = (oralScene.actions || [])
            .filter((a) => this.intimateActionAllowed(a, character.id));

        const choices = allowedActions.map((action) => ({
            text: action.text,
            action: async () => {
                const wasAtClimaxBefore = IntimateSceneSystem.canClimax(session);
                const result = IntimateSceneSystem.applyOralAction(
                    session,
                    action,
                    character.id
                );
                this.changeAffection(character.id, result.affection);
                await this.playIntimateLines(result.lines, character);
                this.updateIntimateHud();

                // 自動でフィニッシュに進めず、限界到達時はヒントのみ
                if (result.autoClimax && !wasAtClimaxBefore) {
                    await this.showMessage(
                        '──このまま続ければ、口の中で果てる。「フィニッシュする」を選べば射精。',
                        'システム'
                    );
                } else if (!wasAtClimaxBefore && IntimateSceneSystem.canClimax(session)) {
                    await this.showMessage(
                        '──そろそろフィニッシュできる。',
                        'システム'
                    );
                }
                await this.runOralStage(scene, character);
            }
        }));

        if (canClimax) {
            choices.push({
                text: 'フィニッシュする ▼',
                action: async () => {
                    await this.showFinishMenu(scene, character);
                }
            });
        }

        choices.push({
            text: '挿入に切り替える',
            action: async () => {
                IntimateSceneSystem.advanceStage(session, 'insert');
                await this.runIntimateStage();
            }
        });

        choices.push({
            text: '前戯に戻る',
            action: async () => {
                IntimateSceneSystem.advanceStage(session, 'foreplay');
                await this.runIntimateStage();
            }
        });

        choices.push({
            text: 'メニューに戻る',
            action: () => {
                this.endIntimateScene();
                this.showInteractionHub(character.id);
            }
        });

        this.showChoices(choices, { compact: true });
    }

    /** F2/F6: フィニッシュ着弾先メニュー */
    async showFinishMenu(scene, character) {
        const session = this.intimateSession;
        const profile = typeof getIntimacyProfile === 'function'
            ? getIntimacyProfile(character.id)
            : null;
        const options = typeof getFinishOptions === 'function'
            ? getFinishOptions(session, profile, this.gameState)
            : [];

        if (!options.length) {
            await this.showMessage('身体が限界を迎えていく――', 'システム');
            const outsideAction = (typeof FINISH_ACTIONS !== 'undefined' && FINISH_ACTIONS.outside)
                ? FINISH_ACTIONS.outside
                : null;
            if (outsideAction) {
                options.push(outsideAction);
            }
        }

        await this.showMessage('身体が限界を迎えていく――どうする？', 'システム');

        const choices = options.map((opt) => ({
            text: opt.label,
            action: async () => {
                await this.executeFinishChoice(opt.id, scene, character);
            }
        }));

        this.showChoices(choices, { compact: true });
    }

    async executeFinishChoice(finishId, scene, character) {
        const session = this.intimateSession;

        let chosenId = finishId;
        if (chosenId === 'inside') {
            const ok = await this.confirmInsideFinish(character);
            if (!ok) {
                chosenId = 'outside';
            }
        }

        const result = IntimateSceneSystem.applyFinishAction(
            session,
            chosenId,
            character,
            this.gameState
        );
        if (!result) {
            await this.showMessage('（フィニッシュアクションが解決できなかった）', 'システム');
            await this.runIntimateStage();
            return;
        }

        if (result.type === 'endure') {
            await this.playIntimateLines(result.lines, character);
            this.updateIntimateHud();
            const resumeStage = session.stage; // stage は変えていない
            if (resumeStage === 'oral') {
                await this.runOralStage(scene, character);
            } else {
                await this.runPistonStage(scene, character);
            }
            return;
        }

        // 通常射精
        this.changeAffection(character.id, result.affection);
        await this.playIntimateLines(result.lines, character);
        AffectionSystem.markRouteProgress(this.gameState, character.id, 'main');
        this.changeAffection(character.id, AffectionSystem.getIntimateAffection('main'));

        IntimateSceneSystem.advanceStage(session, 'aftercare');
        await this.runIntimateStage();
    }

    /** F3/F6: 中出し前の最終確認（初回または未同意時のみ） */
    async confirmInsideFinish(character) {
        const route = this.gameState.routeProgress?.[character.id] || {};
        const isExperienced = character.stats?.experience !== 'virgin';
        if (route.consentInside || isExperienced) {
            return true;
        }

        await this.showMessage('本当に中に出すのか――？', 'システム');

        return new Promise((resolve) => {
            const finalize = (value) => {
                resolve(value);
            };
            this.showChoices([
                { text: '中に出す', action: () => finalize(true) },
                { text: 'やっぱり外に出す', action: () => finalize(false) }
            ], { compact: true });
        });
    }

    async runClimaxStage(scene, character) {
        const session = this.intimateSession;
        const result = IntimateSceneSystem.buildClimaxResult(session, scene);

        this.changeAffection(character.id, result.affection);
        await this.playIntimateLines(result.lines, character);
        AffectionSystem.markRouteProgress(this.gameState, character.id, 'main');
        this.changeAffection(character.id, AffectionSystem.getIntimateAffection('main'));

        await this.showMessage('（絶頂――意識が遠のくほどの快楽が二人を包んだ）', 'システム');

        IntimateSceneSystem.advanceStage(session, 'aftercare');
        await this.runIntimateStage();
    }

    async runAftercareStage(scene, character) {
        const session = this.intimateSession;

        if (session.entryMode === 'aftercare' || session.climaxCount > 0) {
            if (!session._aftercareIntroShown) {
                session._aftercareIntroShown = true;
                await this.playIntimateLines(scene.aftercare.intro, character);
            }
        }

        AffectionSystem.markRouteProgress(this.gameState, character.id, 'aftercare');

        const choices = scene.aftercare.actions.map((action) => ({
            text: action.text,
            action: async () => {
                this.changeAffection(
                    character.id,
                    action.affection ?? AffectionSystem.getIntimateAffection('aftercare')
                );
                await this.playIntimateLines(action.lines, character);
                await this.finishIntimateScene();
            }
        }));

        choices.push({
            text: 'メニューに戻る',
            action: () => {
                this.endIntimateScene();
                this.showInteractionHub(character.id);
            }
        });

        this.showChoices(choices);
    }

    async finishIntimateScene() {
        const character = this.phaseData.character;
        this.endIntimateScene();

        if (AffectionSystem.shouldTriggerEnding(this.gameState, character.id)) {
            await this.showMessage('……ねえ。最後に、あなたにだけ伝えたいことがある。', character.name);
            await this.startEndingForCharacter(character.id);
            return;
        }

        this.showPostActivityChoices(character.id);
    }

    async completeMainPhase() {
        await this.finishIntimateScene();
    }

    // 相互作用終了
    async endInteraction() {
        const character = this.phaseData?.character;
        if (character) {
            const nn = character.nickname || character.name;
            await this.showMessage(`${nn}に手を振り、その場を後にした。`, 'システム');
        }

        this.hideCharacterImage();
        this.activeCharacterId = null;
        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.hideAffectionHud();
        }

        const actionResult = AffectionSystem.spendAction(this.gameState);
        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.updateGameInfo();
            if (actionResult.dayEnded) {
                await uiManager.showMessage(
                    `【${this.gameState.day}日目・${this.getTimeLabel()}】新しい一日が始まった。体力が回復した。`,
                    'システム'
                );
            } else if (actionResult.timeAdvanced) {
                await uiManager.showMessage(
                    `時間が進んだ。── ${this.getTimeLabel()}`,
                    'システム'
                );
            }
        }

        this.currentPhase = null;
        this.phaseData = null;
        this.autoSave();

        const forced = await this.checkForceEnding();
        if (forced) return;

        // 時間帯が進んだなら、好感度の高い子からのお誘いを抽選する
        if (actionResult.timeAdvanced) {
            const invited = await this.maybeTriggerInvitation();
            if (invited) return;
        }

        this.showMap();
    }

    getTimeLabel() {
        if (typeof AffectionSystem !== 'undefined'
            && typeof AffectionSystem.getTimeLabel === 'function') {
            return AffectionSystem.getTimeLabel(this.gameState.timeOfDay);
        }
        return this.gameState.timeOfDay;
    }

    /** デート合流時の導入演出（時間帯ムード反映） */
    async runDateMeetingIntro(characterId, spotId, timeOfDay) {
        const character = (typeof CHARACTERS !== 'undefined') ? CHARACTERS[characterId] : null;
        const spotName = (typeof SPOTS !== 'undefined' && SPOTS[spotId]) ? SPOTS[spotId] : spotId;
        if (!character) return;

        const moodMap = {
            morning: '朝陽が${spot}の景色を柔らかく照らしている。',
            afternoon: '陽射しが${spot}に降り注ぎ、二人の影をくっきりと描く。',
            evening: '夕焼けが${spot}を茜色に染めている。',
            night: '夜風が${spot}を撫で、星明かりが頬を照らす。',
            midnight: '${spot}の静寂が、ふたりだけの世界を作り出している。'
        };
        const mood = (moodMap[timeOfDay] || moodMap.afternoon)
            .replace('${spot}', spotName);

        await this.showMessage(mood, 'システム');

        const nn = character.nickname || character.name;
        await this.showMessage(`${spotName}に着くと、${nn}が先に待っていた。`, 'システム');

        const personality = character.personality || 'default';
        const greetingByPersonality = {
            active: {
                morning: `「おっはよー！　早起きは得意なんだ♪」`,
                afternoon: `「待ってた！　今日は楽しもうね！」`,
                evening: `「夕焼けきれい……って、見とれてる場合じゃないか！」`,
                night: `「夜の冒険、ドキドキするね！」`,
                midnight: `「こんな時間まで一緒……なんか特別だね」`
            },
            shy: {
                morning: `「あ……おはよう、ございます。……来てくれて嬉しい」`,
                afternoon: `「あの……待ってました。えっと、よろしくお願いします」`,
                evening: `「夕焼け……綺麗ですね。……あなたと見られて、よかった」`,
                night: `「こ、こんな時間に二人きりって……緊張します」`,
                midnight: `「……来てくれた。ずっと、待ってたの」`
            },
            cool: {
                morning: `「おはよう。朝の空気は悪くない――あなたがいればね」`,
                afternoon: `「待たせたわね……冗談、私が早すぎただけ」`,
                evening: `「夕焼けに見惚れていたの。……あなたに、じゃないわよ」`,
                night: `「夜のあなたは、なんだか違って見える……」`,
                midnight: `「来てくれた……。今夜は、誰にも渡したくない」`
            },
            default: {
                morning: `「おはよう。来てくれて、嬉しい」`,
                afternoon: `「待ってた。今日は、たっぷり付き合ってもらうから」`,
                evening: `「夕焼け、見られてよかった――あなたと、一緒に」`,
                night: `「夜のあなたは、なんだか違って見える……」`,
                midnight: `「来てくれた……。今夜は、誰にも渡したくない」`
            }
        };

        const personalityGreetings = greetingByPersonality[personality] || greetingByPersonality.default;
        const greeting = personalityGreetings[timeOfDay] || personalityGreetings.afternoon;
        await this.showMessage(greeting, character.name);
    }

    /** 時間帯遷移時のお誘い抽選＋演出。発動したら true を返す。 */
    async maybeTriggerInvitation() {
        if (typeof tryRollInvitation !== 'function') return false;
        const invitation = tryRollInvitation(this.gameState, this.gameState.timeOfDay);
        if (!invitation) return false;
        await this.runInvitationFlow(invitation);
        return true;
    }

    async runInvitationFlow(invitation) {
        const character = invitation.character;
        const spotName = (typeof SPOTS !== 'undefined' && SPOTS[invitation.spotId])
            ? SPOTS[invitation.spotId]
            : invitation.spotId;

        if (typeof uiManager !== 'undefined' && uiManager) {
            await uiManager.showMessage(
                `――${character.name}からメッセージが届いた。`,
                'システム'
            );
            await uiManager.showMessage(invitation.line, character.name);
            await uiManager.showMessage(
                `「${spotName}で、待ってる。」`,
                character.name
            );
        }

        // フラグ管理（同人連続防止 + 時間帯1回制）
        if (!this.gameState.flags) this.gameState.flags = {};
        const slotKey = `invitedAt_${this.gameState.day}_${invitation.timeOfDay}`;
        this.gameState.flags[slotKey] = true;
        this.gameState.flags.lastInviterId = invitation.characterId;

        return new Promise((resolve) => {
            this.showChoices([
                {
                    text: `今すぐ ${spotName} へ向かう`,
                    action: async () => {
                        this.gameState.flags.activeDate = {
                            characterId: invitation.characterId,
                            spotId: invitation.spotId,
                            timeOfDay: invitation.timeOfDay
                        };
                        await this.changeSpot(invitation.spotId);
                        resolve();
                    }
                },
                {
                    text: '今は行けない（断る）',
                    action: async () => {
                        await this.showMessage(
                            `${this.gameState.playerName}はメッセージに短い返事を返した。`,
                            'システム'
                        );
                        this.changeAffection(invitation.characterId, -3);
                        this.gameState.flags.lastInviterId = null;
                        this.showMap();
                        resolve();
                    }
                }
            ]);
        });
    }

    async checkForceEnding() {
        if (this.gameState.flags.endingSeen) return false;
        const candidate = AffectionSystem.getEndingCandidate(this.gameState);
        if (!candidate) return false;

        if (candidate.type === 'heroine') {
            return false;
        }

        await this.showMessage('滞在期間が終了しました。エンディングへ進みます。', 'システム');
        await this.playEnding(candidate);
        return true;
    }

    async startEndingForCharacter(characterId) {
        const candidate = {
            type: 'heroine',
            id: characterId,
            affection: AffectionSystem.getAffection(this.gameState, characterId),
            character: CHARACTERS[characterId]
        };
        await this.playEnding(candidate);
    }

    async playEnding(candidate) {
        const ending = typeof getEndingForCandidate === 'function'
            ? getEndingForCandidate(candidate)
            : null;

        if (!ending) {
            await this.showMessage('エンディングデータが見つかりません。', 'システム');
            this.showMap();
            return;
        }

        this.gameState.flags.endingSeen = true;
        this.gameState.flags.endingCharacterId = candidate.id;

        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.hideMap();
            uiManager.hideAffectionHud();
        }

        this.storyActive = true;
        this.storyMode = 'ending';
        this.pendingEndingMeta = {
            title: ending.title,
            type: ending.type,
            characterName: candidate.character?.name || ''
        };
        this.storyQueue = ending.beats.map((b) => ({ ...b }));
        await this.runNextStoryBeat();
    }

    async finishEndingSequence() {
        this.storyActive = false;
        this.storyMode = null;
        this.waitingForStoryClick = false;
        this.hideCharacterImage();
        this.autoSave();

        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.showEndingScreen(this.pendingEndingMeta || {
                title: 'エンディング',
                type: 'heroine',
                characterName: ''
            });
        } else {
            this.showMap();
        }
    }

    // 好感度変更
    changeAffection(characterId, change) {
        const result = AffectionSystem.changeAffection(this.gameState, characterId, change);
        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.showAffectionDelta(result);
            if (this.activeCharacterId === characterId) {
                uiManager.updateAffectionHud(characterId, result.after);
            }
        }
        return result;
    }

    // メッセージ表示
    async showMessage(text, speaker = '') {
        if (typeof uiManager !== 'undefined' && uiManager && uiManager.isInitialized) {
            return uiManager.showMessage(text, speaker);
        }
        return new Promise((resolve) => {
            if (this.elements.speakerName) {
                this.elements.speakerName.textContent = speaker;
            }
            if (this.elements.messageWindow) {
                this.elements.messageWindow.style.display = 'block';
            }
            if (this.elements.messageText) {
                this.typeText(text, resolve);
            } else {
                resolve();
            }
        });
    }

    // タイピング効果
    typeText(text, callback) {
        if (!this.elements.messageText) return;
        
        this.elements.messageText.textContent = '';
        let index = 0;
        const speed = [50, 30, 10][this.settings.textSpeed];
        
        const typing = () => {
            if (index < text.length) {
                this.elements.messageText.textContent += text[index];
                index++;
                setTimeout(typing, speed);
            } else {
                callback();
            }
        };
        
        typing();
    }

    // テキスト進行
    advanceText() {
        // タイピング中なら即座に完了
        // 完了済みなら次のアクションへ
    }

    // 選択肢表示
    showChoices(choices) {
        if (typeof uiManager !== 'undefined' && uiManager && uiManager.isInitialized) {
            uiManager.showChoices(choices);
            return;
        }
        if (!this.elements.choicesContainer) return;
        
        this.elements.choicesContainer.innerHTML = '';
        
        choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.textContent = choice.text;
            button.className = 'choice-button';
            button.addEventListener('click', choice.action);
            this.elements.choicesContainer.appendChild(button);
        });
        
        this.elements.choicesContainer.style.display = 'block';
    }

    // 選択肢を隠す
    hideChoices() {
        if (this.elements.choicesContainer) {
            this.elements.choicesContainer.style.display = 'none';
        }
    }

    // マップ表示
    async showMap() {
        if (this.gameState.flags?.endingSeen) {
            return;
        }

        const forced = await this.checkForceEnding();
        if (forced) {
            return;
        }

        if (typeof uiManager !== 'undefined' && uiManager && uiManager.isInitialized) {
            uiManager.showMap();
            return;
        }
        this.hideChoices();
        if (this.elements.mapContainer) {
            this.elements.mapContainer.style.display = 'block';
        }
    }

    // マップを隠す
    hideMap() {
        if (typeof uiManager !== 'undefined' && uiManager && uiManager.isInitialized) {
            uiManager.hideMap();
            return;
        }
        if (this.elements.mapContainer) {
            this.elements.mapContainer.style.display = 'none';
        }
    }

    // キャラクター画像表示
    showCharacterImage(characterId) {
        if (this.elements.characterImage) {
            this.elements.characterImage.style.backgroundImage = 
                `url('assets/images/characters/${characterId}.png')`;
            this.elements.characterImage.style.display = 'block';
        }
    }

    // キャラクター画像を隠す
    hideCharacterImage() {
        if (this.elements.characterImage) {
            this.elements.characterImage.style.display = 'none';
        }
    }

    // エラー表示
    showError(message) {
        alert(`エラー: ${message}`);
    }

    // キー操作処理
    handleKeyPress(event) {
        switch (event.key) {
            case 'Enter':
            case ' ':
                this.advanceText();
                break;
            case 'Escape':
                this.showMenu();
                break;
            case 's':
            case 'S':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.quickSave();
                }
                break;
            case 'l':
            case 'L':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.quickLoad();
                }
                break;
        }
    }

    // 設定読み込み
    loadSettings() {
        const saved = localStorage.getItem('awaji_novel_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    // 設定保存
    saveSettings() {
        localStorage.setItem('awaji_novel_settings', JSON.stringify(this.settings));
    }

    // オートセーブ
    autoSave() {
        localStorage.setItem('awaji_novel_autosave', JSON.stringify(this.gameState));
    }

    // オートセーブ読み込み
    loadAutoSave() {
        const saved = localStorage.getItem('awaji_novel_autosave');
        if (saved) {
            this.gameState = { ...this.gameState, ...JSON.parse(saved) };
        }
    }

    // クイックセーブ
    quickSave() {
        localStorage.setItem('awaji_novel_quicksave', JSON.stringify(this.gameState));
        this.showMessage('クイックセーブしました', 'システム');
    }

    // クイックロード
    quickLoad() {
        const saved = localStorage.getItem('awaji_novel_quicksave');
        if (saved) {
            this.gameState = JSON.parse(saved);
            this.showMessage('クイックロードしました', 'システム');
            // 現在の状態を復元
            this.restoreGameState();
        }
    }

    // ゲーム状態復元
    async restoreGameState() {
        this.migrateGameState();
        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.updateGameInfo();
        }
        if (this.gameState.flags?.endingSeen) {
            const meta = {
                title: '続きから',
                type: 'heroine',
                characterName: CHARACTERS[this.gameState.flags.endingCharacterId]?.name || ''
            };
            if (typeof uiManager !== 'undefined' && uiManager) {
                uiManager.showEndingScreen(meta);
            }
            return;
        }
        await this.changeSpot(this.gameState.currentSpot);
    }

    migrateGameState() {
        if (!this.gameState) return;
        this.gameState.characterAffections = this.gameState.characterAffections || {};
        this.gameState.metCharacters = this.gameState.metCharacters || {};
        this.gameState.routeProgress = this.gameState.routeProgress || {};
        this.gameState.affectionHistory = this.gameState.affectionHistory || [];
        this.gameState.actionsToday = this.gameState.actionsToday ?? 0;
        this.gameState.energy = this.gameState.energy ?? 100;
        this.gameState.intimateSession = this.gameState.intimateSession || null;
        this.gameState.flags = this.gameState.flags || {};

        // 旧 'noon' / 不正値 を新時間帯体系へ正規化
        if (typeof AffectionSystem !== 'undefined'
            && typeof AffectionSystem.normalizeTimeOfDay === 'function') {
            this.gameState.timeOfDay = AffectionSystem.normalizeTimeOfDay(
                this.gameState.timeOfDay
            );
        }
        // 旧スポットID（terminal等）を現行IDへ
        if (typeof SPOT_ALIASES !== 'undefined' && SPOT_ALIASES[this.gameState.currentSpot]) {
            this.gameState.currentSpot = SPOT_ALIASES[this.gameState.currentSpot];
        }

        if (typeof CHARACTERS !== 'undefined') {
            Object.keys(CHARACTERS).forEach((id) => {
                if (this.gameState.characterAffections[id] === undefined) {
                    this.gameState.characterAffections[id] = 0;
                }
            });
        }
    }

    // メニュー表示
    showMenu() {
        // メニュー画面の表示（別途実装）
    }

    // セーブ画面表示
    showSaveScreen() {
        // セーブ画面の表示（別途実装）
    }

    // ロード画面表示
    showLoadScreen() {
        // ロード画面の表示（別途実装）
    }

    // 設定画面表示
    showSettings() {
        // 設定画面の表示（別途実装）
    }

    // ゲーム破棄
    destroy() {
        this.removeAllEventListeners();
        this.isInitialized = false;
    }
}

// グローバルインスタンス
let gameEngine = null;

// ゲーム開始
function startGame() {
    if (gameEngine) {
        gameEngine.destroy();
    }
    
    gameEngine = new GameEngine();
    gameEngine.initialize();
}

// DOMロード完了時にゲーム開始
document.addEventListener('DOMContentLoaded', async () => {
    gameEngine = new GameEngine();

    if (typeof storyManager !== 'undefined' && storyManager) {
        await storyManager.initializeScenarios();
    }

    if (typeof uiManager !== 'undefined' && uiManager) {
        await uiManager.initialize();
    }

    await gameEngine.initialize();
});