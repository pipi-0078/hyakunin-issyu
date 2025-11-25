// メインアプリケーションロジック

// --- 定数・変数 ---
const MAX_PRACTICE_QUESTIONS = 5; // れんしゅうモードの問題数

let currentMode = null; // 'practice' or 'challenge'
let currentQuestionIndex = 0; // れんしゅうモード用
let currentScore = 0; // チャレンジモード用（連続正解数）
let currentQuestionData = null; // 現在出題中のデータ
let isAnswering = false; // 回答受付中かどうか

// --- DOM要素の取得 ---
const screens = {
    title: document.getElementById('screen-title'),
    menu: document.getElementById('screen-menu'),
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result'),
    gameover: document.getElementById('screen-gameover'),
    zukan: document.getElementById('screen-zukan'),
    settings: document.getElementById('screen-settings')
};

const ui = {
    stampDisplay: document.getElementById('stamp-display'),
    quizKami: document.getElementById('quiz-kami-no-ku'),
    optionsContainer: document.getElementById('options-container'),
    resultMark: document.getElementById('result-mark'),
    resultMessage: document.getElementById('result-message'),
    resultKami: document.getElementById('result-kami'),
    resultShimo: document.getElementById('result-shimo'),
    resultAuthor: document.getElementById('result-author'),
    resultMeaning: document.getElementById('result-meaning'),
    gameoverTitle: document.getElementById('gameover-title'),
    gameoverMessage: document.getElementById('gameover-message'),
    stampAnimation: document.getElementById('stamp-animation'),
    zukanList: document.getElementById('zukan-list'),
    zukanList: document.getElementById('zukan-list'),
    settingVolume: document.getElementById('setting-volume')
};

// --- 初期化 ---
function init() {
    setupEventListeners();
    updateStampDisplay();
    loadSettingsToUI();
}

function setupEventListeners() {
    // 画面遷移ボタン
    // 画面遷移ボタン
    document.getElementById('btn-start').addEventListener('click', () => {
        showScreen('menu');
    });

    document.getElementById('btn-mode-practice').addEventListener('click', () => startPractice());
    document.getElementById('btn-mode-challenge').addEventListener('click', () => startChallenge());
    document.getElementById('btn-zukan').addEventListener('click', () => showZukan());
    document.getElementById('btn-settings').addEventListener('click', () => showScreen('settings'));

    // 共通「もどる」ボタン
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target.dataset.target;
            showScreen(target);
        });
    });

    // クイズ関連
    // クイズ関連
    document.getElementById('btn-next-question').addEventListener('click', nextQuestion);
    document.getElementById('btn-back-to-menu').addEventListener('click', () => showScreen('menu'));
    document.getElementById('btn-home').addEventListener('click', () => showScreen('title'));

    // 設定変更
    // 設定変更
    ui.settingVolume.addEventListener('input', (e) => {
        storage.updateSettings('sound_volume', parseFloat(e.target.value));
    });

    // スタンプリセット
    document.getElementById('btn-reset-stamps').addEventListener('click', () => {
        if (confirm('ほんとうにスタンプをリセットしますか？')) {
            storage.resetStamps();
            updateStampDisplay();
            alert('スタンプをリセットしました！');
        }
    });
}

// --- 画面遷移 ---
function showScreen(screenName) {
    // すべての画面を非表示
    Object.values(screens).forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });

    // 指定された画面を表示
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
        // フェードインアニメーションのために少し待つ（CSS transition）
        setTimeout(() => {
            screens[screenName].classList.add('active');
        }, 10);
    }
}

function updateStampDisplay() {
    ui.stampDisplay.textContent = storage.stamps;
}

function loadSettingsToUI() {
    ui.settingVolume.value = storage.settings.sound_volume;
}

// --- ゲームロジック ---

function startPractice() {
    currentMode = 'practice';
    currentQuestionIndex = 0;
    showScreen('quiz');
    generateQuestion();
}

function startChallenge() {
    currentMode = 'challenge';
    currentScore = 0;
    showScreen('quiz');
    generateQuestion();
}

function generateQuestion() {
    isAnswering = true;

    // 正解を選ぶ（ランダム）
    const correctIndex = Math.floor(Math.random() * HYAKUNIN_ISSHU_DATA.length);
    currentQuestionData = HYAKUNIN_ISSHU_DATA[correctIndex];

    // 不正解を3つ選ぶ
    const distractors = [];
    while (distractors.length < 3) {
        const idx = Math.floor(Math.random() * HYAKUNIN_ISSHU_DATA.length);
        if (idx !== correctIndex && !distractors.includes(idx)) {
            distractors.push(idx);
        }
    }

    // 選択肢を作成（正解 + 不正解）
    const options = [currentQuestionData];
    distractors.forEach(idx => options.push(HYAKUNIN_ISSHU_DATA[idx]));

    // シャッフル
    shuffleArray(options);

    // UI更新
    // 漢字にルビを振る処理
    ui.quizKami.innerHTML = addRuby(currentQuestionData.kami_no_ku, currentQuestionData.kami_no_ku_kana);

    ui.optionsContainer.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt.shimo_no_ku_kana;
        btn.onclick = () => handleAnswer(opt.id);
        ui.optionsContainer.appendChild(btn);
    });


}

function handleAnswer(selectedId) {
    if (!isAnswering) return;
    isAnswering = false;

    const isCorrect = selectedId === currentQuestionData.id;

    // 正誤演出
    ui.resultMark.textContent = isCorrect ? '⭕' : '❌';
    ui.resultMark.className = `result-overlay ${isCorrect ? 'correct' : 'incorrect'}`;
    ui.resultMark.style.opacity = '1';

    playSound(isCorrect ? 'correct' : 'incorrect');

    setTimeout(() => {
        ui.resultMark.style.opacity = '0';
        showResultScreen(isCorrect);
    }, 1000);
}

function showResultScreen(isCorrect) {
    showScreen('result');

    ui.resultMessage.textContent = isCorrect ? 'せいかい！' : 'ざんねん...';
    ui.resultKami.innerHTML = addRuby(currentQuestionData.kami_no_ku, currentQuestionData.kami_no_ku_kana);
    ui.resultShimo.innerHTML = addRuby(currentQuestionData.shimo_no_ku, currentQuestionData.shimo_no_ku_kana);
    ui.resultAuthor.innerHTML = addRuby(currentQuestionData.author, ""); // 作者名のルビはデータにないので省略（必要ならデータに追加）
    ui.resultMeaning.textContent = currentQuestionData.meaning;

    // チャレンジモードで間違えたら即終了
    if (currentMode === 'challenge' && !isCorrect) {
        document.getElementById('btn-next-question').onclick = finishGame;
        document.getElementById('btn-next-question').textContent = 'けっかはっぴょう';
    } else {
        document.getElementById('btn-next-question').onclick = nextQuestion;
        document.getElementById('btn-next-question').textContent = 'つぎへ';
    }

    // スコア加算
    if (currentMode === 'challenge' && isCorrect) {
        currentScore++;
    }
}

function nextQuestion() {
    if (currentMode === 'practice') {
        currentQuestionIndex++;
        if (currentQuestionIndex >= MAX_PRACTICE_QUESTIONS) {
            finishGame();
        } else {
            showScreen('quiz');
            generateQuestion();
        }
    } else if (currentMode === 'challenge') {
        showScreen('quiz');
        generateQuestion();
    }
}

function finishGame() {
    showScreen('gameover');
    ui.stampAnimation.classList.add('hidden');

    if (currentMode === 'practice') {
        ui.gameoverTitle.textContent = 'おつかれさま！';
        ui.gameoverMessage.textContent = 'れんしゅうがおわったよ。スタンプをあげるね！';

        // スタンプ付与
        storage.addStamp();
        updateStampDisplay();

        // アニメーション
        setTimeout(() => {
            ui.stampAnimation.classList.remove('hidden');
            playSound('stamp');
        }, 500);

    } else {
        ui.gameoverTitle.textContent = 'けっかはっぴょう';
        ui.gameoverMessage.textContent = `${currentScore}もん れんぞくせいかい！`;

        if (storage.updateHighScore(currentScore)) {
            ui.gameoverMessage.textContent += '\nすごい！しんきろくだよ！';
            playSound('fanfare');
        }
    }
}

// --- ずかん機能 ---
function showZukan() {
    showScreen('zukan');
    ui.zukanList.innerHTML = '';

    HYAKUNIN_ISSHU_DATA.forEach(data => {
        const isLearned = storage.learnedIds.includes(data.id);

        const item = document.createElement('div');
        item.className = `zukan-item ${isLearned ? 'learned' : ''}`;

        const content = document.createElement('div');
        content.innerHTML = `
            <strong>${data.id}. ${data.author}</strong><br>
            ${data.kami_no_ku}<br>
            ${data.shimo_no_ku}
        `;

        const checkBtn = document.createElement('input');
        checkBtn.type = 'checkbox';
        checkBtn.className = 'check-learned';
        checkBtn.checked = isLearned;
        checkBtn.onchange = () => {
            const learned = storage.toggleLearned(data.id);
            item.classList.toggle('learned', learned);
        };

        item.appendChild(content);
        item.appendChild(checkBtn);
        ui.zukanList.appendChild(item);
    });
}

// --- ユーティリティ ---

// 配列シャッフル (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ルビ追加ヘルパー
// 簡易的に全体にルビを振る（漢字とかなの対応が厳密でないため、全体をrubyタグで囲むスタイルにするか、
// データ側で細かく分ける必要があるが、今回は簡易表示として全体ルビ、または漢字のみ抽出して...は難しいので
// プロンプトの指示通り <ruby>漢字<rt>かんじ</rt></ruby> の形式にしたいが、
// データが「全文漢字混じり」と「全文かな」しかないので、
// ここでは簡易的に「上の句（かな）」のように並記するか、
// あるいはCSSでうまく表示する。
// 今回は要件定義書に「<ruby>タグを使ってふりがなをつける」とあるが、
// 自動で漢字部分だけにルビを振るのはライブラリがないと困難。
// 妥協案として、漢字混じりの文の下に、ひらがなを表示するデザインにするか、
// もしくはデータ構造を変える必要がある。
// 今回のデータ構造では「kami_no_ku」と「kami_no_ku_kana」が分かれている。
// 子供向けなので、ひらがなをメインにして、漢字を補足にするか、
// 漢字の行の上にルビとしてひらがなを表示するのがベスト。
// ここでは、HTMLのrubyタグの構造を利用して、
// <ruby>漢字混じり文<rt>ひらがな全文</rt></ruby> という「モノルビ」ではなく「グループルビ」的な表示にする。
function addRuby(text, kana) {
    // 簡易実装：全体をrubyタグで囲む（ブラウザによっては見づらいかもしれないが、仕様を満たすため）
    // より良い実装：漢字とひらがなが一致する部分を探すが、それは複雑。
    // ここでは、視認性を考慮し、２行表示にする（CSSで制御）。
    // しかし要件はrubyタグなので、それを使う。
    return `<ruby>${text}<rt>${kana}</rt></ruby>`;
}

// 音声再生（プレースホルダー）
function playSound(type) {
    // 効果音再生ロジック
    // 実際には Audio オブジェクトを作成して再生
    // console.log(`Play Sound: ${type}`);

    // 簡易的なビープ音や合成音声で代用も可能だが、
    // ここではログ出力のみ（ファイルがないため）
}

// アプリ起動
window.onload = init;
