// MONGODB_URI が設定されていれば MongoDB、なければ JSON ファイル
if (process.env.MONGODB_URI) {
  module.exports = require('./mongo');
} else {
  module.exports = require('./file');
}
