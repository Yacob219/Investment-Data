(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'ranking-card';
  dialog.setAttribute('aria-labelledby', 'rankingCardTitle');
  dialog.innerHTML = '<div class="ranking-card-head"><h3 id="rankingCardTitle"></h3><button type="button" class="ranking-card-close" aria-label="关闭卡片">×</button></div><p class="ranking-card-note"></p><div class="ranking-card-sources" aria-label="来源"></div>';
  document.body.append(dialog);
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });

  function showCard(chartId, company) {
    const item = window.dashboardRankingDetails[chartId].find((record) => record.company === company);
    if (!item) return;
    dialog.querySelector('h3').textContent = company;
    dialog.querySelector('.ranking-card-note').textContent = item.note;
    const sources = dialog.querySelector('.ranking-card-sources');
    sources.replaceChildren();
    const label = document.createElement('span');
    label.textContent = '来源';
    sources.append(label);
    item.sources.forEach((source) => {
      const validUrl = source.url && /^https?:\/\//i.test(source.url);
      const element = document.createElement(validUrl ? 'a' : 'span');
      element.textContent = source.label;
      if (validUrl) {
        element.href = source.url;
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
      }
      sources.append(element);
    });
    dialog.showModal();
  }

  window.renderRankingButtons = (config, canvas, layout) => {
    let wrapper = canvas.closest('.ranking-chart');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'ranking-chart';
      canvas.before(wrapper);
      wrapper.append(canvas);
      canvas.setAttribute('aria-hidden', 'true');
      const hint = document.createElement('p');
      hint.className = 'ranking-chart-hint';
      hint.textContent = '点击公司或柱条查看说明与来源';
      wrapper.before(hint);
    }
    let layer = wrapper.querySelector('.ranking-chart-actions');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'ranking-chart-actions';
      wrapper.append(layer);
      config.labels.forEach((company, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-label', `${company}，${config.values[index]}亿元，查看说明与来源`);
        button.setAttribute('aria-haspopup', 'dialog');
        button.addEventListener('click', () => showCard(config.id, company));
        layer.append(button);
      });
    }
    [...layer.children].forEach((button, index) => {
      button.style.top = `${100 * (layout.top + index * layout.rowHeight) / layout.height}%`;
      button.style.height = `${100 * layout.rowHeight / layout.height}%`;
    });
  };
})();
