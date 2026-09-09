(() => {
  const sidebar = document.getElementById('investmentSidebar');
  if (!sidebar) return;
  const icons = window.investSidebarIcons;
  const icon = (name) => `<span class="nav-icon" aria-hidden="true">${icons[name] || icons.layers}</span>`;
  const tracks = (window.dashboardTracks || []).filter(track => track !== 'IPO');
  const rows = window.dashboardTrackData || [];
  const selected = location.pathname.endsWith('library.html') ? '__library__' : location.pathname.endsWith('track.html') ? new URLSearchParams(location.search).get('track') || '全栈' : null;
  const iconNames = {
    '全栈': 'layers', '本体': 'bot', '灵巧手': 'hand', '世界模型': 'orbit',
    '数据采集': 'database', '仿真与合成数据': 'boxes', '触觉传感器': 'fingerprint-pattern',
    '关节模组': 'settings', '力控': 'gauge', '具身Infra': 'server',
    '小脑运动控制': 'brain-circuit', '场景机器人': 'factory', '仿生脸': 'scan-face'
  };
  const counts = new Map();
  rows.forEach(row => {
    const track = row.mainTrack || row.companyCategory;
    counts.set(track, (counts.get(track) || 0) + 1);
  });
  function link(label, track, name, extraClass = '') {
    const active = track === selected;
    const url = track === '__library__' ? 'library.html' : track === null ? 'index.html' : `track.html?track=${encodeURIComponent(track)}`;
    return `<a class="nav-item ${extraClass}${active ? ' is-current' : ''}" href="${url}"${active ? ' aria-current="page"' : ''}>
      ${icon(name)}<span class="nav-label">${label}</span>${track === null || track === '__library__' ? '' : `<span class="nav-count" aria-label="${counts.get(track) || 0}家公司">${counts.get(track) || 0}</span>`}
    </a>`;
  }
  sidebar.innerHTML = `
    <a class="nav-brand" href="index.html">${icon('layers')}<span>融资数据看板</span></a>
    <div class="nav-scroll">
      ${link('总览', null, 'layout-dashboard')}
      ${link('一级总库', '__library__', 'database')}
      <details class="nav-group${tracks.includes(selected) ? ' has-current' : ''}" open>
        <summary>${icon('boxes')}<span class="nav-label">赛道分类</span><span class="nav-chevron">${icon('chevron-down')}</span></summary>
        <nav aria-label="赛道分类">${tracks.map(track => link(track === '具身Infra' ? '具身 Infra' : track, track, iconNames[track], 'nav-child')).join('')}</nav>
      </details>
    </div>
    <nav class="nav-footer" aria-label="IPO 企业">${link('IPO 企业', 'IPO', 'chart-no-axes-combined')}</nav>`;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-mobile-toggle';
  toggle.setAttribute('aria-controls', sidebar.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = `${icon('menu')}<span>导航菜单</span>`;
  sidebar.before(toggle);
  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'nav-backdrop';
  backdrop.setAttribute('aria-label', '关闭导航菜单');
  backdrop.tabIndex = -1;
  sidebar.before(backdrop);
  const mobile = matchMedia('(max-width: 760px)');
  function setOpen(open) {
    sidebar.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-is-open', open && mobile.matches);
    toggle.setAttribute('aria-expanded', String(open));
    sidebar.inert = mobile.matches && !open;
    backdrop.hidden = !open;
  }
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  backdrop.addEventListener('click', () => { setOpen(false); toggle.focus(); });
  document.addEventListener('keydown', (event) => {
    if (!mobile.matches || toggle.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { setOpen(false); toggle.focus(); }
    if (event.key === 'Tab') {
      const focusable = [toggle, ...sidebar.querySelectorAll('a, summary')].filter(node => node.getClientRects().length);
      const index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && index === 0) { event.preventDefault(); focusable.at(-1).focus(); }
      else if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); toggle.focus(); }
    }
  });
  mobile.addEventListener('change', () => setOpen(false));
  setOpen(false);
})();
