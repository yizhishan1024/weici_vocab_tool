const state = {
  words: [],
  selectedMap: new Map(),
  activeLetter: "all",
  currentIndex: 0,
};

const STORAGE_KEY = "weici_vocab_selected_words";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const CATEGORY_LABELS = {
  phrase: "短语",
  special: "特殊词汇",
};

const $ = (id) => document.getElementById(id);

function renderStats(text) {
  $("stats").textContent = text;
}

function getIpa(word) {
  return word.ipa || word.ipa_us || word.ipa_uk || "";
}

function getPos(word) {
  return word.pos || "";
}

function formatWordLabel(word) {
  return `${word.word}${getPos(word) ? ` (${getPos(word)})` : ""}`;
}

function getCategoryLabel(category) {
  if (CATEGORY_LABELS[category]) return CATEGORY_LABELS[category];
  return category || "未分类";
}

function normalizeSavedWord(word) {
  if (!word || !word.word) return null;
  return {
    ...word,
    meanings: Array.isArray(word.meanings) ? word.meanings : [],
  };
}

function saveSelected() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state.selectedMap.values())));
}

function loadSavedSelected() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const items = list.map(normalizeSavedWord).filter(Boolean);
    state.selectedMap = new Map(items.map((item) => [item.word, item]));
  } catch (_) {
    state.selectedMap = new Map();
  }
}

function renderSelectedList() {
  const selected = Array.from(state.selectedMap.values()).sort((a, b) => a.word.localeCompare(b.word));
  $("selectedCount").textContent = `已选 ${selected.length} 个单词`;

  const ul = $("selectedList");
  ul.innerHTML = "";
  for (const word of selected) {
    const li = document.createElement("li");
    li.textContent = `${formatWordLabel(word)} ${getIpa(word) ? `[${getIpa(word)}]` : ""} - ${buildMeaningPreview(word)}`;
    ul.appendChild(li);
  }
}

function renderLetterFilters() {
  const container = $("letterFilters");
  const range = $("rangeSelect").value;
  container.innerHTML = "";

  if (range !== "all") return;

  const createButton = (label, value) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `letter-btn${state.activeLetter === value ? " active" : ""}`;
    btn.textContent = label;
    btn.addEventListener("click", () => {
      state.activeLetter = value;
      state.currentIndex = 0;
      renderLetterFilters();
      renderCard();
    });
    return btn;
  };

  container.appendChild(createButton("全部字母", "all"));
  for (const letter of LETTERS) {
    container.appendChild(createButton(letter, letter));
  }
}

function buildMeaningPreview(word) {
  const meanings = (word.meanings || []).slice(0, 2);
  if (meanings.length) {
    return meanings
      .map((meaning) => {
        const pos = (meaning.pos || "").trim();
        const zh = (meaning.zh || "").trim();
        const en = (meaning.en || "").trim();
        const body = zh || en;
        return `${pos ? `${pos} ` : ""}${body}`.trim();
      })
      .filter(Boolean)
      .join("；");
  }

  return word.first_zh || word.first_en || "";
}

function matchesSearch(word, keyword) {
  if (!keyword) return true;

  const haystack = [
    word.word,
    word.pos,
    getIpa(word),
    word.first_zh,
    word.first_en,
    ...(word.meanings || []).flatMap((meaning) => [meaning.pos, meaning.zh, meaning.en]),
  ];

  return haystack.filter(Boolean).some((item) => item.toLowerCase().includes(keyword));
}

function getFilteredWords() {
  const keyword = $("searchInput").value.trim().toLowerCase();
  const range = $("rangeSelect").value;

  let pool = state.words;
  if (range === "notebook") {
    pool = Array.from(state.selectedMap.values());
  } else if (range !== "all") {
    pool = pool.filter((word) => word.category === range);
  } else if (state.activeLetter !== "all") {
    pool = pool.filter((word) => word.category === state.activeLetter);
  }

  return pool.filter((word) => matchesSearch(word, keyword));
}

function getCurrentWord() {
  const words = getFilteredWords();
  if (!words.length) return null;

  if (state.currentIndex >= words.length) state.currentIndex = 0;
  if (state.currentIndex < 0) state.currentIndex = 0;
  return words[state.currentIndex];
}

function renderMeaningLines(word) {
  const meanings = (word.meanings || []).slice(0, 2);
  const container = $("cardMeanings");
  container.innerHTML = "";

  const rows = meanings.length ? meanings : [{ pos: word.pos, zh: word.first_zh, en: word.first_en }];
  for (const meaning of rows) {
    const row = document.createElement("div");
    row.className = "meaning-row";

    const pos = document.createElement("span");
    pos.className = "meaning-pos";
    pos.textContent = meaning.pos || "词义";

    const body = document.createElement("div");
    body.className = "meaning-body";

    const zh = document.createElement("p");
    zh.className = "meaning-zh";
    zh.textContent = meaning.zh || "";
    body.appendChild(zh);

    if (meaning.en) {
      const en = document.createElement("p");
      en.className = "meaning-en";
      en.textContent = meaning.en;
      body.appendChild(en);
    }

    row.appendChild(pos);
    row.appendChild(body);
    container.appendChild(row);
  }
}

function renderCard() {
  const words = getFilteredWords();
  const current = getCurrentWord();
  const range = $("rangeSelect").value;
  const progress = words.length ? `当前第 ${state.currentIndex + 1} / ${words.length} 个` : "当前范围内没有单词";

  $("progressText").textContent = `${progress}${range === "notebook" ? " · 生词表模式" : ""}`;

  $("emptyState").hidden = Boolean(current);
  $("cardContent").hidden = !current;
  $("addBtn").disabled = !current || state.selectedMap.has(current.word);
  $("skipBtn").disabled = !current;

  if (!current) return;

  $("cardCategory").textContent = getCategoryLabel(current.category);
  $("cardWord").textContent = current.word;
  $("cardIpa").textContent = getIpa(current) ? `[${getIpa(current)}]` : "暂无音标";
  renderMeaningLines(current);
}

function advanceCard() {
  const words = getFilteredWords();
  if (!words.length) {
    state.currentIndex = 0;
    renderCard();
    return;
  }

  state.currentIndex = (state.currentIndex + 1) % words.length;
  renderCard();
}

function addCurrentWord() {
  const current = getCurrentWord();
  if (!current || state.selectedMap.has(current.word)) return;

  state.selectedMap.set(current.word, current);
  saveSelected();
  renderSelectedList();
  advanceCard();
}

function skipCurrentWord() {
  if (!getCurrentWord()) return;
  advanceCard();
}

async function loadWords(refresh = false) {
  renderStats("正在加载词库，请稍候...");
  const resp = await fetch(`/api/words${refresh ? "?refresh=1" : ""}`);
  if (!resp.ok) throw new Error("词库加载失败");

  const data = await resp.json();
  state.words = (data.words || []).map(normalizeSavedWord).filter(Boolean);

  for (const wordKey of Array.from(state.selectedMap.keys())) {
    const found = state.words.find((item) => item.word === wordKey);
    if (found) state.selectedMap.set(wordKey, found);
  }

  renderStats(`新词库 ${data.count} 条，原始词条 ${data.raw_count || data.count} 条，更新时间：${data.updated_at || "未知"}`);
  state.currentIndex = 0;
  renderLetterFilters();
  renderSelectedList();
  renderCard();
}

async function exportNotebook() {
  const entries = Array.from(state.selectedMap.values()).sort((a, b) => a.word.localeCompare(b.word));
  if (!entries.length) {
    alert("请先添加生词。");
    return;
  }

  const mode = $("modeSelect").value;
  const fileType = $("typeSelect").value;

  const resp = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries, mode, file_type: fileType }),
  });

  if (!resp.ok) {
    let msg = "导出失败";
    try {
      const data = await resp.json();
      if (data.error) msg = data.error;
    } catch (_) {
      // no-op
    }
    alert(msg);
    return;
  }

  const blob = await resp.blob();
  const cd = resp.headers.get("Content-Disposition") || "";
  const match = cd.match(/filename="?([^";]+)"?/i);
  const filename = match ? match[1] : `weici_vocab.${fileType}`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(a.href), 800);
}

function setupEvents() {
  $("loadBtn").addEventListener("click", () => loadWords(false).catch((e) => alert(e.message)));
  $("refreshBtn").addEventListener("click", () => loadWords(true).catch((e) => alert(e.message)));
  $("searchInput").addEventListener("input", () => {
    state.currentIndex = 0;
    renderCard();
  });
  $("rangeSelect").addEventListener("change", () => {
    if ($("rangeSelect").value !== "all") state.activeLetter = "all";
    state.currentIndex = 0;
    renderLetterFilters();
    renderCard();
  });

  $("addBtn").addEventListener("click", addCurrentWord);
  $("skipBtn").addEventListener("click", skipCurrentWord);

  $("clearSelectedBtn").addEventListener("click", () => {
    state.selectedMap.clear();
    saveSelected();
    state.currentIndex = 0;
    renderSelectedList();
    renderCard();
  });

  $("exportBtn").addEventListener("click", () => exportNotebook().catch((e) => alert(e.message)));

  document.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

    if (event.key === "a" || event.key === "A" || event.key === "Enter") {
      event.preventDefault();
      addCurrentWord();
    } else if (event.key === "s" || event.key === "S" || event.key === " ") {
      event.preventDefault();
      skipCurrentWord();
    }
  });
}

loadSavedSelected();
setupEvents();
renderLetterFilters();
renderSelectedList();
renderCard();
loadWords(false).catch((e) => {
  renderStats("词库加载失败，请稍后重试");
  alert(e.message);
});
