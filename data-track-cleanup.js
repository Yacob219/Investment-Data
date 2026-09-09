// Presentation cleanup for the per-track company list.
(() => {
  const companyNameMap = new Map([
    ["灵巧智能 DexRobot", "灵巧智能"],
    ["机科未来 RoboScience", "机科未来"],
    ["Current Robotics 元流", "元流"],
    ["元昊动力 PrimalVerse", "元昊动力"],
    ["首形科技 AheadForm", "首形科技"],
    ["无论科技 AnyWit Robotics", "无论科技"],
    ["深穹星核 Novacore", "深穹星核"],
    ["一直在科技 Robonova.i", "一直在科技"],
    ["卓益得 DroidUp", "卓益得"],
    ["演犀科技 YANXI TECH", "演犀科技"],
  ]);

  function normalizeName(name) {
    return companyNameMap.get(name) || name;
  }

  function getTrack(row) {
    return row.mainTrack || row.track;
  }

  function normalizeRows(rows) {
    if (!Array.isArray(rows)) return;

    const cleanedRows = rows
      .map((row) => ({
        ...row,
        companyName: normalizeName(row.companyName),
      }))
      .filter((row) => !(row.companyName === "珞石机器人" && getTrack(row) === "力控"));

    rows.splice(0, rows.length, ...cleanedRows);
  }

  normalizeRows(window.dashboardHomeData);
  normalizeRows(window.dashboardTrackData);
  normalizeRows(window.dashboardData);

  if (Array.isArray(window.dashboardTrackExtras)) {
    window.dashboardTrackExtras = window.dashboardTrackExtras
      .map(([companyName, mainTrack, detail]) => [normalizeName(companyName), mainTrack, detail])
      .filter(([companyName, mainTrack]) => !(companyName === "珞石机器人" && mainTrack === "力控"));
  }

  function cleanCumulativeFunding(value) {
    if (!value) return value;

    const cleaned = String(value)
      .replace(/（公开[^）]*）/g, "")
      .replace(/\(公开[^)]*\)/g, "")
      .replace(/[；;，,]?\s*公开[^；;，,。]*/g, "")
      .replace(/累计量级：/g, "")
      .replace(/^累计(?=近|约|超|数|\d)/, "")
      .replace(/；\s*$/, "")
      .trim();

    return /左右/.test(cleaned) ? `累计量级：\n${cleaned}` : cleaned;
  }

  if (Array.isArray(window.dashboardTrackData)) {
    window.dashboardTrackData.forEach((row) => {
      row.cumulativeFundingDisplay = cleanCumulativeFunding(row.cumulativeFundingDisplay);
    });
  }
})();
