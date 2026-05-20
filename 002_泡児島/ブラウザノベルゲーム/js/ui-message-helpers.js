/**
 * メッセージログ・スキップ表示の純粋ロジック（テスト可能）
 */
const UIMessageHelpers = {
    appendLogEntry(log, { speaker = '', text = '', emotion = 'normal' }) {
        const next = [...log, { speaker, text, emotion, timestamp: new Date() }];
        return next;
    },

    formatLogEntriesForDisplay(entries) {
        return entries.map((entry) => ({
            speaker: entry.speaker || '',
            text: entry.text || ''
        }));
    },

    shouldInstantText(skipMode) {
        return !!skipMode;
    },

    canAutoAdvanceStory({ storyActive, waitingForStoryClick, choicesVisible }) {
        if (choicesVisible) return false;
        return !!(storyActive && waitingForStoryClick);
    },

    getAutoAdvanceDelayMs(autoMode, skipMode, textSpeed = 1) {
        if (!autoMode && !skipMode) return null;
        if (skipMode) return 30;
        const table = [3000, 2000, 1000];
        return table[textSpeed] ?? 2000;
    },

    /**
     * メッセージ内の {playerName} / ${playerName} / {あなた} を実名に置換。
     * @param {string} text
     * @param {string} playerName
     * @returns {string}
     */
    applyPlayerName(text, playerName) {
        if (typeof text !== 'string' || !text) return text;
        const name = (playerName && String(playerName).trim()) || 'ユウマ';
        return text
            .replace(/\$\{playerName\}/g, name)
            .replace(/\{playerName\}/g, name)
            .replace(/\{あなた\}/g, name);
    },

    /**
     * プレイヤー名の正規化。空・スペースのみは既定名「ユウマ」。
     * 長すぎる名前は8文字に切り詰め。
     * @param {string} raw
     * @param {string} [fallback]
     */
    normalizePlayerName(raw, fallback = 'ユウマ') {
        const trimmed = (typeof raw === 'string' ? raw : '').trim();
        if (!trimmed) return fallback;
        return trimmed.slice(0, 8);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIMessageHelpers };
}
