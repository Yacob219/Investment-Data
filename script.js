const blue = "#25b7ff";
const gridColor = "rgba(179, 195, 219, 0.14)";
const textColor = "#aeb8c7";

const charts = [
  {
    id: "valuationCountChart",
    type: "vertical",
    max: 20,
    labels: ["20亿以下", "20-50亿", "50-100亿", "100-150亿", "150-200亿", "200-250亿", "400-450亿"],
    values: [16, 13, 15, 7, 5, 9, 1],
  },
  {
    id: "fundingRangeChart",
    type: "vertical",
    max: 30,
    labels: ["少于10亿", "10-20亿", "20-30亿", "30-40亿", "40-50亿", "50-60亿", "60-70亿", "70-80亿", "未知"],
    values: [25, 17, 10, 4, 2, 3, 3, 1, 1],
  },
  {
    id: "categoryFundingChart",
    type: "vertical",
    max: 40,
    labels: ["全栈", "物理仿真", "世界模型", "灵巧手", "具身大脑", "触觉传感器", "数据采集", "机械臂", "本体"],
    values: [35.2, 15.3, 13.7, 13.7, 13.3, 13.2, 8.6, 7.9, 6.8],
  },
  {
    id: "categoryValuationChart",
    type: "vertical",
    max: 500,
    labels: ["全栈", "物理仿真", "具身大脑", "灵巧手", "触觉传感器", "世界模型", "本体", "机械臂", "数据采集"],
    values: [430, 132.3, 76, 67.5, 61.2, 60, 57, 39.1, 29],
  },
  {
    id: "latestRoundChart",
    type: "horizontal",
    max: 450,
    labels: ["鹏行智能", "银河通用", "它石智航", "银河通用", "原力灵机", "星海图", "自变量机器人", "强脑科技", "卜拉格", "智象未来", "乐聚", "灵心巧手", "千寻智能", "逐际动力", "大晓机器人", "无界动力", "灵初智能", "光轮智能", "极佳视界", "星动纪元"],
    values: [430, 210, 200, 200, 200, 200, 200, 120, 100, 100, 63, 50, 31, 25, 20, 20, 20, 15.7, 15, 15],
  },
  {
    id: "fullStackChart",
    type: "horizontal",
    max: 220,
    labels: ["银河通用", "原力灵机", "极佳视界", "星动纪元", "星海图", "千寻智能", "自变量机器人", "智平方", "它石智航", "逐际动力", "智元机器人", "星尘智能", "墨奇", "思灵", "萝博派对", "乐聚", "魔法原子"],
    values: [210, 200, 200, 200, 200, 200, 200, 200, 180, 150, 150, 100, 70, 69, 50, 43.3, 35],
  },
];

const tooltip = document.createElement("div");
tooltip.className = "chart-tooltip";
document.body.appendChild(tooltip);

const hitAreas = new Map();

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const height = Number(canvas.getAttribute("height"));
  canvas.width = rect.width * dpr;
  canvas.height = height * dpr;
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
  drawGrid(ctx, left, top, chartWidth, chartHeight, config.max);

  const gap = Math.max(16, chartWidth / config.values.length * 0.36);
  const barWidth = Math.max(18, (chartWidth - gap * (config.values.length - 1)) / config.values.length);

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
    ctx.fillText(value, x + barWidth / 2, y + (barHeight > 34 ? 22 : -8));

    ctx.fillStyle = textColor;
    ctx.font = "14px Inter, Arial";
    const label = config.labels[index];
    ctx.save();
    if (config.labels.length > 8) {
      ctx.translate(x + barWidth / 2, top + chartHeight + 38);
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
  const right = 24;
  const top = 18;
  const bottom = 30;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const rowHeight = chartHeight / config.values.length;

  ctx.clearRect(0, 0, width, height);
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
    const barWidth = (value / config.max) * chartWidth;

    ctx.fillStyle = textColor;
    ctx.textAlign = "right";
    ctx.font = "13px Inter, Arial";
    ctx.fillText(config.labels[index], left - 12, y + barHeight);

    roundedRect(ctx, left, y, barWidth, barHeight, 4);
    ctx.fillStyle = blue;
    ctx.fill();

    ctx.fillStyle = blue;
    ctx.textAlign = "left";
    ctx.fillText(value.toFixed(1), left + barWidth + 8, y + barHeight + 2);
    areas.push({ x: left, y, w: barWidth, h: barHeight, label: config.labels[index], value });
  });

  hitAreas.set(config.id, areas);
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

      tooltip.innerHTML = `${area.label}<br><span>数值</span><br><b>${area.value}</b>`;
      tooltip.style.left = `${event.clientX + 18}px`;
      tooltip.style.top = `${event.clientY - 28}px`;
      tooltip.style.display = "block";
    });

    canvas.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });
}

drawAll();
attachTooltips();
window.addEventListener("resize", drawAll);
