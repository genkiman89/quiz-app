const express = require('express');
const path = require('path');
const crypto = require('crypto');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const QUIZ_PASSWORD = process.env.QUIZ_PASSWORD || '';
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24時間

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  raw.split(';').forEach(pair => {
    const [key, ...v] = pair.trim().split('=');
    if (!key) return;
    try {
      out[key] = decodeURIComponent((v.join('=') || '').trim());
    } catch (_) {
      out[key] = (v.join('=') || '').trim();
    }
  });
  return out;
}

function signPayload(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${data}.${sig}`;
}

function verifySignedCookie(value, secret) {
  if (!value || !secret) return null;
  const dot = value.indexOf('.');
  if (dot === -1) return null;
  const data = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.t && payload.t > Date.now() - COOKIE_MAX_AGE_MS) return payload;
  } catch (_) {}
  return null;
}

function cookieOptions(role) {
  const opts = { path: '/', httpOnly: true, sameSite: 'lax', maxAge: COOKIE_MAX_AGE_MS / 1000 };
  if (process.env.NODE_ENV === 'production') opts.secure = true;
  return opts;
}

// 管理者認証（API用: 401）
function requireAdminApi(req, res, next) {
  if (!ADMIN_PASSWORD) return next();
  const cookies = parseCookies(req);
  if (verifySignedCookie(cookies.admin_session, ADMIN_PASSWORD)) return next();
  res.status(401).json({ error: 'ログインが必要です。' });
}

// 管理者認証（ページ用: ログイン画面へリダイレクト）
function requireAdminPage(req, res, next) {
  if (!ADMIN_PASSWORD) return next();
  const cookies = parseCookies(req);
  if (verifySignedCookie(cookies.admin_session, ADMIN_PASSWORD)) return next();
  res.redirect(302, '/admin-login.html');
}

// 回答サイト認証（API用: 401）
function requireQuizApi(req, res, next) {
  if (!QUIZ_PASSWORD) return next();
  const cookies = parseCookies(req);
  if (verifySignedCookie(cookies.quiz_session, QUIZ_PASSWORD)) return next();
  res.status(401).json({ error: 'パスワードを入力してください。' });
}

app.use(express.json());

// 非同期ルートの未処理 reject を捕捉（Express 4 ではそのままでは握りつぶされる）
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ----- 認証（パスワード未設定の場合はスキップ） -----

app.post('/api/admin-login', (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'パスワードが違います。' });
  }
  const token = signPayload({ t: Date.now(), role: 'admin' }, ADMIN_PASSWORD);
  res.cookie('admin_session', token, cookieOptions('admin'));
  res.json({ ok: true });
});

app.post('/api/quiz-login', (req, res) => {
  if (!QUIZ_PASSWORD) {
    return res.json({ ok: true });
  }
  const { password } = req.body || {};
  if (password !== QUIZ_PASSWORD) {
    return res.status(401).json({ error: 'パスワードが違います。' });
  }
  const token = signPayload({ t: Date.now(), role: 'quiz' }, QUIZ_PASSWORD);
  res.cookie('quiz_session', token, cookieOptions('quiz'));
  res.json({ ok: true });
});

// 管理画面・集計画面は認証後に表示（静的より先に処理）
app.get('/admin.html', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/summary.html', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'summary.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// 管理者用：クイズ設定取得
app.get('/api/config', requireAdminApi, asyncHandler(async (req, res) => {
  const quizConfig = await store.getConfig();
  res.json(quizConfig);
}));

// 管理者用：クイズ設定更新（問題文・選択肢）
app.post('/api/config', requireAdminApi, asyncHandler(async (req, res) => {
  const { title, question, options, resetResponses } = req.body || {};

  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'question と2つ以上の options が必要です。' });
  }

  const quizConfig = await store.getConfig();
  const nextConfig = {
    ...quizConfig,
    title: title || 'クイズ',
    question,
    options
  };
  await store.saveConfig(nextConfig);

  if (resetResponses) {
    await store.clearResponses();
  }

  res.json({ ok: true, config: nextConfig });
}));

// 利用者用：クイズ取得（1アクセス1回答用にクライアントトークンを付与）
// ※ quiz_client_token は cookieOptions で統一し、他セッション（admin_session 等）を上書きしない
app.get('/api/quiz', requireQuizApi, asyncHandler(async (req, res) => {
  const quizConfig = await store.getConfig();
  const { title, question, options } = quizConfig;
  if (!question || options.length < 2) {
    return res.status(503).json({ error: '現在有効なクイズが設定されていません。' });
  }
  const cookies = parseCookies(req);
  if (!cookies.quiz_client_token) {
    const token = crypto.randomBytes(24).toString('hex');
    res.cookie('quiz_client_token', token, cookieOptions('quiz'));
  }
  res.json({ title, question, options });
}));

// 利用者用：回答送信（1アクセス1回まで。quiz_client_token で同一ブラウザを判定）
app.post('/api/answer', requireQuizApi, asyncHandler(async (req, res) => {
  const cookies = parseCookies(req);
  const clientToken = cookies.quiz_client_token;
  if (!clientToken) {
    return res.status(400).json({ error: 'このページからもう一度クイズを読み込んでから回答してください。' });
  }

  const { tableNumber, name, answerIndex } = req.body || {};

  if (!tableNumber || !name) {
    return res.status(400).json({ error: 'tableNumber と name は必須です。' });
  }
  if (typeof answerIndex !== 'number') {
    return res.status(400).json({ error: 'answerIndex が不正です。' });
  }

  const normalizedName = String(name).trim();
  const normalizedTable = String(tableNumber).trim();

  if (!normalizedName || !normalizedTable) {
    return res.status(400).json({ error: 'tableNumber と name は空にできません。' });
  }

  const responses = await store.getResponses();
  const alreadyAnswered = responses.find(r => r.clientToken === clientToken);
  if (alreadyAnswered) {
    return res.json({
      ok: true,
      duplicated: true,
      answerIndex: alreadyAnswered.answerIndex,
      message: 'この端末ではすでに回答済みです。1回のみ回答できます。'
    });
  }

  const record = {
    tableNumber: normalizedTable,
    name: normalizedName,
    answerIndex,
    clientToken,
    createdAt: new Date().toISOString()
  };
  await store.addResponse(record);

  res.json({ ok: true, answerIndex });
}));

// 管理者用：全回答取得（clientToken は返さない）
app.get('/api/responses', requireAdminApi, asyncHandler(async (req, res) => {
  const responses = await store.getResponses();
  const safe = responses.map(({ clientToken, ...r }) => r);
  res.json(safe);
}));

// 管理者用：正解者一覧
app.get('/api/correct', requireAdminApi, asyncHandler(async (req, res) => {
  const quizConfig = await store.getConfig();
  if (typeof quizConfig.correctIndex !== 'number') {
    return res.status(400).json({ error: '正解がまだ設定されていません。' });
  }
  const responses = await store.getResponses();
  const correctList = responses.filter(
    r =>
      typeof r.answerIndex === 'number' &&
      r.answerIndex === quizConfig.correctIndex
  );
  res.json(correctList);
}));

// 管理者用：正解の選択肢を確定
app.post('/api/set-correct', requireAdminApi, asyncHandler(async (req, res) => {
  const { correctIndex } = req.body || {};
  const quizConfig = await store.getConfig();
  if (!Array.isArray(quizConfig.options) || quizConfig.options.length < 2) {
    return res.status(400).json({ error: '先にクイズ内容を設定してください。' });
  }
  if (typeof correctIndex !== 'number' || correctIndex < 0 || correctIndex >= quizConfig.options.length) {
    return res.status(400).json({ error: 'correctIndex が不正です。' });
  }

  const nextConfig = { ...quizConfig, correctIndex, winner: null };
  await store.saveConfig(nextConfig);
  res.json({ ok: true, correctIndex });
}));

// 管理者用：抽選（1回分）。ルーレット用に候補と当選者を返す。
app.post('/api/draw', requireAdminApi, asyncHandler(async (req, res) => {
  const quizConfig = await store.getConfig();
  if (typeof quizConfig.correctIndex !== 'number') {
    return res.status(400).json({ error: '正解がまだ設定されていません。' });
  }

  const responses = await store.getResponses();
  const correctList = responses.filter(
    r =>
      typeof r.answerIndex === 'number' &&
      r.answerIndex === quizConfig.correctIndex
  );
  if (correctList.length === 0) {
    return res.status(400).json({ error: '正解者がいません。' });
  }

  const winnerIndex = Math.floor(Math.random() * correctList.length);
  const winner = correctList[winnerIndex];

  const nextConfig = {
    ...quizConfig,
    winner: {
      tableNumber: winner.tableNumber,
      name: winner.name,
      drawnAt: new Date().toISOString()
    }
  };
  await store.saveConfig(nextConfig);

  res.json({
    candidates: correctList.map(c => ({
      tableNumber: c.tableNumber,
      name: c.name
    })),
    winnerIndex,
    winner: {
      tableNumber: winner.tableNumber,
      name: winner.name
    }
  });
}));

// 非同期ハンドラのエラーを返す（asyncHandler 経由の reject 用）
app.use((err, req, res, next) => {
  console.error(err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'サーバーでエラーが発生しました。' });
  }
});

app.listen(PORT, () => {
  const dbType = process.env.MONGODB_URI ? 'MongoDB' : 'JSONファイル';
  console.log(`Server is running on http://localhost:${PORT} (保存: ${dbType})`);
});

