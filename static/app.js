const state = {
  words: [],
  selectedMap: new Map(),
  notebookEntries: [],
  activeView: "home",
  studyIndex: 0,
  notebookIndex: 0,
  lastView: "home",
  studyRange: "all",
  drawerOpen: false,
  settingsOpen: false,
  autoPlayAudio: true,
  hideMeanings: false,
  currentAudio: null,
  preferredVoice: null,
};

const SETTINGS_STORAGE_KEY = "weici_settings_v1";
const BOOKMARKS_STORAGE_KEY = "weici_bookmarks_v1";
const NOTEBOOK_STORAGE_KEY = "weici_notebook_v1";

const CATEGORY_LABELS = {
  phrase: "短语",
  special: "特殊词汇",
};
const STUDY_RANGES = [
  { value: "all", label: "全部新词" },
  { value: "phrase", label: "短语" },
  { value: "special", label: "特殊词汇" },
  ...Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map((letter) => ({ value: letter, label: letter })),
];
const EXPORT_CATEGORY_OPTIONS = STUDY_RANGES.filter((item) => item.value !== "all");

const $ = (id) => document.getElementById(id);

function renderStats(text) {
  $("stats").textContent = text;
}

function renderLoadState(status, text) {
  $("stats").textContent = text;
  $("stats").dataset.status = status;

  if (state.activeView === "study") {
    $("progressText").textContent = text;
  }
}

function renderToday() {
  const now = new Date();
  $("todayText").textContent = now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function loadSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.autoPlayAudio === "boolean") {
      state.autoPlayAudio = parsed.autoPlayAudio;
    }
    if (typeof parsed.hideMeanings === "boolean") {
      state.hideMeanings = parsed.hideMeanings;
    }
  } catch (_) {
    // no-op
  }
}

function saveSettings() {
  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        autoPlayAudio: state.autoPlayAudio,
        hideMeanings: state.hideMeanings,
      }),
    );
  } catch (_) {
    // no-op
  }
}

function loadBookmarks() {
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.word) : [];
  } catch (_) {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  try {
    window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (_) {
    // no-op
  }
}

function saveNotebookToStorage(entries) {
  try {
    window.localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(entries));
  } catch (_) {
    // no-op
  }
}

function normalizeWord(word) {
  if (!word || !word.word) return null;
  return {
    ...word,
    meanings: Array.isArray(word.meanings) ? word.meanings : [],
  };
}

function getIpa(word) {
  return word.audio ? word.ipa || word.ipa_us || word.ipa_uk || "" : word.ipa || word.ipa_us || word.ipa_uk || "";
}

function getAudio(word) {
  return word.audio || word.audio_us || word.audio_uk || "";
}

function getPlayableAudioUrl(word) {
  const audioUrl = getAudio(word);
  if (!audioUrl) return "";
  return `/api/audio?src=${encodeURIComponent(audioUrl)}`;
}

function getAudioMimeType(audioUrl) {
  if (!audioUrl) return "";
  const cleanUrl = audioUrl.split("?")[0].toLowerCase();
  if (cleanUrl.endsWith(".mp3")) return "audio/mpeg";
  if (cleanUrl.endsWith(".m4a")) return "audio/mp4";
  if (cleanUrl.endsWith(".aac")) return "audio/aac";
  if (cleanUrl.endsWith(".wav")) return "audio/wav";
  if (cleanUrl.endsWith(".ogg")) return "audio/ogg";
  return "";
}

function getCategoryLabel(category) {
  if (CATEGORY_LABELS[category]) return CATEGORY_LABELS[category];
  return category || "新词";
}

function getSelectedExportCategories() {
  const selected = Array.from(document.querySelectorAll('input[name="exportCategory"]:checked'));
  return selected.map((input) => input.value);
}

async function saveSelected() {
  const entries = [...state.notebookEntries];
  saveNotebookToStorage(entries);
}

async function loadNotebook() {
  let items = [];
  try {
    const raw = window.localStorage.getItem(NOTEBOOK_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    items = (Array.isArray(parsed) ? parsed : []).map(normalizeWord).filter(Boolean);
  } catch (_) {
    items = [];
  }
  state.notebookEntries = items;
  state.selectedMap = new Map(items.map((item) => [item.word, item]));
}

function getStudyWords() {
  if (state.studyRange === "all") return state.words;
  return state.words.filter((word) => word.category === state.studyRange);
}

function getNotebookWords() {
  return [...state.notebookEntries].sort((a, b) => a.word.localeCompare(b.word));
}

function getCurrentStudyWord() {
  const words = getStudyWords();
  if (!words.length) return null;
  if (state.studyIndex >= words.length) state.studyIndex = 0;
  if (state.studyIndex < 0) state.studyIndex = 0;
  return words[state.studyIndex];
}

function getCurrentNotebookWord() {
  const words = getNotebookWords();
  if (!words.length) return null;
  if (state.notebookIndex >= words.length) state.notebookIndex = 0;
  if (state.notebookIndex < 0) state.notebookIndex = 0;
  return words[state.notebookIndex];
}

function getBookmarks() {
  return loadBookmarks();
}

function addBookmark() {
  const current = getCurrentStudyWord();
  if (!current) return;

  const bookmarks = getBookmarks();
  const existingIndex = bookmarks.findIndex((item) => item.word === current.word && item.range === state.studyRange);
  const payload = {
    id: `${Date.now()}-${current.word}`,
    word: current.word,
    range: state.studyRange,
    category: current.category,
    createdAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    bookmarks[existingIndex] = { ...bookmarks[existingIndex], ...payload, id: bookmarks[existingIndex].id };
  } else {
    bookmarks.unshift(payload);
  }

  saveBookmarks(bookmarks.slice(0, 30));
  renderDrawer();
}

function jumpToBookmark(bookmark) {
  if (!bookmark) return;
  state.studyRange = bookmark.range || "all";
  const words = getStudyWords();
  const foundIndex = words.findIndex((item) => item.word === bookmark.word);
  state.studyIndex = foundIndex >= 0 ? foundIndex : 0;
  state.activeView = "study";
  state.drawerOpen = false;
  renderActiveView();
  maybeAutoPlay(getCurrentStudyWord());
}

function removeBookmark(bookmarkId) {
  const bookmarks = getBookmarks().filter((item) => item.id !== bookmarkId);
  saveBookmarks(bookmarks);
  renderDrawer();
}

function renderView() {
  const isHome = state.activeView === "home";
  const isStudy = state.activeView === "study";
  const isNotebook = state.activeView === "notebook";
  const enteringImmersive = state.lastView === "home" && !isHome;

  document.body.classList.toggle("immersive-mode", !isHome);
  document.body.classList.toggle("hide-meanings", state.hideMeanings);
  $("homePanel").hidden = !isHome;
  $("workspace").hidden = isHome;
  $("studyPanel").hidden = !isStudy;
  $("notebookPanel").hidden = !isNotebook;
  $("studyPanel").style.display = isStudy ? "flex" : "none";
  $("notebookPanel").style.display = isNotebook ? "flex" : "none";
  $("studyDrawer").hidden = !isStudy || !state.drawerOpen;
  $("settingsDrawer").hidden = !state.settingsOpen;
  $("settingsBtn").setAttribute("aria-expanded", state.settingsOpen ? "true" : "false");
  $("showStudyBtn").classList.toggle("active", isStudy);
  $("showNotebookBtn").classList.toggle("active", isNotebook);

  if (enteringImmersive) {
    $("workspace").classList.remove("animate-in");
    window.requestAnimationFrame(() => {
      $("workspace").classList.add("animate-in");
    });
  }

  state.lastView = state.activeView;
}

function renderSettings() {
  $("autoPlayToggle").checked = state.autoPlayAudio;
  $("hideMeaningsToggle").checked = state.hideMeanings;
}

function renderExportControls() {
  const source = $("exportSourceSelect").value;
  $("exportCategoryPanel").hidden = source !== "categories";
}

function renderExportCategories() {
  const container = $("exportCategoryList");
  container.innerHTML = "";

  for (const item of EXPORT_CATEGORY_OPTIONS) {
    const label = document.createElement("label");
    label.className = "export-category-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "exportCategory";
    input.value = item.value;
    input.checked = true;

    const text = document.createElement("span");
    text.textContent = item.label;

    label.appendChild(input);
    label.appendChild(text);
    container.appendChild(label);
  }
}

function renderDrawer() {
  const container = $("drawerRangeList");
  const bookmarkContainer = $("bookmarkList");
  container.innerHTML = "";
  bookmarkContainer.innerHTML = "";

  for (const item of STUDY_RANGES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `drawer-item${state.studyRange === item.value ? " active" : ""}`;
    btn.textContent = item.label;
    btn.addEventListener("click", () => {
      state.studyRange = item.value;
      state.studyIndex = 0;
      renderDrawer();
      renderStudyCard();
      maybeAutoPlay(getCurrentStudyWord());
    });
    container.appendChild(btn);
  }

  const bookmarks = getBookmarks();
  if (!bookmarks.length) {
    const empty = document.createElement("p");
    empty.className = "bookmark-empty";
    empty.textContent = "还没有书签。";
    bookmarkContainer.appendChild(empty);
    return;
  }

  for (const item of bookmarks) {
    const row = document.createElement("div");
    row.className = "bookmark-item";

    const jumpBtn = document.createElement("button");
    jumpBtn.type = "button";
    jumpBtn.className = "bookmark-jump";
    jumpBtn.innerHTML = `<strong>${item.word}</strong><span>${STUDY_RANGES.find((range) => range.value === item.range)?.label || "全部新词"}</span>`;
    jumpBtn.addEventListener("click", () => {
      jumpToBookmark(item);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "ghost bookmark-remove";
    removeBtn.textContent = "删除";
    removeBtn.addEventListener("click", () => {
      removeBookmark(item.id);
    });

    row.appendChild(jumpBtn);
    row.appendChild(removeBtn);
    bookmarkContainer.appendChild(row);
  }
}

function renderMeaningBlock(containerId, word) {
  const container = $(containerId);
  container.innerHTML = "";
  container.classList.remove("card-swap");

  const rows = (word.meanings && word.meanings.length)
    ? word.meanings.slice(0, 2)
    : [{ pos: word.pos, zh: word.first_zh, en: word.first_en }];

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

  window.requestAnimationFrame(() => {
    container.classList.add("card-swap");
  });
}

function playWordAudio(word) {
  if (!word) return;
  stopAudioPlayback();
  const originalAudioUrl = getAudio(word);
  const audioUrl = getPlayableAudioUrl(word);
  if (audioUrl) {
    const mimeType = getAudioMimeType(originalAudioUrl);
    const probe = document.createElement("audio");
    if (mimeType && typeof probe.canPlayType === "function" && !probe.canPlayType(mimeType)) {
      speakFallback(word.word);
      return;
    }
    const audio = new Audio(audioUrl);
    state.currentAudio = audio;
    audio.preload = "auto";
    audio.playsInline = true;
    audio.addEventListener("ended", () => {
      if (state.currentAudio === audio) state.currentAudio = null;
    }, { once: true });
    audio.addEventListener("error", () => {
      if (state.currentAudio === audio) state.currentAudio = null;
      speakFallback(word.word);
    }, { once: true });
    audio.play().catch(() => {
      if (state.currentAudio === audio) state.currentAudio = null;
      speakFallback(word.word);
    });
    return;
  }
  speakFallback(word.word);
}

function stopAudioPlayback() {
  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio.currentTime = 0;
    state.currentAudio = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function maybeAutoPlay(word) {
  if (!state.autoPlayAudio || !word) return;
  playWordAudio(word);
}

function pickPreferredVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find((voice) => /en-US/i.test(voice.lang) && /Samantha|Alex|Daniel|Google US English/i.test(voice.name))
    || voices.find((voice) => /en-US/i.test(voice.lang))
    || voices.find((voice) => /en-GB/i.test(voice.lang))
    || null;
  state.preferredVoice = preferredVoice;
  return preferredVoice;
}

function speakFallback(text) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const preferredVoice = state.preferredVoice || pickPreferredVoice();
  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang;
  } else {
    utterance.lang = "en-US";
  }
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}

function warmupSpeech() {
  if (!("speechSynthesis" in window)) return;
  pickPreferredVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    pickPreferredVoice();
  };
}

function renderStudyCard() {
  const words = getStudyWords();
  const current = getCurrentStudyWord();
  const rangeLabel = STUDY_RANGES.find((item) => item.value === state.studyRange)?.label || "全部新词";
  $("progressText").textContent = words.length ? `${rangeLabel} · 当前第 ${state.studyIndex + 1} / ${words.length} 个` : `${rangeLabel} · 当前没有可显示的新词`;
  $("emptyState").hidden = Boolean(current);
  $("cardContent").hidden = !current;
  $("cardMeanings").hidden = !current || state.hideMeanings;
  $("addBtn").disabled = !current || state.selectedMap.has(current.word);
  $("bookmarkBtn").disabled = !current;
  $("playAudioBtn").disabled = !current;
  $("prevBtn").disabled = !current;
  $("nextBtn").disabled = !current;

  if (!current) return;

  $("cardCategory").textContent = getCategoryLabel(current.category);
  $("cardWord").textContent = current.word;
  $("cardIpa").textContent = getIpa(current) ? `[${getIpa(current)}]` : "暂无音标";
  if (!state.hideMeanings) {
    renderMeaningBlock("cardMeanings", current);
  }
}

function renderNotebookCard() {
  const words = getNotebookWords();
  const current = getCurrentNotebookWord();
  $("selectedCount").textContent = words.length ? `已选 ${words.length} 个单词 · 当前第 ${state.notebookIndex + 1} / ${words.length} 个` : "生词本为空";
  $("notebookEmptyState").hidden = Boolean(current);
  $("notebookCardContent").hidden = !current;
  $("notebookMeanings").hidden = !current || state.hideMeanings;
  $("removeBtn").disabled = !current;
  $("notebookPlayAudioBtn").disabled = !current;
  $("notebookPrevBtn").disabled = !current;
  $("notebookNextBtn").disabled = !current;
  $("exportBtn").disabled = !words.length;

  if (!current) return;

  $("notebookCategory").textContent = `生词本模式 · ${getCategoryLabel(current.category)} · ${state.notebookIndex + 1}/${words.length}`;
  $("notebookWord").textContent = current.word;
  $("notebookIpa").textContent = getIpa(current) ? `[${getIpa(current)}]` : "暂无音标";
  if (!state.hideMeanings) {
    renderMeaningBlock("notebookMeanings", current);
  }
}

function renderActiveView() {
  renderView();
  renderSettings();
  renderDrawer();
  renderStudyCard();
  renderNotebookCard();
}

function moveStudy(delta) {
  const words = getStudyWords();
  if (!words.length) return;
  state.studyIndex = (state.studyIndex + delta + words.length) % words.length;
  renderStudyCard();
  maybeAutoPlay(getCurrentStudyWord());
}

function moveNotebook(delta) {
  const words = getNotebookWords();
  if (!words.length) return;
  state.notebookIndex = (state.notebookIndex + delta + words.length) % words.length;
  renderNotebookCard();
  maybeAutoPlay(getCurrentNotebookWord());
}

function addCurrentWord() {
  const current = getCurrentStudyWord();
  if (!current || state.selectedMap.has(current.word)) return;

  state.notebookEntries.push(current);
  state.selectedMap.set(current.word, current);
  renderNotebookCard();
  saveSelected().catch(() => {
    // no-op
  });
  moveStudy(1);
}

function removeCurrentWord() {
  const current = getCurrentNotebookWord();
  if (!current) return;

  state.notebookEntries = state.notebookEntries.filter((item) => item.word !== current.word);
  state.selectedMap.delete(current.word);
  const wordsAfter = getNotebookWords();
  if (state.notebookIndex >= wordsAfter.length) {
    state.notebookIndex = Math.max(0, wordsAfter.length - 1);
  }
  renderNotebookCard();
  saveSelected().catch(() => {
    // no-op
  });
}

async function loadWords(refresh = false) {
  renderLoadState("loading", "词库加载中，请稍候...");
  const resp = await fetch(`/api/words${refresh ? "?refresh=1" : ""}`);
  if (!resp.ok) throw new Error("词库加载失败");

  const data = await resp.json();
  state.words = (data.words || []).map(normalizeWord).filter(Boolean);

  const refreshedNotebook = new Map();
  const refreshedNotebookEntries = [];
  for (const [wordKey, savedItem] of Array.from(state.selectedMap.entries())) {
    const found = state.words.find((item) => item.word === wordKey);
    const item = found || savedItem;
    refreshedNotebook.set(wordKey, item);
    refreshedNotebookEntries.push(item);
  }
  state.selectedMap = refreshedNotebook;
  state.notebookEntries = refreshedNotebookEntries;

  state.studyIndex = 0;
  state.notebookIndex = 0;
  renderLoadState("success", `词库已加载：${data.count} 条可用词，原始词条 ${data.raw_count || data.count} 条，更新时间：${data.updated_at || "未知"}`);
  renderActiveView();
}

async function exportNotebook() {
  const source = $("exportSourceSelect").value;
  const selectedCategories = getSelectedExportCategories();
  const entries = source === "categories"
    ? state.words.filter((item) => selectedCategories.includes(item.category))
    : getNotebookWords();

  if (!entries.length) {
    alert(source === "categories" ? "请先选择至少一个类别并确保词库已加载。" : "请先加入生词。");
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

function enterView(view) {
  if (view === "home") {
    stopAudioPlayback();
  }
  state.activeView = view;
  if (view === "study") {
    state.studyIndex = 0;
  }
  if (view === "notebook") {
    state.notebookIndex = 0;
    state.drawerOpen = false;
  }
  renderActiveView();
  if (view === "home") return;
  const current = view === "study" ? getCurrentStudyWord() : getCurrentNotebookWord();
  maybeAutoPlay(current);
}

function setupEvents() {
  $("loadBtn").addEventListener("click", () => loadWords(false).catch((e) => alert(e.message)));
  $("refreshBtn").addEventListener("click", () => loadWords(true).catch((e) => alert(e.message)));

  $("showStudyBtn").addEventListener("click", () => enterView("study"));
  $("showNotebookBtn").addEventListener("click", () => enterView("notebook"));
  $("backHomeBtn").addEventListener("click", () => enterView("home"));
  $("notebookExitBtn").addEventListener("click", () => enterView("home"));
  $("drawerToggleBtn").addEventListener("click", () => {
    state.drawerOpen = !state.drawerOpen;
    renderView();
  });
  $("drawerCloseBtn").addEventListener("click", () => {
    state.drawerOpen = false;
    renderView();
  });
  $("settingsBtn").addEventListener("click", () => {
    state.settingsOpen = !state.settingsOpen;
    renderView();
    renderSettings();
  });
  $("settingsCloseBtn").addEventListener("click", () => {
    state.settingsOpen = false;
    renderView();
  });
  $("autoPlayToggle").addEventListener("change", (event) => {
    state.autoPlayAudio = event.target.checked;
    saveSettings();
    renderSettings();
  });
  $("hideMeaningsToggle").addEventListener("change", (event) => {
    state.hideMeanings = event.target.checked;
    saveSettings();
    renderActiveView();
  });

  $("bookmarkCurrentBtn").addEventListener("click", addBookmark);
  $("bookmarkBtn").addEventListener("click", addBookmark);
  $("addBtn").addEventListener("click", addCurrentWord);
  $("playAudioBtn").addEventListener("click", () => playWordAudio(getCurrentStudyWord()));
  $("prevBtn").addEventListener("click", () => moveStudy(-1));
  $("nextBtn").addEventListener("click", () => moveStudy(1));

  $("removeBtn").addEventListener("click", removeCurrentWord);
  $("notebookPlayAudioBtn").addEventListener("click", () => playWordAudio(getCurrentNotebookWord()));
  $("notebookPrevBtn").addEventListener("click", () => moveNotebook(-1));
  $("notebookNextBtn").addEventListener("click", () => moveNotebook(1));
  $("exportSourceSelect").addEventListener("change", renderExportControls);
  $("exportSelectAllBtn").addEventListener("click", () => {
    document.querySelectorAll('input[name="exportCategory"]').forEach((input) => {
      input.checked = true;
    });
  });
  $("exportClearBtn").addEventListener("click", () => {
    document.querySelectorAll('input[name="exportCategory"]').forEach((input) => {
      input.checked = false;
    });
  });

  $("exportBtn").addEventListener("click", () => exportNotebook().catch((e) => alert(e.message)));

  document.addEventListener("keydown", (event) => {
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

    if (event.key === "Escape") {
      if (state.settingsOpen) {
        state.settingsOpen = false;
        renderView();
        return;
      }
      enterView("home");
      return;
    }

    if (state.activeView === "study") {
      if (event.key === "Tab") {
        event.preventDefault();
        state.drawerOpen = !state.drawerOpen;
        renderView();
      } else if (event.key === "a" || event.key === "A" || event.key === "Enter") {
        event.preventDefault();
        addCurrentWord();
      } else if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        addBookmark();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveStudy(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveStudy(1);
      }
    } else if (state.activeView === "notebook") {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveNotebook(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveNotebook(1);
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        removeCurrentWord();
      }
    }
  });
}

setupEvents();
loadSettings();
renderToday();
warmupSpeech();
renderExportCategories();
renderExportControls();
renderActiveView();
Promise.resolve()
  .then(() => loadNotebook())
  .then(() => loadWords(false))
  .catch((e) => {
    renderLoadState("error", "词库加载失败，请点击“加载词库”或“强制刷新”重试");
    alert(e.message);
  });
