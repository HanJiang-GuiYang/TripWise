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

  const greeting = document.getElementById('personal-greeting');
  const today = document.getElementById('today-date');
  const hour = new Date().getHours();
  const period = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  if (greeting) greeting.textContent = `${period}，下一站想去哪里？`;
  if (today) {
    today.dateTime = new Date().toISOString().slice(0, 10);
    today.textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
  }

  const preferences = readPreferences();
  function readPreferences() {
    try { return JSON.parse(localStorage.getItem('tripwise-preferences') || '{}') || {}; }
    catch (_) { return {}; }
  }

  // 根据城市生成首页大图：实景图由 text_to_image 按当地著名景点实时生成
  function inspirationImageUrl(prompt) {
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;
  }

  // —— hero 实景图异步就绪加载 ——
  // text_to_image 首次请求会先返回"生成中"占位图（固定 176626 字节 / 1832x1832 的 JPEG），
  // 生成完成后同一 URL 才返回真图（约 1368x768）。若直接把远程 URL 塞给 img.src，
  // 用户会看到"The image is generating..."占位图。因此这里：
  //   1. 先查 localStorage 缓存（按城市），命中即秒显；
  //   2. 未命中则轮询图床，用「字节长度 + 固有尺寸」双信号识别占位图，真图就绪后转 dataURL 上屏并缓存；
  //   3. fetch 被拦（file:// CORS）或轮询超时，退回 Image 探测 / 保持本地 hero-lake.jpg，绝不让占位图上屏。
  const HERO_PLACEHOLDER_BYTES = 176626;
  const HERO_PLACEHOLDER_DIM = 1832;
  const HERO_POLL_INTERVAL = 5000;
  const HERO_POLL_MAX = 24; // 约 2 分钟
  const HERO_CACHE_MAX = 6; // 最多缓存 6 个城市，控制 localStorage 占用
  let heroLoadToken = 0;

  function readHeroCache(city) {
    try {
      const raw = localStorage.getItem(`tripwise-hero:${city}`);
      if (!raw) return null;
      return JSON.parse(raw).d || null;
    } catch (_) { return null; }
  }

  function writeHeroCache(city, dataUrl) {
    try {
      const stamp = { t: Date.now(), d: dataUrl };
      localStorage.setItem(`tripwise-hero:${city}`, JSON.stringify(stamp));
      // 淘汰最旧的缓存项
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('tripwise-hero:'));
      if (keys.length > HERO_CACHE_MAX) {
        keys.sort((a, b) => (JSON.parse(localStorage.getItem(a)).t || 0) - (JSON.parse(localStorage.getItem(b)).t || 0));
        keys.slice(0, keys.length - HERO_CACHE_MAX).forEach((k) => localStorage.removeItem(k));
      }
    } catch (_) { /* 配额满则放弃缓存 */ }
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  }

  // Image 元素探测：无 CORS 依赖，用固有尺寸识别占位图
  function probeImage(url) {
    return new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve(probe.naturalWidth !== HERO_PLACEHOLDER_DIM || probe.naturalHeight !== HERO_PLACEHOLDER_DIM);
      probe.onerror = () => resolve(null);
      probe.src = url;
    });
  }

  // 单次尝试：fetch 优先（blob.size 权威判断，得 dataUrl 可缓存）；
  // 被 CORS/网络拦截时退 Image 探测（<img> 加载不受 CORS 限制），就绪则返回 directUrl 直接上屏。
  // 返回 {dataUrl} | {directUrl} | 'wait' | null(不可判定)
  async function checkHeroOnce(url) {
    let res;
    try {
      res = await fetch(url, { cache: 'no-store' });
    } catch (_) {
      const ok = await probeImage(url);
      if (ok === null) return null;
      return ok ? { directUrl: url } : 'wait';
    }
    if (!res.ok) return 'wait';
    const blob = await res.blob();
    if (blob.size === HERO_PLACEHOLDER_BYTES) return 'wait';
    const dataUrl = await blobToDataUrl(blob);
    return dataUrl ? { dataUrl } : null;
  }

  async function resolveHeroImage(url) {
    for (let i = 0; i < HERO_POLL_MAX; i++) {
      const result = await checkHeroOnce(url);
      if (result === null) return null;   // 探测失败（断网等），终止轮询
      if (result !== 'wait') return result; // 真图就绪
      await new Promise((r) => setTimeout(r, HERO_POLL_INTERVAL));
    }
    return null; // 超时，保持本地图
  }

  // 让首页 hero 大图与"本周灵感"文字保持同一城市同一景点
  function applyHeroInspiration(city) {
    const inspiration = window.TripWiseData?.cityInspiration?.[city] || window.TripWiseData?.cityInspiration?.['杭州'];
    if (!inspiration) return;
    const featured = document.getElementById('featured-route-name');
    if (featured) featured.textContent = `${city} · ${inspiration.phrase}`;
    const heroImg = document.getElementById('hero-image');
    if (!heroImg || heroImg.dataset.city === city) return;
    heroImg.dataset.city = city;
    heroImg.alt = `${city}${inspiration.phrase}旅行风景`;

    // 命中缓存：直接上屏
    const cached = readHeroCache(city);
    if (cached) { heroImg.src = cached; return; }

    // 未命中：轮询等待真图就绪后淡入，期间保留现有画面（本地 hero-lake.jpg），不闪占位图
    const token = ++heroLoadToken;
    const url = inspirationImageUrl(inspiration.prompt);
    heroImg.style.transition = 'opacity .45s ease';
    heroImg.style.opacity = '0';
    resolveHeroImage(url).then((ready) => {
      if (token !== heroLoadToken || !ready) { heroImg.style.opacity = '1'; return; }
      heroImg.onload = () => { heroImg.style.opacity = '1'; };
      heroImg.src = ready.dataUrl || ready.directUrl;
      if (ready.dataUrl) writeHeroCache(city, ready.dataUrl);
    });
  }

  function applyPreferences() {
    const city = preferences.city || '杭州';
    const type = preferences.type || 'culture';
    applyHeroInspiration(city);
    const routeDest = document.getElementById('route-dest');
    const routeType = document.getElementById('route-type');
    if (routeDest && preferences.city) routeDest.value = city;
    if (routeType && preferences.type) routeType.value = type;
    const packingDest = document.getElementById('packing-dest');
    if (packingDest && preferences.city && !packingDest.value) packingDest.value = city;
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
    window.switchTab('route');
    showToast(`已为你选好${city}，再选天数和偏好即可`, 'map-pin');
  };
  document.getElementById('featured-route-button')?.addEventListener('click', () => window.openFeaturedRoute(preferences.city || '杭州'));

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
    preferences.city = args[0];
    preferences.type = args[2];
    localStorage.setItem('tripwise-preferences', JSON.stringify(preferences));
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

  document.addEventListener('keydown', (event) => {
    if (modal?.style.display === 'none') return;
    if (event.key === 'Escape') window.closeModal();
    if (event.key === 'Tab') {
      const controls = [...modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
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
    'memory-title': '旅行记忆标题',
    'memory-location': '旅行地点',
    'memory-text': '旅行感受',
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

  applyPreferences();
  refreshIcons();
}());
