// 数据层与工具层已拆分至 data.js / utils.js（第二阶段架构优化）
const D = window.TripWiseData;
const U = window.TripWiseUtils;

// ========== Tab切换 ==========
function switchTab(tabName) {
  // 离开路线页时停止自动导航，避免定时器在后台继续操作地图
  if (tabName !== 'route' && typeof stopNavigation === 'function') stopNavigation();

  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ========== 地图相关变量 ==========
let routeMap = null;
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

  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: cfg.temperature,
      max_tokens: overrides.maxTokens || cfg.maxTokens
    })
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error('INVALID_KEY');
    throw new Error(`API请求失败（${res.status}）`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI返回内容为空');
  return content;
}

function describeAiError(err) {
  if (err.message === 'NO_CONFIG') return 'AI 尚未配置：请打开项目目录下的 config.js，把 API Key 填入 apiKey 字段并保存，刷新页面即可。';
  if (err.message === 'INVALID_KEY') return 'API Key 无效或额度不足，请检查 config.js 中的 apiKey 是否填写正确（需先在平台完成实名认证）。';
  return `AI 请求失败：${err.message}。请检查网络，或确认 config.js 中的模型名是否可用。`;
}

// ========== 路线规划 ==========
async function generateRoute() {
  const dest = document.getElementById('route-dest').value;
  const days = document.getElementById('route-days').value;
  const type = document.getElementById('route-type').value;

  if (!dest) {
    window.showToast('请先选择目的地城市', 'alert');
    return;
  }

  // 精选城市走本地离线路线：单日按主题取，多日取 sevenDay 前 N 天
  if (D.routeData[dest]) {
    const cityData = D.routeData[dest];
    const daysNum = parseInt(days, 10) || 1;
    let routes;
    if (daysNum > 1 && cityData.sevenDay) {
      routes = cityData.sevenDay.slice(0, daysNum)
        .flatMap((dayRoutes, dayIdx) =>
          dayRoutes.map(route => ({ ...route, day: dayIdx + 1 }))
        );
    } else {
      routes = (cityData[type] || cityData.culture).map(route => ({ ...route, day: 1 }));
    }
    showRouteResult(dest, days, type, routes);
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
  document.getElementById('route-result').style.display = 'block';
  document.getElementById('map-title').innerHTML = `${U.iconSvg('map')}<span>${U.escapeHtml(dest)} · ${getDaysText(days)}${getRouteTypeText(type)}</span>`;
  document.getElementById('route-summary').innerHTML = `
    <h3>路线概览</h3>
    <div class="ai-loading"><div class="loading-dots"><span></span><span></span><span></span></div><p>AI 正在为你规划${U.escapeHtml(dest)}路线，请稍候…</p></div>`;
  document.getElementById('route-timeline').innerHTML = '';
  document.getElementById('route-tips').innerHTML = '';
  document.getElementById('map-legend').innerHTML = '';
  document.getElementById('nav-start-btn').style.display = 'none';
  document.getElementById('nav-stop-btn').style.display = 'none';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('route-result').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  const center = D.cityCoords[dest] || [35.0, 105.0];
  const daysNum = parseInt(days, 10) || 1;
  const dayRangeText = daysNum === 1
    ? '只安排第1天，'
    : `必须包含完整的第1天到第${daysNum}天，`;
  const prompt = `你是专业旅行路线规划师。请为用户规划"${dest}"的${getRouteTypeText(type)}（${getDaysText(days)}，共${daysNum}天）。
只返回JSON数组，不要任何其他文字、解释或markdown代码块符号。数组每个元素格式：
{"day":第几天数字,"time":"HH:MM","title":"地点名","desc":"50字以内介绍","category":"landmark|food|nature|photo|shopping","lat":纬度数字,"lng":经度数字,"transport":"与上一站之间的交通方式"}
要求：
1. ${dayRangeText}每天安排4-6个地点；同一天内时间从早到晚、顺序合理、路线顺路；不同天的住宿与动线衔接合理；
2. 数组按天排序：先排完第1天全部地点，再排第2天，以此类推；
3. lat/lng必须是${dest}真实存在的地点坐标（城市中心约在纬度${center[0]}、经度${center[1]}附近），且必须使用GCJ-02火星坐标系（即高德地图/腾讯地图拾取到的坐标），不要使用WGS-84/GPS原始坐标；
4. 地点必须是${dest}真实著名的景点或餐厅，不要虚构。`;

  try {
    // 天数越多需要的回复越长，按天放大 max_tokens（上限 6000）
    const routeMaxTokens = Math.min(6000, Math.max(getAiConfig().maxTokens || 1500, 1000 * daysNum + 500));
    const content = await callAI([
      { role: 'system', content: '你是专业旅行路线规划师，严格按用户要求的JSON格式输出，绝不输出多余文字。' },
      { role: 'user', content: prompt }
    ], { maxTokens: routeMaxTokens });
    const routes = parseRouteJson(content, center);
    if (routes && routes.length) {
      showRouteResult(dest, days, type, routes);
    } else {
      showRouteTextFallback(dest, days, type, content);
    }
  } catch (err) {
    document.getElementById('route-summary').innerHTML = '';
    document.getElementById('route-timeline').innerHTML = `
      <div class="timeline-item ai-error-item">
        <h4>${U.iconSvg('alert')}生成失败</h4>
        <p>${U.escapeHtml(describeAiError(err))}</p>
      </div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '生成路线';
  }
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
function showRouteResult(dest, days, type, routes) {
  // 重新渲染前先停掉旧路线上的自动导航，防止旧定时器操作新地图
  if (navigationInterval) {
    clearInterval(navigationInterval);
    navigationInterval = null;
  }
  navSequence = [];

  currentRouteData = { dest, days, type, routes };

  document.getElementById('route-result').style.display = 'block';
  document.getElementById('map-title').innerHTML = `${U.iconSvg('map')}<span>${U.escapeHtml(dest)} · ${getDaysText(days)}${getRouteTypeText(type)}</span>`;
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
      ${route.transport ? `<div class="route-transport">${U.iconSvg('train')}<span>${U.escapeHtml(route.transport)}</span></div>` : ''}
      <button class="timeline-nav-btn" onclick="event.stopPropagation();navigateTo(${idx})">${U.iconSvg('navigation')}<span>导航到这里</span></button>
    </div>`).join('');
    return heading + items;
  }).join('');

  document.getElementById('route-timeline').innerHTML = timelineHtml;

  renderRouteTips(dest, routes);
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
  // 等待 Leaflet 异步加载完成；CDN 失败时提示并保留文字时间线
  try {
    await (window.leafletReady || Promise.resolve());
  } catch (_) {
    window.showToast('地图组件加载失败，已为你显示文字路线', 'alert');
    return;
  }

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

document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
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

// ========== 旅行记忆墙 ==========
let travelMemories = U.readStoredJson('travelMemories', [], Array.isArray);

function addMemory() {
  const title = document.getElementById('memory-title').value.trim();
  const location = document.getElementById('memory-location').value.trim();
  const mood = document.getElementById('memory-mood').value;
  const text = document.getElementById('memory-text').value.trim();

  if (!title || !text) {
    window.showToast('请填写标题和感受', 'alert');
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
  document.getElementById('memory-text').value = '';

  renderMemories();
}

function deleteMemory(id) {
  if (confirm('确定要删除这条记忆吗？')) {
    travelMemories = travelMemories.filter(m => m.id !== id);
    U.storeJson('travelMemories', travelMemories);
    renderMemories();
  }
}

function renderMemories() {
  const timeline = document.getElementById('memory-timeline');
  const empty = document.getElementById('memory-empty');

  if (travelMemories.length === 0) {
    timeline.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  timeline.style.display = 'block';
  empty.style.display = 'none';

  const moodIcons = {
    happy: 'happy',
    excited: 'excited',
    peaceful: 'peaceful',
    touched: 'touched',
    surprised: 'surprised'
  };

  timeline.innerHTML = travelMemories.map(m => `
    <div class="memory-item">
      <div class="memory-date">${U.escapeHtml(m.date)}</div>
      <div class="memory-content">
        <div class="memory-header">
          <h3>${U.escapeHtml(m.title)}</h3>
          <span class="memory-mood" title="旅行心情">${U.iconSvg(moodIcons[m.mood] || 'happy')}</span>
        </div>
        ${m.location ? `<div class="memory-location">${U.iconSvg('pin')}<span>${U.escapeHtml(m.location)}</span></div>` : ''}
        <p class="memory-text">${U.escapeHtml(m.text)}</p>
        <button class="memory-delete" onclick="deleteMemory(${m.id})">删除</button>
      </div>
    </div>
  `).join('');
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

// ========== 初始化 ==========
initCitySelect();
initLandmarks();
initChat();
updateAiStatus();
renderDialects();
startDialectQuiz();
renderMemories();
