const TESTAMENTS = {
  'Old Testament': [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
    'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
    'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
    'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
    'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
  ],
  'New Testament': [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
    'James', '1 Peter', '2 Peter', '1 John', '2 John',
    '3 John', 'Jude', 'Revelation'
  ]
};

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'nor', 'yet', 'so', 'for',
  'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its',
  'our', 'their', 'which', 'who', 'whom', 'whose', 'what',
  'of', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'into', 'through',
  'about', 'between', 'after', 'before', 'under', 'over', 'against',
  'among', 'upon', 'within', 'without', 'toward', 'towards', 'up', 'out',
  'down', 'off', 'near',
  'i', 'me', 'we', 'us', 'you', 'he', 'him', 'she', 'it',
  'they', 'them', 'myself', 'yourself', 'himself', 'herself', 'itself',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'has', 'have', 'had', 'having', 'do', 'does', 'did', 'done',
  'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could', 'must',
  'not', 'no', 'very', 'too', 'also', 'just', 'only', 'even',
  'now', 'then', 'here', 'there', 'when', 'where', 'how', 'why',
  'all', 'each', 'every', 'both', 'more', 'most', 'some', 'any',
  'much', 'many', 'such', 'other', 'another', 'same',
  'still', 'already', 'never', 'ever', 'always', 'again',
  'said', 'say', 'says', 'saying', 'went', 'go', 'going', 'gone',
  'came', 'come', 'coming', 'make', 'made', 'making',
  'take', 'took', 'taken', 'give', 'gave', 'given',
  'get', 'got', 'getting', 'put', 'set', 'let',
  'see', 'saw', 'seen', 'know', 'knew', 'known',
  'tell', 'told', 'bring', 'brought', 'turn', 'turned',
  'keep', 'kept', 'leave', 'left',
  'one', 'two', 'first', 'like', 'back', 'way', 'well',
  'if', 'than', 'right', 'while', 'because', 'since', 'though',
  'according', 'therefore', 'thus', 'however',
  'unto', 'thee', 'thou', 'thy', 'thine', 'ye', 'hath', 'doth',
  'thereof', 'therein', 'whereby', 'wherein'
]);

const COLORS = [
  '#1a3a5c', '#c4913a', '#2d5016', '#6b2737', '#1a6b5a',
  '#8b4513', '#4a3060', '#c45a2d', '#2a6b8b', '#5c6b1a'
];

const DEITY_WORDS = new Set(['god', 'jesus', 'lord', 'christ']);

let bibleData = null;
let currentBook = null;
let currentBookEntry = null;
let currentWords = [];
let currentTotalWords = 0;
let showingTopFive = false;
let excludingDeity = false;

const bookSelectEl = document.getElementById('book-select');
const wordCountEl = document.getElementById('word-count');
const cloudWrapperEl = document.getElementById('cloud-wrapper');
const cloudPlaceholderEl = document.getElementById('cloud-placeholder');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const rangePickersEl = document.getElementById('range-pickers');
const startChapterEl = document.getElementById('start-chapter');
const startVerseEl = document.getElementById('start-verse');
const endChapterEl = document.getElementById('end-chapter');
const endVerseEl = document.getElementById('end-verse');

async function init() {
  document.getElementById('retry-btn').addEventListener('click', () => {
    if (currentBook) selectBook(currentBook);
  });
  document.getElementById('top5-btn').addEventListener('click', toggleTopFive);
  document.getElementById('exclude-deity-btn').addEventListener('click', toggleExcludeDeity);
  bookSelectEl.addEventListener('change', onBookSelected);
  startChapterEl.addEventListener('change', onStartChapterChange);
  startVerseEl.addEventListener('change', onStartVerseChange);
  endChapterEl.addEventListener('change', onEndChapterChange);
  endVerseEl.addEventListener('change', onEndVerseChange);

  loadingEl.classList.remove('hidden');

  try {
    const response = await fetch('bible.json');
    bibleData = await response.json();
    loadingEl.classList.add('hidden');
    populateBookSelect();
  } catch (err) {
    loadingEl.classList.add('hidden');
    showError('Failed to load Bible data.');
  }
}

function populateBookSelect() {
  for (const [testament, books] of Object.entries(TESTAMENTS)) {
    const group = document.createElement('optgroup');
    group.label = testament;
    for (const book of books) {
      const option = document.createElement('option');
      option.value = book;
      option.textContent = book;
      group.appendChild(option);
    }
    bookSelectEl.appendChild(group);
  }
}

function onBookSelected() {
  const bookName = bookSelectEl.value;
  if (!bookName) return;
  selectBook(bookName);
}

function getBookText(bookName, startCh, startV, endCh, endV) {
  const entry = bibleData.find(b => b.name === bookName);
  if (!entry) throw new Error(`Book "${bookName}" not found in data.`);

  if (startCh === undefined) return entry.chapters.flat().join(' ');

  const verses = [];
  for (let ch = startCh; ch <= endCh; ch++) {
    const chapter = entry.chapters[ch - 1];
    const vStart = (ch === startCh) ? startV - 1 : 0;
    const vEnd = (ch === endCh) ? endV : chapter.length;
    for (let v = vStart; v < vEnd; v++) {
      verses.push(chapter[v]);
    }
  }
  return verses.join(' ');
}

function selectBook(bookName) {
  currentBook = bookName;
  currentBookEntry = bibleData.find(b => b.name === bookName);
  wordCountEl.textContent = '';
  cloudWrapperEl.innerHTML = '';
  errorEl.classList.add('hidden');

  showingTopFive = false;
  excludingDeity = false;
  document.getElementById('top5-btn').classList.remove('active');
  document.getElementById('exclude-deity-btn').classList.remove('active');

  populateRangePickers();
  generateCloud();
}

function populateRangePickers() {
  if (!currentBookEntry) return;

  const chapters = currentBookEntry.chapters;
  const numChapters = chapters.length;
  const lastChapterVerses = chapters[numChapters - 1].length;

  fillOptions(startChapterEl, 1, numChapters);
  fillOptions(startVerseEl, 1, chapters[0].length);
  fillOptions(endChapterEl, 1, numChapters);
  fillOptions(endVerseEl, 1, lastChapterVerses);

  startChapterEl.value = '1';
  startVerseEl.value = '1';
  endChapterEl.value = String(numChapters);
  endVerseEl.value = String(lastChapterVerses);

  rangePickersEl.classList.remove('hidden');
}

function fillOptions(selectEl, min, max) {
  selectEl.innerHTML = '';
  for (let i = min; i <= max; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = String(i);
    selectEl.appendChild(opt);
  }
}

function getRangeValues() {
  return {
    startCh: parseInt(startChapterEl.value),
    startV: parseInt(startVerseEl.value),
    endCh: parseInt(endChapterEl.value),
    endV: parseInt(endVerseEl.value)
  };
}

function onStartChapterChange() {
  const chapters = currentBookEntry.chapters;
  const startCh = parseInt(startChapterEl.value);
  const endCh = parseInt(endChapterEl.value);

  fillOptions(startVerseEl, 1, chapters[startCh - 1].length);
  startVerseEl.value = '1';

  if (endCh < startCh) {
    endChapterEl.value = String(startCh);
    fillOptions(endVerseEl, 1, chapters[startCh - 1].length);
    endVerseEl.value = String(chapters[startCh - 1].length);
  }

  validateEndVerse();
  generateCloud();
}

function onEndChapterChange() {
  const chapters = currentBookEntry.chapters;
  const startCh = parseInt(startChapterEl.value);
  let endCh = parseInt(endChapterEl.value);

  if (endCh < startCh) {
    endChapterEl.value = String(startCh);
    endCh = startCh;
  }

  fillOptions(endVerseEl, 1, chapters[endCh - 1].length);
  endVerseEl.value = String(chapters[endCh - 1].length);

  validateEndVerse();
  generateCloud();
}

function onStartVerseChange() {
  validateEndVerse();
  generateCloud();
}

function onEndVerseChange() {
  validateEndVerse();
  generateCloud();
}

function validateEndVerse() {
  const { startCh, startV, endCh } = getRangeValues();
  let endV = parseInt(endVerseEl.value);

  if (startCh === endCh && endV < startV) {
    endVerseEl.value = String(startV);
  }
}

function generateCloud() {
  try {
    const { startCh, startV, endCh, endV } = getRangeValues();
    const text = getBookText(currentBook, startCh, startV, endCh, endV);
    const { words, totalWords } = processText(text);
    currentWords = words;
    currentTotalWords = totalWords;
    updateCloudDisplay();
  } catch (err) {
    showError(err.message);
  }
}

function processText(text) {
  const tokens = text.toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const freq = {};
  for (const w of tokens) {
    freq[w] = (freq[w] || 0) + 1;
  }

  const words = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 150)
    .map(([text, count]) => ({ text, count }));

  return { words, totalWords: tokens.length };
}

function renderWordCloud(words) {
  if (words.length === 0) {
    showError('No words to display after filtering.');
    return;
  }

  const width = cloudWrapperEl.clientWidth;
  const height = Math.max(400, Math.min(600, window.innerHeight * 0.55));
  const maxFontSize = Math.min(72, width / 8);
  const minFontSize = Math.max(10, width / 80);

  const maxCount = words[0].count;
  const minCount = words[words.length - 1].count;

  const fontScale = minCount === maxCount
    ? () => (maxFontSize + minFontSize) / 2
    : d3.scaleSqrt().domain([minCount, maxCount]).range([minFontSize, maxFontSize]);

  const layout = d3.layout.cloud()
    .size([width, height])
    .words(words.map(d => ({ text: d.text, rawCount: d.count })))
    .padding(3)
    .rotate(() => (~~(Math.random() * 3) - 1) * 30)
    .font('Inter')
    .fontWeight(700)
    .fontSize(d => fontScale(d.rawCount))
    .on('end', draw);

  layout.start();

  function draw(layoutWords) {
    const svg = d3.select(cloudWrapperEl)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'word-cloud-svg');

    svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)
      .selectAll('text')
      .data(layoutWords)
      .enter()
      .append('text')
      .style('font-size', d => `${d.size}px`)
      .style('font-family', 'Inter, sans-serif')
      .style('font-weight', '700')
      .style('fill', (d, i) => COLORS[i % COLORS.length])
      .attr('text-anchor', 'middle')
      .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
      .text(d => d.text)
      .append('title')
      .text(d => `${d.text}: ${d.rawCount} occurrences`);
  }
}

function getFilteredWords() {
  let words = currentWords;
  if (excludingDeity) {
    words = words.filter(w => !DEITY_WORDS.has(w.text));
  }
  if (showingTopFive) {
    words = words.slice(0, 5);
  }
  return words;
}

function updateCloudDisplay() {
  const words = getFilteredWords();
  const label = showingTopFive ? `top 5` : `top ${words.length}`;
  wordCountEl.textContent = `Showing ${label} words from ${currentTotalWords.toLocaleString()} total`;
  cloudWrapperEl.innerHTML = '';
  renderWordCloud(words);
}

function toggleTopFive() {
  if (!currentBook) return;
  showingTopFive = !showingTopFive;
  document.getElementById('top5-btn').classList.toggle('active');
  updateCloudDisplay();
}

function toggleExcludeDeity() {
  if (!currentBook) return;
  excludingDeity = !excludingDeity;
  document.getElementById('exclude-deity-btn').classList.toggle('active');
  updateCloudDisplay();
}

function showError(message) {
  errorEl.classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

document.addEventListener('DOMContentLoaded', init);
