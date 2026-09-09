(() => {
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const trackOf = row => row.mainTrack || row.companyCategory || '未分类';
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0;
  const number = value => Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  const extras = new Map((window.dashboardTrackExtras || []).map(([name, track, direction]) => [name + '::' + track, direction]));
  const merged = new Map();
  const ipoNames = new Set((window.dashboardTrackData || []).filter(row => trackOf(row) === 'IPO').map(row => String(row.companyName || '').trim()));
  (window.dashboardTrackData || []).forEach(row => {
    const name = String(row.companyName || '').trim();
    if (!name || ipoNames.has(name)) return;
    const track = trackOf(row);
    let company = merged.get(name);
    if (!company) {
      company = { ...row, companyName: name, tracks: [], directions: [], records: [] };
      merged.set(name, company);
    }
    if (!company.tracks.includes(track)) company.tracks.push(track);
    company.records.push(row);
    const direction = row.mainDirection || extras.get(name + '::' + track);
    if (direction && !company.directions.includes(direction)) company.directions.push(direction);
    // Fill missing fields only; never add financing amounts across duplicate records.
    for (const key of ['area', 'foundedYear', 'latestRound', 'latestValuation', 'cumulativeFunding', 'latestRoundAmount']) {
      if (!company[key] && row[key]) company[key] = row[key];
    }
  });
  const companies = [...merged.values()];
  const tracks = new Set(companies.flatMap(company => company.tracks).filter(track => track !== 'IPO' && track !== '未分类'));
  function valuation(company) {
    if (company.tracks.includes('IPO')) return null;
    const row = company.records.find(row => positive(row.latestValuation) && !/未披露|未知|历史/.test(row.latestValuationDisplay || ''));
    if (!row) return null;
    return { value: Number(row.latestValuation), label: row.latestValuationDisplay || number(row.latestValuation), strictOver100: /(?:>|超(?:过)?)\s*100\s*亿/.test(row.latestValuationDisplay || '') };
  }
  companies.forEach(company => { company.valuation = valuation(company); });
  const valued = companies.filter(company => company.valuation).sort((a,b) => b.valuation.value - a.valuation.value || a.companyName.localeCompare(b.companyName, 'zh-CN'));
  const over100 = valued.filter(company => company.valuation.value > 100 || company.valuation.strictOver100);
  const between = valued.filter(company => company.valuation.value >= 50 && company.valuation.value <= 100 && !company.valuation.strictOver100);
  const scale = Math.max(100, ...valued.map(company => company.valuation.value));
  function bars(id, countId, list) {
    document.getElementById(countId).textContent = `${list.length} 家`;
    document.getElementById(id).innerHTML = list.length ? list.map((company, index) => `<li>
      <div class="library-bar-caption"><span class="library-bar-rank">${index + 1}</span><span class="library-bar-name">${escape(company.companyName)}</span><span class="library-bar-value">${escape(company.valuation.label)}</span></div>
      <div class="library-bar-track" aria-hidden="true"><span style="width:${company.valuation.value / scale * 100}%"></span></div>
    </li>`).join('') : '<li class="library-empty">暂无符合条件的公司</li>';
  }
  function amount(company, key, labelKey) {
    return escape(company[labelKey] || (positive(company[key]) ? `${number(company[key])} 亿元` : '未披露'));
  }
  function valuationCell(company) {
    if (company.tracks.includes('IPO')) {
      const url = window.dashboardIpoQuotes?.[company.companyName];
      return url ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(company.companyName)}：实时查看">实时查看</a>` : '未提供行情链接';
    }
    return amount(company, 'latestValuation', 'latestValuationDisplay');
  }
  const sorted = [...companies].sort((a,b) => (b.valuation?.value || 0) - (a.valuation?.value || 0) || a.companyName.localeCompare(b.companyName, 'zh-CN'));
  document.getElementById('libraryCompanyCount').textContent = number(companies.length);
  document.getElementById('libraryTrackCount').textContent = number(tracks.size);
  bars('over100List', 'over100Count', over100);
  bars('betweenList', 'betweenCount', between);
  document.getElementById('libraryRows').innerHTML = sorted.map(company => `<tr>
    <th scope="row">${escape(company.companyName)}</th>
    <td>${company.tracks.map(track => `<a class="library-track-tag" href="track.html?track=${encodeURIComponent(track)}">${escape(track)}</a>`).join(' ')}</td>
    <td>${escape(company.area || '未披露')}</td><td>${escape(company.foundedYear || '未披露')}</td>
    <td class="library-direction">${escape(company.directions.join('；') || '未披露')}</td><td>${escape(company.latestRound || '未披露')}</td>
    <td>${valuationCell(company)}</td><td>${amount(company, 'cumulativeFunding', 'cumulativeFundingDisplay')}</td><td>${amount(company, 'latestRoundAmount', 'latestRoundAmountDisplay')}</td>
  </tr>`).join('');
})();
