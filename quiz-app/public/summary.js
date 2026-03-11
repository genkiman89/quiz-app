(function () {
  function redirectToLoginIf401(res) {
    if (res && res.status === 401) {
      window.location.href = '/admin-login.html';
      return true;
    }
    return false;
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

  function renderTableCount(responses) {
    const chartContainer = document.getElementById('table-count-chart');
    const tbody = document.getElementById('table-count-body');
    if (!chartContainer || !tbody) return;

    chartContainer.innerHTML = '';
    tbody.innerHTML = '';

    const byTable = {};
    responses.forEach(function (r) {
      const t = (r.tableNumber != null ? String(r.tableNumber).trim() : '') || '（未入力）';
      byTable[t] = (byTable[t] || 0) + 1;
    });

    const entries = Object.entries(byTable).sort(function (a, b) {
      return String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true });
    });

    if (entries.length === 0) {
      const p = document.createElement('p');
      p.className = 'message';
      p.textContent = 'まだ回答がありません。';
      chartContainer.appendChild(p);
      return;
    }

    const maxCount = Math.max(...entries.map(function (e) { return e[1]; }), 1);

    entries.forEach(function (entry) {
      const tableName = entry[0];
      const count = entry[1];

      const row = document.createElement('div');
      row.className = 'summary-row';

      const label = document.createElement('div');
      label.className = 'summary-label';
      label.textContent = 'テーブル' + tableName;

      const barOuter = document.createElement('div');
      barOuter.className = 'summary-bar-outer';

      const barInner = document.createElement('div');
      barInner.className = 'summary-bar-inner';
      barInner.style.width = (count / maxCount) * 100 + '%';
      barOuter.appendChild(barInner);

      const countEl = document.createElement('div');
      countEl.className = 'summary-count';
      countEl.textContent = count + '人';

      row.appendChild(label);
      row.appendChild(barOuter);
      row.appendChild(countEl);
      chartContainer.appendChild(row);

      const tr = document.createElement('tr');
      tr.innerHTML = '<td>テーブル' + escapeHtml(tableName) + '</td><td>' + count + '人</td>';
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  async function loadSummary() {
    try {
      const configRes = await fetch('/api/config', { credentials: 'include' });
      if (redirectToLoginIf401(configRes)) return;
      if (!configRes.ok) throw new Error('設定の取得に失敗しました');
      const config = await configRes.json();

      const responsesRes = await fetch('/api/responses', { credentials: 'include' });
      if (redirectToLoginIf401(responsesRes)) return;
      if (!responsesRes.ok) throw new Error('回答の取得に失敗しました');
      const responses = await responsesRes.json();

      const options = Array.isArray(config.options) ? config.options : [];
      renderOptionSummary(options, responses);
      renderTableCount(responses);
    } catch (e) {
      const container = document.getElementById('summary-chart');
      if (container) {
        container.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'message error';
        p.textContent = e.message || '読み込みに失敗しました。';
        container.appendChild(p);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('reload-summary-btn');
    if (btn) btn.addEventListener('click', loadSummary);
    loadSummary();
  });
})();
