import { getGenreTotals, getMonthTotal, getMonthTotals, getRecordsForGenre, getYearTotals } from "./analytics";
import { formatRecordDateTime, formatYearMonth, getCurrentStamp } from "./date";
import { signedYen, yen } from "./format";
import { renderPieChart, wirePieInteractions } from "./pie";
import "./styles.css";
import { loadSettings, loadState, normalizeState, saveSettings, saveState } from "./storage";
import type { AppState, Genre, GenreTotal, MoneyRecord, MoneyType, Screen } from "./types";

const typeLabel: Record<MoneyType, string> = {
  expense: "支出",
  income: "収入"
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root not found");

let state: AppState = loadState();
let settings = loadSettings();
let screen: Screen = { name: "home" };
let recordType: MoneyType = "expense";
let summaryType: MoneyType = "expense";
let analysisType: MoneyType = "expense";
let showIncome = settings.showIncome;
let menuOpen = false;
let selectedGenreId = firstGenreId(recordType);

const persist = () => saveState(state);
const persistSettings = () => saveSettings(settings);

const setScreen = (next: Screen) => {
  screen = next;
  menuOpen = false;
  render();
};

const setRecordType = (next: MoneyType) => {
  recordType = next;
  if (!currentGenres().some((genre) => genre.id === selectedGenreId)) {
    selectedGenreId = firstGenreId(recordType);
  }
  render();
};

const setSummaryType = (next: MoneyType) => {
  summaryType = next;
  render();
};

const setAnalysisType = (next: MoneyType) => {
  analysisType = next;
  render();
};

const setShowIncome = (next: boolean) => {
  showIncome = next;
  settings = { ...settings, showIncome };
  persistSettings();
  menuOpen = false;
  if (!showIncome) {
    recordType = "expense";
    summaryType = "expense";
    analysisType = "expense";
    selectedGenreId = firstGenreId(recordType);
    if (screen.name === "genre" && screen.type === "income") screen = { name: "home" };
  }
  render();
};

const addGenre = () => {
  const name = window.prompt(`${typeLabel[recordType]}ジャンル名`);
  const trimmed = name?.trim();
  if (!trimmed) return;

  const existing = state.genres.find((genre) => genre.type === recordType && genre.name === trimmed);
  if (existing) {
    selectedGenreId = existing.id;
    render();
    return;
  }

  const genre: Genre = {
    id: createId("genre"),
    name: trimmed,
    type: recordType
  };

  state = {
    ...state,
    genres: [...state.genres, genre]
  };
  selectedGenreId = genre.id;
  persist();
  render();
};

const addRecord = () => {
  const titleInput = document.querySelector<HTMLInputElement>("#title-input");
  const amountInput = document.querySelector<HTMLInputElement>("#amount-input");
  const genreSelect = document.querySelector<HTMLSelectElement>("#genre-select");
  const title = titleInput?.value.trim() ?? "";
  const amount = Number((amountInput?.value ?? "").replace(/[^\d]/g, ""));
  const genreId = genreSelect?.value || selectedGenreId;

  if (!title) {
    showToast("タイトルを入力して");
    return;
  }
  if (!amount || amount <= 0) {
    showToast("金額を入力して");
    return;
  }
  if (!genreId) {
    showToast("ジャンルを追加して");
    return;
  }

  const stamp = getCurrentStamp();
  const record: MoneyRecord = {
    id: createId("record"),
    title,
    amount,
    type: recordType,
    genreId,
    createdAt: stamp.createdAt,
    yearMonth: stamp.yearMonth,
    year: stamp.year
  };

  state = {
    ...state,
    records: [record, ...state.records]
  };
  selectedGenreId = genreId;
  persist();
  render();
  showToast("記録しました");
};

const exportData = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `monthly-money-memo-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const importData = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as AppState;
      state = normalizeState(parsed);
      selectedGenreId = firstGenreId(recordType);
      persist();
      render();
      showToast("復元しました");
    } catch {
      showToast("JSONを読み込めませんでした");
    }
  });
  input.click();
};

const render = () => {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        ${screen.name === "home" ? "<h1>月ごとメモ</h1>" : `<button class="ghost" data-action="back">戻る</button><h1>${screenTitle(screen)}</h1>`}
        ${renderTopbarMenu()}
      </header>
      <main>
        ${renderScreen()}
      </main>
      <div class="toast" id="toast" aria-live="polite"></div>
    </div>
  `;

  wireEvents();
  if (screen.name === "year") wirePieInteractions();
};

const renderScreen = () => {
  if (screen.name === "past") return renderPast();
  if (screen.name === "month") return renderMonth(screen.yearMonth);
  if (screen.name === "genre") return renderGenre(screen);
  if (screen.name === "year") return renderYear(screen.year);
  return renderHome();
};

const renderHome = () => {
  const currentMonth = getCurrentStamp().yearMonth;
  const total = getMonthTotal(state.records, currentMonth);
  const genres = currentGenres();
  const genreTotals = getGenreTotals(state.records, state.genres, summaryType, currentMonth);

  return `
    <section class="panel input-panel">
      <div class="input-grid">
        <label>
          <span>タイトル</span>
          <input id="title-input" autocomplete="off" placeholder="例: 参考書" />
        </label>
        <label>
          <span>金額</span>
          <input id="amount-input" inputmode="numeric" placeholder="0" />
        </label>
      </div>
      ${showIncome ? renderSegment("record-type", recordType) : ""}
      <div class="genre-control">
        <label>
          <span>ジャンル</span>
          <select id="genre-select" ${genres.length === 0 ? "disabled" : ""}>
            ${genres.length === 0 ? `<option>未定義</option>` : genres.map((genre) => `<option value="${genre.id}" ${genre.id === selectedGenreId ? "selected" : ""}>${escapeHtml(genre.name)}</option>`).join("")}
          </select>
        </label>
        <button class="outline" data-action="add-genre">追加</button>
      </div>
      <button class="primary" data-action="record">記録</button>
    </section>

    ${renderMonthSummary("今月", total)}

    <section class="panel">
      ${showIncome ? renderSegment("summary-type", summaryType) : ""}
      <h2>ジャンル別</h2>
      ${renderGenreTotals(genreTotals, `${typeLabel[summaryType]}の記録なし`, "genre-current")}
    </section>
  `;
};

const renderMonth = (yearMonth: string) => {
  const total = getMonthTotal(state.records, yearMonth);
  const genreTotals = getGenreTotals(state.records, state.genres, summaryType, yearMonth);

  return `
    ${renderMonthSummary(formatYearMonth(yearMonth), total)}
    <section class="panel">
      ${showIncome ? renderSegment("summary-type", summaryType) : ""}
      <h2>ジャンル別</h2>
      ${renderGenreTotals(genreTotals, "この月の記録なし", "genre-month")}
    </section>
  `;
};

const renderGenre = (detail: Extract<Screen, { name: "genre" }>) => {
  const genre = state.genres.find((item) => item.id === detail.genreId);
  const records = getRecordsForGenre(state.records, detail.type, detail.genreId, detail.yearMonth);

  return `
    <section class="panel">
      <h2>${formatYearMonth(detail.yearMonth)} / ${typeLabel[detail.type]} / ${escapeHtml(genre?.name ?? "未分類")}</h2>
      ${records.length === 0 ? `<p class="empty">記録なし</p>` : records.map(renderRecordRow).join("")}
    </section>
  `;
};

const renderPast = () => {
  const monthTotals = getMonthTotals(state.records);
  const yearTotals = getYearTotals(state.records);

  return `
    <section class="panel">
      <h2>月別</h2>
      ${monthTotals.length === 0 ? `<p class="empty">まだ記録なし</p>` : monthTotals.map((month) => `
        <button class="list-row" data-action="open-month" data-month="${month.yearMonth}">
          <span>${formatYearMonth(month.yearMonth)}</span>
          ${showIncome
            ? `<strong class="${month.balance < 0 ? "expense" : "income"}">${signedYen(month.balance)}</strong>`
            : `<strong class="expense">${yen(month.expense)}</strong>`}
        </button>
      `).join("")}
    </section>

    <section class="panel">
      <h2>年別</h2>
      ${yearTotals.length === 0 ? `<p class="empty">まだ記録なし</p>` : yearTotals.map((year) => `
        <button class="list-row year-row" data-action="open-year" data-year="${year.year}">
          <span>${year.year}年</span>
          <small>${showIncome ? `収入 ${yen(year.income)} / 支出 ${yen(year.expense)}` : `支出 ${yen(year.expense)}`}</small>
        </button>
      `).join("")}
    </section>

    <section class="panel">
      <h2>バックアップ</h2>
      <div class="backup-row">
        <button class="outline" data-action="export">JSON出力</button>
        <button class="outline" data-action="import">JSON読込</button>
      </div>
    </section>
  `;
};

const renderYear = (year: number) => {
  const visibleAnalysisType = showIncome ? analysisType : "expense";
  const items = getGenreTotals(state.records, state.genres, visibleAnalysisType, undefined, year);
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return `
    <section class="panel">
      <h2>${showIncome ? `${year}年のジャンル割合` : `${year}年の支出割合`}</h2>
      ${showIncome ? renderSegment("analysis-type", analysisType) : ""}
      ${renderPieChart(items)}
    </section>
    <section class="panel">
      <h2>内訳</h2>
      ${items.length === 0 ? `<p class="empty">${typeLabel[visibleAnalysisType]}の記録なし</p>` : items.map((item) => `
        <div class="list-row static">
          <span>${escapeHtml(item.genre.name)}</span>
          <strong>${yen(item.amount)} / ${total ? Math.round(item.amount / total * 1000) / 10 : 0}%</strong>
        </div>
      `).join("")}
    </section>
  `;
};

const renderSegment = (name: string, value: MoneyType) => `
  <div class="segmented" role="tablist" aria-label="${name}">
    ${(["expense", "income"] as const).map((type) => `
      <button
        class="${value === type ? `active ${type}` : ""}"
        data-action="${name}"
        data-type="${type}"
        role="tab"
        aria-selected="${value === type}"
      >${typeLabel[type]}</button>
    `).join("")}
  </div>
`;

const renderTopbarMenu = () => `
  <div class="topbar-menu">
    <button class="menu-button" data-action="menu-toggle" aria-label="メニュー" aria-expanded="${menuOpen}">
      <span></span>
      <span></span>
      <span></span>
    </button>
    ${menuOpen ? `
      <div class="menu-panel">
        <button class="menu-item" data-action="past">過去</button>
        <button class="menu-item" data-action="toggle-income">
          ${showIncome ? "収入OFFにする" : "収入ONにする"}
        </button>
      </div>
    ` : ""}
  </div>
`;

const renderMonthSummary = (title: string, total: ReturnType<typeof getMonthTotal>) => `
  <section class="panel summary-panel">
    <h2>${title}</h2>
    <div class="summary-grid ${showIncome ? "" : "expense-only"}">
      <div><span>支出</span><strong class="expense">${yen(total.expense)}</strong></div>
      ${showIncome ? `
        <div><span>収入</span><strong class="income">${yen(total.income)}</strong></div>
        <div><span>差額</span><strong class="${total.balance < 0 ? "expense" : ""}">${signedYen(total.balance)}</strong></div>
      ` : ""}
    </div>
  </section>
`;

const renderGenreTotals = (items: GenreTotal[], emptyText: string, action: string) => {
  if (items.length === 0) return `<p class="empty">${emptyText}</p>`;

  return items.map((item) => `
    <button class="list-row" data-action="${action}" data-genre="${item.genre.id}">
      <span>${escapeHtml(item.genre.name)}</span>
      <strong class="${item.genre.type === "expense" ? "expense" : "income"}">${yen(item.amount)}</strong>
    </button>
  `).join("");
};

const renderRecordRow = (record: MoneyRecord) => `
  <div class="record-row">
    <div>
      <strong>${escapeHtml(record.title)}</strong>
      <small>自動保存: ${formatRecordDateTime(record.createdAt)}</small>
    </div>
    <span class="${record.type === "expense" ? "expense" : "income"}">${yen(record.amount)}</span>
  </div>
`;

const wireEvents = () => {
  document.querySelectorAll<HTMLElement>("[data-action]").forEach((element) => {
    element.addEventListener("click", () => handleAction(element));
  });

  document.querySelector<HTMLSelectElement>("#genre-select")?.addEventListener("change", (event) => {
    selectedGenreId = (event.currentTarget as HTMLSelectElement).value;
  });
};

const handleAction = (element: HTMLElement) => {
  const action = element.dataset.action;
  if (action === "past") setScreen({ name: "past" });
  if (action === "back") goBack();
  if (action === "add-genre") addGenre();
  if (action === "record") addRecord();
  if (action === "export") exportData();
  if (action === "import") importData();
  if (action === "menu-toggle") {
    menuOpen = !menuOpen;
    render();
  }
  if (action === "toggle-income") setShowIncome(!showIncome);
  if (action === "record-type") setRecordType(readMoneyType(element));
  if (action === "summary-type") setSummaryType(readMoneyType(element));
  if (action === "analysis-type") setAnalysisType(readMoneyType(element));
  if (action === "genre-current") openGenre(getCurrentStamp().yearMonth, summaryType, element.dataset.genre);
  if (action === "genre-month" && screen.name === "month") openGenre(screen.yearMonth, summaryType, element.dataset.genre);
  if (action === "open-month" && element.dataset.month) setScreen({ name: "month", yearMonth: element.dataset.month });
  if (action === "open-year" && element.dataset.year) setScreen({ name: "year", year: Number(element.dataset.year) });
};

const openGenre = (yearMonth: string, type: MoneyType, genreId?: string) => {
  if (!genreId) return;
  setScreen({ name: "genre", yearMonth, type, genreId });
};

const goBack = () => {
  if (screen.name === "genre") {
    const currentMonth = getCurrentStamp().yearMonth;
    setScreen(screen.yearMonth === currentMonth ? { name: "home" } : { name: "month", yearMonth: screen.yearMonth });
    return;
  }
  setScreen({ name: "home" });
};

const currentGenres = () => state.genres.filter((genre) => genre.type === recordType);

function firstGenreId(type: MoneyType) {
  return state.genres.find((genre) => genre.type === type)?.id ?? "";
}

const readMoneyType = (element: HTMLElement): MoneyType => element.dataset.type === "income" ? "income" : "expense";

const screenTitle = (current: Screen) => {
  if (current.name === "past") return "過去";
  if (current.name === "month") return formatYearMonth(current.yearMonth);
  if (current.name === "genre") return "明細";
  if (current.name === "year") return `${current.year}年分析`;
  return "";
};

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const showToast = (message: string) => {
  const toast = document.querySelector<HTMLDivElement>("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  });
}

render();
