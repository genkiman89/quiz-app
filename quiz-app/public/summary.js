(function () {
  function showSessionError() {
    var container = document.getElementById('summary-chart');
    if (!container) return;
    container.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'message error';
    wrap.innerHTML = 'セッションが切れました。<a href="/admin.html" class="link-back">管理画面に戻る</a> / <a href="/admin-login.html" class="link-back">ログインし直す</a>';
    container.appendChild(wrap);
  }

  function renderOptionSummary(options, responses) {
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
    responses.forEach(function (r) {
      if (
        typeof r.answerIndex === 'number' &&
        r.answerIndex >= 0 &&
        r.answerIndex < options.length
      ) {
        counts[r.answerIndex] += 1;
      }
    });

    const max = Math.max(1, ...counts);

    counts.forEach(function (count, index) {
      const row = document.createElement('div');
      row.className = 'summary-row';

      const label = document.createElement('div');
      label.className = 'summary-label';
      label.textContent = String.fromCharCode(65 + index) + ': ' + (options[index] || '');

      const barOuter = document.createElement('div');
      barOuter.className = 'summary-bar-outer';

      const barInner = document.createElement('div');
      barInner.className = 'summary-bar-inner';
      barInner.style.width = (count / max) * 100 + '%';
      barOuter.appendChild(barInner);

      const countEl = document.createElement('div');
      countEl.className = 'summary-count';
      countEl.textContent = count + '人';

      row.appendChild(label);
      row.appendChild(barOuter);
      row.appendChild(countEl);
      container.appendChild(row);
    });
  }

  async function loadSummary() {
    var container = document.getElementById('summary-chart');
    if (!container) return;

    try {
      var configRes = await fetch('/api/config', { credentials: 'include' });
      if (configRes.status === 401) {
        showSessionError();
        return;
      }
      if (!configRes.ok) throw new Error('設定の取得に失敗しました');
      var config = await configRes.json();

      var responsesRes = await fetch('/api/responses', { credentials: 'include' });
      if (responsesRes.status === 401) {
        showSessionError();
        return;
      }
      if (!responsesRes.ok) throw new Error('回答の取得に失敗しました');
      var responses = await responsesRes.json();

      var options = Array.isArray(config.options) ? config.options : [];
      renderOptionSummary(options, responses);
    } catch (e) {
      container.innerHTML = '';
      var p = document.createElement('p');
      p.className = 'message error';
      p.textContent = e.message || '読み込みに失敗しました。';
      container.appendChild(p);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('reload-summary-btn');
    if (btn) btn.addEventListener('click', loadSummary);
    loadSummary();
  });
})();
