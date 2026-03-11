async function fetchQuiz() {
  const loadingEl = document.getElementById('quiz-loading');
  const contentEl = document.getElementById('quiz-content');
  const titleEl = document.getElementById('quiz-title');
  const questionEl = document.getElementById('question');
  const optionsEl = document.getElementById('options');
  const submitBtn = document.getElementById('submitBtn');

  try {
    const res = await fetch('/api/quiz', { credentials: 'include' });
    if (!res.ok) {
      throw new Error('クイズ取得に失敗しました');
    }
    const data = await res.json();

    titleEl.textContent = data.title || 'クイズ';
    questionEl.textContent = data.question;
    optionsEl.innerHTML = '';

    // 選択肢テキストを後でメッセージ表示に使う
    window.quizOptions = Array.isArray(data.options) ? data.options : [];

    data.options.forEach((opt, index) => {
      const div = document.createElement('div');
      div.className = 'option-item';
      div.dataset.index = index.toString();

      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = String.fromCharCode(65 + index); // A, B, C...

      const text = document.createElement('span');
      text.textContent = opt;

      div.appendChild(badge);
      div.appendChild(text);

      div.addEventListener('click', () => {
        document.querySelectorAll('.option-item').forEach(el => {
          el.classList.toggle('selected', el === div);
        });
        submitBtn.disabled = false;
        submitBtn.dataset.answerIndex = String(index);
      });

      optionsEl.appendChild(div);
    });

    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
  } catch (e) {
    loadingEl.textContent = '現在クイズを利用できません。時間をおいて再度アクセスしてください。';
    console.error(e);
  }
}

async function sendAnswer() {
  const tableInput = document.getElementById('tableNumber');
  const nameInput = document.getElementById('name');
  const submitBtn = document.getElementById('submitBtn');
  const messageEl = document.getElementById('result-message');

  const tableNumber = tableInput.value.trim();
  const name = nameInput.value.trim();
  const answerIndex = Number(submitBtn.dataset.answerIndex ?? -1);

  messageEl.textContent = '';
  messageEl.classList.remove('error', 'highlight');

  if (!tableNumber || !name) {
    messageEl.textContent = 'テーブル番号とお名前を入力してください。';
    messageEl.classList.add('error');
    return;
  }
  if (Number.isNaN(answerIndex) || answerIndex < 0) {
    messageEl.textContent = '選択肢を選んでください。';
    messageEl.classList.add('error');
    return;
  }

  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/answer', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableNumber, name, answerIndex })
    });
    const data = await res.json();

    if (!res.ok) {
      messageEl.textContent = data.error || '送信に失敗しました。';
      messageEl.classList.add('error');
      submitBtn.disabled = false;
      return;
    }

    const options = Array.isArray(window.quizOptions) ? window.quizOptions : [];
    const answeredIndex = typeof data.answerIndex === 'number' ? data.answerIndex : answerIndex;
    const answeredText =
      typeof answeredIndex === 'number' &&
      answeredIndex >= 0 &&
      answeredIndex < options.length
        ? options[answeredIndex]
        : 'この選択肢';

    if (data.duplicated) {
      messageEl.textContent =
        data.message ||
        `すでに「${answeredText}」と回答済みです（最初の回答のみ有効です）。`;
      messageEl.classList.add('highlight');
      return;
    }

    messageEl.textContent = `「${answeredText}」と回答しました。`;
    messageEl.classList.add('highlight');
  } catch (e) {
    console.error(e);
    messageEl.textContent = '送信に失敗しました。時間をおいて再度お試しください。';
    messageEl.classList.add('error');
    submitBtn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  var quizContainer = document.getElementById('quiz-container');
  if (quizContainer && !quizContainer.classList.contains('hidden')) {
    fetchQuiz();
  }
  document.getElementById('submitBtn').addEventListener('click', sendAnswer);
});

