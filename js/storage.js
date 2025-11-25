// ユーザーデータ管理クラス (LocalStorage Wrapper)

const STORAGE_KEY = "hyakunin_app_user_data";

const DEFAULT_USER_DATA = {
    stamps: 0,
    challenge_high_score: 0,
    learned_ids: [],
    settings: {
        sound_volume: 0.8
    }
};

class UserStorage {
    constructor() {
        this.data = this.load();
    }

    // データを読み込む。なければ初期値を保存して返す。
    load() {
        const json = localStorage.getItem(STORAGE_KEY);
        if (json) {
            try {
                // マージして、新しいキーが増えていても対応できるようにする
                const parsed = JSON.parse(json);
                return { ...DEFAULT_USER_DATA, ...parsed, settings: { ...DEFAULT_USER_DATA.settings, ...parsed.settings } };
            } catch (e) {
                console.error("データ読み込みエラー", e);
                return { ...DEFAULT_USER_DATA };
            }
        } else {
            this.save(DEFAULT_USER_DATA);
            return { ...DEFAULT_USER_DATA };
        }
    }

    // データを保存する
    save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        this.data = data;
    }

    addStamp() {
        this.data.stamps += 1;
        this.save(this.data);
        return this.data.stamps;
    }

    // スタンプをリセットする
    resetStamps() {
        this.data.stamps = 0;
        this.save(this.data);
        return this.data.stamps;
    }

    // ハイスコア更新チェック
    updateHighScore(score) {
        if (score > this.data.challenge_high_score) {
            this.data.challenge_high_score = score;
            this.save(this.data);
            return true; // 更新した
        }
        return false; // 更新せず
    }

    // 「おぼえた」状態の切り替え
    toggleLearned(id) {
        const index = this.data.learned_ids.indexOf(id);
        if (index === -1) {
            this.data.learned_ids.push(id);
        } else {
            this.data.learned_ids.splice(index, 1);
        }
        this.save(this.data);
        return index === -1; // trueなら追加された（おぼえた）、falseなら削除された
    }

    // 設定の更新
    updateSettings(key, value) {
        this.data.settings[key] = value;
        this.save(this.data);
    }

    // ゲッター
    get stamps() { return this.data.stamps; }
    get highScore() { return this.data.challenge_high_score; }
    get learnedIds() { return this.data.learned_ids; }
    get settings() { return this.data.settings; }
}

// グローバルで使えるようにインスタンス化
const storage = new UserStorage();
