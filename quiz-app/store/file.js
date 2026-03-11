const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const RESPONSES_FILE = path.join(DATA_DIR, 'responses.json');

const defaultConfig = {
  title: 'クイズ',
  question: '',
  options: [],
  correctIndex: null,
  winner: null
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error('Failed to read JSON', filePath, e);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write JSON', filePath, e);
  }
}

async function getConfig() {
  return readJson(QUESTIONS_FILE, defaultConfig);
}

async function saveConfig(config) {
  writeJson(QUESTIONS_FILE, config);
}

async function getResponses() {
  return readJson(RESPONSES_FILE, []);
}

async function addResponse(record) {
  const list = readJson(RESPONSES_FILE, []);
  list.push(record);
  writeJson(RESPONSES_FILE, list);
}

async function clearResponses() {
  writeJson(RESPONSES_FILE, []);
}

module.exports = {
  getConfig,
  saveConfig,
  getResponses,
  addResponse,
  clearResponses
};
