let currentOptions = [];

function createOptionRow(text = '') {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = text;
  input.placeholder = '選択肢を入力';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = '削除';
  removeBtn.className = 'secondary small';
  removeBtn.style.marginTop = '6px';

  removeBtn.addEventListener('click', () => {
    wrapper.remove();
    refreshCorrectSelect();
  });

  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);
  return wrapper;
}

function refreshCorrectSelect(selectedIndex = 0) {
  const container = document.getElementById('options-container');
  const select = document.getElementById('admin-correct');
  const rows = Array.from(container.querySelectorAll('input[type="text"]'));

  select.innerHTML = '';
  rows.forEach((input, index) => {
    const opt = document.createElement('option');
    opt.value = String(index);
    opt.textContent = `${String.fromCharCode(65 + index)}: ${input.value || '(未入力)'}`;
    select.appendChild(opt);
  });

  if (rows.length > 0) {
    const safeIndex = Math.min(selectedIndex, rows.length - 1);
    select.value = String(safeIndex);
  }
}

function redirectToLoginIf401(res) {
  if (res && res.status === 401) {
    window.location.href = '/admin-login.html';
    return true;
  }
  return false;
}

async function loadConfig() {
  const titleInput = document.getElementById('admin-title');
  const questionInput = document.getElementById('admin-question');
  const container = document.getElementById('options-container');

  try {
    const res = await fetch('/api/config', { credentials: 'include' });
    if (redirectToLoginIf401(res)) return;
    if (!res.ok) throw new Error();
    const data = await res.json();

    titleInput.value = data.title || '';
    questionInput.value = data.question || '';

    container.innerHTML = '';
    if (Array.isArray(data.options) && data.options.length > 0) {
      data.options.forEach(opt => {
        container.appendChild(createOptionRow(opt));
      });
      currentOptions = data.options;
    } else {
      container.appendChild(createOptionRow(''));
      container.appendChild(createOptionRow(''));
      currentOptions = [];
    }

    refreshCorrectSelect(typeof data.correctIndex === 'number' ? data.correctIndex : 0);
  } catch {
    // 初回は設定がなくてもよいので、デフォルト2択を用意
    container.innerHTML = '';
    container.appendChild(createOptionRow('はい'));
    container.appendChild(createOptionRow('いいえ'));
    currentOptions = ['はい', 'いいえ'];
    refreshCorrectSelect(0);
  }
}

async function saveConfig() {
  const titleInput = document.getElementById('admin-title');
  const questionInput = document.getElementById('admin-question');
  const container = document.getElementById('options-container');
  const correctSelect = document.getElementById('admin-correct');
  const resetCheck = document.getElementById('reset-responses');
  const messageEl = document.getElementById('config-message');

  messageEl.textContent = '';
  messageEl.classList.remove('error', 'highlight');

  const options = Array.from(
    container.querySelectorAll('input[type="text"]')
  )
    .map(input => input.value.trim())
    .filter(v => v);

  if (!questionInput.value.trim()) {
    messageEl.textContent = '問題文を入力してください。';
    messageEl.classList.add('error');
    return;
  }

  if (options.length < 2) {
    messageEl.textContent = '2つ以上の選択肢を入力してください。';
    messageEl.classList.add('error');
    return;
  }

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: titleInput.value.trim() || 'クイズ',
        question: questionInput.value.trim(),
        options,
        resetResponses: resetCheck.checked
      })
    });
    const data = await res.json();
    if (redirectToLoginIf401(res)) return;
    if (!res.ok) {
      messageEl.textContent = data.error || '保存に失敗しました。';
      messageEl.classList.add('error');
      return;
    }

    messageEl.textContent = '設定を保存しました。';
    messageEl.classList.add('highlight');
    resetCheck.checked = false;

    // 設定保存後は currentOptions を更新
    currentOptions = options;
  } catch {
    messageEl.textContent = '保存に失敗しました。時間をおいて再度お試しください。';
    messageEl.classList.add('error');
  }
}

function renderSummary(options, responses) {
  const container = document.getElementById('summary-chart');
  if (!container) return;

  container.innerHTML = '';

  if (!Array.isArray(options) || options.length === 0) {
    const p = document.createElement('p');
    p.className = 'message';
    p.textContent = 'まだクイズが設定されていません。';
    container.appendChild(p);
    return;
  }

  const counts = new Array(options.length).fill(0);
  responses.forEach(r => {
    if (
      typeof r.answerIndex === 'number' &&
      r.answerIndex >= 0 &&
      r.answerIndex < options.length
    ) {
      counts[r.answerIndex] += 1;
    }
  });

  const max = Math.max(1, ...counts);

  counts.forEach((count, index) => {
    const row = document.createElement('div');
    row.className = 'summary-row';

    const label = document.createElement('div');
    label.className = 'summary-label';
    label.textContent = `${String.fromCharCode(65 + index)}: ${options[index] || ''}`;

    const barOuter = document.createElement('div');
    barOuter.className = 'summary-bar-outer';

    const barInner = document.createElement('div');
    barInner.className = 'summary-bar-inner';
    const width = (count / max) * 100;
    barInner.style.width = `${width}%`;
    barOuter.appendChild(barInner);

    const countEl = document.createElement('div');
    countEl.className = 'summary-count';
    countEl.textContent = `${count}人`;

    row.appendChild(label);
    row.appendChild(barOuter);
    row.appendChild(countEl);

    container.appendChild(row);
  });
}

async function loadResponses() {
  const tbody = document.getElementById('responses-body');
  tbody.innerHTML = '';

  try {
    const res = await fetch('/api/responses', { credentials: 'include' });
    if (redirectToLoginIf401(res)) return;
    if (!res.ok) throw new Error();
    const data = await res.json();

    // 棒グラフの描画
    renderSummary(currentOptions, data);

    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.tableNumber}</td>
        <td>${row.name}</td>
        <td>${typeof row.answerIndex === 'number' ? String.fromCharCode(65 + row.answerIndex) : '-'}</td>
        <td>
          <span class="tag ${typeof row.answerIndex === 'number' ? 'correct' : 'wrong'}">
            ？
          </span>
        </td>
        <td>${row.createdAt ? new Date(row.createdAt).toLocaleTimeString() : ''}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = '回答を取得できませんでした。';
    tbody.appendChild(tr);
    tr.appendChild(td);
  }
}

async function loadCorrect() {
  const tbody = document.getElementById('correct-body');
  tbody.innerHTML = '';

  try {
    const res = await fetch('/api/correct', { credentials: 'include' });
    const data = await res.json();
    if (redirectToLoginIf401(res)) return;
    if (!res.ok) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 2;
      td.textContent = data.error || '正解者を取得できませんでした。';
      tbody.appendChild(tr);
      tr.appendChild(td);
      return;
    }

    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.tableNumber}</td>
        <td>${row.name}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = '正解者を取得できませんでした。';
    tbody.appendChild(tr);
    tr.appendChild(td);
  }
}

async function revealAndDraw() {
  const correctSelect = document.getElementById('admin-correct');
  const winnerMessage = document.getElementById('winner-message');

  winnerMessage.textContent = '';
  winnerMessage.classList.remove('error', 'highlight');

  const correctIndex = Number(correctSelect.value ?? 0);

  try {
    // 正解の選択肢を確定
    const resSet = await fetch('/api/set-correct', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correctIndex })
    });
    const dataSet = await resSet.json();
    if (!resSet.ok) {
      winnerMessage.textContent = dataSet.error || '正解の設定に失敗しました。';
      winnerMessage.classList.add('error');
      return;
    }

    // 正解者一覧を更新
    await loadCorrect();

    // 抽選開始
    await drawRoulette();
  } catch {
    winnerMessage.textContent = '正解の設定または抽選に失敗しました。';
    winnerMessage.classList.add('error');
  }
}

async function drawRoulette() {
  const display = document.getElementById('roulette-display');
  const winnerMessage = document.getElementById('winner-message');
  const btn = document.getElementById('draw-btn');

  winnerMessage.textContent = '';
  winnerMessage.classList.remove('error', 'highlight');

  btn.disabled = true;
  display.textContent = '抽選中...';

  try {
    const res = await fetch('/api/draw', { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      display.textContent = '抽選に失敗しました。';
      winnerMessage.textContent = data.error || '正解者がいない可能性があります。';
      winnerMessage.classList.add('error');
      btn.disabled = false;
      return;
    }

    const candidates = data.candidates || [];
    const winnerIndex = data.winnerIndex;

    if (!candidates.length) {
      display.textContent = '正解者がいません。';
      btn.disabled = false;
      return;
    }

    // ルーレット風アニメーション
    let index = 0;
    let interval = 70;
    const totalDuration = 3500;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / totalDuration, 1);

      // 速度を徐々に落とす
      const eased = 1 - Math.pow(1 - progress, 3);
      interval = 60 + eased * 260; // 60ms → 320ms くらいに減速

      index = (index + 1) % candidates.length;
      const current = candidates[index];
      display.textContent = `テーブル${current.tableNumber}：${current.name} さん`;

      if (progress < 1) {
        setTimeout(() => requestAnimationFrame(step), interval);
      } else {
        // 最終的に winnerIndex に合わせる
        const winner = candidates[winnerIndex];
        display.textContent = `テーブル${winner.tableNumber}：${winner.name} さん`;
        winnerMessage.textContent = `当選者：テーブル${winner.tableNumber} ${winner.name} さん`;
        winnerMessage.classList.add('highlight');
        btn.disabled = false;
      }
    }

    requestAnimationFrame(step);
  } catch {
    display.textContent = '抽選に失敗しました。';
    winnerMessage.textContent = 'サーバーとの通信に失敗しました。';
    winnerMessage.classList.add('error');
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-option-btn').addEventListener('click', () => {
    const container = document.getElementById('options-container');
    container.appendChild(createOptionRow(''));
    refreshCorrectSelect();
  });

  document.getElementById('save-config-btn').addEventListener('click', saveConfig);
  document.getElementById('reload-responses-btn').addEventListener('click', loadResponses);
  document.getElementById('reload-correct-btn').addEventListener('click', loadCorrect);
  document.getElementById('draw-btn').addEventListener('click', revealAndDraw);

  loadConfig();
  loadResponses();
  loadCorrect();
});

