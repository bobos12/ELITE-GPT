const fs = require('fs');
const path = require('path');

const LAWS_DIR = path.join(__dirname, '../data/laws');
const LAWS_SINGLE = path.join(__dirname, '../data/laws.json');

let _cache = null;
let _snapshot = '';

function buildSnapshot() {
  let snap = '';
  try {
    const stat = fs.statSync(LAWS_SINGLE);
    snap += `single:${stat.mtimeMs}`;
  } catch {}
  try {
    if (fs.existsSync(LAWS_DIR)) {
      fs.readdirSync(LAWS_DIR)
        .filter(f => f.endsWith('.json'))
        .forEach(f => {
          const s = fs.statSync(path.join(LAWS_DIR, f));
          snap += `|dir:${f}:${s.mtimeMs}`;
        });
    }
  } catch {}
  return snap;
}

function loadLaws() {
  const snap = buildSnapshot();
  if (snap === _snapshot && _cache !== null) return _cache;

  const all = [];

  // Primary: laws.json (user's main file)
  try {
    const raw = fs.readFileSync(LAWS_SINGLE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) all.push(...parsed);
  } catch {}

  // Supplemental: laws/ folder (per-category files)
  try {
    if (fs.existsSync(LAWS_DIR) && fs.statSync(LAWS_DIR).isDirectory()) {
      for (const file of fs.readdirSync(LAWS_DIR).filter(f => f.endsWith('.json'))) {
        try {
          const raw = fs.readFileSync(path.join(LAWS_DIR, file), 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) all.push(...parsed);
        } catch (e) {
          console.warn(`[retrieval] skipping ${file}:`, e.message);
        }
      }
    }
  } catch {}

  // Deduplicate by id (laws.json wins over laws/ on conflict)
  const seen = new Set();
  _cache = all.filter(a => {
    if (!a.id || seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  _snapshot = snap;
  return _cache;
}

const STOP_WORDS = new Set([
  'من', 'إلى', 'في', 'على', 'عن', 'مع', 'هو', 'هي', 'هم', 'هن', 'أن', 'إن',
  'كان', 'كانت', 'يكون', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'الذين',
  'وفق', 'حيث', 'بعد', 'قبل', 'عند', 'لكن', 'أو', 'ثم', 'ما', 'لا', 'لم',
  'لن', 'قد', 'كل', 'بين', 'أي', 'أيضا', 'فإن', 'يجب', 'كما', 'حق', 'حقوق',
  'وفقا', 'بموجب', 'وإذا', 'فإذا', 'أما', 'غير', 'حال', 'حالة',
]);

function tokenize(text) {
  return String(text || '')
    .replace(/[،؛:؟!«»""()\[\]\.،]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim().replace(/^ال/, ''))
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function scoreArticle(article, queryTokens) {
  let score = 0;
  const keywordsText = (article.keywords || []).join(' ');
  const lawNameText = String(article.law_name || '');
  const categoryText = String(article.category || '');
  const chapterText = String(article.chapter || '');
  const articleText = String(article.article_text || '');

  for (const token of queryTokens) {
    const tl = token.toLowerCase();
    if (keywordsText.includes(tl)) score += 5;
    if (categoryText.includes(tl)) score += 4;
    if (lawNameText.includes(tl)) score += 3;
    if (chapterText.includes(tl)) score += 2;
    if (articleText.includes(tl)) score += 1;
  }
  return score;
}

function retrieveRelevant(query, topK = 5) {
  const laws = loadLaws();
  if (!laws.length) return [];
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  return laws
    .map(article => ({ article, score: scoreArticle(article, queryTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ article }) => article);
}

module.exports = { retrieveRelevant };
