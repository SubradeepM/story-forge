/* ═══════════════════════════════════════════
   AI Story Forge — Main Application
   ═══════════════════════════════════════════ */

const API = "http://127.0.0.1:3001/api";
// ── State ──────────────────────────────────
const state = {
  genre: "fantasy",
  tone: "dramatic",
  wordCount: 300,
  currentStory: "",
  characters: [],        // roster
  activeChars: [],       // added to story
  stories: [],           // library
  isGenerating: false,
};

// ── DOM Refs ───────────────────────────────
const $ = (id) => document.getElementById(id);
const promptInput   = $("promptInput");
const promptCounter = $("promptCounter");
const forgeBtn      = $("forgeBtn");
const continueBtn   = $("continueBtn");
const enhanceBtn    = $("enhanceBtn");
const wordCountSlider = $("wordCount");
const wordCountLabel  = $("wordCountLabel");
const storyText     = $("storyText");
const storyTitle    = $("storyTitle");
const storyContainer = $("storyContainer");
const outputPlaceholder = $("outputPlaceholder");
const storyWordCount = $("storyWordCount");
const storyGenreLabel = $("storyGenre");
const titleGenBtn   = $("titleGenBtn");
const critiqueBtn   = $("critiqueBtn");
const copyBtn       = $("copyBtn");
const saveBtn       = $("saveBtn");
const clearBtn      = $("clearBtn");
const toast         = $("toast");
const miniChars     = $("miniChars");
const charCountBadge = $("charCount");
const storyCount    = $("storyCount");

// Critique
const critiqueCard  = $("critiqueCard");
const scoreRing     = $("scoreRing");
const scoreNum      = $("scoreNum");
const critiqueTags  = $("critiqueTags");
const strengthsList = $("strengthsList");
const improvementsList = $("improvementsList");
const insightPlaceholder = $("insightPlaceholder");
const titlesCard    = $("titlesCard");
const titlesList    = $("titlesList");

// Characters page
const charRole      = $("charRole");
const charGenre     = $("charGenre");
const charHint      = $("charHint");
const generateCharBtn = $("generateCharBtn");
const charResult    = $("charResult");
const charCardPreview = $("charCardPreview");
const regenCharBtn  = $("regenCharBtn");
const addCharBtn    = $("addCharBtn");
const rosterGrid    = $("rosterGrid");

// Library
const libraryGrid   = $("libraryGrid");

// Modal
const titlesModal   = $("titlesModal");
const modalTitlesList = $("modalTitlesList");
const modalClose    = $("modalClose");

// ── Load from localStorage ─────────────────
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("storyForgeData") || "{}");
    if (saved.characters) state.characters = saved.characters;
    if (saved.stories) state.stories = saved.stories;
  } catch (_) {}
}

function saveStateToStorage() {
  localStorage.setItem("storyForgeData", JSON.stringify({
    characters: state.characters,
    stories: state.stories,
  }));
}

// ── Navigation ─────────────────────────────
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const panel = document.getElementById("panel-" + btn.dataset.panel);
    if (panel) { panel.classList.add("active"); }
    if (btn.dataset.panel === "library") renderLibrary();
    if (btn.dataset.panel === "characters") renderRoster();
  });
});

// ── Genre & Tone ───────────────────────────
document.querySelectorAll(".genre-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".genre-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.genre = btn.dataset.genre;
  });
});

document.querySelectorAll(".tone-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tone-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.tone = btn.dataset.tone;
  });
});

// ── Word count slider ──────────────────────
wordCountSlider.addEventListener("input", () => {
  state.wordCount = parseInt(wordCountSlider.value);
  wordCountLabel.textContent = state.wordCount;
});

// ── Prompt counter ─────────────────────────
promptInput.addEventListener("input", () => {
  const len = promptInput.value.length;
  promptCounter.textContent = `${len} / 500`;
  if (len > 500) promptInput.value = promptInput.value.slice(0, 500);
});

// ── Enhance Prompt ─────────────────────────
enhanceBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) { showToast("Enter a prompt first"); return; }
  enhanceBtn.textContent = "⏳ Enhancing...";
  enhanceBtn.disabled = true;
  try {
    const res = await fetch(`${API}/enhance-prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, genre: state.genre }),
    });
    const data = await res.json();
    if (data.enhanced) {
      promptInput.value = data.enhanced;
      promptInput.dispatchEvent(new Event("input"));
      showToast("✨ Prompt enhanced!");
    }
  } catch (err) {
    showToast("Enhancement failed — check your connection");
  } finally {
    enhanceBtn.textContent = "✨ Enhance";
    enhanceBtn.disabled = false;
  }
});

// ── Forge Story (streaming) ────────────────
forgeBtn.addEventListener("click", () => forgeStory(false));
continueBtn.addEventListener("click", () => forgeStory(true));

async function forgeStory(isContinuation) {
  const prompt = promptInput.value.trim();
  if (!prompt) { showToast("Enter a story prompt first"); return; }
  if (state.isGenerating) return;

  state.isGenerating = true;
  forgeBtn.disabled = true;
  forgeBtn.innerHTML = '<span class="spin">⚗️</span> <span class="btn-text">Forging...</span>';

  // Show story container
  outputPlaceholder.classList.add("hidden");
  storyContainer.classList.remove("hidden");
  storyText.textContent = "";
  storyText.classList.add("cursor-blink");

  // Reset insights
  critiqueCard.style.display = "none";
  titlesCard.style.display = "none";
  insightPlaceholder.style.display = "flex";

  let fullText = "";

  try {
    const res = await fetch(`${API}/generate-story`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        genre: state.genre,
        tone: state.tone,
        characters: state.activeChars,
        wordCount: state.wordCount,
        continueFrom: isContinuation ? state.currentStory : null,
      }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try {
          const json = JSON.parse(line.slice(5).trim());
          if (json.text) {
            fullText += json.text;
            storyText.textContent = fullText;
            storyText.scrollTop = storyText.scrollHeight;
          }
          if (json.done || json.error) break;
        } catch (_) {}
      }
    }

    state.currentStory = fullText;
    const wc = fullText.split(/\s+/).filter(Boolean).length;
    storyWordCount.textContent = `${wc} words`;
    storyGenreLabel.textContent = state.genre;
    continueBtn.disabled = false;

  } catch (err) {
    storyText.textContent = "⚠️ Connection error. Make sure the backend is running.";
    showToast("Generation failed — check backend connection");
  } finally {
    storyText.classList.remove("cursor-blink");
    state.isGenerating = false;
    forgeBtn.disabled = false;
    forgeBtn.innerHTML = '<span class="btn-text">Forge Story</span><span class="btn-icon">⚡</span>';
  }
}

// ── AI Critique ────────────────────────────
critiqueBtn.addEventListener("click", async () => {
  if (!state.currentStory) { showToast("No story to critique"); return; }
  critiqueBtn.textContent = "⏳ Analysing...";
  critiqueBtn.disabled = true;
  try {
    const res = await fetch(`${API}/critique`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyText: state.currentStory }),
    });
    const data = await res.json();

    // Score ring
    const score = data.overallScore || 75;
    const circumference = 2 * Math.PI * 26;
    const offset = circumference - (score / 100) * circumference;
    scoreRing.style.strokeDashoffset = offset;
    scoreNum.textContent = score;

    // Tags
    critiqueTags.innerHTML = "";
    [data.mood, data.style].filter(Boolean).forEach(tag => {
      const span = document.createElement("span");
      span.className = "critique-tag";
      span.textContent = tag;
      critiqueTags.appendChild(span);
    });

    // Strengths / improvements
    strengthsList.innerHTML = (data.strengths || []).map(s => `<li>${s}</li>`).join("");
    improvementsList.innerHTML = (data.improvements || []).map(i => `<li>${i}</li>`).join("");

    critiqueCard.style.display = "block";
    insightPlaceholder.style.display = "none";
    showToast("✅ Critique ready!");
  } catch (err) {
    showToast("Critique failed — try again");
  } finally {
    critiqueBtn.textContent = "🎯 AI Critique";
    critiqueBtn.disabled = false;
  }
});

// ── Title Generator ────────────────────────
titleGenBtn.addEventListener("click", generateTitles);

async function generateTitles() {
  if (!state.currentStory) { showToast("No story to name"); return; }
  titleGenBtn.textContent = "⏳";
  try {
    const res = await fetch(`${API}/generate-titles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyText: state.currentStory, genre: state.genre }),
    });
    const data = await res.json();
    if (data.titles) {
      // Show in sidebar
      titlesList.innerHTML = data.titles.map(t =>
        `<li onclick="setTitle('${t.replace(/'/g,"\\'")}')">«${t}»</li>`
      ).join("");
      titlesCard.style.display = "block";
      insightPlaceholder.style.display = "none";

      // Show modal too
      modalTitlesList.innerHTML = data.titles.map(t =>
        `<li onclick="setTitle('${t.replace(/'/g,"\\'")}'); closeModal()">«${t}»</li>`
      ).join("");
      titlesModal.classList.remove("hidden");
    }
  } catch (err) {
    showToast("Title generation failed");
  } finally {
    titleGenBtn.textContent = "Generate Titles";
  }
}

window.setTitle = (t) => { storyTitle.textContent = t; showToast("Title set!"); };

modalClose.addEventListener("click", closeModal);
titlesModal.addEventListener("click", e => { if (e.target === titlesModal) closeModal(); });
function closeModal() { titlesModal.classList.add("hidden"); }
window.closeModal = closeModal;

// ── Copy / Save / Clear ────────────────────
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(state.currentStory).then(() => showToast("📋 Copied to clipboard!"));
});

saveBtn.addEventListener("click", () => {
  if (!state.currentStory) { showToast("Nothing to save"); return; }
  const entry = {
    id: Date.now(),
    title: storyTitle.textContent || "Untitled",
    text: state.currentStory,
    genre: state.genre,
    tone: state.tone,
    date: new Date().toLocaleDateString(),
    words: state.currentStory.split(/\s+/).filter(Boolean).length,
  };
  state.stories.unshift(entry);
  saveStateToStorage();
  updateStoryCount();
  showToast("💾 Story saved to Library!");
});

clearBtn.addEventListener("click", () => {
  state.currentStory = "";
  storyText.textContent = "";
  storyContainer.classList.add("hidden");
  outputPlaceholder.classList.remove("hidden");
  continueBtn.disabled = true;
  critiqueCard.style.display = "none";
  titlesCard.style.display = "none";
  insightPlaceholder.style.display = "flex";
});

// ── Character Generator ────────────────────
let lastGeneratedChar = null;

generateCharBtn.addEventListener("click", generateCharacter);
regenCharBtn.addEventListener("click", generateCharacter);

async function generateCharacter() {
  generateCharBtn.textContent = "⚗️ Forging...";
  generateCharBtn.disabled = true;
  try {
    const res = await fetch(`${API}/generate-character`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genre: charGenre.value,
        role: charRole.value,
        hint: charHint.value,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    lastGeneratedChar = data;
    renderCharPreview(data);
    charResult.classList.remove("hidden");
  } catch (err) {
    showToast("Character generation failed — check backend");
  } finally {
    generateCharBtn.textContent = "⚗️ Generate Character";
    generateCharBtn.disabled = false;
  }
}

function renderCharPreview(c) {
  charCardPreview.innerHTML = `
    <div class="char-name">${c.name}</div>
    <div class="char-role-badge">${c.role}</div>
    <p class="char-desc">${c.description}</p>
    <div class="char-meta">
      <div class="char-meta-row"><span class="char-meta-key">Age</span><span class="char-meta-val">${c.age || "Unknown"}</span></div>
      <div class="char-meta-row"><span class="char-meta-key">Personality</span><span class="char-meta-val">${c.personality}</span></div>
      <div class="char-meta-row"><span class="char-meta-key">Backstory</span><span class="char-meta-val">${c.backstory}</span></div>
    </div>
    <p class="char-quirk">✦ ${c.quirk}</p>
  `;
}

addCharBtn.addEventListener("click", () => {
  if (!lastGeneratedChar) return;
  const exists = state.characters.find(c => c.name === lastGeneratedChar.name);
  if (!exists) {
    state.characters.push(lastGeneratedChar);
    saveStateToStorage();
    renderRoster();
  }
  // Also add to active
  const alreadyActive = state.activeChars.find(c => c.name === lastGeneratedChar.name);
  if (!alreadyActive) {
    state.activeChars.push(lastGeneratedChar);
    updateMiniChars();
  }
  showToast(`✅ ${lastGeneratedChar.name} added to story!`);
});

// ── Roster ─────────────────────────────────
function renderRoster() {
  if (state.characters.length === 0) {
    rosterGrid.innerHTML = `<div class="roster-empty"><span>⚗️</span><p>No characters forged yet. Generate your first one above.</p></div>`;
    return;
  }
  rosterGrid.innerHTML = state.characters.map((c, i) => {
    const isActive = !!state.activeChars.find(a => a.name === c.name);
    return `
    <div class="roster-card">
      <div class="roster-card-header">
        <div>
          <div class="roster-card-name">${c.name}</div>
          <div class="roster-card-role">${c.role}</div>
        </div>
      </div>
      <p class="roster-card-desc">${c.description}</p>
      <div class="roster-card-actions">
        <button class="roster-card-btn ${isActive ? "active-char" : ""}" onclick="toggleActiveChar(${i})">
          ${isActive ? "✓ In Story" : "+ Add to Story"}
        </button>
        <button class="roster-card-btn remove-btn" onclick="removeChar(${i})">Remove</button>
      </div>
    </div>`;
  }).join("");
}

window.toggleActiveChar = (i) => {
  const c = state.characters[i];
  const idx = state.activeChars.findIndex(a => a.name === c.name);
  if (idx === -1) { state.activeChars.push(c); showToast(`${c.name} added to story`); }
  else { state.activeChars.splice(idx, 1); showToast(`${c.name} removed from story`); }
  updateMiniChars();
  renderRoster();
};

window.removeChar = (i) => {
  const c = state.characters[i];
  state.characters.splice(i, 1);
  state.activeChars = state.activeChars.filter(a => a.name !== c.name);
  saveStateToStorage();
  updateMiniChars();
  renderRoster();
};

function updateMiniChars() {
  charCountBadge.textContent = state.activeChars.length;
  if (state.activeChars.length === 0) {
    miniChars.innerHTML = `<p class="empty-chars">No characters added yet.<br/>Build some in the Characters tab.</p>`;
    return;
  }
  miniChars.innerHTML = state.activeChars.map(c => `
    <div class="mini-char-item">
      <div class="mini-char-avatar">${c.name.charAt(0)}</div>
      <div class="mini-char-info">
        <div class="mini-char-name">${c.name}</div>
        <div class="mini-char-role">${c.role}</div>
      </div>
    </div>
  `).join("");
}

// ── Library ─────────────────────────────────
function renderLibrary() {
  updateStoryCount();
  if (state.stories.length === 0) {
    libraryGrid.innerHTML = `<div class="library-empty"><span>📚</span><p>No stories saved yet. Forge your first story and save it here.</p></div>`;
    return;
  }
  libraryGrid.innerHTML = state.stories.map((s, i) => `
    <div class="library-card" onclick="loadStory(${i})">
      <div class="lib-genre">${s.genre} · ${s.tone}</div>
      <div class="lib-title">${s.title}</div>
      <p class="lib-preview">${s.text}</p>
      <div class="lib-meta">
        <span class="lib-words">${s.words} words</span>
        <span class="lib-date">${s.date}</span>
        <button class="lib-del" onclick="event.stopPropagation(); deleteStory(${i})">✕</button>
      </div>
    </div>
  `).join("");
}

window.loadStory = (i) => {
  const s = state.stories[i];
  state.currentStory = s.text;
  storyTitle.textContent = s.title;
  storyText.textContent = s.text;
  storyWordCount.textContent = `${s.words} words`;
  storyGenreLabel.textContent = s.genre;
  outputPlaceholder.classList.add("hidden");
  storyContainer.classList.remove("hidden");
  continueBtn.disabled = false;
  // Navigate to forge
  document.querySelector('[data-panel="forge"]').click();
  showToast("📖 Story loaded into forge!");
};

window.deleteStory = (i) => {
  state.stories.splice(i, 1);
  saveStateToStorage();
  renderLibrary();
  showToast("Story deleted");
};

function updateStoryCount() {
  storyCount.textContent = `${state.stories.length} ${state.stories.length === 1 ? "story" : "stories"}`;
}

// ── Toast ────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// ── Init ────────────────────────────────────
loadState();
updateMiniChars();
updateStoryCount();
