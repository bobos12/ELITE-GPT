const fs = require('fs');
const path = require('path');

function readJson(fileName) {
  const filePath = path.join(__dirname, '..', 'data', fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function getTemplates() {
  return readJson('templates.json');
}

function getTemplateById(id) {
  return getTemplates().find((t) => t.id === id) || null;
}

module.exports = { getTemplates, getTemplateById };

