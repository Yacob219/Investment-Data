const STORAGE_KEY = "investment-dashboard-draft";
const baseRows = Array.isArray(window.dashboardData) ? window.dashboardData : [];
let rows = loadDraft();

const columns = [
  { key: "companyName", label: "公司名称", type: "text" },
  { key: "companyCategory", label: "公司分类", type: "text" },
  { key: "latestRoundAmount", label: "最新轮金额", type: "number" },
  { key: "cumulativeFunding", label: "累计融资额", type: "number" },
  { key: "latestValuation", label: "最新估值", type: "number" },
  { key: "valuationRange", label: "估值区间", type: "text" },
  { key: "cumulativeFundingRange", label: "累计融资区间", type: "text" },
];

const tbody = document.getElementById("editorRows");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const statusText = document.getElementById("statusText");

function loadDraft() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(baseRows);
  } catch {
    return structuredClone(baseRows);
  }
}

function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function setStatus(message) {
  statusText.textContent = message;
}

function filteredRows() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  return rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => {
      const matchesCategory = !category || row.companyCategory === category;
      const haystack = Object.values(row).join(" ").toLowerCase();
      const matchesKeyword = !keyword || haystack.includes(keyword);
      return matchesCategory && matchesKeyword;
    });
}

function renderCategoryFilter() {
  const categories = Array.from(new Set(rows.map((row) => row.companyCategory).filter(Boolean))).sort();
  const current = categoryFilter.value;
  categoryFilter.innerHTML = `<option value="">全部分类</option>${categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("")}`;
  categoryFilter.value = categories.includes(current) ? current : "";
}

function renderTable() {
  const visibleRows = filteredRows();
  tbody.innerHTML = visibleRows
    .map(({ row, index }) => {
      const cells = columns.map((column) => {
        const value = row[column.key] ?? "";
        const inputType = column.type === "number" ? "number" : "text";
        const extra = column.type === "number" ? " step=\"0.01\"" : "";
        const cellClass = column.type === "number" ? "number-cell" : "text-cell";
        return `<td class="${cellClass}"><input class="editor-table-input" data-index="${index}" data-key="${column.key}" type="${inputType}"${extra} value="${escapeHtml(String(value))}" /></td>`;
      });

      return `<tr>${cells.join("")}<td><button class="delete-button" data-delete="${index}" type="button">删除</button></td></tr>`;
    })
    .join("");

  setStatus(`当前显示 ${visibleRows.length} 条，共 ${rows.length} 条`);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function saveDraft() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  setStatus("草稿已保存在当前浏览器");
}

function addRow() {
  rows.unshift({
    companyName: "新公司",
    companyCategory: "全栈",
    latestRoundAmount: null,
    cumulativeFunding: null,
    latestValuation: null,
    valuationRange: "未知",
    cumulativeFundingRange: "未知",
  });
  renderCategoryFilter();
  renderTable();
  saveDraft();
}

function deleteRow(index) {
  rows.splice(index, 1);
  renderCategoryFilter();
  renderTable();
  saveDraft();
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function exportJs() {
  const content = `window.dashboardData = ${JSON.stringify(rows, null, 2)};\n`;
  downloadFile("data.js", content, "text/javascript;charset=utf-8");
  setStatus("已导出 data.js");
}

function exportCsv() {
  const header = columns.map((column) => column.label);
  const body = rows.map((row) => columns.map((column) => csvCell(row[column.key])));
  const content = [header, ...body].map((line) => line.join(",")).join("\n");
  downloadFile("investment-dashboard-data.csv", `\ufeff${content}`, "text/csv;charset=utf-8");
  setStatus("已导出 CSV");
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

tbody.addEventListener("input", (event) => {
  const input = event.target.closest("[data-index][data-key]");
  if (!input) return;
  const index = Number(input.dataset.index);
  const key = input.dataset.key;
  const column = columns.find((item) => item.key === key);
  rows[index][key] = column.type === "number" ? normalizeNumber(input.value) : input.value.trim();
  setStatus("有未导出的修改");
});

tbody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  deleteRow(Number(button.dataset.delete));
});

searchInput.addEventListener("input", renderTable);
categoryFilter.addEventListener("change", renderTable);
document.getElementById("addRow").addEventListener("click", addRow);
document.getElementById("saveDraft").addEventListener("click", saveDraft);
document.getElementById("exportJs").addEventListener("click", exportJs);
document.getElementById("exportCsv").addEventListener("click", exportCsv);
document.getElementById("resetDraft").addEventListener("click", () => {
  rows = structuredClone(baseRows);
  localStorage.removeItem(STORAGE_KEY);
  renderCategoryFilter();
  renderTable();
  setStatus("已恢复原始数据");
});

renderCategoryFilter();
renderTable();
