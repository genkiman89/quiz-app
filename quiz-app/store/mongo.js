const mongoose = require('mongoose');

const CONFIG_ID = 'current';

const quizConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: CONFIG_ID },
    title: String,
    question: String,
    options: [String],
    correctIndex: Number,
    winner: mongoose.Schema.Types.Mixed
  },
  { _id: true }
);

const responseSchema = new mongoose.Schema(
  {
    tableNumber: String,
    name: String,
    answerIndex: Number,
    clientToken: String,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const QuizConfig = mongoose.model('QuizConfig', quizConfigSchema);
const Response = mongoose.model('Response', responseSchema);

let connected = false;

async function ensureConnection() {
  if (connected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  connected = true;
}

async function getConfig() {
  await ensureConnection();
  const doc = await QuizConfig.findById(CONFIG_ID).lean();
  if (!doc) {
    return {
      title: 'クイズ',
      question: '',
      options: [],
      correctIndex: null,
      winner: null
    };
  }
  return {
    title: doc.title || 'クイズ',
    question: doc.question || '',
    options: Array.isArray(doc.options) ? doc.options : [],
    correctIndex: doc.correctIndex ?? null,
    winner: doc.winner ?? null
  };
}

async function saveConfig(config) {
  await ensureConnection();
  await QuizConfig.findByIdAndUpdate(
    CONFIG_ID,
    {
      $set: {
        title: config.title,
        question: config.question,
        options: config.options,
        correctIndex: config.correctIndex,
        winner: config.winner
      }
    },
    { upsert: true, new: true }
  );
}

async function getResponses() {
  await ensureConnection();
  const list = await Response.find().sort({ createdAt: 1 }).lean();
  return list.map((r) => ({
    tableNumber: r.tableNumber,
    name: r.name,
    answerIndex: r.answerIndex,
    clientToken: r.clientToken || null,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null
  }));
}

async function addResponse(record) {
  await ensureConnection();
  await Response.create({
    tableNumber: record.tableNumber,
    name: record.name,
    answerIndex: record.answerIndex,
    clientToken: record.clientToken || null,
    createdAt: record.createdAt ? new Date(record.createdAt) : new Date()
  });
}

async function clearResponses() {
  await ensureConnection();
  await Response.deleteMany({});
}

module.exports = {
  getConfig,
  saveConfig,
  getResponses,
  addResponse,
  clearResponses
};
