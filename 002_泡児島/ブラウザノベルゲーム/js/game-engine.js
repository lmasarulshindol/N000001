// 泡児島ノベルゲーム - メインゲームエンジン
// シーン管理・選択肢処理・フェーズ管理を統括

class GameEngine {
    constructor() {
        this.currentScene = null;
        this.gameState = {
            currentSpot: 'terminal',
            timeOfDay: 'morning', // morning, noon, evening, night
            day: 1,
            playerName: 'プレイヤー',
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
    async startNewGame() {
        this.gameState = {
            currentSpot: 'terminal',
            timeOfDay: 'morning',
            day: 1,
            playerName: 'プレイヤー',
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
        this.gameState.currentSpot = 'terminal';
        this.hideCharacterImage();

        if (typeof AffectionSystem !== 'undefined') {
            AffectionSystem.applyPrologueBonuses(this.gameState, [
                'minagi', 'kokoa', 'hinata', 'sakura', 'aoi', 'miyu', 'rin', 'nagisa'
            ]);
        }

        await this.changeBackground('terminal');
        if (typeof uiManager !== 'undefined' && uiManager) {
            uiManager.updateGameInfo();
            await uiManager.showMessage(
                '【システム】お出迎えの少女たちと顔合わせした。\n会った子はどこでも「会話」「子作り」可能。子作りは前戯→挿入→交尾→絶頂の流れで快感ゲージが上昇し、行為でも好感度が上がる。（1日3行動・全5日）',
                'システム'
            );
            this.waitingForStoryClick = true;
            this.storyActive = true;
            this.storyMode = 'tutorial';
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
            terminal: 'linear-gradient(160deg, #e8f4fc 0%, #9ec5e8 50%, #5a8fb8 100%)',
            beach: 'linear-gradient(180deg, #4facfe 0%, #00f2fe 45%, #f5d76e 100%)',
            beachbar: 'linear-gradient(180deg, #f6d365 0%, #fda085 100%)',
            cottage: 'linear-gradient(180deg, #a8e6cf 0%, #88d8b0 50%, #ffeaa7 100%)',
            hotel: 'linear-gradient(180deg, #dfe9f3 0%, #ffffff 50%, #c9d6df 100%)',
            restaurant: 'linear-gradient(180deg, #ffecd2 0%, #fcb69f 100%)',
            garden: 'linear-gradient(180deg, #d4fc79 0%, #96e6a1 100%)',
            library: 'linear-gradient(180deg, #e0c3fc 0%, #8ec5fc 100%)',
            sports_area: 'linear-gradient(180deg, #84fab0 0%, #8fd3f4 100%)'
        };
        const el = document.getElementById('background-image');
        if (!el) return;
        el.style.backgroundColor = '#1a4d6d';
        el.style.backgroundImage = gradients[spotId] || gradients.beach;
        el.style.backgroundSize = 'cover';
    }

    // スポット固有のイベント処理
    async processSpotEvents(spotId) {
        if (spotId === 'terminal') {
            const arrived = this.gameState.flags.prologueSeen;
            await this.showMessage(
                arrived
                    ? 'ターミナルロビー。チェックイン済みです。島内マップから行き先を選んでください。'
                    : '白を基調としたロビー。チェックインは済んでいます。島内マップから好きな場所へ向かいましょう。',
                'コンシェルジュ'
            );
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
        const choices = characters.map((char) => {
            const isFirstMeet = !this.gameState.metCharacters?.[char.id];
            return {
                text: isFirstMeet ? `${char.name}と初めて会う` : `${char.name}と過ごす`,
                action: () => this.startCharacterInteraction(char.id, isFirstMeet)
            };
        });

        choices.push({
            text: 'マップに戻る',
            action: () => this.showMap()
        });

        const metCount = this.getMetCharacters().length;
        const prompt = metCount > 0
            ? `誰と過ごしますか？（会った${metCount}人はどこでも呼べます）`
            : '誰と過ごしますか？';
        await this.showMessage(prompt, '');
        this.showChoices(choices);
    }

    async startCharacterInteraction(characterId, isFirstMeet = false) {
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
            await this.showMessage(
                `${character.name}と初めて会った。\nこれからはどの場所からでも会話・子作りができる。`,
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

        this.currentPhase = 'hub';
        this.phaseData = {
            characterId,
            character,
            phaseType: 'hub'
        };

        await this.showMessage(
            `${character.name}と過ごす。\n（好感度: ${affection}／${rank.label}${mainDone ? '・子作り済' : ''}）\n会話も子作りも、いつでもどこでも。`,
            character.name
        );

        this.showChoices([
            { text: '会話する', action: () => this.startPhase('conversation', characterId) },
            { text: '子作りする', action: () => this.startIntimateScene('main') },
            { text: '前戯から始める', action: () => this.startIntimateScene('foreplay') },
            { text: '余韻を楽しむ', action: () => this.startIntimateScene('aftercare') },
            { text: '別の子を選ぶ／マップへ', action: () => this.leaveToMap() }
        ]);
    }

    leaveToMap() {
        this.endIntimateScene(false);
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
                await this.skinshipPhase();
                break;
            case 'intimate':
                await this.intimatePhase();
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
        const affection = AffectionSystem.getAffection(this.gameState, character.id);
        const rank = AffectionSystem.getRank(affection);

        await this.showMessage(
            `${this.gameState.playerName}さん、どうしたの？\n（好感度: ${affection}／${rank.label}）`,
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
        this.changeAffection(character.id, dialogue.affection);
        await this.showMessage(dialogue.response, character.name);
        await this.showMessage('（会話で好感度が上がった）', 'システム');
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
        for (const line of lineList) {
            const speaker = typeof resolveSpeaker === 'function'
                ? resolveSpeaker(line, character)
                : (line.speaker === 'heroine' ? character.name : '');
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

    async runIntimateStage() {
        const session = this.intimateSession;
        const character = this.phaseData.character;
        const scene = getCharacterIntimateScene(session.characterId);
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

    async runForeplayStage(scene, character) {
        if (this.intimateSession.foreplayCount === 0) {
            await this.playIntimateLines(scene.foreplay.intro, character);
        }

        const choices = scene.foreplay.actions.map((action) => ({
            text: action.text,
            action: async () => {
                const result = IntimateSceneSystem.applyForeplayAction(
                    this.intimateSession,
                    action
                );
                this.changeAffection(character.id, result.affection);
                await this.playIntimateLines(result.lines, character);
                this.updateIntimateHud();

                if (result.goInsert
                    || this.intimateSession.pleasure >= INTIMATE_CONFIG.foreplayToInsertPleasure) {
                    IntimateSceneSystem.advanceStage(this.intimateSession, 'insert');
                    await this.runIntimateStage();
                    return;
                }

                await this.runForeplayStage(scene, character);
            }
        }));

        choices.push({
            text: '挿入へ進む',
            action: async () => {
                IntimateSceneSystem.advanceStage(this.intimateSession, 'insert');
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

        IntimateSceneSystem.advanceStage(session, 'piston');
        await this.runIntimateStage();
    }

    async runPistonStage(scene, character) {
        const session = this.intimateSession;

        if (session.pistonCount === 0) {
            await this.showMessage(
                '律動が始まる。快楽のメーターが上昇していく……',
                'システム'
            );
        }

        const actions = getPistonActions();
        const choices = actions.map((action) => ({
            text: action.climaxAction
                ? `${action.text}${IntimateSceneSystem.canClimax(session) ? '' : '（快感不足）'}`
                : action.text,
            action: async () => {
                if (action.climaxAction) {
                    if (!IntimateSceneSystem.canClimax(session)) {
                        await this.showMessage('まだ射精できるほど快感がたまっていない……', 'システム');
                        await this.runPistonStage(scene, character);
                        return;
                    }
                    IntimateSceneSystem.advanceStage(session, 'climax');
                    await this.runIntimateStage();
                    return;
                }

                const result = IntimateSceneSystem.applyPistonAction(
                    session,
                    action,
                    scene
                );
                this.changeAffection(character.id, result.affection);
                await this.playIntimateLines(result.lines, character);
                this.updateIntimateHud();

                if (result.autoClimax) {
                    IntimateSceneSystem.advanceStage(session, 'climax');
                    await this.runIntimateStage();
                    return;
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

    async runClimaxStage(scene, character) {
        const session = this.intimateSession;
        const result = IntimateSceneSystem.buildClimaxResult(session, scene);

        this.changeAffection(character.id, result.affection);
        await this.playIntimateLines(result.lines, character);
        AffectionSystem.markRouteProgress(this.gameState, character.id, 'main');
        this.changeAffection(character.id, AffectionSystem.getIntimateAffection('main'));

        await this.showMessage('（絶頂。子作りシーン完了・好感度大幅上昇）', 'システム');

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
        const characterName = this.phaseData?.character?.name || '';
        if (characterName) {
            await this.showMessage('また今度お話ししましょうね。', characterName);
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
            }
        }

        this.currentPhase = null;
        this.phaseData = null;
        this.autoSave();

        const forced = await this.checkForceEnding();
        if (!forced) {
            this.showMap();
        }
    }

    getTimeLabel() {
        const map = { morning: '朝', noon: '昼', evening: '夕方', night: '夜' };
        return map[this.gameState.timeOfDay] || this.gameState.timeOfDay;
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