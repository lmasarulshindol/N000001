// 泡児島ノベルゲーム - ストーリー管理クラス
// シナリオデータの管理と各フェーズの詳細処理

class StoryManager {
    constructor() {
        this.scenarios = {};
        this.currentScenario = null;
        this.currentDialogueIndex = 0;
        
        // フェーズ別のシナリオテンプレート
        this.phaseTemplates = {
            conversation: this.generateConversationScenario.bind(this),
            skinship: this.generateSkinshipScenario.bind(this),
            foreplay: this.generateForeplayScenario.bind(this),
            main: this.generateMainScenario.bind(this),
            aftercare: this.generateAftercareScenario.bind(this)
        };
    }

    // シナリオの初期化
    async initializeScenarios() {
        // 基本会話パターンの生成
        await this.generateAllConversationScenarios();
        console.log('シナリオデータ初期化完了');
    }

    // 全キャラクターの会話シナリオ生成
    async generateAllConversationScenarios() {
        for (const [charId, character] of Object.entries(CHARACTERS)) {
            this.scenarios[charId] = {
                conversation: await this.generateConversationScenario(character),
                skinship: await this.generateSkinshipScenario(character),
                foreplay: await this.generateForeplayScenario(character),
                main: await this.generateMainScenario(character),
                aftercare: await this.generateAftercareScenario(character)
            };
        }
    }

    // 会話フェーズシナリオ生成
    async generateConversationScenario(character) {
        const scenario = {
            phase: 'conversation',
            characterId: character.id,
            dialogues: [],
            choices: []
        };

        // 基本挨拶
        scenario.dialogues.push({
            speaker: character.name,
            text: this.generateGreeting(character),
            emotion: 'happy'
        });

        // 選択肢群の生成
        scenario.choices = [
            {
                id: 'self_intro',
                text: '自己紹介をする',
                affectionChange: 2,
                response: this.generateSelfIntroResponse(character)
            },
            {
                id: 'island_question',
                text: 'この島についてどう思う？',
                affectionChange: 1,
                response: this.generateIslandResponse(character)
            },
            {
                id: 'hometown_question',
                text: '出身地について聞く',
                affectionChange: 3,
                response: this.generateHometownResponse(character)
            },
            {
                id: 'hobby_question',
                text: '趣味について聞く',
                affectionChange: 2,
                response: this.generateHobbyResponse(character)
            },
            {
                id: 'family_question',
                text: '家族について聞く',
                affectionChange: 4,
                response: this.generateFamilyResponse(character),
                condition: (affection) => affection >= 20
            }
        ];

        return scenario;
    }

    // スキンシップフェーズシナリオ生成
    async generateSkinshipScenario(character) {
        const scenario = {
            phase: 'skinship',
            characterId: character.id,
            dialogues: [],
            choices: []
        };

        // 導入
        scenario.dialogues.push({
            speaker: character.name,
            text: this.generateSkinshipIntro(character),
            emotion: 'shy'
        });

        // 段階的なスキンシップ選択肢
        scenario.choices = [
            {
                id: 'hand_hold',
                text: '手を繋ぐ',
                affectionChange: 3,
                response: this.generateHandHoldResponse(character)
            },
            {
                id: 'shoulder_hug',
                text: '肩を抱く',
                affectionChange: 4,
                response: this.generateShoulderHugResponse(character)
            },
            {
                id: 'gentle_kiss',
                text: '頬にキスする',
                affectionChange: 5,
                response: this.generateGentleKissResponse(character),
                condition: (affection) => affection >= 40
            },
            {
                id: 'intimate_progress',
                text: 'もっと親密になる',
                affectionChange: 0,
                nextPhase: 'foreplay',
                response: this.generateIntimateProgressResponse(character),
                condition: (affection) => affection >= 60
            }
        ];

        return scenario;
    }

    // 前戯フェーズシナリオ生成
    async generateForeplayScenario(character) {
        const scenario = {
            phase: 'foreplay',
            characterId: character.id,
            dialogues: [],
            choices: [],
            contentLevel: 'adult' // 成人向けコンテンツ
        };

        // フェーズ導入
        scenario.dialogues.push({
            speaker: character.name,
            text: this.generateForeplayIntro(character),
            emotion: 'nervous'
        });

        scenario.choices = [
            {
                id: 'gentle_approach',
                text: 'ゆっくりと優しく',
                affectionChange: 5,
                response: this.generateGentleApproachResponse(character)
            },
            {
                id: 'passionate_approach',
                text: '情熱的に',
                affectionChange: 3,
                response: this.generatePassionateApproachResponse(character)
            },
            {
                id: 'ask_feelings',
                text: '気持ちを確認する',
                affectionChange: 7,
                response: this.generateFeelingsCheckResponse(character)
            },
            {
                id: 'proceed_main',
                text: '次の段階へ',
                nextPhase: 'main',
                response: this.generateProceedMainResponse(character),
                condition: (affection) => affection >= 80
            }
        ];

        return scenario;
    }

    // メインフェーズシナリオ生成
    async generateMainScenario(character) {
        const scenario = {
            phase: 'main',
            characterId: character.id,
            dialogues: [],
            choices: [],
            contentLevel: 'adult'
        };

        // 経験レベルに応じた導入
        const isVirgin = character.stats.experience === 'virgin';
        scenario.dialogues.push({
            speaker: character.name,
            text: isVirgin ? 
                this.generateVirginMainIntro(character) : 
                this.generateExperiencedMainIntro(character),
            emotion: isVirgin ? 'nervous' : 'excited'
        });

        scenario.choices = [
            {
                id: 'gentle_pace',
                text: '優しく丁寧に',
                affectionChange: 8,
                response: this.generateGentlePaceResponse(character, isVirgin)
            },
            {
                id: 'normal_pace',
                text: '普通のペースで',
                affectionChange: 5,
                response: this.generateNormalPaceResponse(character, isVirgin)
            },
            {
                id: 'check_comfort',
                text: '様子を確認する',
                affectionChange: 10,
                response: this.generateComfortCheckResponse(character, isVirgin)
            }
        ];

        return scenario;
    }

    // アフターケアフェーズシナリオ生成
    async generateAftercareScenario(character) {
        const scenario = {
            phase: 'aftercare',
            characterId: character.id,
            dialogues: [],
            choices: []
        };

        scenario.dialogues.push({
            speaker: character.name,
            text: this.generateAftercareIntro(character),
            emotion: 'satisfied'
        });

        scenario.choices = [
            {
                id: 'cuddle',
                text: '寄り添う',
                affectionChange: 5,
                response: this.generateCuddleResponse(character)
            },
            {
                id: 'talk_feelings',
                text: '気持ちを話し合う',
                affectionChange: 8,
                response: this.generateTalkFeelingsResponse(character)
            },
            {
                id: 'promise_future',
                text: '今後の約束をする',
                affectionChange: 10,
                response: this.generatePromiseFutureResponse(character)
            }
        ];

        return scenario;
    }

    // === テキスト生成メソッド群 ===

    generateGreeting(character) {
        const greetings = {
            active: [`こんにちは！元気いっぱいの${character.nickname}です♪`, `やっほー！今日もいい天気だね〜！`],
            shy: [`あ、あの...こんにちは...`, `は、はじめまして...${character.nickname}です...`],
            cool: [`こんにちは。${character.name}です。`, `よろしくお願いします。`],
            gentle: [`こんにちは〜♪ ${character.nickname}だよ〜`, `のんびりしましょうね〜`]
        };
        
        const patterns = greetings[character.personality] || greetings.active;
        return this.addSpeechPattern(patterns[Math.floor(Math.random() * patterns.length)], character);
    }

    getPlayerName() {
        if (typeof gameEngine !== 'undefined' && gameEngine && gameEngine.gameState) {
            return gameEngine.gameState.playerName;
        }
        return 'あなた';
    }

    generateSelfIntroResponse(character) {
        const playerName = this.getPlayerName();
        const responses = {
            active: [`${playerName}さんっていうんだ！覚えたよ〜♪`, `よろしくね、${playerName}さん！`],
            shy: [`${playerName}さん...とっても素敵なお名前ですね...`, `よ、よろしくお願いします...`],
            cool: [`${playerName}さんですね。覚えました。`, `こちらこそ、よろしくお願いします。`]
        };
        
        const patterns = responses[character.personality] || responses.active;
        return this.addSpeechPattern(patterns[Math.floor(Math.random() * patterns.length)], character);
    }

    generateIslandResponse(character) {
        return this.addSpeechPattern(`この島、とってもきれいでしょ？私も大好きなの。`, character);
    }

    generateHometownResponse(character) {
        return this.addSpeechPattern(`私は${character.origin}出身なの。${this.getHometownDetail(character)}`, character);
    }

    generateHobbyResponse(character) {
        const hobbies = character.traits.hobbies.join('や');
        return this.addSpeechPattern(`私の趣味は${hobbies}なの。一緒にやってみる？`, character);
    }

    generateFamilyResponse(character) {
        return this.addSpeechPattern(`家族のこと...実は${character.background.reason}で、それで私ここに来たの。`, character);
    }

    // 方言・話し方パターンの適用
    addSpeechPattern(text, character) {
        // 沖縄方言
        if (character.origin.includes('沖縄')) {
            text = text.replace(/でしょ？/g, 'さぁ？');
            text = text.replace(/だよ/g, 'だよ〜');
            text = text.replace(/大丈夫/g, 'だいじょぶ');
        }
        
        // 関西弁
        if (character.origin.includes('大阪') || character.origin.includes('関西')) {
            text = text.replace(/だよ/g, 'やで');
            text = text.replace(/でしょ/g, 'やん');
            text = text.replace(/だめ/g, 'あかん');
        }
        
        // 九州弁（熊本）
        if (character.origin.includes('熊本')) {
            text = text.replace(/だよ/g, 'ばい');
            text = text.replace(/でしょ/g, 'やろ');
            text = text.replace(/だから/g, 'だけん');
        }
        
        // 京都弁
        if (character.origin.includes('京都')) {
            text = text.replace(/です/g, 'どす');
            text = text.replace(/ください/g, 'おくれやす');
        }

        return text;
    }

    getHometownDetail(character) {
        const details = {
            '沖縄': 'とっても暖かくて海がきれいなところなの',
            '大阪': '人情あふれる楽しい街やで〜',
            '北海道': '雪がとってもきれいで、空気が澄んでいるの',
            '京都': '古い文化が残る美しい街どす',
            '熊本': '自然豊かでのんびりしたところばい'
        };
        
        for (const [region, detail] of Object.entries(details)) {
            if (character.origin.includes(region)) {
                return detail;
            }
        }
        return '素敵なところよ';
    }

    // より詳細な成人向けコンテンツ生成メソッド（プレースホルダー）
    generateSkinshipIntro(character) {
        const isVirgin = character.stats.experience === 'virgin';
        if (isVirgin) {
            return this.addSpeechPattern('ド、ドキドキする...でも、嫌じゃないの...', character);
        } else {
            return this.addSpeechPattern('もう少し近づいても...いいかな？', character);
        }
    }

    generateHandHoldResponse(character) {
        return this.addSpeechPattern('あったかい手...安心する...', character);
    }

    generateShoulderHugResponse(character) {
        return this.addSpeechPattern('こんなに近くにいると、心臓がドキドキしちゃう...', character);
    }

    generateGentleKissResponse(character) {
        return this.addSpeechPattern('あっ...優しいキス...嬉しい...', character);
    }

    generateIntimateProgressResponse(character) {
        return this.addSpeechPattern('もっと...あなたと近づきたい...', character);
    }

    // 成人向けコンテンツの生成メソッド（実装詳細は設定レベルに応じて調整）
    generateForeplayIntro(character) {
        return this.addSpeechPattern('緊張するけど...あなたとなら...', character);
    }

    generateVirginMainIntro(character) {
        return this.addSpeechPattern('初めてで...怖いけど...優しくして...', character);
    }

    generateExperiencedMainIntro(character) {
        return this.addSpeechPattern('あなたとこうなれて...嬉しい...', character);
    }

    generateAftercareIntro(character) {
        return this.addSpeechPattern('幸せ...あなたといると安心する...', character);
    }

    // その他の詳細レスポンス生成メソッド（簡略版）
    generateGentleApproachResponse(character) {
        return this.addSpeechPattern('優しくしてくれて...ありがとう...', character);
    }

    generatePassionateApproachResponse(character) {
        return this.addSpeechPattern('こんなに激しく...でも嫌じゃない...', character);
    }

    generateFeelingsCheckResponse(character) {
        return this.addSpeechPattern('気遣ってくれて...本当に優しい人ね...', character);
    }

    generateProceedMainResponse(character) {
        return this.addSpeechPattern('準備できたわ...お願いします...', character);
    }

    generateGentlePaceResponse(character, isVirgin) {
        if (isVirgin) {
            return this.addSpeechPattern('痛いけど...我慢するから...', character);
        } else {
            return this.addSpeechPattern('優しくて気持ちいい...', character);
        }
    }

    generateNormalPaceResponse(character, isVirgin) {
        return this.addSpeechPattern('あっ...そんなに...でも嫌じゃない...', character);
    }

    generateComfortCheckResponse(character, isVirgin) {
        return this.addSpeechPattern('心配してくれるの...嬉しい...', character);
    }

    generateCuddleResponse(character) {
        return this.addSpeechPattern('こうしていると...とても安心する...', character);
    }

    generateTalkFeelingsResponse(character) {
        return this.addSpeechPattern('本当に幸せ...あなたと出会えてよかった...', character);
    }

    generatePromiseFutureResponse(character) {
        return this.addSpeechPattern('また会えるよね...約束よ...', character);
    }

    // シナリオの取得
    getScenario(characterId, phase) {
        return this.scenarios[characterId]?.[phase];
    }

    // 現在のシナリオ設定
    setCurrentScenario(characterId, phase) {
        this.currentScenario = this.getScenario(characterId, phase);
        this.currentDialogueIndex = 0;
        return this.currentScenario;
    }

    // 次のダイアログ取得
    getNextDialogue() {
        if (!this.currentScenario || this.currentDialogueIndex >= this.currentScenario.dialogues.length) {
            return null;
        }
        return this.currentScenario.dialogues[this.currentDialogueIndex++];
    }

    // 選択肢取得（条件チェック付き）
    getAvailableChoices(affection) {
        if (!this.currentScenario) return [];
        
        return this.currentScenario.choices.filter(choice => {
            if (choice.condition) {
                return choice.condition(affection);
            }
            return true;
        });
    }
}

// グローバルインスタンス
const storyManager = new StoryManager();