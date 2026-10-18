// 数据层与工具层已拆分至 data.js / utils.js（第二阶段架构优化）
const D = window.TripWiseData;
const U = window.TripWiseUtils;

// ========== 共享「下一站」状态（需求1/6/7 共用单一数据源） ==========
// 所有写入走 setCity，所有响应方订阅 onChange，避免互相触发造成回环。
window.TripWiseNextStop = (function () {
  const KEY = 'tripwise-nextstop';
  const listeners = [];
  let state = U.readStoredJson(KEY, null, v => v && typeof v.city === 'string');
  if (!state) {
    // 从旧的 tripwise-preferences.city 一次性迁移（不删旧 key，兼容主题偏好）
    const legacy = U.readStoredJson('tripwise-preferences', {}, v => v && typeof v === 'object');
    state = { city: legacy.city || '杭州', updatedAt: Date.now() };
  }
  function getCity() { return state.city; }
  function setCity(city, opts) {
    city = String(city || '').trim();
    if (!city) return;
    if (city === state.city && !(opts && opts.force)) return;
    state = { city, updatedAt: Date.now() };
    U.storeJson(KEY, state);
    if (!opts || !opts.silent) listeners.forEach(fn => { try { fn(city); } catch (_) {} });
  }
  function onChange(fn) { listeners.push(fn); }
  return { getCity, setCity, onChange };
})();

// 本地实景图取址：48 城已有 assets/cities/{拼音}.jpg，缺图城市回退 hero-lake.jpg
// （GitHub Pages 构建拒绝非 ASCII 文件名，故本地照片一律用拼音命名）
const NO_CITY_PHOTO = { '敦煌': 1, '西宁': 1, '银川': 1, '乌鲁木齐': 1 };
const CITY_FILE_PINYIN = {
  '三亚': 'sanya', '上海': 'shanghai', '丽江': 'lijiang', '兰州': 'lanzhou',
  '北京': 'beijing', '北海': 'beihai', '南京': 'nanjing', '南宁': 'nanning',
  '南昌': 'nanchang', '厦门': 'xiamen', '合肥': 'hefei', '呼和浩特': 'huhhot',
  '哈尔滨': 'harbin', '大理': 'dali', '大连': 'dalian', '天津': 'tianjin',
  '广州': 'guangzhou', '开封': 'kaifeng', '张家界': 'zhangjiajie', '张掖': 'zhangye',
  '恩施': 'enshi', '成都': 'chengdu', '扬州': 'yangzhou', '拉萨': 'lasa',
  '无锡': 'wuxi', '昆明': 'kunming', '杭州': 'hangzhou', '桂林': 'guilin',
  '武汉': 'wuhan', '沈阳': 'shenyang', '泰安': 'taian', '洛阳': 'luoyang',
  '济南': 'jinan', '海口': 'haikou', '深圳': 'shenzhen', '珠海': 'zhuhai',
  '福州': 'fuzhou', '秦皇岛': 'qinhuangdao', '舟山': 'zhoushan', '苏州': 'suzhou',
  '西安': 'xian', '贵阳': 'guiyang', '郑州': 'zhengzhou', '重庆': 'chongqing',
  '长春': 'changchun', '长沙': 'changsha', '青岛': 'qingdao', '黄山': 'huangshan'
};
function cityPhotoSrc(city) {
  const py = city && CITY_FILE_PINYIN[city];
  if (py && !NO_CITY_PHOTO[city] && D.cityCoords[city]) {
    return `assets/cities/${py}.jpg`;
  }
  return 'assets/hero-lake.jpg';
}

// 类别主题图：未命中本地景点清单时，按 category 选不同主题图，避免同城市所有景点同图
const THEME_MAP = { landmark: 'landmark', food: 'food', nature: 'nature', photo: 'photo', shopping: 'shopping' };
function themePhotoSrc(cat) {
  const key = cat && THEME_MAP[cat.toLowerCase()];
  return key ? `assets/themes/${key}.jpg` : null;
}

// 探店盲盒拼音映射（用于本地美食数据复用）
const CITY_PINYIN = { '北京': 'beijing', '上海': 'shanghai', '成都': 'chengdu', '广州': 'guangzhou', '杭州': 'hangzhou', '厦门': 'xiamen' };

// ========== 城市图文聚合器（需求1/7 共用）：本地数据 → 缓存 → AI → 空 ==========
const INSIGHT_CACHE_PREFIX = 'tripwise-insight:';
const INSIGHT_CACHE_MAX = 20;

function readInsightCache(city) {
  try {
    const raw = localStorage.getItem(INSIGHT_CACHE_PREFIX + city);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return (v && Array.isArray(v.food) && Array.isArray(v.culture)) ? v : null;
  } catch (_) { return null; }
}

function writeInsightCache(city, data) {
  try {
    localStorage.setItem(INSIGHT_CACHE_PREFIX + city, JSON.stringify({ t: Date.now(), food: data.food, culture: data.culture }));
    const keys = Object.keys(localStorage).filter(k => k.startsWith(INSIGHT_CACHE_PREFIX));
    if (keys.length > INSIGHT_CACHE_MAX) {
      keys.sort((a, b) => (JSON.parse(localStorage.getItem(a)).t || 0) - (JSON.parse(localStorage.getItem(b)).t || 0));
      keys.slice(0, keys.length - INSIGHT_CACHE_MAX).forEach(k => localStorage.removeItem(k));
    }
  } catch (_) { /* 配额满则放弃缓存 */ }
}

// 从已有本地数据拼出 {food, culture}；无数据返回 null
function localInsight(city) {
  let food = [];
  let culture = [];
  const rd = D.routeData[city];
  if (rd) {
    food = (rd.food || []).slice(0, 4).map(r => ({ name: r.title, desc: r.desc }));
    culture = (rd.culture || []).slice(0, 3).map(r => ({ title: r.title, text: r.desc }));
  }
  if (!food.length) {
    const py = CITY_PINYIN[city];
    const shops = py && D.blindboxData[py];
    if (shops && shops.length) food = shops.slice(0, 4).map(s => ({ name: s.name, desc: s.desc }));
  }
  if (!culture.length) {
    const trivia = D.cityTriviaData[city];
    if (trivia && trivia.length) culture = trivia.slice(0, 3).map(t => ({ title: t.q, text: t.a }));
  }
  if (!food.length && !culture.length) return null;
  return { food, culture };
}

async function generateInsightWithAI(city) {
  const messages = [
    { role: 'system', content: '你是中文旅行资料编辑。只输出 JSON，不要任何解释或 markdown 代码块。' },
    { role: 'user', content: `请介绍「${city}」，返回严格 JSON：{"food":[{"name":"美食名","desc":"一句话特色"}]共4项,"culture":[{"title":"文化/景点名","text":"一句话介绍"}]共3项}` }
  ];
  const text = await callAI(messages, { maxTokens: 800 });
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  const obj = JSON.parse(text.slice(start, end + 1));
  const food = Array.isArray(obj.food) ? obj.food.slice(0, 4).map(f => ({ name: String(f.name || ''), desc: String(f.desc || '') })).filter(f => f.name) : [];
  const culture = Array.isArray(obj.culture) ? obj.culture.slice(0, 3).map(c => ({ title: String(c.title || ''), text: String(c.text || '') })).filter(c => c.title) : [];
  if (!food.length && !culture.length) return null;
  return { food, culture };
}

// 返回 { food, culture, source }；source ∈ local|cache|ai|none
async function loadCityInsight(city) {
  const local = localInsight(city);
  if (local) return { ...local, source: 'local' };
  const cached = readInsightCache(city);
  if (cached) return { food: cached.food, culture: cached.culture, source: 'cache' };
  if (getAiConfig()) {
    try {
      const ai = await generateInsightWithAI(city);
      if (ai) { writeInsightCache(city, ai); return { ...ai, source: 'ai' }; }
    } catch (_) { /* 落空态 */ }
  }
  return { food: [], culture: [], source: 'none' };
}

// 渲染首页「下一站」图文卡（风景本地秒开，美食/文化异步加载）
let nextStopToken = 0;
async function renderNextStopCard(city) {
  const card = document.getElementById('nextstop-card');
  if (!card) return;
  const token = ++nextStopToken;
  card.hidden = false;

  const inspiration = D.cityInspiration && D.cityInspiration[city];
  const titleEl = document.getElementById('nextstop-title');
  if (titleEl) titleEl.textContent = `${city} · ${inspiration ? inspiration.phrase : '下一站'}`;

  const img = document.getElementById('nextstop-scenery-img');
  if (img) {
    img.src = cityPhotoSrc(city);
    img.alt = `${city} 城市风光`;
    img.onerror = () => { img.onerror = null; img.src = 'assets/hero-lake.jpg'; };
  }
  const sceneryText = document.getElementById('nextstop-scenery-text');
  if (sceneryText) sceneryText.textContent = inspiration ? inspiration.phrase : `${city}的街巷与风景，等你亲自走过。`;

  // 已到访地点（足迹打卡）同步展示
  const checkinEl = document.getElementById('nextstop-checkin');
  if (checkinEl) {
    const landmarks = D.landmarkData[city];
    if (landmarks && landmarks.length) {
      const checked = landmarks.filter(lm => checkedLandmarks[`${city}#${lm.name}`]).length;
      checkinEl.innerHTML = `<span class="nextstop-checkin-label">已到访 ${checked}/${landmarks.length}</span>` +
        landmarks.map((lm, idx) => {
          const on = Boolean(checkedLandmarks[`${city}#${lm.name}`]);
          return `<button type="button" class="landmark-chip ${on ? 'checked' : ''}" onclick="toggleLandmark(${U.jsStringArg(city)}, ${idx})">${U.escapeHtml(lm.name)}</button>`;
        }).join('');
    } else {
      checkinEl.innerHTML = '';
    }
  }

  const foodList = document.getElementById('nextstop-food-list');
  const cultureList = document.getElementById('nextstop-culture-list');
  if (foodList) foodList.innerHTML = '<li class="nextstop-loading">正在加载…</li>';
  if (cultureList) cultureList.innerHTML = '';

  const insight = await loadCityInsight(city);
  if (token !== nextStopToken) return; // 已有更新的请求，丢弃本次结果

  if (foodList) {
    foodList.innerHTML = insight.food.length
      ? insight.food.map(f => `<li><strong>${U.escapeHtml(f.name)}</strong><span>${U.escapeHtml(f.desc)}</span></li>`).join('')
      : `<li class="nextstop-empty">暂无美食资料</li>`;
  }
  if (cultureList) {
    cultureList.innerHTML = insight.culture.length
      ? insight.culture.map(c => `<li><strong>${U.escapeHtml(c.title)}</strong><span>${U.escapeHtml(c.text)}</span></li>`).join('')
      : `<li class="nextstop-empty">暂无文化资料</li>`;
  }
  if (insight.source === 'none' && foodList) {
    foodList.innerHTML = `<li class="nextstop-empty">资料整理中，<button type="button" class="link-btn" onclick="switchTab('ai')">问问旅行顾问</button></li>`;
  }
}

// ========== Tab切换 ==========
function switchTab(tabName) {
  const section = document.getElementById(`tab-${tabName}`);
  if (!section?.classList.contains('tab-content')) return;
  // 离开路线页时停止自动导航，避免定时器在后台继续操作地图
  if (tabName !== 'route' && typeof stopNavigation === 'function') stopNavigation();

  document.querySelectorAll('.tab-content').forEach(el => {
    const active = el === section;
    el.classList.toggle('active', active);
    el.hidden = !active;
    el.setAttribute('aria-hidden', String(!active));
  });
  document.body.dataset.view = tabName;
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  var navBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
  if (navBtn) navBtn.classList.add('active');
}

document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => window.switchTab(btn.dataset.tab, { focus: true }));
});

// ========== 地图相关变量 ==========
let routeMap = null;
let routeMapVersion = 0;
let routeMarkers = [];
let routePolyline = null;
let navigationInterval = null;
let currentRouteData = null;
let currentNavIndex = 0;
let navSequence = []; // 当前自动导航会依次聚焦的景点下标（跳过无坐标点）

// 带容错的本地持久化：隐私模式或配额满时提示用户而不是抛异常
// Fisher-Yates 洗牌，保证随机排列分布均匀
// ========== 全国热门旅游城市 ==========
// 按区域分组，用于目的地下拉预选框
// 城市中心坐标
// 初始化目的地下拉框（按区域分组）
function initCitySelect() {
  const select = document.getElementById('route-dest');
  Object.keys(D.cityRegions).forEach(region => {
    const group = document.createElement('optgroup');
    group.label = region;
    D.cityRegions[region].forEach(city => {
      const opt = document.createElement('option');
      opt.value = city;
      opt.textContent = D.routeData[city] ? `${city} · 精选` : city;
      group.appendChild(opt);
    });
    select.appendChild(group);
  });
}

// 初始化出行日期选择器（未来7天，默认选中前3天）
function initDateCheckboxes() {
  const container = document.getElementById('route-date-checkboxes');
  if (!container) return;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const weekDay = `周${weekDays[d.getDay()]}`;
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = d.toISOString().slice(0, 10);
    cb.checked = i < 3; // 默认选中前3天
    cb.dataset.dateIndex = i;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(`${dateStr} ${weekDay}`));
    container.appendChild(label);
  }
}

// 获取选中的出行日期列表
function getSelectedDates() {
  const cbs = document.querySelectorAll('#route-date-checkboxes input[type="checkbox"]:checked');
  return Array.from(cbs).map(cb => cb.value).sort();
}

// ========== 精选路线数据（离线） ==========
// ========== AI 配置（来自 config.js，程序后台配置模式） ==========
// 读取 config.js 中的全局配置；未配置时返回 null
function getAiConfig() {
  const conf = window.TRIPWISE_CONFIG;
  if (!conf || !conf.apiKey || !conf.provider) return null;
  const provider = D.AI_PROVIDERS[conf.provider];
  if (!provider) return null;
  return {
    provider: conf.provider,
    name: provider.name,
    url: provider.url,
    // 可选：CORS 代理前缀（如自部署的 Cloudflare Worker）。
    // 智谱网关的 OPTIONS 预检不返回 CORS 头，浏览器直连会被拦截成
    // "Failed to fetch"；配置 proxyPrefix 后请求改走 <proxyPrefix><apiUrl>
    proxyPrefix: (conf.proxyPrefix || '').trim(),
    apiKey: conf.apiKey.trim(),
    model: (conf.models && conf.models[conf.provider]) || 'glm-4-flash',
    temperature: conf.temperature != null ? conf.temperature : 0.8,
    maxTokens: conf.maxTokens || 1500
  };
}

function updateAiStatus() {
  const cfg = getAiConfig();
  const statusText = document.getElementById('ai-status-text');
  const bar = document.getElementById('ai-status-bar');
  if (cfg) {
    statusText.innerHTML = `${U.iconSvg('check-circle')}<span>AI 已就绪 · ${U.escapeHtml(cfg.name)}（${U.escapeHtml(cfg.model)}）</span>`;
    bar.classList.add('ready');
  } else {
    statusText.innerHTML = `${U.iconSvg('alert')}<span>AI 未启用：请在项目目录 config.js 中填写 apiKey（打开该文件按注释操作即可，一次配置长期有效）</span>`;
    bar.classList.remove('ready');
  }
}

// 调用大模型（OpenAI 兼容格式，非流式）
// overrides.maxTokens 可用于多日路线等需要更长回复的场景
async function callAI(messages, overrides = {}) {
  const cfg = getAiConfig();
  if (!cfg) throw new Error('NO_CONFIG');

  const url = cfg.proxyPrefix ? cfg.proxyPrefix + cfg.url : cfg.url;
  const body = JSON.stringify({
    model: cfg.model,
    messages,
    temperature: cfg.temperature,
    max_tokens: overrides.maxTokens || cfg.maxTokens
  });

  // 网络抖动/超时/服务繁忙自动重试一次；key 与格式问题不重试
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`
        },
        body,
        signal: controller.signal
      });

      if (res.status === 401 || res.status === 403) throw new Error('INVALID_KEY');
      if (res.status === 429 || res.status >= 500) throw new Error(`服务繁忙（${res.status}）`);
      if (!res.ok) throw new Error(`API请求失败（${res.status}）`);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('AI返回内容为空');
      return content;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('请求超时（90秒）');
      const retryable = err instanceof TypeError || /^服务繁忙/.test(err.message || '');
      if (!retryable || attempt >= 1) throw err;
      await new Promise(r => setTimeout(r, 1500));
    } finally {
      clearTimeout(timer);
    }
  }
}

function describeAiError(err) {
  if (err.message === 'NO_CONFIG') return 'AI 尚未配置：请打开项目目录下的 config.js，把 API Key 填入 apiKey 字段并保存，刷新页面即可。';
  if (err.message === 'INVALID_KEY') return 'API Key 无效或额度不足：请检查 config.js 中的 apiKey（魔搭 ModelScope 需在 modelscope.cn 个人中心创建访问令牌；按量付费服务商需账户有余额）。';
  if (err instanceof TypeError) {
    return '网络或跨域请求被拦截（Failed to fetch）：请检查网络连接；若使用智谱（zhipu），其网关不支持浏览器直连，需改用 modelscope / deepseek / siliconflow。';
  }
  return `AI 请求失败：${err.message}。请检查网络，或确认 config.js 中的模型名是否可用。`;
}

// ========== 路线规划 ==========
async function generateRoute() {
  const dest = document.getElementById('route-dest').value;
  const type = document.getElementById('route-type').value;
  const selectedDates = getSelectedDates();
  const daysNum = selectedDates.length || 1;

  if (!dest) {
    window.showToast('请先选择目的地城市', 'alert');
    return;
  }
  if (!selectedDates.length) {
    window.showToast('请至少选择一天出行日期', 'alert');
    return;
  }

  // 精选城市走本地离线路线：单日按主题取，多日取 sevenDay 前 N 天
  if (D.routeData[dest]) {
    const cityData = D.routeData[dest];
    let routes;
    if (daysNum > 1 && cityData.sevenDay) {
      routes = cityData.sevenDay.slice(0, daysNum)
        .flatMap((dayRoutes, dayIdx) =>
          dayRoutes.map(route => ({ ...route, day: dayIdx + 1 }))
        );
    } else {
      routes = (cityData[type] || cityData.culture).map(route => ({ ...route, day: 1 }));
    }
    showRouteResult(dest, selectedDates, type, routes);
    return;
  }

  // 其余城市由 AI 实时生成
  if (!getAiConfig()) {
    window.showToast(`"${dest}"的路线需要 AI 实时生成，请先配置免费大模型 API Key`, 'alert');
    openAiSettings();
    return;
  }

  const btn = document.getElementById('route-gen-btn');
  btn.disabled = true;
  btn.textContent = '正在生成…';

  // 开始一次全新生成：停掉可能仍在运行的自动导航，并移除上一个城市的旧地图
  if (navigationInterval) {
    clearInterval(navigationInterval);
    navigationInterval = null;
  }
  destroyRouteMap();

  // 先展示结果区和加载动画
  showRouteOutput();
  document.getElementById('route-result').setAttribute('aria-busy', 'true');
  setRouteMapStatus('正在生成路线，地图将在路线准备好后显示。');
  const daysText = daysNum === 1 ? '1天' : `${daysNum}天`;
  document.getElementById('map-title').innerHTML = `${U.iconSvg('map')}<span>${U.escapeHtml(dest)} · ${daysText}${getRouteTypeText(type)}</span>`;
  document.getElementById('route-summary').innerHTML = `
    <h3>路线概览</h3>
    <div class="ai-loading"><div class="loading-dots"><span></span><span></span><span></span></div><p>AI 正在为你规划${U.escapeHtml(dest)}路线，请稍候…</p></div>`;
  document.getElementById('route-timeline').innerHTML = '';
  document.getElementById('route-tips').innerHTML = '';
  document.getElementById('map-legend').innerHTML = '';
  document.getElementById('nav-start-btn').style.display = 'none';
  document.getElementById('nav-stop-btn').style.display = 'none';

  const center = D.cityCoords[dest] || [35.0, 105.0];
  const dayRangeText = daysNum === 1
    ? '只安排第1天，'
    : `必须包含完整的第1天到第${daysNum}天，`;
  const customPrompt = document.getElementById('route-custom-prompt')?.value?.trim() || '';
  const customHint = customPrompt ? `\n用户额外要求：${customPrompt}` : '';
  const dateRangeText = selectedDates.length > 1 ? `（${selectedDates[0]} 至 ${selectedDates[selectedDates.length - 1]}）` : '';
  const prompt = `你是专业旅行路线规划师。请为用户规划"${dest}"的${getRouteTypeText(type)}（共${daysNum}天${dateRangeText}）。
只返回JSON数组，不要任何其他文字、解释或markdown代码块符号。数组每个元素格式：
{"day":第几天数字,"time":"HH:MM","title":"地点名","desc":"50字以内介绍","category":"landmark|food|nature|photo|shopping","lat":纬度数字,"lng":经度数字,"transport":"与上一站之间的交通方式"}
要求：
1. ${dayRangeText}每天安排4-6个地点；同一天内时间从早到晚、顺序合理、路线顺路；不同天的住宿与动线衔接合理；
2. 数组按天排序：先排完第1天全部地点，再排第2天，以此类推；
3. lat/lng必须是${dest}真实存在的地点坐标（城市中心约在纬度${center[0]}、经度${center[1]}附近），且必须使用GCJ-02火星坐标系（即高德地图/腾讯地图拾取到的坐标），不要使用WGS-84/GPS原始坐标；
4. 地点必须是${dest}真实著名的景点或餐厅，不要虚构。${customHint}`;

  try {
    // 天数越多需要的回复越长，按天放大 max_tokens（上限 6000）
    const routeMaxTokens = Math.min(6000, Math.max(getAiConfig().maxTokens || 1500, 1000 * daysNum + 500));
    const content = await callAI([
      { role: 'system', content: '你是专业旅行路线规划师，严格按用户要求的JSON格式输出，绝不输出多余文字。' },
      { role: 'user', content: prompt }
    ], { maxTokens: routeMaxTokens });
    const routes = parseRouteJson(content, center);
    if (routes && routes.length) {
      showRouteResult(dest, selectedDates, type, routes);
    } else {
      showRouteTextFallback(dest, selectedDates, type, content);
    }
  } catch (err) {
    setRouteMapStatus('路线生成失败，请重试或返回修改目的地。');
    document.getElementById('route-summary').innerHTML = '';
    document.getElementById('route-timeline').innerHTML = `
      <div class="timeline-item ai-error-item">
        <h4>${U.iconSvg('alert')}生成失败</h4>
        <p>${U.escapeHtml(describeAiError(err))}</p>
        <button class="timeline-nav-btn" onclick="generateRoute()">${U.iconSvg('navigation')}<span>重试</span></button>
      </div>`;
  } finally {
    document.getElementById('route-result').setAttribute('aria-busy', 'false');
    btn.disabled = false;
    btn.innerHTML = `${U.iconSvg('sparkles')}<span>AI 生成路线</span>`;
  }
}

// 返回路线输入页
function showRouteInput() {
  stopNavigation();
  document.getElementById('route-result').style.display = 'none';
  document.getElementById('tab-route').classList.remove('has-result');
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.getElementById('route-dest').focus({ preventScroll: true });
}

function showRouteOutput() {
  document.getElementById('tab-route').classList.add('has-result');
  document.getElementById('route-result').style.display = 'block';
  if (document.getElementById('tab-route').classList.contains('active')) {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function setRouteMapStatus(message) {
  const map = document.getElementById('route-map');
  map.classList.add('map-status');
  map.textContent = message;
}

// 解析 AI 返回的路线 JSON，校验并修正坐标
function parseRouteJson(text, center) {
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return null;
    const arr = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(arr)) return null;
    return arr.map((item, idx) => {
      let lat = parseFloat(item.lat);
      let lng = parseFloat(item.lng);
      // AI 偶尔会把经纬度写反：经度落在纬度区间、纬度落在经度区间时交换回来
      if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
        const swapped = lat;
        lat = lng;
        lng = swapped;
      }
      // 校验是否落在合理范围（中国境内粗边界），并距城市中心不超过 2 度；
      // 不满足则回退到市中心附近的规则点，避免把热点甩到国外或海上
      const inChina = lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55;
      if (isNaN(lat) || isNaN(lng) || !inChina || Math.abs(lat - center[0]) > 2 || Math.abs(lng - center[1]) > 2) {
        lat = center[0] + (idx - 2) * 0.01;
        lng = center[1] + (idx % 2 === 0 ? 1 : -1) * idx * 0.008;
      }
      // 统一保留 4 位小数（约 11 米精度），过滤 AI 编造的过量小数位
      lat = Math.round(lat * 1e4) / 1e4;
      lng = Math.round(lng * 1e4) / 1e4;
      return {
        day: Math.max(1, parseInt(item.day, 10) || 1),
        time: String(item.time || ''),
        title: String(item.title || `地点${idx + 1}`),
        desc: String(item.desc || ''),
        category: String(item.category || ''),
        icon: String(item.category || item.icon || 'pin'),
        lat, lng,
        transport: String(item.transport || '')
      };
    }).filter(item => item.title);
  } catch (e) {
    return null;
  }
}

// AI 返回无法解析为结构化路线时，降级为纯文本展示
function showRouteTextFallback(dest, days, type, text) {
  setRouteMapStatus('本次返回文字路线，地点详情请查看行程建议。');
  document.getElementById('route-summary').innerHTML = `
    <h3>路线概览</h3>
    <div class="summary-grid">
      <div class="summary-item"><span class="summary-value">${U.escapeHtml(dest)}</span><span class="summary-label">目的地</span></div>
      <div class="summary-item"><span class="summary-value">${getDaysText(days)}</span><span class="summary-label">行程天数</span></div>
      <div class="summary-item"><span class="summary-value">${getRouteTypeText(type)}</span><span class="summary-label">主题</span></div>
      <div class="summary-item"><span class="summary-value">智能</span><span class="summary-label">路线来源</span></div>
    </div>`;
  document.getElementById('route-timeline').innerHTML = `
    <div class="timeline-item ai-text-item">
      <h4>${U.iconSvg('bot')}AI 路线建议</h4>
      <p class="ai-route-text">${U.escapeHtml(text)}</p>
    </div>`;
  document.getElementById('route-tips').innerHTML = '';
  document.getElementById('map-legend').innerHTML = '';
  document.getElementById('nav-start-btn').style.display = 'none';
}

// 渲染完整路线结果（地图 + 摘要 + 时间线 + 贴士）
function showRouteResult(dest, dates, type, routes) {
  // 重新渲染前先停掉旧路线上的自动导航，防止旧定时器操作新地图
  if (navigationInterval) {
    clearInterval(navigationInterval);
    navigationInterval = null;
  }
  navSequence = [];

  const daysNum = Array.isArray(dates) ? dates.length : 1;
  const daysText = daysNum === 1 ? '1天' : `${daysNum}天`;
  currentRouteData = { dest, dates, type, routes };

  showRouteOutput();
  document.getElementById('map-title').innerHTML = `${U.iconSvg('map')}<span>${U.escapeHtml(dest)} · ${daysText}${getRouteTypeText(type)}</span>`;
  document.getElementById('nav-start-btn').style.display = 'inline-block';
  document.getElementById('nav-stop-btn').style.display = 'none';

  renderRouteMap(dest, routes);
  renderRouteSummary(dest, routes);

  // 按天分组渲染时间线；.timeline-item 保持与 routes 下标一一对应，供地图聚焦使用
  const dayNumbers = [...new Set(routes.map(r => r.day || 1))].sort((a, b) => a - b);
  const timelineHtml = dayNumbers.map(day => {
    const dayRoutes = routes
      .map((route, idx) => ({ route, idx }))
      .filter(item => (item.route.day || 1) === day);
    const heading = dayNumbers.length > 1
      ? `<h3 class="route-day-heading">第 ${day} 天</h3>`
      : '';
    const items = dayRoutes.map(({ route, idx }) => `
    <div class="timeline-item" data-route-idx="${idx}">
      <span class="time-badge">${U.escapeHtml(route.time)}</span>
      <h4><button class="timeline-place-btn" type="button" onclick="focusOnMarker(${idx})">${U.iconFrom(route.icon)}<span>${U.escapeHtml(route.title)}</span></button></h4>
      <p>${U.escapeHtml(route.desc)}</p>
      <div class="place-photo-slot" data-place="${U.escapeHtml(route.title)}" data-city="${U.escapeHtml(dest)}" data-cat="${U.escapeHtml(route.category || '')}"></div>
      ${route.transport ? `<div class="route-transport">${U.iconSvg('train')}<span>${U.escapeHtml(route.transport)}</span></div>` : ''}
      <button class="timeline-nav-btn" onclick="event.stopPropagation();navigateTo(${idx})">${U.iconSvg('navigation')}<span>导航到这里</span></button>
    </div>`).join('');
    return heading + items;
  }).join('');

  document.getElementById('route-timeline').innerHTML = timelineHtml;

  // 挂载景点真实照片（懒加载 Wikipedia/Wikimedia 图片，失败时优雅隐藏）
  window.TripWisePlacePhotos?.mount(document.getElementById('route-timeline'));

  renderRouteTips(dest, routes);

  // 需求6：路线城市同步为「下一站」，触发图文卡/足迹/发现联动
  window.TripWiseNextStop.setCity(dest);
}

function getDaysText(days) {
  return days === '1' ? '一日游' : days === '2' ? '两日游' : days === '3' ? '三日游' : days === '5' ? '五日游' : '七日游';
}

function getRouteTypeText(type) {
  const types = { culture: '文化之旅', food: '美食之旅', nature: '自然探索', photo: '摄影打卡' };
  return types[type] || '文化之旅';
}

// ========== 地图渲染 ==========
// 销毁当前地图实例（AI 重新生成或切换路线时调用，避免旧城市地图残留）
function destroyRouteMap() {
  routeMapVersion++;
  if (routeMap) {
    try { routeMap.remove(); } catch (_) { /* 容器已移除时忽略 */ }
    routeMap = null;
  }
  routeMarkers = [];
  routePolyline = null;
}

async function renderRouteMap(dest, routes) {
  // 清理旧地图
  destroyRouteMap();
  const version = routeMapVersion;
  setRouteMapStatus('正在加载地图，行程详情已可查看。');
  // 等待 Leaflet 异步加载完成；CDN 失败时提示并保留文字时间线
  try {
    await (window.leafletReady || Promise.resolve());
  } catch (_) {
    if (version !== routeMapVersion) return;
    setRouteMapStatus('地图组件加载失败，仍可查看行程并使用“导航到这里”。');
    window.showToast('地图组件加载失败，已为你显示文字路线', 'alert');
    return;
  }
  if (version !== routeMapVersion) return;

  document.getElementById('route-map').classList.remove('map-status');
  document.getElementById('route-map').textContent = '';

  // 底图是高德瓦片（GCJ-02），data.js 离线数据与 AI 返回坐标统一约定为 GCJ-02，
  // 与底图同一坐标系，直接上图，不做转换
  const center = D.cityCoords[dest] || [39.9042, 116.4074];

  routeMap = L.map('route-map').setView(center, 13);

  // 添加地图图层（使用高德地图，国内加载更快）
  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: '1234',
    attribution: '© 高德地图',
    maxZoom: 18
  }).addTo(routeMap);

  const coordinates = [];
  // 不同天用不同颜色区分
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9'];

  // 关键：routeMarkers 与 routes 下标严格对齐，无坐标的点留 null，
  // 保证时间线按钮的 idx 不会错位
  routeMarkers = new Array(routes.length).fill(null);

  routes.forEach((route, idx) => {
    if (route.lat != null && route.lng != null && !Number.isNaN(route.lat) && !Number.isNaN(route.lng)) {
      // 坐标即 GCJ-02，与高德瓦片直接对齐
      const latlng = [route.lat, route.lng];
      coordinates.push(latlng);
      const color = colors[((route.day || 1) - 1) % colors.length];

      const icon = L.divIcon({
        html: `<div style="background:${color};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">${idx + 1}</div>`,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker(latlng, { icon }).addTo(routeMap);
      marker.bindPopup(`
        <div style="text-align:center;padding:8px;">
          <div class="map-popup-icon">${U.iconFrom(route.icon)}</div>
          <h3 style="margin:0 0 4px 0;font-size:14px;">${U.escapeHtml(route.title)}</h3>
          <p style="margin:0;font-size:12px;color:#666;">${U.escapeHtml(route.time)}</p>
          ${route.transport ? `<p class="map-popup-transport">${U.iconSvg('train')}<span>${U.escapeHtml(route.transport)}</span></p>` : ''}
        </div>
      `);

      routeMarkers[idx] = marker;
    }
  });

  // 按天分别绘制连线，避免跨天的点被强行连成一条线
  const dayNumbers = [...new Set(routes.map(r => r.day || 1))].sort((a, b) => a - b);
  dayNumbers.forEach(day => {
    const dayCoords = routes
      .filter(r => (r.day || 1) === day && r.lat != null && r.lng != null)
      .map(r => [r.lat, r.lng]);
    if (dayCoords.length > 1) {
      L.polyline(dayCoords, {
        color: colors[(day - 1) % colors.length],
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(routeMap);
    }
  });
  // 多条按天连线随地图实例统一销毁，无需单独持有引用
  routePolyline = null;

  if (coordinates.length > 0) {
    const bounds = L.latLngBounds(coordinates);
    routeMap.fitBounds(bounds, { padding: [50, 50] });
  }

  renderMapLegend(routes, colors, dayNumbers);
}

function renderMapLegend(routes, colors, dayNumbers = [1]) {
  const legend = document.getElementById('map-legend');
  const multiDay = dayNumbers.length > 1;
  legend.innerHTML = routes.map((route, idx) => {
    const color = colors[((route.day || 1) - 1) % colors.length];
    const dayPrefix = multiDay ? `D${route.day || 1} · ` : '';
    return `
    <div class="legend-item">
      <div class="legend-dot" style="background:${color}"></div>
      <span>${dayPrefix}${idx + 1}. ${U.escapeHtml(route.title)}</span>
    </div>`;
  }).join('');
}

function renderRouteSummary(dest, routes) {
  const summary = document.getElementById('route-summary');
  const totalStops = routes.length;
  const firstStop = routes[0]?.time || '09:00';
  const lastStop = routes[routes.length - 1]?.time || '18:00';
  const dates = currentRouteData?.dates || [];
  const dateDisplay = dates.length ? `${dates[0]}${dates.length > 1 ? ' ~ ' + dates[dates.length - 1] : ''}` : '';

  summary.innerHTML = `
    <h3>路线概览</h3>
    <div class="summary-grid">
      <div class="summary-item">
        <span class="summary-value">${totalStops}</span>
        <span class="summary-label">景点数量</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">${U.escapeHtml(firstStop)}-${U.escapeHtml(lastStop)}</span>
        <span class="summary-label">时间跨度</span>
      </div>
      ${dateDisplay ? `<div class="summary-item"><span class="summary-value">${U.escapeHtml(dateDisplay)}</span><span class="summary-label">出行日期</span></div>` : ''}
      <div class="summary-item">
        <span class="summary-value">${U.escapeHtml(dest)}</span>
        <span class="summary-label">目的地</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">${D.routeData[dest] ? '精选' : '智能'}</span>
        <span class="summary-label">路线来源</span>
      </div>
    </div>
  `;
}

// ========== 出行贴士 ==========
function renderRouteTips(dest, routes) {
  const tipsEl = document.getElementById('route-tips');
  const tips = getRouteTips(dest, routes);

  tipsEl.innerHTML = `
    <h4>${U.iconSvg('idea')}出行贴士</h4>
    <div class="tips-grid">
      ${tips.map(tip => `
        <div class="tip-item">
          <span class="tip-icon">${U.iconFrom(tip.icon)}</span>
          <span>${U.escapeHtml(tip.text)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function getRouteTips(dest, routes) {
  const tips = [
    { icon: 'ticket', text: '建议提前预约门票' },
    { icon: 'train', text: '推荐地铁出行，避开拥堵' },
    { icon: 'phone', text: '下载离线地图备用' },
    { icon: 'droplet', text: '随身携带饮用水' },
    { icon: 'battery', text: '带充电宝保持电量' },
    { icon: 'umbrella', text: '注意防晒/防雨' },
  ];

  if (dest === '北京') {
    tips.push({ icon: 'landmark', text: '故宫周一闭馆' });
    tips.push({ icon: 'wind', text: '春秋季风大注意保暖' });
  } else if (dest === '上海') {
    tips.push({ icon: 'rain', text: '梅雨季备好雨具' });
    tips.push({ icon: 'city', text: '外滩夜景建议19点后' });
  } else if (dest === '成都') {
    tips.push({ icon: 'food', text: '吃辣量力而行' });
    tips.push({ icon: 'place', text: '熊猫基地建议早去' });
  } else if (dest === '贵阳') {
    tips.push({ icon: 'rain', text: '天无三日晴，常备雨具' });
    tips.push({ icon: 'food', text: '酸汤鱼和辣子鸡必尝' });
  } else if (dest === '拉萨') {
    tips.push({ icon: 'wind', text: '注意高原反应，缓慢行动' });
    tips.push({ icon: 'sun', text: '紫外线强，做好防晒' });
  } else if (dest === '三亚' || dest === '厦门' || dest === '北海') {
    tips.push({ icon: 'umbrella', text: '海边游玩注意潮汐时间' });
    tips.push({ icon: 'food', text: '海鲜搭配肠胃药备用' });
  }

  return tips;
}

// ========== 地图交互 ==========
function focusOnMarker(idx) {
  if (routeMarkers[idx] && routeMap) {
    // marker 坐标即 GCJ-02，与底图对齐
    routeMap.setView(routeMarkers[idx].getLatLng(), 15);
    routeMarkers[idx].openPopup();
  }
  // 按 data-route-idx 定位，而不是依赖 .timeline-item 的 DOM 顺序：
  // 多日路线的时间线里混有"第 N 天"标题和离线提示，用下标遍历会错位到别的景点
  document.querySelectorAll('.timeline-item').forEach(item => {
    item.classList.toggle('active', Number(item.dataset.routeIdx) === idx);
  });
}

function navigateTo(idx) {
  if (currentRouteData && currentRouteData.routes[idx]) {
    const route = currentRouteData.routes[idx];
    // uri.amap.com 的 position 参数默认按 GCJ-02（高德坐标）解读，与数据坐标系一致，直接使用
    const lat = route.lat;
    const lng = route.lng;
    if (lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      const url = `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(route.title)}`;
      window.open(url, '_blank');
    }
  }
}

function startNavigation() {
  if (!currentRouteData) return;

  // 收集所有真正有坐标、可聚焦的景点下标（跳过 null 槽位）
  navSequence = currentRouteData.routes
    .map((route, idx) => (route.lat != null && route.lng != null ? idx : -1))
    .filter(idx => idx >= 0 && routeMarkers[idx]);
  if (!navSequence.length) return;

  // 重复点击"开始导航"时先清掉旧定时器，避免叠加多个定时器
  if (navigationInterval) clearInterval(navigationInterval);

  currentNavIndex = 0;
  document.getElementById('nav-start-btn').style.display = 'none';
  document.getElementById('nav-stop-btn').style.display = 'inline-block';

  // 立即聚焦第一个点；之后每 3 秒推进一个，避免首点被聚焦两次
  focusOnMarker(navSequence[0]);
  navigationInterval = setInterval(() => {
    currentNavIndex++;
    if (currentNavIndex < navSequence.length) {
      focusOnMarker(navSequence[currentNavIndex]);
    } else {
      stopNavigation();
    }
  }, 3000);
}

function stopNavigation() {
  if (navigationInterval) {
    clearInterval(navigationInterval);
    navigationInterval = null;
  }
  navSequence = [];
  const startBtn = document.getElementById('nav-start-btn');
  const stopBtn = document.getElementById('nav-stop-btn');
  // 元素在结果区重建期间可能正好缺失，做存在性判断
  if (startBtn) startBtn.style.display = 'inline-block';
  if (stopBtn) stopBtn.style.display = 'none';

  document.querySelectorAll('.timeline-item').forEach(item => {
    item.classList.remove('active');
  });
}

// ========== AI旅行顾问聊天 ==========
let chatHistory = [];
let chatBusy = false;

function getChatSystemPrompt() {
  const dest = document.getElementById('route-dest').value;
  const days = document.getElementById('route-days').value;
  const type = document.getElementById('route-type').value;
  let context = '';
  if (dest) {
    context = `\n用户当前在路线规划里选择的城市是「${dest}」，计划${getDaysText(days)}，偏好${getRouteTypeText(type)}。回答时优先围绕这个城市。`;
  }
  return `你是"TripWise AI旅行顾问"，一位专业、热情、贴心的中文旅行规划助手。请根据用户的实际情况（预算、同行人、天数、偏好、季节等）给出实用建议，包括行程安排、景点推荐、美食推荐、交通方式、住宿建议、预算评估、注意事项等。
要求：回答简洁清晰，控制在400字以内；多用短句和分点（用"1. 2. 3."或"- "）；不要使用emoji或颜文字；如果用户信息不足，先给出通用建议再追问关键信息。${context}`;
}

function renderMarkdown(text, stripEmoji = false) {
  const cleanText = stripEmoji ? String(text).replace(/\p{Extended_Pictographic}\uFE0F?/gu, '').replace(/\uFE0F/g, '') : text;
  let html = U.escapeHtml(cleanText);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^[-•]\s*/gm, '• ');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function appendChatBubble(role, content) {
  const box = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role === 'user' ? 'chat-user' : 'chat-ai'}`;
  bubble.innerHTML = `
    <div class="chat-avatar">${U.iconSvg(role === 'user' ? 'user' : 'bot')}</div>
    <div class="chat-text">${renderMarkdown(content, role !== 'user')}</div>`;
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
  return bubble;
}

function appendLoadingBubble() {
  const box = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-ai';
  bubble.id = 'chat-loading';
  bubble.innerHTML = `
    <div class="chat-avatar">${U.iconSvg('bot')}</div>
    <div class="chat-text"><div class="loading-dots"><span></span><span></span><span></span></div></div>`;
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
}

function removeLoadingBubble() {
  const el = document.getElementById('chat-loading');
  if (el) el.remove();
}

function sendQuickQuestion(btn) {
  if (chatBusy) {
    window.showToast?.('顾问正在回复中，请稍等片刻', 'alert');
    return;
  }
  const input = document.getElementById('chat-input');
  const dest = document.getElementById('route-dest').value;
  let q = btn.textContent;
  if (dest && !q.includes(dest)) {
    q = `我想去${dest}，${q}`;
  }
  input.value = q;
  sendChatMessage();
}

async function sendChatMessage() {
  if (chatBusy) return;
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  if (!getAiConfig()) {
    window.showToast('AI 尚未配置。\n请打开项目目录下的 config.js，按注释填入 API Key 并保存，然后刷新页面。', 'alert');
    return;
  }

  input.value = '';
  appendChatBubble('user', text);
  chatHistory.push({ role: 'user', content: text });

  chatBusy = true;
  document.getElementById('chat-send-btn').disabled = true;
  appendLoadingBubble();

  try {
    // 控制上下文长度，保留最近12轮
    const history = chatHistory.slice(-12);
    const messages = [{ role: 'system', content: getChatSystemPrompt() }, ...history];
    const reply = await callAI(messages);
    chatHistory.push({ role: 'assistant', content: reply });
    removeLoadingBubble();
    appendChatBubble('assistant', reply);
  } catch (err) {
    removeLoadingBubble();
    appendChatBubble('assistant', describeAiError(err));
    chatHistory.pop(); // 移除失败这轮的用户消息，方便重试
  } finally {
    chatBusy = false;
    document.getElementById('chat-send-btn').disabled = false;
  }
}

function initChat() {
  const box = document.getElementById('chat-messages');
  box.innerHTML = `
    <div class="chat-bubble chat-ai">
      <div class="chat-avatar">${U.iconSvg('bot')}</div>
      <div class="chat-text">你好，我是你的 <strong>AI 旅行顾问</strong>。<br>告诉我目的地、天数、同行人和预算，我会为你整理一份贴合实际的建议。<br>也可以先在路线规划页选好城市，我会自动获取上下文。</div>
    </div>`;

  const input = document.getElementById('chat-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
}

// ========== 行李清单 ==========
function generatePackingList() {
  const dest = document.getElementById('packing-dest').value.trim();
  const weather = document.getElementById('packing-weather').value;
  const days = document.getElementById('packing-days').value;

  if (!dest) {
    window.showToast('请输入目的地', 'alert');
    return;
  }

  const categories = [];
  categories.push({ ...D.packingData.essentials });

  const clothesItems = D.packingData.clothes[weather] || D.packingData.clothes.warm;
  categories.push({ name: '衣物', icon: 'shirt', items: [...clothesItems] });

  categories.push({ ...D.packingData.toiletries });
  categories.push({ ...D.packingData.electronics });

  if (document.getElementById('opt-beach').checked) categories.push({ ...D.packingData.beach });
  if (document.getElementById('opt-mountain').checked) categories.push({ ...D.packingData.mountain });
  if (document.getElementById('opt-business').checked) categories.push({ ...D.packingData.business });
  if (document.getElementById('opt-photo').checked) categories.push({ ...D.packingData.photo });

  if (parseInt(days) >= 7) {
    categories[1].items.push('备用衣物套装');
  }

  renderPackingList(categories, dest);
}

// 当前清单对应的目的地，勾选状态按目的地分别持久化
let currentPackingDest = '';
const packingStorageKey = dest => `tripwise-packing#${dest}`;

function renderPackingList(categories, dest) {
  currentPackingDest = dest;
  document.getElementById('packing-result').style.display = 'block';

  // 恢复该目的地之前保存的勾选记录
  const saved = U.readStoredJson(packingStorageKey(dest), {}, value => value && typeof value === 'object' && !Array.isArray(value));

  const listEl = document.getElementById('packing-list');
  listEl.innerHTML = categories.map((cat, catIdx) => `
    <div class="packing-category">
      <h4>${U.iconSvg(cat.icon || 'list')}<span>${U.escapeHtml(cat.name)}</span></h4>
      ${cat.items.map((item, itemIdx) => `
        <div class="packing-item" data-cat="${catIdx}" data-item="${itemIdx}">
          <input type="checkbox" id="item-${catIdx}-${itemIdx}" value="${U.escapeHtml(item)}" onchange="updateProgress()" ${saved[item] ? 'checked' : ''}>
          <label for="item-${catIdx}-${itemIdx}">${U.escapeHtml(item)}</label>
        </div>
      `).join('')}
    </div>
  `).join('');

  updateProgress();
}

function updateProgress() {
  const items = document.querySelectorAll('.packing-item');
  const checked = document.querySelectorAll('.packing-item input:checked');

  items.forEach(item => {
    const input = item.querySelector('input');
    item.classList.toggle('checked', input.checked);
  });

  const total = items.length;
  const done = checked.length;
  const percent = total > 0 ? (done / total * 100) : 0;

  document.getElementById('packing-progress-fill').style.width = percent + '%';
  document.getElementById('packing-progress-text').textContent = `${done}/${total} 已准备`;

  // 把勾选状态按物品名保存下来，重新生成清单时自动恢复
  if (currentPackingDest) {
    const saved = {};
    items.forEach(item => {
      const input = item.querySelector('input');
      if (input.checked) saved[input.value] = true;
    });
    U.storeJson(packingStorageKey(currentPackingDest), saved);
  }
}

// ========== 地标打卡 ==========
let currentCity = '北京';
let checkedLandmarks = U.readStoredJson('checkedLandmarks', {}, value => value && typeof value === 'object' && !Array.isArray(value));

// 打卡记录使用稳定的"城市#地标名"作为 key（数组下标会因为数据增删而错位）
function landmarkKey(city, lm) {
  return `${city}#${lm.name}`;
}

// 一次性迁移：把旧版"城市-下标"格式的记录映射到新 key
function migrateCheckedLandmarks(data) {
  let changed = false;
  const result = {};
  Object.keys(data).forEach(key => {
    if (key.includes('#')) {
      result[key] = data[key];
      return;
    }
    const match = key.match(/^(.+)-(\d+)$/);
    if (match) {
      const lm = D.landmarkData[match[1]]?.[Number(match[2])];
      if (lm) {
        result[landmarkKey(match[1], lm)] = data[key];
        changed = true;
        return;
      }
    }
    result[key] = data[key];
  });
  if (changed) U.storeJson('checkedLandmarks', result);
  return result;
}

checkedLandmarks = migrateCheckedLandmarks(checkedLandmarks);

function initLandmarks() {
  const citySelector = document.getElementById('city-selector');
  citySelector.innerHTML = Object.keys(D.landmarkData).map(city => `
    <button class="city-btn ${city === currentCity ? 'active' : ''}" onclick="selectCity(${U.jsStringArg(city)})">${U.escapeHtml(city)}</button>
  `).join('');

  renderLandmarks();
  updateLandmarkStats();
}

function selectCity(city) {
  currentCity = city;
  document.querySelectorAll('.city-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === city);
  });
  renderLandmarks();
}

function renderLandmarks() {
  const grid = document.getElementById('landmark-grid');
  const landmarks = D.landmarkData[currentCity] || [];

  grid.innerHTML = landmarks.map((lm, idx) => {
    const key = landmarkKey(currentCity, lm);
    const isChecked = Boolean(checkedLandmarks[key]);
    return `
      <button class="landmark-card ${isChecked ? 'checked' : ''}" type="button" aria-pressed="${isChecked}" aria-label="${U.escapeHtml(lm.name)}，${isChecked ? '已打卡' : '未打卡'}" onclick="toggleLandmark(${U.jsStringArg(currentCity)}, ${idx})">
        <span class="landmark-image">${U.iconFrom(lm.icon)}</span>
        <span class="landmark-info">
          <strong>${U.escapeHtml(lm.name)}</strong>
          <span>${U.escapeHtml(lm.desc)}</span>
        </span>
        <span class="landmark-check">${U.iconSvg('check')}</span>
      </button>
    `;
  }).join('');
}

function toggleLandmark(city, idx) {
  const lm = D.landmarkData[city][idx];
  if (!lm) return;
  const key = landmarkKey(city, lm);
  checkedLandmarks[key] = !checkedLandmarks[key];
  U.storeJson('checkedLandmarks', checkedLandmarks);

  renderLandmarks();
  updateLandmarkStats();

  // 需求6：打卡变化同步刷新「下一站」图文卡的到访进度
  if (city === window.TripWiseNextStop.getCity()) renderNextStopCard(city);

  if (checkedLandmarks[key]) {
    showCheckinModal(city, idx);
  }
}

function showCheckinModal(city, idx) {
  const lm = D.landmarkData[city][idx];
  document.getElementById('modal-title').textContent = `打卡成功！`;
  document.getElementById('modal-desc').textContent = `恭喜你打卡了${city}的${lm.name}！`;
  document.getElementById('checkin-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('checkin-modal').style.display = 'none';
}

function updateLandmarkStats() {
  let checked = 0;
  let total = 0;
  const citiesUnlocked = new Set();

  Object.keys(D.landmarkData).forEach(city => {
    total += D.landmarkData[city].length;
    D.landmarkData[city].forEach(lm => {
      if (checkedLandmarks[landmarkKey(city, lm)]) {
        checked++;
        citiesUnlocked.add(city);
      }
    });
  });

  document.getElementById('stat-checked').textContent = checked;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-cities').textContent = citiesUnlocked.size;
}

// ========== 探店盲盒 ==========
function openBlindBox() {
  const city = document.getElementById('blindbox-city').value;
  const shops = D.blindboxData[city] || D.blindboxData.beijing;
  const shop = shops[Math.floor(Math.random() * shops.length)];

  document.getElementById('blindbox-front').style.display = 'none';
  const reveal = document.getElementById('blindbox-reveal');
  reveal.style.display = 'block';

  document.getElementById('reveal-category').textContent = shop.category;
  document.getElementById('reveal-name').textContent = shop.name;
  document.getElementById('reveal-rating').textContent = `${[...shop.rating].filter(char => char === '⭐').length || shop.rating} / 5`;
  document.getElementById('reveal-desc').textContent = shop.desc;
  document.getElementById('reveal-tags').innerHTML = shop.tags.map(t => `<span class="reveal-tag">${U.escapeHtml(t)}</span>`).join('');
  document.getElementById('reveal-tip').innerHTML = `<strong>${U.iconSvg('idea')}小贴士：</strong><span>${U.escapeHtml(shop.tip)}</span>`;

  setTimeout(() => {
    document.getElementById('blindbox-btn').innerHTML = `${U.iconSvg('refresh')}<span>再抽一次</span>`;
  }, 500);
}

// ========== 旅行手账 ==========
let currentStyle = 'cute';

document.querySelectorAll('.journal-styles .style-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.journal-styles .style-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentStyle = this.dataset.style;
  });
});

function generateJournal() {
  const text = document.getElementById('journal-text').value.trim();
  if (!text) {
    window.showToast('请输入旅途文字', 'alert');
    return;
  }

  document.getElementById('journal-output').style.display = 'block';

  const page = document.getElementById('journal-page');
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  document.getElementById('journal-date').innerHTML = `${U.iconSvg('calendar')}<span>${dateStr}</span>`;
  document.getElementById('journal-weather').innerHTML = getJournalWeather();

  const styles = {
    cute: { bg: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', color: '#be185d', stickers: ['sparkles', 'leaf', 'happy'], doodles: ['sun', 'cloud'] },
    retro: { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', stickers: ['camera', 'images', 'palette'], doodles: ['sunset', 'sparkles'] },
    fresh: { bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#065f46', stickers: ['leaf', 'tree', 'waves'], doodles: ['sun', 'cloud'] },
    ink: { bg: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', color: '#1f2937', stickers: ['palette', 'landmark', 'mountain'], doodles: ['leaf', 'wind'] }
  };

  const style = styles[currentStyle];
  page.style.background = style.bg;
  page.style.color = style.color;

  const processedText = U.escapeHtml(text)
    .replace(/。/g, '。<br>');

  document.getElementById('journal-content').innerHTML = processedText;
  document.getElementById('journal-stickers').innerHTML = style.stickers.map(s => `<div>${U.iconSvg(s)}</div>`).join('');
  document.getElementById('journal-doodles').innerHTML = style.doodles.map(d => `<div>${U.iconSvg(d)}</div>`).join('');
}

// 同一天多次生成手账时天气保持一致，避免每点一次就变天
let journalWeatherCache = null;
function getJournalWeather() {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  if (!journalWeatherCache || journalWeatherCache.dateKey !== dateKey) {
    const weathers = [
      { icon: 'sun', label: '晴' },
      { icon: 'cloud-sun', label: '多云' },
      { icon: 'wind', label: '微风' },
      { icon: 'rain', label: '阵雨' }
    ];
    journalWeatherCache = { dateKey, weather: weathers[Math.floor(Math.random() * weathers.length)] };
  }
  const { weather } = journalWeatherCache;
  return `${U.iconSvg(weather.icon)}<span>${weather.label}</span>`;
}

// 基座实现：仅作降级兜底。v2.js 会用带 html2canvas 的完整实现覆盖它，
// 覆盖后会优先走到 v2 的分支，只有 v2 缺失时才落到这里。
// 注意：这里不能假定"没生成手账"——v2 在导出组件缺失时也会调进来，
// 所以按实际状态区分提示，避免给出误导性信息。
function downloadJournal() {
  const output = document.getElementById('journal-output');
  const ready = output && output.style.display !== 'none';
  window.showToast(ready ? '导出组件不可用，请检查网络后重试' : '请先生成手账后再保存图片。', 'alert');
}

function shareJournal() {
  window.showToast('请先生成手账后再分享。', 'alert');
}

// ========== 旅行预算计算器 ==========
function calculateBudget() {
  const dest = document.getElementById('budget-dest').value;
  const people = parseInt(document.getElementById('budget-people').value);
  const days = parseInt(document.getElementById('budget-days').value);
  const hotel = document.getElementById('budget-hotel').value;
  const food = document.getElementById('budget-food').value;
  const transport = document.getElementById('budget-transport').value;

  if (!dest) { window.showToast('请选择目的地', 'alert'); return; }

  const cost = D.cityCostLevel[dest] || D.cityCostLevel['北京'];
  const hotelPerNight = cost.hotel[hotel];
  const foodPerDay = cost.food[food];
  const ticketPerDay = cost.ticket;
  const localTransportPerDay = cost.transport_local;
  const bigTransport = D.transportCost[transport];

  const hotelTotal = hotelPerNight * (days - 1) * Math.ceil(people / 2);
  const foodTotal = foodPerDay * days * people;
  const ticketTotal = ticketPerDay * days * people;
  const localTransportTotal = localTransportPerDay * days * people;
  const bigTransportTotal = bigTransport * people * 2;
  const shoppingBudget = Math.floor((hotelTotal + foodTotal + ticketTotal) * 0.15);
  const total = hotelTotal + foodTotal + ticketTotal + localTransportTotal + bigTransportTotal + shoppingBudget;
  const perPerson = Math.round(total / people);

  document.getElementById('budget-result').style.display = 'block';
  document.getElementById('budget-total-amount').textContent = `¥${total.toLocaleString()}`;
  document.getElementById('budget-per-person').textContent = `人均 ¥${perPerson.toLocaleString()}`;

  const items = [
    { name: '大交通（往返）', icon: 'train', amount: bigTransportTotal, color: '#6366f1', percent: 0 },
    { name: '住宿', icon: 'buildings', amount: hotelTotal, color: '#ec4899', percent: 0 },
    { name: '餐饮', icon: 'food', amount: foodTotal, color: '#f59e0b', percent: 0 },
    { name: '门票', icon: 'ticket', amount: ticketTotal, color: '#10b981', percent: 0 },
    { name: '市内交通', icon: 'train', amount: localTransportTotal, color: '#8b5cf6', percent: 0 },
    { name: '购物/其他', icon: 'store', amount: shoppingBudget, color: '#ef4444', percent: 0 }
  ];
  items.forEach(item => item.percent = Math.round(item.amount / total * 100));
  // 各项四舍五入后合计可能不是 100，把误差调整到占比最大的一项上
  const percentSum = items.reduce((sum, item) => sum + item.percent, 0);
  if (percentSum !== 100 && items.length) {
    const largest = items.reduce((a, b) => (b.percent > a.percent ? b : a), items[0]);
    largest.percent = Math.max(0, largest.percent + (100 - percentSum));
  }

  document.getElementById('budget-breakdown').innerHTML = `
    <h4>${U.iconSvg('wallet')}费用明细</h4>
    ${items.map(item => `
    <div class="budget-item">
      <div class="budget-item-header">
        <span class="budget-item-name">${U.iconSvg(item.icon)}<span>${item.name}</span></span>
        <span class="budget-item-amount">¥${item.amount.toLocaleString()}</span>
      </div>
      <div class="budget-item-bar">
        <div class="budget-item-fill" style="width:${item.percent}%;background:${item.color}"></div>
      </div>
      <span class="budget-item-percent">${item.percent}%</span>
    </div>
  `).join('')}`;

  const tips = getBudgetTips(dest, hotel, food, transport, days);
  document.getElementById('budget-tips').innerHTML = `
    <h4>${U.iconSvg('idea')}省钱小贴士</h4>
    <div class="tips-grid">${tips.map(tip => `<div class="tip-item"><span class="tip-icon">${U.iconFrom(tip.icon)}</span><span>${U.escapeHtml(tip.text)}</span></div>`).join('')}</div>`;
}

function getBudgetTips(dest, hotel, food, transport, days) {
  const tips = [
    { icon: 'ticket', text: '提前网上购票通常比现场便宜10-20%' },
    { icon: 'buildings', text: '工作日住宿比周末便宜30%以上' },
    { icon: 'food', text: '避开景区周边餐厅，本地人去的更实惠' },
    { icon: 'train', text: '办一张当地交通卡，地铁公交都有折扣' },
  ];
  if (transport === 'plane') tips.push({ icon: 'plane', text: '提前2周订票通常最便宜' });
  if (hotel === 'luxury') tips.push({ icon: 'home', text: '豪华型可以考虑民宿，性价比更高' });
  if (days >= 5) tips.push({ icon: 'calendar', text: '5天以上行程建议购买景点联票' });
  const cityTips = {
    '北京': [{ icon: 'landmark', text: '很多博物馆免费，提前预约即可' }],
    '成都': [{ icon: 'place', text: '熊猫基地早上去，门票更值' }],
    '三亚': [{ icon: 'umbrella', text: '11-3月是旺季，避开春节价格减半' }],
    '西安': [{ icon: 'landmark', text: '兵马俑学生票半价' }],
  };
  if (cityTips[dest]) tips.push(...cityTips[dest]);
  return tips;
}

// ========== 手动记账（需求2） ==========
const LEDGER_KEY = 'tripwise-ledger';
const LEDGER_META = {
  food: { label: '餐饮', icon: 'food' },
  transport: { label: '交通', icon: 'train' },
  hotel: { label: '住宿', icon: 'buildings' },
  ticket: { label: '门票', icon: 'ticket' },
  shopping: { label: '购物', icon: 'store' },
  other: { label: '其他', icon: 'wallet' }
};
let ledgerEntries = U.readStoredJson(LEDGER_KEY, [], Array.isArray);

function addLedgerEntry() {
  const amountEl = document.getElementById('ledger-amount');
  const categoryEl = document.getElementById('ledger-category');
  const dateEl = document.getElementById('ledger-date');
  const noteEl = document.getElementById('ledger-note');
  const amount = parseFloat(amountEl.value);
  if (!amount || amount <= 0) { window.showToast('请输入有效金额', 'alert'); return; }

  ledgerEntries.unshift({
    id: Date.now(),
    amount: Math.round(amount * 100) / 100,
    category: categoryEl.value,
    date: dateEl.value || new Date().toISOString().slice(0, 10),
    note: noteEl.value.trim(),
    city: window.TripWiseNextStop.getCity()
  });
  U.storeJson(LEDGER_KEY, ledgerEntries);
  amountEl.value = '';
  noteEl.value = '';
  renderLedger();
  window.showToast('已记一笔', 'wallet');
}

function deleteLedgerEntry(id) {
  if (!confirm('删除这笔记录？')) return;
  ledgerEntries = ledgerEntries.filter(e => e.id !== id);
  U.storeJson(LEDGER_KEY, ledgerEntries);
  renderLedger();
}

function renderLedger() {
  const summary = document.getElementById('ledger-summary');
  const list = document.getElementById('ledger-list');
  if (!summary || !list) return;

  if (ledgerEntries.length === 0) {
    summary.innerHTML = '';
    list.innerHTML = '<p class="ledger-empty">还没有记账，记下旅途的第一笔花费吧。</p>';
    return;
  }

  const total = ledgerEntries.reduce((sum, e) => sum + e.amount, 0);
  const byCat = {};
  ledgerEntries.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  summary.innerHTML = `
    <div class="ledger-total"><span>总支出</span><strong>¥${total.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</strong></div>
    <div class="ledger-cats">${sorted.map(([cat, amt]) => {
      const meta = LEDGER_META[cat] || LEDGER_META.other;
      return `<span class="ledger-cat-chip">${U.iconSvg(meta.icon)}${meta.label} ¥${amt.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</span>`;
    }).join('')}</div>`;

  list.innerHTML = ledgerEntries.map(e => {
    const meta = LEDGER_META[e.category] || LEDGER_META.other;
    return `
    <div class="ledger-item">
      <span class="ledger-item-icon">${U.iconSvg(meta.icon)}</span>
      <div class="ledger-item-main">
        <strong>${U.escapeHtml(meta.label)}${e.note ? ' · ' + U.escapeHtml(e.note) : ''}</strong>
        <small>${U.escapeHtml(e.date)}${e.city ? ' · ' + U.escapeHtml(e.city) : ''}</small>
      </div>
      <span class="ledger-item-amount">-¥${e.amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</span>
      <button class="ledger-item-delete" type="button" aria-label="删除这笔记录" onclick="deleteLedgerEntry(${e.id})">${U.iconSvg('close')}</button>
    </div>`;
  }).join('');
}

// ========== 方言课堂 ==========
function renderDialects() {
  const city = document.getElementById('dialect-city').value;
  const dialects = D.dialectData[city] || [];
  const grid = document.getElementById('dialect-grid');

  grid.innerHTML = dialects.map(d => `
    <div class="dialect-card">
      <div class="dialect-phrase">${U.escapeHtml(d.phrase)}</div>
      <div class="dialect-dialect">${U.escapeHtml(d.dialect)}</div>
      <div class="dialect-pinyin">${U.escapeHtml(d.pinyin)}</div>
      <div class="dialect-meaning">${U.escapeHtml(d.meaning)}</div>
      <div class="dialect-example">例句：${U.escapeHtml(d.example)}</div>
    </div>
  `).join('');
}

function startDialectQuiz() {
  const city = document.getElementById('dialect-city').value;
  const dialects = D.dialectData[city] || [];
  if (dialects.length === 0) return;

  const quiz = dialects[Math.floor(Math.random() * dialects.length)];
  // 先去重再抽样，避免候选项不足 4 个时 while 循环永远空转
  const pool = U.shuffle([...new Set(dialects.map(d => d.dialect))].filter(v => v !== quiz.dialect));
  const options = U.shuffle([quiz.dialect, ...pool.slice(0, 3)]);

  document.getElementById('quiz-question').textContent = `"${quiz.phrase}"用${D.dialectCityNames[city]}话怎么说？`;
  document.getElementById('quiz-options').innerHTML = options.map(opt => `
    <button class="quiz-option" type="button" data-answer="${U.escapeHtml(opt)}">${U.escapeHtml(opt)}</button>
  `).join('');
  document.getElementById('quiz-options').querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => checkQuizAnswer(btn.dataset.answer, quiz.dialect));
  });
  document.getElementById('quiz-result').style.display = 'none';
}

function checkQuizAnswer(selected, correct) {
  const result = document.getElementById('quiz-result');
  result.style.display = 'block';
  if (selected === correct) {
    result.innerHTML = `<span class="quiz-correct">${U.iconSvg('check')}答对了！</span>`;
  } else {
    result.innerHTML = `<span class="quiz-wrong">${U.iconSvg('close')}答错了，正确答案是：${U.escapeHtml(correct)}</span>`;
  }
}

// ========== 旅行日记（原「记忆」，需求3 改名；需求4 心情自由填写；需求8 存档翻页） ==========
let travelMemories = U.readStoredJson('travelMemories', [], Array.isArray);
let diaryView = 'timeline';
let diaryPageIndex = 0;

const MOOD_LABEL = { happy: '开心', excited: '兴奋', peaceful: '平静', touched: '感动', surprised: '惊喜' };
const MOOD_ICON = { happy: 'happy', excited: 'excited', peaceful: 'peaceful', touched: 'touched', surprised: 'surprised' };
function moodText(mood) { return MOOD_LABEL[mood] || mood || '心情'; }
function moodIcon(mood) { return MOOD_ICON[mood] || 'happy'; }

function addMemory() {
  const title = document.getElementById('memory-title').value.trim();
  const location = document.getElementById('memory-location').value.trim();
  const mood = document.getElementById('memory-mood').value.trim();
  const text = document.getElementById('memory-text').value.trim();

  if (!title || !text) {
    window.showToast('请填写标题和正文', 'alert');
    return;
  }

  const memory = {
    id: Date.now(),
    title,
    location,
    mood,
    text,
    date: new Date().toLocaleDateString('zh-CN')
  };

  travelMemories.unshift(memory);
  U.storeJson('travelMemories', travelMemories);

  document.getElementById('memory-title').value = '';
  document.getElementById('memory-location').value = '';
  document.getElementById('memory-mood').value = '';
  document.getElementById('memory-text').value = '';

  renderMemories();
  if (diaryView === 'archive') renderDiaryArchive();
}

function deleteMemory(id) {
  if (confirm('确定要删除这篇日记吗？')) {
    travelMemories = travelMemories.filter(m => m.id !== id);
    U.storeJson('travelMemories', travelMemories);
    renderMemories();
    if (diaryView === 'archive') renderDiaryArchive();
  }
}

function renderMemories() {
  const timeline = document.getElementById('memory-timeline');
  const empty = document.getElementById('memory-empty');
  if (!timeline) return;

  if (diaryView === 'archive') {
    timeline.style.display = 'none';
    if (empty) empty.style.display = 'none';
    renderDiaryArchive();
    return;
  }

  if (travelMemories.length === 0) {
    timeline.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }

  timeline.style.display = 'block';
  if (empty) empty.style.display = 'none';

  timeline.innerHTML = travelMemories.map(m => `
    <div class="memory-item">
      <div class="memory-date">${U.escapeHtml(m.date)}</div>
      <div class="memory-content">
        <div class="memory-header">
          <h3>${U.escapeHtml(m.title)}</h3>
          <span class="memory-mood" title="旅行心情">${U.iconSvg(moodIcon(m.mood))}<span class="memory-mood-text">${U.escapeHtml(moodText(m.mood))}</span></span>
        </div>
        ${m.location ? `<div class="memory-location">${U.iconSvg('pin')}<span>${U.escapeHtml(m.location)}</span></div>` : ''}
        <p class="memory-text">${U.escapeHtml(m.text)}</p>
        <button class="memory-delete" onclick="deleteMemory(${m.id})">删除</button>
      </div>
    </div>
  `).join('');
}

// 需求8：存档视图，一篇一页
function switchDiaryView(view) {
  diaryView = view;
  const timelineBtn = document.getElementById('diary-view-timeline');
  const archiveBtn = document.getElementById('diary-view-archive');
  const book = document.getElementById('diary-book');
  const input = document.querySelector('.memory-input');
  if (timelineBtn) timelineBtn.classList.toggle('active', view === 'timeline');
  if (archiveBtn) archiveBtn.classList.toggle('active', view === 'archive');
  if (book) book.hidden = view !== 'archive';
  if (input) input.style.display = view === 'archive' ? 'none' : '';
  renderMemories();
}

function renderDiaryArchive() {
  const stage = document.getElementById('diary-book-stage');
  const indicator = document.getElementById('diary-page-indicator');
  if (!stage) return;

  if (travelMemories.length === 0) {
    stage.innerHTML = '<div class="diary-page diary-page-empty"><p>还没有日记，回到「时间线」写下第一篇吧！</p></div>';
    if (indicator) indicator.textContent = '第 0 / 0 页';
    return;
  }

  if (diaryPageIndex < 0) diaryPageIndex = 0;
  if (diaryPageIndex >= travelMemories.length) diaryPageIndex = travelMemories.length - 1;
  const m = travelMemories[diaryPageIndex];

  stage.innerHTML = `
    <div class="journal-page diary-page">
      <div class="diary-page-no">${diaryPageIndex + 1} / ${travelMemories.length}</div>
      <div class="diary-page-date">${U.escapeHtml(m.date)}</div>
      <div class="diary-page-mood">${U.iconSvg(moodIcon(m.mood))}<span>${U.escapeHtml(moodText(m.mood))}</span></div>
      <h3 class="diary-page-title">${U.escapeHtml(m.title)}</h3>
      ${m.location ? `<div class="diary-page-location">${U.iconSvg('pin')}<span>${U.escapeHtml(m.location)}</span></div>` : ''}
      <p class="diary-page-text">${U.escapeHtml(m.text)}</p>
      <button class="memory-delete" onclick="deleteMemory(${m.id})">删除本页</button>
    </div>`;
  if (indicator) indicator.textContent = `第 ${diaryPageIndex + 1} / ${travelMemories.length} 页`;
}

function diaryPageStep(delta) {
  diaryPageIndex += delta;
  renderDiaryArchive();
}

// ========== 旅行天气助手 ==========
function checkWeather() {
  const city = document.getElementById('weather-city').value;
  const data = D.cityWeatherData[city] || D.cityWeatherData['北京'];

  document.getElementById('weather-result').style.display = 'block';
  document.getElementById('weather-city-name').textContent = city;
  document.getElementById('weather-temp').textContent = data.temp;
  document.getElementById('weather-condition').textContent = data.weather;
  document.getElementById('weather-tip').textContent = data.tip;
  document.getElementById('weather-best').textContent = data.best;
}

// ========== 城市冷知识问答 ==========
function startCityTrivia() {
  const city = document.getElementById('trivia-city').value;
  const questions = D.cityTriviaData[city] || [];
  if (questions.length === 0) return;

  const q = questions[Math.floor(Math.random() * questions.length)];
  const options = U.shuffle(q.options);

  document.getElementById('trivia-question').textContent = q.q;
  document.getElementById('trivia-options').innerHTML = options.map(opt => `
    <button class="trivia-option" type="button" data-answer="${U.escapeHtml(opt)}">${U.escapeHtml(opt)}</button>
  `).join('');
  document.getElementById('trivia-options').querySelectorAll('.trivia-option').forEach(btn => {
    btn.addEventListener('click', () => checkTriviaAnswer(btn.dataset.answer, q.a));
  });
  document.getElementById('trivia-result').style.display = 'none';
}

function checkTriviaAnswer(selected, correct) {
  const result = document.getElementById('trivia-result');
  result.style.display = 'block';
  if (selected === correct) {
    result.innerHTML = `<span class="trivia-correct">${U.iconSvg('check')}答对了！</span>`;
  } else {
    result.innerHTML = `<span class="trivia-wrong">${U.iconSvg('close')}答错了，正确答案是：${U.escapeHtml(correct)}</span>`;
  }
}

// ========== 发现页：与「下一站」同步，直接展示城市内容 ==========
let discoveryToken = 0;
async function renderDiscovery(city) {
  const wrap = document.getElementById('discovery-content');
  if (!wrap) return;
  const token = ++discoveryToken;

  const nameEl = document.getElementById('discovery-city-name');
  if (nameEl) nameEl.textContent = city;

  const setBtn = document.getElementById('discovery-set-stop');
  if (setBtn) {
    const isCurrent = city === window.TripWiseNextStop.getCity();
    setBtn.disabled = isCurrent;
    setBtn.textContent = isCurrent ? '当前下一站' : '设为下一站';
    setBtn.onclick = () => window.TripWiseNextStop.setCity(city);
  }

  // 热门景点：优先本地地标数据，其次精选路线文化点
  const spotsEl = document.getElementById('discovery-spots');
  if (spotsEl) {
    let spots = (D.landmarkData[city] || []).map(lm => lm.name);
    if (!spots.length && D.routeData[city]) spots = (D.routeData[city].culture || []).map(r => r.title);
    if (!spots.length && D.routeData[city] && D.routeData[city].sevenDay) {
      spots = D.routeData[city].sevenDay[0].flatMap(dayRoutes => dayRoutes.map(r => r.title));
    }
    spotsEl.innerHTML = spots.length
      ? spots.slice(0, 8).map(s => `<span class="spot-chip">${U.escapeHtml(s)}</span>`).join('')
      : '<span class="nextstop-empty">该城市暂无整理好的景点清单</span>';
  }

  // 冷知识问答：若城市在 16 城题库中则自动出题，免用户点击
  const triviaSelect = document.getElementById('trivia-city');
  if (triviaSelect) {
    if (!Array.from(triviaSelect.options).some(o => o.value === city)) {
      const opt = document.createElement('option');
      opt.value = city; opt.textContent = city;
      triviaSelect.appendChild(opt);
    }
    triviaSelect.value = city;
    if (D.cityTriviaData[city]) startCityTrivia();
    else {
      document.getElementById('trivia-question').textContent = '';
      document.getElementById('trivia-options').innerHTML = '';
      document.getElementById('trivia-result').style.display = 'none';
    }
  }

  // 美食/文化：复用图文聚合器
  const foodEl = document.getElementById('discovery-food');
  const cultureEl = document.getElementById('discovery-culture');
  if (foodEl) foodEl.innerHTML = '<li class="nextstop-loading">正在加载…</li>';
  const insight = await loadCityInsight(city);
  if (token !== discoveryToken) return;
  if (foodEl) {
    foodEl.innerHTML = insight.food.length
      ? insight.food.map(f => `<li><strong>${U.escapeHtml(f.name)}</strong><span>${U.escapeHtml(f.desc)}</span></li>`).join('')
      : '<li class="nextstop-empty">暂无美食资料</li>';
  }
  if (cultureEl) {
    cultureEl.innerHTML = insight.culture.length
      ? insight.culture.map(c => `<li><strong>${U.escapeHtml(c.title)}</strong><span>${U.escapeHtml(c.text)}</span></li>`).join('')
      : '<li class="nextstop-empty">暂无文化资料</li>';
  }
}

// ========== 初始化 ==========
initCitySelect();
initDateCheckboxes();
initLandmarks();
initChat();
updateAiStatus();
renderDialects();
startDialectQuiz();
renderMemories();

// —— 下一站联动：图文卡 / 发现页 / 足迹城市跟随订阅 ——
window.TripWiseNextStop.onChange(city => {
  renderNextStopCard(city);
  renderDiscovery(city);
  if (D.landmarkData[city]) selectCity(city);
});
renderNextStopCard(window.TripWiseNextStop.getCity());
renderDiscovery(window.TripWiseNextStop.getCity());

// —— 日记视图切换与翻页（需求8） ——
document.getElementById('diary-view-timeline')?.addEventListener('click', () => switchDiaryView('timeline'));
document.getElementById('diary-view-archive')?.addEventListener('click', () => { diaryPageIndex = 0; switchDiaryView('archive'); });
document.getElementById('diary-prev')?.addEventListener('click', () => diaryPageStep(-1));
document.getElementById('diary-next')?.addEventListener('click', () => diaryPageStep(1));
document.getElementById('diary-book-stage')?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') diaryPageStep(-1);
  if (e.key === 'ArrowRight') diaryPageStep(1);
});

// —— 发现页手动换城市浏览（不改「下一站」） ——
document.getElementById('trivia-city')?.addEventListener('change', (e) => renderDiscovery(e.target.value));

// —— 手动记账初始化（需求2） ——
const ledgerDate = document.getElementById('ledger-date');
if (ledgerDate) ledgerDate.value = new Date().toISOString().slice(0, 10);
renderLedger();

// ========== 路线景点照片模块 ==========
// 时间线卡片内嵌实景图，三级策略：
// ① 本地预置景点图（assets/spots/，spot-photos.js 清单，支持别名/子串匹配，零网络）
// ② 未命中则本地占位（城市大图 + 景点名标签，任何环境必显示，永不灰块）
// ③ 配置了 pixabayApiKey 时后台查 Pixabay 真实照片替换占位（可选增强）
// 注：ModelScope/Trae 等文生图端点的浏览器直连均被 CORS 自定义头或匿名策略拦截，不可用
window.TripWisePlacePhotos = (function () {
  'use strict';

  const CACHE_PREFIX = 'tripwise-place-photo:v3:';
  const CACHE_MAX = 200;
  const CONCURRENCY = 3;
  const FETCH_TIMEOUT = 8000;

  const sessionCache = new Map(); // key -> {url} | null
  let consecutiveFails = 0;

  // —— localStorage 持久化（只存 URL 元数据，不存 dataUrl，控制配额占用）——
  function readCache(key) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return undefined;
      return JSON.parse(raw).v; // 可能是 null（已确认无图）
    } catch (_) { return undefined; }
  }

  function writeCache(key, value) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
      if (keys.length > CACHE_MAX) {
        keys.sort((a, b) => (JSON.parse(localStorage.getItem(a)).t || 0) - (JSON.parse(localStorage.getItem(b)).t || 0));
        keys.slice(0, keys.length - CACHE_MAX).forEach(k => localStorage.removeItem(k));
      }
    } catch (_) { /* 配额满则放弃缓存 */ }
  }

  // —— 并发队列 ——
  const queue = [];
  let inflight = 0;
  function schedule(task) {
    queue.push(task);
    pump();
  }
  function pump() {
    while (inflight < CONCURRENCY && queue.length) {
      inflight++;
      queue.shift()().finally(() => { inflight--; pump(); });
    }
  }

  function fetchWithTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  // —— Pixabay API（国内可访问的真实照片库，key 在 config.js 的 pixabayApiKey 配置）——
  async function fetchPixabayPhoto(city, place, apiKey) {
    const queries = [place, `${city} ${place}`];
    for (const q of queries) {
      const url = `https://pixabay.com/api/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3&lang=zh`;
      try {
        const res = await fetchWithTimeout(url, FETCH_TIMEOUT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const hit = data.hits?.[0];
        if (hit?.webformatURL) {
          consecutiveFails = 0;
          return { url: hit.webformatURL, width: hit.webformatWidth, height: hit.webformatHeight };
        }
        // 有响应但无结果，尝试下一个查询词
      } catch (_) {
        consecutiveFails++;
      }
    }
    return null;
  }

  // —— 本地占位：优先按类别主题图（不同类别不同图），无类别回退城市大图 + 景点名 ——
  function renderPlaceholder(slotEl) {
    slotEl.classList.remove('is-loading');
    slotEl.classList.add('has-placeholder');
    const themeUrl = themePhotoSrc(slotEl.dataset.cat);
    slotEl.style.backgroundImage = `url("${themeUrl || cityPhotoSrc(slotEl.dataset.city)}")`;
    const label = document.createElement('span');
    label.className = 'photo-placeholder-label';
    label.textContent = slotEl.dataset.place;
    slotEl.appendChild(label);
  }

  function applyResult(slotEl, result) {
    slotEl.classList.remove('is-loading');
    if (!result || !result.url) return; // 查无照片：保持占位，不隐藏
    slotEl.querySelectorAll('img, .photo-placeholder-label').forEach(n => n.remove());
    slotEl.classList.remove('has-placeholder');
    slotEl.style.backgroundImage = '';
    const img = document.createElement('img');
    img.src = result.url;
    img.alt = `${slotEl.dataset.place}实景照片`;
    img.loading = 'lazy';
    img.onload = () => img.classList.add('loaded');
    img.onerror = () => { img.remove(); renderPlaceholder(slotEl); }; // 图挂了退回占位
    slotEl.appendChild(img);
  }

  // 本地清单匹配：精确 → 子串（AI 生成的景点名常带前后缀，如「故宫博物院」「岳麓山风景名胜区」）
  // 取匹配成功的最长键，降低误配概率
  function matchSpotPhoto(city, place) {
    const map = window.TRIPWISE_SPOT_PHOTOS?.[city];
    if (!map || !place) return null;
    if (map[place]) return map[place];
    let best = null;
    let bestLen = 0;
    for (const key in map) {
      if (key.length >= 2 && place.includes(key)) {
        if (key.length > bestLen) { best = map[key]; bestLen = key.length; }
      } else if (place.length >= 2 && key.includes(place)) {
        if (place.length > bestLen) { best = map[key]; bestLen = place.length; }
      }
    }
    return best;
  }

  async function loadPhoto(slotEl) {
    const place = slotEl.dataset.place;
    const city = slotEl.dataset.city;

    // 本地预下载的真实照片优先（assets/spots/，无需任何 API）
    const localPath = matchSpotPhoto(city, place);
    if (localPath) { applyResult(slotEl, { url: localPath }); return; }

    // ① 占位立即显示，卡片永不空窗
    renderPlaceholder(slotEl);

    // ② 配置了 Pixabay key 才发起网络查询，成功则替换占位
    const pixabayKey = window.TRIPWISE_CONFIG?.pixabayApiKey?.trim();
    if (!pixabayKey) return;

    const key = `${city}#${place}`;
    if (sessionCache.has(key)) { applyResult(slotEl, sessionCache.get(key)); return; }
    const stored = readCache(key);
    if (stored !== undefined) {
      sessionCache.set(key, stored);
      applyResult(slotEl, stored);
      return;
    }

    schedule(async () => {
      const result = await fetchPixabayPhoto(city, place, pixabayKey);
      sessionCache.set(key, result);
      writeCache(key, result);
      applyResult(slotEl, result);
    });
  }

  // —— 挂载入口：照片多为本地小文件，挂载即加载；img 的 loading="lazy" 负责视口外延迟解码 ——
  // （此前用 IntersectionObserver，但空槽高度为 0 时 threshold 触发不稳定，已弃用）
  function mount(timelineEl) {
    if (!timelineEl) return;
    timelineEl.querySelectorAll('.place-photo-slot').forEach(slot => loadPhoto(slot));
  }

  return { mount };
})();
