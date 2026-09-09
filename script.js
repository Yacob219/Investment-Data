const blue = "#25b7ff";
const gridColor = "rgba(42, 55, 78, 0.09)";
const textColor = "#8b909a";
const rows = Array.isArray(window.dashboardHomeData)
  ? window.dashboardHomeData
  : Array.isArray(window.dashboardData)
    ? window.dashboardData
    : [];
const navRows = Array.isArray(window.dashboardTrackData) ? window.dashboardTrackData : rows;
const ipoRows = Array.isArray(window.dashboardIpoData) ? window.dashboardIpoData : [];
const ipoStages = Array.isArray(window.dashboardIpoStages)
  ? window.dashboardIpoStages
  : ["拟IPO筹备", "辅导备案/已递表", "正式受理排队", "近期已上市"];
const ipoCategories = Array.isArray(window.dashboardIpoCategories)
  ? window.dashboardIpoCategories
  : ["四足", "人形", "通用全栈", "产业链上下游"];
const ipoColors = {
  四足: "#49aa72",
  人形: "#2d7898",
  通用全栈: "#d88326",
  产业链上下游: "#3c83d8",
};
const ipoGridColumns = "160px repeat(3, minmax(260px, 1fr)) minmax(150px, 0.42fr)";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

if (!window.location.hash) {
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
  window.addEventListener("pageshow", () => {
    setTimeout(() => window.scrollTo({ top: 0, left: 0 }), 0);
  });
}

const tooltip = document.createElement("div");
tooltip.className = "chart-tooltip";
document.body.appendChild(tooltip);

const hitAreas = new Map();
const mainTracks = Array.isArray(window.dashboardTracks)
  ? window.dashboardTracks
  : ["全栈", "本体", "场景机器人", "具身大脑", "世界模型", "数据采集", "物理仿真", "机械臂", "灵巧手", "关节模组", "触觉传感器", "视觉感知", "仿生脸"];

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return "未披露";
  const rounded = Number(value.toFixed(digits));
  return rounded.toLocaleString("zh-CN");
}

function displayMetric(value, unit = "亿元") {
  if (value === null || value === undefined || value === "" || value === "未披露") return "未披露";
  if (typeof value === "number") return `${formatNumber(value, 1)} ${unit}`;
  return `${value} ${unit}`;
}

function sumBy(items, field) {
  return items.reduce((total, item) => total + (Number(item[field]) || 0), 0);
}

function getTrack(item) {
  return item.mainTrack || item.companyCategory || item["主赛道"] || item["公司分类"] || "未知";
}

function averageBy(items, field) {
  const values = items.map((item) => Number(item[field])).filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function groupCount(items, field) {
  return items.reduce((groups, item) => {
    const key = typeof field === "function" ? field(item) : item[field] || "未知";
    groups.set(key, (groups.get(key) || 0) + 1);
    return groups;
  }, new Map());
}

function groupAverage(items, groupField, valueField) {
  const groups = new Map();
  items.forEach((item) => {
    const value = Number(item[valueField]);
    if (!Number.isFinite(value) || value <= 0) return;
    const key = typeof groupField === "function" ? groupField(item) : item[groupField] || "未知";
    const current = groups.get(key) || { total: 0, count: 0 };
    current.total += value;
    current.count += 1;
    groups.set(key, current);
  });

  return Array.from(groups, ([label, stats]) => ({
    label,
    value: stats.total / stats.count,
  })).sort((a, b) => b.value - a.value);
}

function rangeStart(label) {
  if (label === "未知") return Number.MAX_SAFE_INTEGER;
  const match = String(label).match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER - 1;
}

function toChartSeries(items, maxItems = Infinity) {
  const limited = items.slice(0, maxItems);
  return {
    labels: limited.map((item) => item.label),
    values: limited.map((item) => Number(item.value.toFixed(1))),
  };
}

function makeCountSeries(field) {
  return toChartSeries(
    Array.from(groupCount(rows, field), ([label, value]) => ({ label, value }))
      .sort((a, b) => rangeStart(a.label) - rangeStart(b.label)),
  );
}

function makeTopSeries(field, categoryFilter, limit = 20) {
  return toChartSeries(
    rows
      .filter((item) => !categoryFilter || getTrack(item) === categoryFilter)
      .map((item) => ({
        label: item.companyName,
        value: Number(item[field]) || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value),
    limit,
  );
}

function niceMax(values) {
  const max = Math.max(...values, 1);
  if (max <= 10) return Math.ceil(max / 2) * 2;
  if (max <= 100) return Math.ceil(max / 10) * 10;
  return Math.ceil(max / 50) * 50;
}

function buildCharts() {
  const rankingSeries = (id) => toChartSeries(
    window.dashboardRankingDetails[id]
      .map((item) => ({ label: item.company, value: item.value }))
      .sort((a, b) => b.value - a.value),
  );
  const valuationCount = makeCountSeries("valuationRange");
  const fundingRange = makeCountSeries("cumulativeFundingRange");
  const categoryFunding = toChartSeries(groupAverage(rows, getTrack, "cumulativeFunding"));
  const categoryValuation = toChartSeries(groupAverage(rows, getTrack, "latestValuation"));
  const latestRound = rankingSeries("latestRoundChart");
  const valuationTop = rankingSeries("valuationTopChart");
  const fundingTop = rankingSeries("fundingTopChart");
  const fullStack = rankingSeries("fullStackChart");

  return [
    {
      id: "valuationCountChart",
      type: "vertical",
      max: niceMax(valuationCount.values),
      ...valuationCount,
    },
    {
      id: "fundingRangeChart",
      type: "vertical",
      max: niceMax(fundingRange.values),
      ...fundingRange,
    },
    {
      id: "categoryFundingChart",
      type: "vertical",
      max: niceMax(categoryFunding.values),
      ...categoryFunding,
    },
    {
      id: "latestRoundChart",
      type: "horizontal",
      max: niceMax(latestRound.values),
      ...latestRound,
    },
    {
      id: "categoryValuationChart",
      type: "vertical",
      max: niceMax(categoryValuation.values),
      ...categoryValuation,
    },
    {
      id: "valuationTopChart",
      type: "horizontal",
      max: niceMax(valuationTop.values),
      ...valuationTop,
    },
    {
      id: "fundingTopChart",
      type: "horizontal",
      max: niceMax(fundingTop.values),
      ...fundingTop,
    },
    {
      id: "fullStackChart",
      type: "horizontal",
      max: niceMax(fullStack.values),
      ...fullStack,
    },
  ];
}

const charts = buildCharts();

function updateKpis() {
  const totalFunding = sumBy(rows, "cumulativeFunding");
  const averageFunding = averageBy(rows, "cumulativeFunding");
  const averageValuation = averageBy(rows, "latestValuation");

  document.getElementById("totalFunding").textContent = formatNumber(totalFunding, 0);
  document.getElementById("totalFundingSub").textContent = "亿元 RMB 累计融资";
  document.getElementById("companyCount").textContent = rows.length.toLocaleString("zh-CN");
  document.getElementById("averageValuation").textContent = formatNumber(averageValuation, 1);
  document.getElementById("averageFunding").textContent = formatNumber(averageFunding, 1);
  document.getElementById("trackCount").textContent = mainTracks.filter((track) => track !== "IPO").length.toLocaleString("zh-CN");

}

function setupTrackNav() {
  const list = document.getElementById("sideTrackList");
  const counts = groupCount(navRows, getTrack);
  if (!list) return;

  list.innerHTML = mainTracks
    .map((track) => {
      const count = counts.get(track) || 0;
      return `
        <a href="track.html?track=${encodeURIComponent(track)}" title="${track}" aria-label="${track}">
          <span class="rail-icon" aria-hidden="true"></span>
          <span class="rail-label">${track}</span>
          <b>${count}</b>
        </a>
      `;
    })
    .join("");
}

function setupIpoChart() {
  const chart = document.getElementById("ipoChart");
  const legend = document.getElementById("ipoLegend");
  const popover = document.getElementById("ipoPopover");
  if (!chart || !legend || !popover || !ipoRows.length) return;

  const categoryCounts = groupCount(ipoRows, "category");
  const stageCounts = groupCount(ipoRows, "stage");

  legend.innerHTML = ipoCategories
    .map((category) => `
      <span class="ipo-legend-item">
        <i style="background:${ipoColors[category] || blue}"></i>
        ${category}（${categoryCounts.get(category) || 0}家）
      </span>
    `)
    .join("");

  chart.innerHTML = `
    <div class="ipo-stage-head" style="grid-template-columns: ${ipoGridColumns};">
      <span></span>
      ${ipoStages.map((stage) => `<b>${stage} · ${stageCounts.get(stage) || 0} 家</b>`).join("")}
    </div>
    <div class="ipo-grid" style="grid-template-columns: ${ipoGridColumns};">
      ${ipoCategories.map((category) => makeIpoRow(category)).join("")}
    </div>
  `;

  chart.querySelectorAll(".ipo-company").forEach((button) => {
    button.addEventListener("click", (event) => {
      const item = ipoRows.find((row) => String(row.id) === button.dataset.id);
      if (!item) return;
      showIpoPopover(item, event.currentTarget, popover);
    });
  });

  document.addEventListener("click", (event) => {
    if (popover.hidden) return;
    if (popover.contains(event.target) || event.target.closest(".ipo-company")) return;
    popover.hidden = true;
  });
}

function makeIpoRow(category) {
  const items = ipoRows.filter((item) => item.category === category);
  const cells = ipoStages.map((stage) => {
    const stageItems = items.filter((item) => item.stage === stage);
    return `
      <div class="ipo-cell">
        ${stageItems.map((item, index) => makeIpoPoint(item, index, stageItems.length)).join("")}
      </div>
    `;
  }).join("");

  return `
    <div class="ipo-category">
      <strong style="color:${ipoColors[category] || blue}">${category}</strong>
      <span>${items.length} 家</span>
    </div>
    ${cells}
  `;
}

function makeIpoPoint(item, index, total) {
  const color = ipoColors[item.category] || blue;
  const isListed = item.stage === ipoStages[ipoStages.length - 1];
  const offset = isListed ? 50 : total <= 1 ? 50 : 12 + (index * 76) / (total - 1);
  const isAbove = index % 2 === 0;
  return `
    <button class="ipo-company ${isAbove ? "is-above" : "is-below"} ${isListed ? "is-listed" : ""}" type="button" data-id="${item.id}" style="left:${offset}%; --ipo-color:${color}">
      <span></span>
      <b>${item.company}</b>
      <small>${item.board}</small>
    </button>
  `;
}

function showIpoPopover(item, anchor, popover) {
  const rect = anchor.getBoundingClientRect();
  popover.innerHTML = `
    <div class="ipo-popover-head">
      <span>${item.category} · ${item.stage}</span>
      <strong>${item.company}</strong>
    </div>
    <dl>
      <div><dt>拟上市/挂牌板块</dt><dd>${item.board || "未披露"}</dd></div>
      <div><dt>核心业务</dt><dd>${item.business || "未披露"}</dd></div>
      <div><dt>上市前累计融资额</dt><dd>${displayMetric(item.preIpoFunding)}</dd></div>
      <div><dt>一级市场估值</dt><dd>${displayMetric(item.primaryValuation)}</dd></div>
    </dl>
  `;
  popover.hidden = false;

  const width = Math.min(360, window.innerWidth - 28);
  popover.style.width = `${width}px`;
  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(14, Math.min(left, window.innerWidth - width - 14));
  const top = rect.bottom + 14 > window.innerHeight - 260 ? rect.top - 250 : rect.bottom + 14;
  popover.style.left = `${left}px`;
  popover.style.top = `${Math.max(14, top)}px`;
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const fallbackHeight = Number(canvas.getAttribute("height")) || 340;
  const height = Math.round(rect.height || fallbackHeight);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height };
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawGrid(ctx, left, top, width, height, max, steps = 4) {
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.lineWidth = 1;
  ctx.font = "14px Inter, Arial";
  ctx.textAlign = "left";

  for (let i = 0; i <= steps; i++) {
    const y = top + (height / steps) * i;
    const value = max - (max / steps) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + width, y);
    ctx.stroke();
    ctx.fillText(value.toFixed(max > 100 ? 0 : 1).replace(".0", ""), 8, y + 5);
  }
}

function drawNoData(ctx, width, height) {
  ctx.fillStyle = textColor;
  ctx.font = "15px Inter, Arial";
  ctx.textAlign = "center";
  ctx.fillText("暂无可展示数据", width / 2, height / 2);
}

function drawVerticalChart(config) {
  const canvas = document.getElementById(config.id);
  const { ctx, width, height } = setupCanvas(canvas);
  const areas = [];
  const left = 64;
  const right = 22;
  const top = 22;
  const bottom = 58;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  ctx.clearRect(0, 0, width, height);
  if (!config.values.length) {
    drawNoData(ctx, width, height);
    hitAreas.set(config.id, areas);
    return;
  }

  drawGrid(ctx, left, top, chartWidth, chartHeight, config.max);

  const gap = Math.max(12, (chartWidth / config.values.length) * 0.32);
  const barWidth = Math.max(16, (chartWidth - gap * (config.values.length - 1)) / config.values.length);

  config.values.forEach((value, index) => {
    const x = left + index * (barWidth + gap);
    const barHeight = Math.max(8, (value / config.max) * chartHeight);
    const y = top + chartHeight - barHeight;
    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
    gradient.addColorStop(0, "#2fc0ff");
    gradient.addColorStop(1, "#22a9ed");

    roundedRect(ctx, x, y, barWidth, barHeight, 7);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = barHeight > 34 ? "#102032" : blue;
    ctx.font = "15px Inter, Arial";
    ctx.fillText(formatNumber(value, 1), x + barWidth / 2, y + (barHeight > 34 ? 22 : -8));

    ctx.fillStyle = textColor;
    ctx.font = "14px Inter, Arial";
    const label = config.labels[index];
    ctx.save();
    if (config.labels.length > 8 || label.length > 5) {
      ctx.translate(x + barWidth / 2, top + chartHeight + 40);
      ctx.rotate(-Math.PI / 7);
      ctx.fillText(label, 0, 0);
    } else {
      ctx.fillText(label, x + barWidth / 2, top + chartHeight + 34);
    }
    ctx.restore();

    areas.push({ x, y, w: barWidth, h: barHeight, label, value });
  });

  hitAreas.set(config.id, areas);
}

function drawHorizontalChart(config) {
  const canvas = document.getElementById(config.id);
  const { ctx, width, height } = setupCanvas(canvas);
  const areas = [];
  const left = 116;
  const right = 54;
  const top = 18;
  const bottom = 30;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  ctx.clearRect(0, 0, width, height);
  if (!config.values.length) {
    drawNoData(ctx, width, height);
    hitAreas.set(config.id, areas);
    return;
  }

  const rowHeight = chartHeight / config.values.length;
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.font = "13px Inter, Arial";

  for (let i = 0; i <= 4; i++) {
    const x = left + (chartWidth / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + chartHeight);
    ctx.stroke();
    ctx.fillText(((config.max / 4) * i).toFixed(1), x - 8, height - 6);
  }

  config.values.forEach((value, index) => {
    const y = top + index * rowHeight + rowHeight * 0.24;
    const barHeight = Math.max(7, rowHeight * 0.42);
    const barWidth = Math.max(7, (value / config.max) * chartWidth);

    ctx.fillStyle = textColor;
    ctx.textAlign = "right";
    ctx.font = "13px Inter, Arial";
    ctx.fillText(config.labels[index], left - 12, y + barHeight);

    roundedRect(ctx, left, y, barWidth, barHeight, 4);
    ctx.fillStyle = blue;
    ctx.fill();

    ctx.fillStyle = blue;
    ctx.textAlign = "left";
    ctx.fillText(formatNumber(value, 1), left + barWidth + 8, y + barHeight + 2);
    areas.push({ x: left, y, w: barWidth, h: barHeight, label: config.labels[index], value });
  });

  hitAreas.set(config.id, areas);
  window.renderRankingButtons(config, canvas, { top, rowHeight, height });
}

function drawAll() {
  charts.forEach((chart) => {
    if (chart.type === "horizontal") drawHorizontalChart(chart);
    else drawVerticalChart(chart);
  });
}

function attachTooltips() {
  charts.forEach((chart) => {
    const canvas = document.getElementById(chart.id);
    canvas.addEventListener("mousemove", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const area = (hitAreas.get(chart.id) || []).find((item) => {
        return x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h;
      });

      if (!area) {
        tooltip.style.display = "none";
        return;
      }

      tooltip.innerHTML = `${area.label}<br><span>数值</span><br><b>${formatNumber(area.value, 1)}</b>`;
      tooltip.style.left = `${event.clientX + 18}px`;
      tooltip.style.top = `${event.clientY - 28}px`;
      tooltip.style.display = "block";
    });

    canvas.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });
}

updateKpis();
setupTrackNav();
setupIpoChart();
drawAll();
attachTooltips();
window.addEventListener("resize", drawAll);
