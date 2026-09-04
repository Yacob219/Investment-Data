const portfolioSeries = {
  30: [116200, 117450, 116980, 118300, 119250, 118900, 120100, 121450, 120980, 122700, 123250, 122840, 124300, 125120, 124870, 126200, 127050, 126760, 127420, 128430],
  90: [103400, 105200, 104850, 107600, 109300, 111200, 110900, 113700, 115800, 118600, 121000, 119800, 122300, 124900, 128430],
  180: [91200, 94800, 97100, 100300, 98500, 102400, 106900, 110200, 108750, 113300, 117900, 121500, 119900, 124600, 128430],
};

const allocations = [
  { name: "股票", value: 68400, share: 53, color: "#356dff" },
  { name: "ETF", value: 28300, share: 22, color: "#00a3b5" },
  { name: "债券", value: 19130, share: 15, color: "#d99a18" },
  { name: "现金", value: 12600, share: 10, color: "#168a5b" },
];

const sectors = [
  { name: "科技", share: 34, color: "#356dff" },
  { name: "金融", share: 18, color: "#00a3b5" },
  { name: "医疗", share: 15, color: "#168a5b" },
  { name: "消费", share: 13, color: "#d99a18" },
  { name: "能源", share: 8, color: "#c74646" },
];

const trades = [
  ["2026-09-03", "AAPL", "买入", "$8,200", "已完成"],
  ["2026-09-01", "VOO", "买入", "$5,000", "已完成"],
  ["2026-08-28", "TSLA", "卖出", "$3,450", "已完成"],
  ["2026-08-25", "MSFT", "买入", "$6,700", "已完成"],
  ["2026-08-21", "BND", "买入", "$4,000", "已完成"],
];

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function drawTrend(range = "30") {
  const canvas = document.getElementById("trendChart");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = 260;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const data = portfolioSeries[range];
  const padding = { top: 18, right: 18, bottom: 34, left: 58 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const min = Math.min(...data) * 0.985;
  const max = Math.max(...data) * 1.01;

  ctx.strokeStyle = "#dfe5ee";
  ctx.lineWidth = 1;
  ctx.font = "12px Inter, Arial";
  ctx.fillStyle = "#6a7282";

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    const labelValue = max - ((max - min) / 4) * i;
    ctx.fillText(formatMoney(labelValue), 6, y + 4);
  }

  const points = data.map((value, index) => ({
    x: padding.left + (chartWidth / (data.length - 1)) * index,
    y: padding.top + chartHeight - ((value - min) / (max - min)) * chartHeight,
  }));

  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  gradient.addColorStop(0, "rgba(53, 109, 255, 0.24)");
  gradient.addColorStop(1, "rgba(53, 109, 255, 0)");

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.lineTo(points.at(-1).x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = "#356dff";
  ctx.lineWidth = 3;
  ctx.stroke();

  points.forEach((point, index) => {
    if (index === 0 || index === points.length - 1) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#356dff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  const latest = data.at(-1);
  const previous = data.at(-2);
  document.getElementById("totalValue").textContent = formatMoney(latest);
  document.getElementById("dailyGain").textContent = formatMoney(latest - previous);
  document.getElementById("rangeLabel").textContent = `最近${range}天`;
}

function renderAllocations() {
  document.getElementById("allocationList").innerHTML = allocations
    .map(
      (item) => `
        <div class="allocation-item">
          <span class="dot" style="background:${item.color}"></span>
          <div>
            <div class="allocation-name">${item.name}</div>
            <div class="allocation-value">${formatMoney(item.value)}</div>
          </div>
          <strong>${item.share}%</strong>
        </div>
      `
    )
    .join("");
}

function renderSectors() {
  document.getElementById("sectorList").innerHTML = sectors
    .map(
      (item) => `
        <div>
          <div class="bar-top">
            <span>${item.name}</span>
            <span>${item.share}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${item.share}%; background:${item.color}"></div>
          </div>
        </div>
      `
    )
    .join("");
}

function renderTrades() {
  document.getElementById("tradeRows").innerHTML = trades
    .map(([date, ticker, side, amount, status]) => {
      const sideClass = side === "卖出" ? "sell" : "";
      return `
        <tr>
          <td>${date}</td>
          <td><strong>${ticker}</strong></td>
          <td class="${sideClass}">${side}</td>
          <td>${amount}</td>
          <td><span class="badge">${status}</span></td>
        </tr>
      `;
    })
    .join("");
}

document.querySelectorAll(".range-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".range-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    drawTrend(button.dataset.range);
  });
});

window.addEventListener("resize", () => {
  const activeRange = document.querySelector(".range-button.active").dataset.range;
  drawTrend(activeRange);
});

renderAllocations();
renderSectors();
renderTrades();
drawTrend("30");
