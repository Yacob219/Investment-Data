// Presentation cleanup for the per-track company list.
(() => {
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

  if (!Array.isArray(window.dashboardTrackData)) return;

  window.dashboardTrackData.forEach((row) => {
    row.cumulativeFundingDisplay = cleanCumulativeFunding(row.cumulativeFundingDisplay);
  });
})();
