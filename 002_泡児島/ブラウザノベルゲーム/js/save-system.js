// 泡児島ノベルゲーム - セーブシステム
// セーブ/ロード機能の詳細実装

class SaveSystem {
    constructor() {
        this.maxSaveSlots = 10;
        this.savePrefix = 'awaji_novel_save_';
        this.autoSaveKey = 'awaji_novel_autosave';
        this.quickSaveKey = 'awaji_novel_quicksave';
        this.settingsKey = 'awaji_novel_settings';
        
        this.saveMetadata = this.loadSaveMetadata();
    }

    // セーブメタデータの管理
    loadSaveMetadata() {
        const metadata = localStorage.getItem('awaji_novel_save_metadata');
        if (metadata) {
            return JSON.parse(metadata);
        }
        
        // デフォルトのメタデータ構造
        const defaultMetadata = {};
        for (let i = 1; i <= this.maxSaveSlots; i++) {
            defaultMetadata[i] = {
                exists: false,
                timestamp: null,
                playerName: '',
                day: 1,
                currentSpot: '',
                screenshot: null,
                playtime: 0
            };
        }
        return defaultMetadata;
    }

    saveSaveMetadata() {
        localStorage.setItem('awaji_novel_save_metadata', JSON.stringify(this.saveMetadata));
    }

    // ゲームデータの保存
    saveGame(slotNumber, gameState, additionalData = {}) {
        try {
            if (slotNumber < 1 || slotNumber > this.maxSaveSlots) {
                throw new Error('無効なセーブスロット番号');
            }

            const saveData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                gameState: gameState,
                storyProgress: additionalData.storyProgress || {},
                statistics: additionalData.statistics || {},
                settings: additionalData.settings || {}
            };

            // データの圧縮（Base64エンコード）
            const compressedData = this.compressData(saveData);
            
            // ローカルストレージに保存
            const saveKey = this.savePrefix + slotNumber;
            localStorage.setItem(saveKey, compressedData);

            // メタデータの更新
            this.saveMetadata[slotNumber] = {
                exists: true,
                timestamp: saveData.timestamp,
                playerName: gameState.playerName,
                day: gameState.day,
                currentSpot: gameState.currentSpot,
                screenshot: additionalData.screenshot || null,
                playtime: additionalData.playtime || 0
            };
            
            this.saveSaveMetadata();
            
            return {
                success: true,
                message: `スロット${slotNumber}にセーブしました`,
                slotNumber: slotNumber,
                timestamp: saveData.timestamp
            };
            
        } catch (error) {
            console.error('セーブエラー:', error);
            return {
                success: false,
                message: 'セーブに失敗しました: ' + error.message,
                error: error
            };
        }
    }

    // ゲームデータの読み込み
    loadGame(slotNumber) {
        try {
            if (slotNumber < 1 || slotNumber > this.maxSaveSlots) {
                throw new Error('無効なセーブスロット番号');
            }

            const saveKey = this.savePrefix + slotNumber;
            const compressedData = localStorage.getItem(saveKey);
            
            if (!compressedData) {
                throw new Error('セーブデータが見つかりません');
            }

            // データの展開
            const saveData = this.decompressData(compressedData);
            
            // バージョンチェック
            if (saveData.version !== '1.0.0') {
                console.warn('異なるバージョンのセーブデータ:', saveData.version);
            }

            return {
                success: true,
                message: `スロット${slotNumber}からロードしました`,
                data: saveData,
                slotNumber: slotNumber
            };
            
        } catch (error) {
            console.error('ロードエラー:', error);
            return {
                success: false,
                message: 'ロードに失敗しました: ' + error.message,
                error: error
            };
        }
    }

    // セーブデータの削除
    deleteGame(slotNumber) {
        try {
            if (slotNumber < 1 || slotNumber > this.maxSaveSlots) {
                throw new Error('無効なセーブスロット番号');
            }

            const saveKey = this.savePrefix + slotNumber;
            localStorage.removeItem(saveKey);

            // メタデータの更新
            this.saveMetadata[slotNumber] = {
                exists: false,
                timestamp: null,
                playerName: '',
                day: 1,
                currentSpot: '',
                screenshot: null,
                playtime: 0
            };
            
            this.saveSaveMetadata();

            return {
                success: true,
                message: `スロット${slotNumber}のデータを削除しました`,
                slotNumber: slotNumber
            };
            
        } catch (error) {
            console.error('削除エラー:', error);
            return {
                success: false,
                message: '削除に失敗しました: ' + error.message,
                error: error
            };
        }
    }

    // オートセーブ
    autoSave(gameState, additionalData = {}) {
        try {
            const saveData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                gameState: gameState,
                storyProgress: additionalData.storyProgress || {},
                type: 'autosave'
            };

            const compressedData = this.compressData(saveData);
            localStorage.setItem(this.autoSaveKey, compressedData);

            return {
                success: true,
                message: 'オートセーブ完了',
                timestamp: saveData.timestamp
            };
            
        } catch (error) {
            console.error('オートセーブエラー:', error);
            return {
                success: false,
                message: 'オートセーブに失敗しました',
                error: error
            };
        }
    }

    // オートセーブの読み込み
    loadAutoSave() {
        try {
            const compressedData = localStorage.getItem(this.autoSaveKey);
            
            if (!compressedData) {
                return {
                    success: false,
                    message: 'オートセーブデータが見つかりません'
                };
            }

            const saveData = this.decompressData(compressedData);
            
            return {
                success: true,
                message: 'オートセーブからロードしました',
                data: saveData
            };
            
        } catch (error) {
            console.error('オートセーブロードエラー:', error);
            return {
                success: false,
                message: 'オートセーブの読み込みに失敗しました',
                error: error
            };
        }
    }

    // クイックセーブ
    quickSave(gameState, additionalData = {}) {
        try {
            const saveData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                gameState: gameState,
                storyProgress: additionalData.storyProgress || {},
                type: 'quicksave'
            };

            const compressedData = this.compressData(saveData);
            localStorage.setItem(this.quickSaveKey, compressedData);

            return {
                success: true,
                message: 'クイックセーブ完了',
                timestamp: saveData.timestamp
            };
            
        } catch (error) {
            console.error('クイックセーブエラー:', error);
            return {
                success: false,
                message: 'クイックセーブに失敗しました',
                error: error
            };
        }
    }

    // クイックロード
    quickLoad() {
        try {
            const compressedData = localStorage.getItem(this.quickSaveKey);
            
            if (!compressedData) {
                return {
                    success: false,
                    message: 'クイックセーブデータが見つかりません'
                };
            }

            const saveData = this.decompressData(compressedData);
            
            return {
                success: true,
                message: 'クイックロード完了',
                data: saveData
            };
            
        } catch (error) {
            console.error('クイックロードエラー:', error);
            return {
                success: false,
                message: 'クイックロードに失敗しました',
                error: error
            };
        }
    }

    // 設定の保存
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return {
                success: true,
                message: '設定を保存しました'
            };
        } catch (error) {
            console.error('設定保存エラー:', error);
            return {
                success: false,
                message: '設定の保存に失敗しました',
                error: error
            };
        }
    }

    // 設定の読み込み
    loadSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            if (settings) {
                return {
                    success: true,
                    data: JSON.parse(settings)
                };
            } else {
                return {
                    success: false,
                    message: '設定データが見つかりません'
                };
            }
        } catch (error) {
            console.error('設定読み込みエラー:', error);
            return {
                success: false,
                message: '設定の読み込みに失敗しました',
                error: error
            };
        }
    }

    // データの圧縮
    compressData(data) {
        try {
            // JSON文字列化 -> Base64エンコード
            const jsonString = JSON.stringify(data);
            return btoa(unescape(encodeURIComponent(jsonString)));
        } catch (error) {
            console.error('データ圧縮エラー:', error);
            throw new Error('データの圧縮に失敗しました');
        }
    }

    // データの展開
    decompressData(compressedData) {
        try {
            // Base64デコード -> JSON解析
            const jsonString = decodeURIComponent(escape(atob(compressedData)));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('データ展開エラー:', error);
            throw new Error('データの展開に失敗しました');
        }
    }

    // セーブスロット一覧の取得
    getSaveSlots() {
        const slots = [];
        
        for (let i = 1; i <= this.maxSaveSlots; i++) {
            const metadata = this.saveMetadata[i];
            slots.push({
                slotNumber: i,
                exists: metadata.exists,
                timestamp: metadata.timestamp,
                playerName: metadata.playerName,
                day: metadata.day,
                currentSpot: metadata.currentSpot,
                screenshot: metadata.screenshot,
                playtime: metadata.playtime,
                formattedTimestamp: metadata.timestamp ? 
                    this.formatTimestamp(metadata.timestamp) : null,
                formattedPlaytime: this.formatPlaytime(metadata.playtime)
            });
        }
        
        return slots;
    }

    // タイムスタンプのフォーマット
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // プレイ時間のフォーマット
    formatPlaytime(seconds) {
        if (!seconds) return '0分';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}時間${minutes}分`;
        } else {
            return `${minutes}分`;
        }
    }

    // ストレージ容量の確認
    checkStorageSpace() {
        try {
            // ローカルストレージの使用量を概算
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                }
            }
            
            // ブラウザの制限（一般的に5MB）
            const limit = 5 * 1024 * 1024; // 5MB
            const usage = totalSize / limit * 100;
            
            return {
                totalSize: totalSize,
                usage: usage.toFixed(2),
                limit: limit,
                available: limit - totalSize,
                warning: usage > 80 // 80%以上で警告
            };
            
        } catch (error) {
            console.error('ストレージ容量チェックエラー:', error);
            return {
                error: true,
                message: 'ストレージ容量の確認に失敗しました'
            };
        }
    }

    // 全データの削除
    clearAllData() {
        try {
            // セーブデータの削除
            for (let i = 1; i <= this.maxSaveSlots; i++) {
                const saveKey = this.savePrefix + i;
                localStorage.removeItem(saveKey);
            }
            
            // その他のデータ削除
            localStorage.removeItem(this.autoSaveKey);
            localStorage.removeItem(this.quickSaveKey);
            localStorage.removeItem(this.settingsKey);
            localStorage.removeItem('awaji_novel_save_metadata');
            
            // メタデータの初期化
            this.saveMetadata = this.loadSaveMetadata();
            
            return {
                success: true,
                message: '全てのデータを削除しました'
            };
            
        } catch (error) {
            console.error('データ削除エラー:', error);
            return {
                success: false,
                message: 'データの削除に失敗しました',
                error: error
            };
        }
    }

    // データのエクスポート（バックアップ）
    exportData() {
        try {
            const exportData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                saves: {},
                autoSave: localStorage.getItem(this.autoSaveKey),
                quickSave: localStorage.getItem(this.quickSaveKey),
                settings: localStorage.getItem(this.settingsKey),
                metadata: this.saveMetadata
            };
            
            // 全セーブデータの収集
            for (let i = 1; i <= this.maxSaveSlots; i++) {
                const saveKey = this.savePrefix + i;
                const saveData = localStorage.getItem(saveKey);
                if (saveData) {
                    exportData.saves[i] = saveData;
                }
            }
            
            const exportJson = JSON.stringify(exportData);
            const blob = new Blob([exportJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // ダウンロードリンクの作成
            const link = document.createElement('a');
            link.href = url;
            link.download = `awaji_novel_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            return {
                success: true,
                message: 'データをエクスポートしました'
            };
            
        } catch (error) {
            console.error('エクスポートエラー:', error);
            return {
                success: false,
                message: 'エクスポートに失敗しました',
                error: error
            };
        }
    }

    // データのインポート（復元）
    importData(file) {
        return new Promise((resolve) => {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importData = JSON.parse(e.target.result);
                        
                        // バージョンチェック
                        if (importData.version !== '1.0.0') {
                            throw new Error('互換性のないバックアップファイルです');
                        }
                        
                        // データの復元
                        if (importData.saves) {
                            for (const [slotNumber, saveData] of Object.entries(importData.saves)) {
                                const saveKey = this.savePrefix + slotNumber;
                                localStorage.setItem(saveKey, saveData);
                            }
                        }
                        
                        if (importData.autoSave) {
                            localStorage.setItem(this.autoSaveKey, importData.autoSave);
                        }
                        
                        if (importData.quickSave) {
                            localStorage.setItem(this.quickSaveKey, importData.quickSave);
                        }
                        
                        if (importData.settings) {
                            localStorage.setItem(this.settingsKey, importData.settings);
                        }
                        
                        if (importData.metadata) {
                            this.saveMetadata = importData.metadata;
                            this.saveSaveMetadata();
                        }
                        
                        resolve({
                            success: true,
                            message: 'データをインポートしました'
                        });
                        
                    } catch (error) {
                        resolve({
                            success: false,
                            message: 'インポート処理に失敗しました: ' + error.message,
                            error: error
                        });
                    }
                };
                
                reader.onerror = () => {
                    resolve({
                        success: false,
                        message: 'ファイルの読み込みに失敗しました'
                    });
                };
                
                reader.readAsText(file);
                
            } catch (error) {
                resolve({
                    success: false,
                    message: 'インポートに失敗しました: ' + error.message,
                    error: error
                });
            }
        });
    }
}

// グローバルインスタンス
const saveSystem = new SaveSystem();