const fs = require('fs');
const path = require('path');

function readJson(fileName) {
  const filePath = path.join(__dirname, '..', 'data', fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function getFaqItems() {
  return readJson('faq.json');
}

module.exports = { getFaqItems };

