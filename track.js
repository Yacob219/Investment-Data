const rows = Array.isArray(window.dashboardTrackData)
  ? window.dashboardTrackData
  : Array.isArray(window.dashboardData)
    ? window.dashboardData
    : [];
const params = new URLSearchParams(window.location.search);
const selectedTrack = params.get("track") || "全栈";
let sortState = {
  key: "latestValuation",
  direction: "desc",
};

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

if (!window.location.hash) {
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  window.addEventListener("pageshow", () => {
    setTimeout(() => window.scrollTo({ top: 0, left: 0 }), 0);
  });
}

const mainTracks = Array.isArray(window.dashboardTracks)
  ? window.dashboardTracks
  : ["全栈", "本体", "场景机器人", "具身大脑", "世界模型", "数据采集", "物理仿真", "机械臂", "灵巧手", "关节模组", "触觉传感器", "视觉感知", "仿生脸"];
const trackExtras = Array.isArray(window.dashboardTrackExtras) ? window.dashboardTrackExtras : [];
const extraByKey = new Map(trackExtras.map(([companyName, mainTrack, mainDirection]) => [
  `${companyName}::${mainTrack}`,
  { mainDirection },
]));

rows.forEach((row) => {
  const extra = extraByKey.get(`${row.companyName}::${getTrack(row)}`);
  if (!extra) return;
  row.mainDirection = row.mainDirection || extra.mainDirection;
});

function formatValue(value, suffix = "") {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "未披露";
  const rounded = Number(number.toFixed(1));
  return `${rounded.toLocaleString("zh-CN")}${suffix}`;
}

function display(value) {
  return value === null || value === undefined || value === "" ? "未披露" : value;
}

function displayAmountRange(label, value) {
  if (!value || value === "未知") return "未披露";
  return `${label}：${value}`;
}

function displayAmount(row, numericKey, displayKey, suffix = " 亿") {
  if (row[displayKey]) return row[displayKey];
  return formatValue(row[numericKey], suffix);
}

function displayStatAmount(row, numericKey, displayKey) {
  if (!row) return "未披露";
  const value = displayAmount(row, numericKey, displayKey, " 亿")
    .replace(/^估值量级：\s*/u, "")
    .replace(/^累计量级：\s*/u, "");
  return `${value}${row.companyName ? ` · ${row.companyName}` : ""}`;
}

function numericValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function rangeValue(value) {
  if (!value || value === "未知") return null;
  const numbers = String(value)
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((number) => Number.isFinite(number));

  if (!numbers?.length) return null;
  if (numbers.length === 1) return numbers[0];
  return (Math.min(...numbers) + Math.max(...numbers)) / 2;
}

function sortableValue(row, key) {
  if (key === "cumulativeFunding") {
    return numericValue(row.cumulativeFunding) ?? rangeValue(row.cumulativeFundingRange);
  }
  return numericValue(row[key]);
}

function compareNames(a, b) {
  return String(a.companyName || "").localeCompare(String(b.companyName || ""), "zh-CN", {
    numeric: true,
    sensitivity: "base",
  });
}

function compareRows(a, b) {
  const primaryA = sortableValue(a, sortState.key);
  const primaryB = sortableValue(b, sortState.key);
  const missingA = primaryA === null;
  const missingB = primaryB === null;

  if (missingA !== missingB) return missingA ? 1 : -1;

  if (!missingA && primaryA !== primaryB) {
    return sortState.direction === "asc" ? primaryA - primaryB : primaryB - primaryA;
  }

  const valuationA = sortableValue(a, "latestValuation");
  const valuationB = sortableValue(b, "latestValuation");
  const valuationMissingA = valuationA === null;
  const valuationMissingB = valuationB === null;

  if (valuationMissingA !== valuationMissingB) return valuationMissingA ? 1 : -1;
  if (!valuationMissingA && valuationA !== valuationB) return valuationB - valuationA;

  return compareNames(a, b);
}

function getTrack(item) {
  return item.mainTrack || item.companyCategory || item["主赛道"] || item["公司分类"] || "未知";
}

function groupCount(items, field) {
  return items.reduce((groups, item) => {
    const key = typeof field === "function" ? field(item) : item[field] || "未知";
    groups.set(key, (groups.get(key) || 0) + 1);
    return groups;
  }, new Map());
}

function setupTrackNav() {
  const list = document.getElementById("sideTrackList");
  const counts = groupCount(rows, getTrack);
  if (!list) return;

  list.innerHTML = mainTracks
    .map((track) => {
      const count = counts.get(track) || 0;
      const activeClass = track === selectedTrack ? " is-active" : "";
      return `
        <a class="${activeClass}" href="track.html?track=${encodeURIComponent(track)}" title="${track}" aria-label="${track}">
          <span class="rail-icon" aria-hidden="true"></span>
          <span class="rail-label">${track}</span>
          <b>${count}</b>
        </a>
      `;
    })
    .join("");
}

function getRegion(row) {
  const region = [row.region || row.country || row["国家"], row.city || row["城市"]].filter(Boolean).join(" / ");
  return region || display(row.area || row["地区"]);
}

function getMaxRow(items, key) {
  return items.reduce((best, row) => {
    const value = sortableValue(row, key);
    if (value === null) return best;
    if (!best || value > best.value) return { row, value };
    if (value === best.value && compareNames(row, best.row) < 0) return { row, value };
    return best;
  }, null);
}

function renderTrackStats(trackRows) {
  const stats = document.getElementById("trackStats");
  const cards = document.getElementById("trackStatCards");
  if (!stats || !cards) return;

  const maxValuation = getMaxRow(trackRows, "latestValuation");
  const maxLatestRound = getMaxRow(trackRows, "latestRoundAmount");
  const maxCumulativeFunding = getMaxRow(trackRows, "cumulativeFunding");
  const hasMetric = Boolean(maxValuation || maxLatestRound || maxCumulativeFunding);

  stats.hidden = !hasMetric;
  if (!hasMetric) {
    cards.innerHTML = "";
    return;
  }

  const items = [
    ["统计公司数", `${trackRows.length} 家`],
    ["最高估值", displayStatAmount(maxValuation?.row, "latestValuation", "latestValuationDisplay")],
    ["最高最新轮融资", displayStatAmount(maxLatestRound?.row, "latestRoundAmount", "latestRoundAmountDisplay")],
    ["最高累计融资", displayStatAmount(maxCumulativeFunding?.row, "cumulativeFunding", "cumulativeFundingDisplay")],
  ];

  cards.innerHTML = items
    .map(([label, value]) => `
      <article class="track-stat-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `)
    .join("");
}

function render() {
  const trackRows = rows
    .filter((row) => getTrack(row) === selectedTrack)
    .sort(compareRows);

  document.getElementById("trackTitle").textContent = selectedTrack;
  document.getElementById("trackSubtitle").textContent =
    "累计融资额综合公开披露与可估算信息；由于许多公司未完整披露金额，页面展示为便于横向比较的估计量级。";
  document.getElementById("tableTitle").textContent = `${selectedTrack}公司`;
  document.getElementById("emptyState").hidden = trackRows.length > 0;
  renderTrackStats(trackRows);

  const tbody = document.getElementById("companyRows");
  tbody.innerHTML = trackRows
    .map((row, index) => `
      <tr>
        <td><span class="company-name cell-text">${display(row.companyName)}</span></td>
        <td><span class="cell-text">${getRegion(row)}</span></td>
        <td><span class="cell-text">${display(row.foundedYear || row["成立年份"])}</span></td>
        <td><span class="cell-text">${display(row.mainDirection || row["主营方向"])}</span></td>
        <td><span class="cell-text">${display(row.latestRound || row["最新融资轮次"])}</span></td>
        <td><span class="cell-text">${displayAmount(row, "latestValuation", "latestValuationDisplay", " 亿")}</span></td>
        <td><span class="cell-text">${row.cumulativeFundingDisplay || (row.cumulativeFunding > 0 ? formatValue(row.cumulativeFunding, " 亿") : displayAmountRange("累计量级", row.cumulativeFundingRange))}</span></td>
        <td><span class="cell-text">${displayAmount(row, "latestRoundAmount", "latestRoundAmountDisplay", " 亿")}</span></td>
      </tr>
    `)
    .join("");

  updateSortButtons();
}

function updateSortButtons() {
  document.querySelectorAll(".sort-button").forEach((button) => {
    const isActive = button.dataset.sort === sortState.key;
    const direction = isActive ? sortState.direction : "none";
    const icon = isActive ? (sortState.direction === "asc" ? "↑" : "↓") : "↕";

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-sort", direction === "none" ? "none" : direction === "asc" ? "ascending" : "descending");
    button.querySelector("span").textContent = icon;
  });
}

function setupSorting() {
  document.querySelectorAll(".sort-button").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.sort;
      if (sortState.key === key) {
        sortState.direction = sortState.direction === "desc" ? "asc" : "desc";
      } else {
        sortState = { key, direction: "desc" };
      }
      render();
    });
  });
  updateSortButtons();
}

setupTrackNav();
setupSorting();
render();
