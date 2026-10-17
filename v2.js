(function () {
  'use strict';

  const root = document.documentElement;
  const themeButton = document.getElementById('theme-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function icon(name) {
    return window.TripWiseIcons?.svg(name) || '';
  }

  function refreshIcons() {
    window.TripWiseIcons?.hydrate(document);
  }

  function setTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) localStorage.setItem('tripwise-theme', theme);
    if (themeButton) {
      const dark = theme === 'dark';
      themeButton.innerHTML = icon(dark ? 'sun' : 'moon');
      themeButton.setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式');
    }
    refreshIcons();
  }

  const savedTheme = localStorage.getItem('tripwise-theme');
  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(savedTheme || preferredTheme, false);

  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next, true);
    showToast(next === 'dark' ? '已切换到深色外观' : '已切换到浅色外观', 'palette');
  });

  const today = document.getElementById('today-date');
  const hour = new Date().getHours();
  const period = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  // 需求5：本机旅行画像昵称（无后端，存 localStorage）
  function readProfile() {
    try { return JSON.parse(localStorage.getItem('tripwise-user') || '{}') || {}; }
    catch (_) { return {}; }
  }
  function updateGreetingPeriod() {
    const el = document.getElementById('greeting-period');
    if (!el) return;
    const name = readProfile().name;
    el.textContent = name ? `${period}，${name}` : period;
  }
  updateGreetingPeriod();
  if (today) {
    today.dateTime = new Date().toISOString().slice(0, 10);
    today.textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
  }

  const preferences = readPreferences();
  function readPreferences() {
    try { return JSON.parse(localStorage.getItem('tripwise-preferences') || '{}') || {}; }
    catch (_) { return {}; }
  }

  // —— 需求1：下一站输入框接线（datalist 提示 + 模糊匹配 52 城） ——
  const nextStopInput = document.getElementById('next-stop-input');
  const nextStopGo = document.getElementById('next-stop-go');
  const suggestions = document.getElementById('next-stop-suggestions');
  const allCities = Object.values(window.TripWiseData.cityRegions).flat();
  if (suggestions) {
    suggestions.innerHTML = allCities.map(c => `<option value="${window.TripWiseUtils.escapeHtml(c)}"></option>`).join('');
  }
  function matchCity(raw) {
    return allCities.find(c => c === raw)
      || allCities.find(c => c.includes(raw) || raw.includes(c))
      || raw;
  }
  function commitNextStop() {
    const raw = (nextStopInput?.value || '').trim();
    if (!raw) return;
    const city = matchCity(raw);
    if (nextStopInput) nextStopInput.value = city;
    window.TripWiseNextStop.setCity(city);
    showToast(`下一站：${city}`, 'map-pin');
  }
  nextStopGo?.addEventListener('click', commitNextStop);
  nextStopInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') commitNextStop(); });
  if (nextStopInput) nextStopInput.value = window.TripWiseNextStop.getCity();

  // —— 风景图全部本地化（assets/cities/），一次性清理旧版远程文生图 dataURL 缓存释放配额 ——
  Object.keys(localStorage).filter(k => k.startsWith('tripwise-hero:')).forEach(k => localStorage.removeItem(k));

  // 让首页 hero 大图与"本周灵感"文字保持同一城市
  function applyHeroInspiration(city) {
    const inspiration = window.TripWiseData?.cityInspiration?.[city];
    const featured = document.getElementById('featured-route-name');
    if (featured) featured.textContent = `${city} · ${inspiration ? inspiration.phrase : '下一站'}`;
    const heroImg = document.getElementById('hero-image');
    if (!heroImg || heroImg.dataset.city === city) return;
    heroImg.dataset.city = city;
    heroImg.alt = `${city} 城市风光`;
    heroImg.src = window.cityPhotoSrc(city);
  }

  function applyPreferences() {
    const city = window.TripWiseNextStop.getCity();
    const type = preferences.type || 'culture';
    applyHeroInspiration(city);
    const routeDest = document.getElementById('route-dest');
    const routeType = document.getElementById('route-type');
    if (routeDest) routeDest.value = city;
    if (routeType && preferences.type) routeType.value = type;
    const packingDest = document.getElementById('packing-dest');
    if (packingDest && !packingDest.value) packingDest.value = city;
    if (nextStopInput && nextStopInput.value !== city) nextStopInput.value = city;
  }

  const originalSwitchTab = window.switchTab;
  window.switchTab = function switchTabV2(tabName, options = {}) {
    originalSwitchTab(tabName);
    document.querySelectorAll('[data-tab]').forEach((item) => {
      const active = item.dataset.tab === tabName;
      item.classList.toggle('active', active);
      if (item.classList.contains('nav-btn')) item.setAttribute('aria-current', active ? 'page' : 'false');
    });
    const section = document.getElementById(`tab-${tabName}`);
    if (section) {
      section.setAttribute('aria-hidden', 'false');
      document.querySelectorAll('.tab-content:not(.active)').forEach((el) => el.setAttribute('aria-hidden', 'true'));
      if (!options.keepScroll) window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      if (options.focus) section.focus({ preventScroll: true });
    }
    const url = new URL(window.location.href);
    if (tabName === 'home') url.searchParams.delete('view');
    else url.searchParams.set('view', tabName);
    history.replaceState({ tabName }, '', url);
  };

  document.querySelector('.logo')?.addEventListener('click', () => window.switchTab('home'));

  const initialView = new URLSearchParams(location.search).get('view');
  if (initialView && document.getElementById(`tab-${initialView}`)) window.switchTab(initialView, { keepScroll: true });
  else window.switchTab('home', { keepScroll: true });

  document.querySelectorAll('.tab-content').forEach((section) => {
    section.setAttribute('tabindex', '-1');
    section.setAttribute('role', 'region');
    const heading = section.querySelector('h2');
    if (heading) {
      heading.id ||= `${section.id}-title`;
      section.setAttribute('aria-labelledby', heading.id);
    } else {
      section.removeAttribute('role');
    }
  });

  document.getElementById('nav')?.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const items = [...document.querySelectorAll('#nav .nav-btn')];
    const current = items.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    items[index].focus();
    items[index].scrollIntoView({ inline: 'center', block: 'nearest' });
  });

  window.openFeaturedRoute = function openFeaturedRoute(city) {
    const select = document.getElementById('route-dest');
    if (select) select.value = city;
    window.TripWiseNextStop.setCity(city);
    window.switchTab('route');
    showToast(`已为你选好${city}，再选天数和偏好即可`, 'map-pin');
  };
  document.getElementById('featured-route-button')?.addEventListener('click', () => window.openFeaturedRoute(window.TripWiseNextStop.getCity()));

  window.showToast = function showToast(message, iconName = 'check-circle-2') {
    const region = document.getElementById('toast-region');
    if (!region) return;
    region.querySelectorAll('.toast').forEach((item) => item.remove());
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `${icon(iconName)}<span>${window.TripWiseUtils.escapeHtml(message)}</span>`;
    region.appendChild(toast);
    refreshIcons();
    const dismiss = () => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), reduceMotion.matches ? 10 : 180);
    };
    window.setTimeout(dismiss, 3200);
  };

  window.openAiSettings = function openAiSettings() {
    window.switchTab('ai');
    document.getElementById('ai-status-bar')?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
  };

  const originalShowRouteResult = window.showRouteResult;
  window.showRouteResult = function showRouteResultV2(...args) {
    originalShowRouteResult(...args);
    preferences.type = args[2];
    localStorage.setItem('tripwise-preferences', JSON.stringify(preferences));
    // 需求6：路线城市即下一站（app.js 内 setCity 同值去重，不会重复触发订阅）
    applyPreferences();
    refreshIcons();
    window.setTimeout(() => {
      try { routeMap?.invalidateSize?.(); } catch (_) { /* Map is optional until Leaflet loads. */ }
    }, 80);
    showToast('路线已经准备好', 'route');
  };

  // html2canvas 1.4.1 不识别 color-mix()，导出前把样式表里的 color-mix
  // 替换为浏览器计算后的 rgb 值，导出结束后恢复（跨域样式表跳过）
  function neutralizeColorMix() {
    const probe = document.createElement('div');
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const resolveMix = (expression) => {
      try {
        probe.style.color = '';
        probe.style.color = expression;
        const resolved = getComputedStyle(probe).color;
        if (resolved) return resolved;
      } catch (_) { /* 落到透明色 */ }
      return 'transparent';
    };
    const backups = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch (_) { continue; } // 跨域样式表无法访问
      if (!rules) continue;
      [...rules].forEach((rule) => {
        if (!rule.style || !rule.cssText.includes('color-mix')) return;
        const original = rule.style.cssText;
        const sanitized = original.replace(/color-mix\([^)]*\)/g, match => resolveMix(match));
        if (sanitized !== original) {
          backups.push({ rule, original });
          try { rule.style.cssText = sanitized; } catch (_) { /* 忽略无法写入的规则 */ }
        }
      });
    }
    probe.remove();
    return () => backups.forEach(({ rule, original }) => {
      try { rule.style.cssText = original; } catch (_) { /* 忽略 */ }
    });
  }

  // 递归把计算后的关键样式写成内联样式，让离屏克隆不依赖页面 CSS 变量与 color-mix
  const EXPORT_STYLE_PROPS = [
    'display', 'position', 'boxSizing', 'width', 'height', 'minWidth', 'minHeight',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'color', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight',
    'letterSpacing', 'textAlign', 'textTransform', 'textDecoration', 'whiteSpace',
    'wordBreak', 'verticalAlign', 'opacity', 'objectFit', 'fill', 'stroke',
    'backgroundColor', 'backgroundImage', 'backgroundRepeat', 'backgroundPosition', 'backgroundSize',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
    'boxShadow', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'gap',
    'gridTemplateColumns'
  ];
  function inlineComputedStyles(source, clone) {
    const computed = getComputedStyle(source);
    EXPORT_STYLE_PROPS.forEach((prop) => {
      clone.style.setProperty(prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`), computed.getPropertyValue(prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)));
    });
    const sourceChildren = source.children;
    const cloneChildren = clone.children;
    for (let i = 0; i < sourceChildren.length; i++) {
      if (cloneChildren[i]) inlineComputedStyles(sourceChildren[i], cloneChildren[i]);
    }
  }

  const originalDownloadJournal = window.downloadJournal;
  window.downloadJournal = async function downloadJournalV2() {
    const journal = document.getElementById('journal-page');
    if (!journal || document.getElementById('journal-output').style.display === 'none') {
      showToast('请先生成一页手账', 'notebook-pen');
      return;
    }
    if (!window.html2canvas) {
      showToast('导出组件加载失败，请检查网络后重试', 'circle-alert');
      return; // 已明确告知原因，不再调用基座实现覆盖成"请先生成手账"
    }
    let restoreStyles = () => {};
    let holder = null;
    try {
      restoreStyles = neutralizeColorMix();

      // 离屏克隆：固定定位到屏幕外，不影响当前页面布局
      holder = document.createElement('div');
      holder.setAttribute('aria-hidden', 'true');
      holder.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;pointer-events:none;';
      const clone = journal.cloneNode(true);
      const rect = journal.getBoundingClientRect();
      clone.style.margin = '0';
      clone.style.width = `${Math.round(rect.width)}px`;
      holder.appendChild(clone);
      document.body.appendChild(holder);
      inlineComputedStyles(journal, clone);

      const canvas = await window.html2canvas(clone, { scale: 2, backgroundColor: null, logging: false, useCORS: true });
      const link = document.createElement('a');
      link.download = `TripWise-旅行手账-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('手账图片已保存', 'download');
    } catch (_) {
      showToast('图片导出失败，请检查浏览器存储空间后重试', 'circle-alert');
    } finally {
      holder?.remove();
      restoreStyles();
    }
  };

  const originalShareJournal = window.shareJournal;
  window.shareJournal = async function shareJournalV2() {
    const text = document.getElementById('journal-text')?.value.trim();
    if (!text) return originalShareJournal?.();
    try {
      if (navigator.share) await navigator.share({ title: '我的 TripWise 旅行手账', text });
      else {
        await navigator.clipboard.writeText(text);
        showToast('手账文字已复制', 'copy');
      }
    } catch (error) {
      if (error.name !== 'AbortError') showToast('分享没有完成，请稍后重试', 'circle-alert');
    }
  };

  const modal = document.getElementById('checkin-modal');
  let modalLandmarkIndex = null;
  const originalShowCheckinModal = window.showCheckinModal;
  window.showCheckinModal = function showCheckinModalV2(...args) {
    modalLandmarkIndex = args[1];
    originalShowCheckinModal(...args);
    window.setTimeout(() => modal?.querySelector('button')?.focus(), 0);
  };

  const originalCloseModal = window.closeModal;
  window.closeModal = function closeModalV2() {
    originalCloseModal();
    if (modalLandmarkIndex != null) document.querySelectorAll('.landmark-card')[modalLandmarkIndex]?.focus();
  };

  modal?.addEventListener('click', (event) => {
    if (event.target === modal) window.closeModal();
  });

  // 需求5：旅行画像弹窗（昵称本机保存）
  const profileModal = document.getElementById('profile-modal');
  const profileBtn = document.getElementById('profile-btn');
  window.closeProfileModal = function closeProfileModal() {
    if (profileModal) profileModal.style.display = 'none';
    profileBtn?.focus();
  };
  window.saveProfile = function saveProfile() {
    const name = (document.getElementById('profile-name')?.value || '').trim().slice(0, 12);
    try { localStorage.setItem('tripwise-user', JSON.stringify({ name })); } catch (_) { /* 配额满忽略 */ }
    updateGreetingPeriod();
    window.closeProfileModal();
    showToast(name ? `你好，${name}` : '已清除昵称', 'user');
  };
  profileBtn?.addEventListener('click', () => {
    if (!profileModal) return;
    profileModal.style.display = 'flex';
    const input = document.getElementById('profile-name');
    if (input) input.value = readProfile().name || '';
    window.setTimeout(() => input?.focus(), 0);
  });
  profileModal?.addEventListener('click', (event) => {
    if (event.target === profileModal) window.closeProfileModal();
  });

  // 通用弹窗键盘处理：Escape 关闭当前打开的弹窗，Tab 焦点循环
  document.addEventListener('keydown', (event) => {
    const openModal = [modal, profileModal].find(m => m && m.style.display !== 'none');
    if (!openModal) return;
    if (event.key === 'Escape') {
      if (openModal === profileModal) window.closeProfileModal();
      else window.closeModal();
      return;
    }
    if (event.key === 'Tab') {
      const controls = [...openModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const controlNames = {
    'route-dest': '路线目的地',
    'route-days': '旅行天数',
    'route-type': '路线主题',
    'packing-dest': '行李清单目的地',
    'packing-weather': '目的地天气',
    'packing-days': '行程天数',
    'next-stop-input': '下一站目的地',
    'memory-title': '旅行日记标题',
    'memory-location': '旅行地点',
    'memory-mood': '此刻的心情',
    'memory-text': '日记正文',
    'ledger-amount': '记账金额',
    'ledger-note': '记账备注',
    'profile-name': '昵称',
    'journal-text': '旅途故事',
    'chat-input': '向旅行顾问提问'
  };
  Object.entries(controlNames).forEach(([id, label]) => document.getElementById(id)?.setAttribute('aria-label', label));
  ['route-result', 'packing-result', 'budget-result', 'weather-result', 'quiz-result', 'trivia-result'].forEach((id) => {
    const result = document.getElementById(id);
    if (result) { result.setAttribute('aria-live', 'polite'); result.setAttribute('aria-atomic', 'false'); }
  });
  document.querySelectorAll('input, select, textarea').forEach((control, index) => {
    if (!control.name) control.name = control.id || `tripwise-control-${index + 1}`;
    if (!control.autocomplete) control.autocomplete = 'off';
    const explicitLabel = control.id ? document.querySelector(`label[for="${control.id}"]`) : null;
    const wrappingLabel = control.closest('label');
    const nearbyLabel = control.parentElement?.querySelector(':scope > label');
    if (!control.getAttribute('aria-label') && !explicitLabel && !wrappingLabel) {
      const visibleName = nearbyLabel?.textContent?.trim();
      control.setAttribute('aria-label', visibleName || control.placeholder?.replace(/[…。].*$/, '') || control.id || `表单选项 ${index + 1}`);
    }
    if (control.placeholder) control.placeholder = control.placeholder.replace(/\.\.\./g, '…');
  });

  // —— 路线页：选中城市后展示目的地风光（本地实景图） ——
  const cityPreview = document.getElementById('city-preview');
  const cityPreviewImg = document.getElementById('city-preview-image');
  const cityPreviewCaption = document.getElementById('city-preview-caption');

  function renderCityPreview(city) {
    if (!cityPreview || !cityPreviewImg || !city) { if (cityPreview) cityPreview.hidden = true; return; }
    cityPreview.hidden = false;
    const inspiration = window.TripWiseData?.cityInspiration?.[city];
    if (cityPreviewCaption) cityPreviewCaption.textContent = `${city} · ${inspiration ? inspiration.phrase : '目的地风光'}`;
    if (cityPreviewImg.dataset.city === city) return;
    cityPreviewImg.dataset.city = city;
    cityPreviewImg.alt = `${city} 城市风光`;
    cityPreviewImg.src = window.cityPhotoSrc(city);
  }

  document.getElementById('route-dest')?.addEventListener('change', (event) => {
    renderCityPreview(event.target.value);
  });

  // 下一站变化时：首页 hero、输入框、路线页预览同步
  window.TripWiseNextStop.onChange((city) => {
    applyPreferences();
    renderCityPreview(city);
  });

  applyPreferences();
  // 恢复上次城市时同步显示预览
  const savedDest = document.getElementById('route-dest');
  if (savedDest?.value) renderCityPreview(savedDest.value);
  refreshIcons();
}());
