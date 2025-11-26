// メインアプリケーションロジック

// --- 定数・変数 ---
const MAX_PRACTICE_QUESTIONS = 5; // れんしゅうモードの問題数

let currentMode = null; // 'practice' or 'challenge'
let currentCategory = 'master'; // 'pink', 'orange', 'yellow', 'blue', 'green', 'master'
let currentQuestionIndex = 0; // れんしゅうモード用
let currentScore = 0; // チャレンジモード用（連続正解数）
let currentQuestionData = null; // 現在出題中のデータ
let isAnswering = false; // 回答受付中かどうか
let questionPool = []; // 現在のモード・カテゴリーで使用する問題リスト

// --- DOM要素の取得 ---
const screens = {
    title: document.getElementById('screen-title'),
    menu: document.getElementById('screen-menu'),
    categorySelect: document.getElementById('screen-category-select'),
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
    settingVolume: document.getElementById('setting-volume')
};

let currentZukanFilter = 'all';

// --- 初期化 ---
function init() {
    setupEventListeners();
    updateStampDisplay();
    loadSettingsToUI();
}

function setupEventListeners() {
    // 画面遷移ボタン
    document.getElementById('btn-start').addEventListener('click', () => {
        showScreen('menu');
    });

    document.getElementById('btn-mode-practice').addEventListener('click', () => showCategorySelection('practice'));
    document.getElementById('btn-mode-challenge').addEventListener('click', () => showCategorySelection('challenge'));
    document.getElementById('btn-zukan').addEventListener('click', () => showZukan());
    document.getElementById('btn-settings').addEventListener('click', () => showScreen('settings'));

    // カテゴリー選択ボタン
    document.querySelectorAll('.btn-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            startGame(category);
        });
    });

    // 図鑑フィルターボタン
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentZukanFilter = e.target.dataset.filter;
            // ボタンの見た目更新
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            showZukan();
        });
    });

    // 共通「もどる」ボタン
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target.dataset.target;
            showScreen(target);
        });
    });

    // クイズ関連
    document.getElementById('btn-next-question').addEventListener('click', nextQuestion);
    document.getElementById('btn-back-to-menu').addEventListener('click', () => showScreen('menu'));
    document.getElementById('btn-home').addEventListener('click', () => showScreen('title'));

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

// ... (skip unchanged functions) ...

// --- ずかん機能 ---
function showZukan() {
    showScreen('zukan');
    ui.zukanList.innerHTML = '';

    const filteredData = currentZukanFilter === 'all' 
        ? HYAKUNIN_ISSHU_DATA 
        : HYAKUNIN_ISSHU_DATA.filter(d => d.category === currentZukanFilter);

    filteredData.forEach(data => {
        const isLearned = storage.learnedIds.includes(data.id);

        const item = document.createElement('div');
        item.className = `zukan-item ${isLearned ? 'learned' : ''}`;
        
        // カテゴリー表示用のクラスを追加
        if (data.category) {
            item.classList.add(`category-${data.category}`);
        }

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

// --- 画面遷移 ---
function showScreen(screenName) {
    // すべての画面を非表示
    Object.values(screens).forEach(s => {
        if (s) {
            s.classList.remove('active');
            s.classList.add('hidden');
        }
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

function showCategorySelection(mode) {
    currentMode = mode;
    showScreen('categorySelect');
}

function startGame(category) {
    currentCategory = category;
    
    // 問題プールを作成
    if (category === 'master') {
        questionPool = [...HYAKUNIN_ISSHU_DATA];
    } else {
        questionPool = HYAKUNIN_ISSHU_DATA.filter(d => d.category === category);
    }
    
    if (currentMode === 'practice') {
        startPractice();
    } else {
        startChallenge();
    }
}

function startPractice() {
    currentQuestionIndex = 0;
    showScreen('quiz');
    generateQuestion();
}

function startChallenge() {
    currentScore = 0;
    showScreen('quiz');
    generateQuestion();
}

function generateQuestion() {
    isAnswering = true;

    // 正解を選ぶ（ランダム）
    // プールからランダムに選ぶ
    const correctIndex = Math.floor(Math.random() * questionPool.length);
    currentQuestionData = questionPool[correctIndex];

    // 不正解を3つ選ぶ
    // 同じプールから選ぶ（難易度調整のため）
    const distractors = [];
    while (distractors.length < 3) {
        const idx = Math.floor(Math.random() * questionPool.length);
        const distractor = questionPool[idx];
        if (distractor.id !== currentQuestionData.id && !distractors.some(d => d.id === distractor.id)) {
            distractors.push(distractor);
        }
    }

    // 選択肢を作成（正解 + 不正解）
    const options = [currentQuestionData, ...distractors];

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
    ui.resultAuthor.innerHTML = addRuby(currentQuestionData.author, ""); 
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

    const filteredData = currentZukanFilter === 'all' 
        ? HYAKUNIN_ISSHU_DATA 
        : HYAKUNIN_ISSHU_DATA.filter(d => d.category === currentZukanFilter);

    filteredData.forEach(data => {
        const isLearned = storage.learnedIds.includes(data.id);

        const item = document.createElement('div');
        item.className = `zukan-item ${isLearned ? 'learned' : ''}`;
        
        // カテゴリー表示用のクラスを追加
        if (data.category) {
            item.classList.add(`category-${data.category}`);
        }

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
function addRuby(text, kana) {
    return `<ruby>${text}<rt>${kana}</rt></ruby>`;
}

// 音声再生（プレースホルダー）
function playSound(type) {
    // console.log(`Play Sound: ${type}`);
}

// アプリ起動
window.onload = init;
