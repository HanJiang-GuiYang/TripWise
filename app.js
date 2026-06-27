// ========== Tab切换 ==========
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ========== 地图相关变量 ==========
let routeMap = null;
let routeMarkers = [];
let routePolyline = null;
let navigationInterval = null;
let currentRouteData = null;
let currentNavIndex = 0;

// ========== 路线规划 ==========
// 城市中心坐标
const cityCoords = {
  '北京': [39.9042, 116.4074],
  '上海': [31.2304, 121.4737],
  '成都': [30.5728, 104.0668],
  '贵阳': [26.6470, 106.6302],
  '广州': [23.1291, 113.2644],
  '杭州': [30.2741, 120.1551],
  '厦门': [24.4798, 118.0894]
};

const routeData = {
  '北京': {
    culture: [
      { time: '09:00', title: '故宫博物院', desc: '游览紫禁城，感受600年皇家气派。建议从午门进入，沿中轴线参观三大殿。', icon: '🏯', lat: 39.9163, lng: 116.3972, transport: '步行' },
      { time: '12:00', title: '四季民福烤鸭店', desc: '品尝正宗北京烤鸭，推荐故宫店，景观位可边吃边看故宫角楼。', icon: '🦆', lat: 39.9242, lng: 116.3983, transport: '步行10分钟' },
      { time: '14:00', title: '景山公园', desc: '登万春亭俯瞰故宫全景，视野开阔，是拍照的绝佳位置。', icon: '⛰️', lat: 39.9250, lng: 116.3889, transport: '步行15分钟' },
      { time: '16:00', title: '南锣鼓巷', desc: '漫步老北京胡同，体验文艺小店和特色小吃。', icon: '🏘️', lat: 39.9370, lng: 116.4030, transport: '地铁8号线' }
    ],
    food: [
      { time: '09:00', title: '护国寺小吃', desc: '品尝豆汁、焦圈、艾窝窝等传统北京早餐。', icon: '🥟', lat: 39.9389, lng: 116.3733, transport: '地铁4号线' },
      { time: '11:00', title: '牛街', desc: '探访清真美食街，品尝白记年糕、洪记小吃。', icon: '🍜', lat: 39.8914, lng: 116.3658, transport: '地铁7号线' },
      { time: '14:00', title: '大董烤鸭', desc: '高端烤鸭体验，酥不腻烤鸭是招牌。', icon: '🦆', lat: 39.9089, lng: 116.4356, transport: '地铁1号线' },
      { time: '17:00', title: '簋街', desc: '夜幕降临后的美食街，麻辣小龙虾是必点。', icon: '🦞', lat: 39.9407, lng: 116.4178, transport: '地铁5号线' }
    ],
    nature: [
      { time: '08:00', title: '颐和园', desc: '游览皇家园林，昆明湖泛舟，长廊赏画。', icon: '🏞️', lat: 39.9996, lng: 116.2751, transport: '地铁4号线' },
      { time: '12:00', title: '圆明园', desc: '参观遗址公园，感受历史沧桑。', icon: '🏛️', lat: 40.0085, lng: 116.3100, transport: '步行20分钟' },
      { time: '15:00', title: '奥林匹克森林公园', desc: '城市绿肺，骑行或散步放松身心。', icon: '🌳', lat: 40.0236, lng: 116.3889, transport: '地铁8号线' }
    ],
    photo: [
      { time: '06:00', title: '角楼日出', desc: '拍摄故宫角楼倒影，最佳摄影点。', icon: '📸', lat: 39.9242, lng: 116.3889, transport: '步行' },
      { time: '10:00', title: '红墙黄瓦', desc: '故宫内拍摄经典皇家建筑元素。', icon: '🏯', lat: 39.9163, lng: 116.3972, transport: '步行10分钟' },
      { time: '15:00', title: '798艺术区', desc: '工业风与艺术的碰撞，拍照圣地。', icon: '🎨', lat: 39.9842, lng: 116.4953, transport: '地铁14号线' },
      { time: '18:00', title: '什刹海黄昏', desc: '银锭桥上看日落，老北京风情。', icon: '🌅', lat: 39.9407, lng: 116.3875, transport: '地铁6号线' }
    ]
  },
  '上海': {
    culture: [
      { time: '09:00', title: '外滩万国建筑群', desc: '欣赏52栋风格迥异的古典复兴大楼。', icon: '🏛️', lat: 31.2400, lng: 121.4900, transport: '地铁2号线' },
      { time: '11:00', title: '豫园', desc: '明代古典园林，江南园林艺术精华。', icon: '🏯', lat: 31.2272, lng: 121.4925, transport: '步行15分钟' },
      { time: '14:00', title: '上海博物馆', desc: '青铜器、陶瓷、书画馆藏丰富。', icon: '🏛️', lat: 31.2300, lng: 121.4737, transport: '地铁1号线' },
      { time: '17:00', title: '田子坊', desc: '文艺小店聚集，石库门建筑风情。', icon: '🎨', lat: 31.2100, lng: 121.4680, transport: '地铁9号线' }
    ],
    food: [
      { time: '08:00', title: '南翔馒头店', desc: '百年老店，小笼包必尝。', icon: '🥟', lat: 31.2272, lng: 121.4925, transport: '地铁10号线' },
      { time: '11:00', title: '老城隍庙', desc: '品尝上海传统小吃。', icon: '🍜', lat: 31.2267, lng: 121.4894, transport: '步行5分钟' },
      { time: '14:00', title: '和平饭店', desc: '英式下午茶体验。', icon: '☕', lat: 31.2408, lng: 121.4897, transport: '地铁2号线' },
      { time: '18:00', title: '新天地', desc: '石库门里的时尚餐厅。', icon: '🍷', lat: 31.2200, lng: 121.4737, transport: '地铁10号线' }
    ],
    nature: [
      { time: '09:00', title: '辰山植物园', desc: '华东最大植物园，四季花开。', icon: '🌸', lat: 31.0833, lng: 121.2167, transport: '地铁9号线' },
      { time: '13:00', title: '佘山国家森林公园', desc: '上海陆上最高峰，登高望远。', icon: '⛰️', lat: 31.0833, lng: 121.1833, transport: '公交' },
      { time: '16:00', title: '滴水湖', desc: '人工湖景，海风吹拂。', icon: '🌊', lat: 30.9167, lng: 121.8833, transport: '地铁16号线' }
    ],
    photo: [
      { time: '06:00', title: '外滩晨光', desc: '浦东天际线日出。', icon: '🌅', lat: 31.2400, lng: 121.4900, transport: '地铁2号线' },
      { time: '10:00', title: '武康路', desc: '法式梧桐下的老洋房。', icon: '🏘️', lat: 31.2133, lng: 121.4367, transport: '地铁10号线' },
      { time: '15:00', title: '陆家嘴', desc: '摩天大楼群现代都市感。', icon: '🏙️', lat: 31.2397, lng: 121.4997, transport: '地铁2号线' },
      { time: '19:00', title: '南京路夜景', desc: '霓虹灯下的繁华都市。', icon: '🌃', lat: 31.2347, lng: 121.4767, transport: '步行' }
    ]
  },
  '成都': {
    culture: [
      { time: '09:00', title: '武侯祠', desc: '三国文化圣地，红墙竹影。', icon: '🏯', lat: 30.6417, lng: 104.0456, transport: '地铁3号线' },
      { time: '11:00', title: '锦里古街', desc: '民俗风情一条街。', icon: '🏮', lat: 30.6400, lng: 104.0483, transport: '步行5分钟' },
      { time: '14:00', title: '杜甫草堂', desc: '诗圣故居，园林清幽。', icon: '🌿', lat: 30.6617, lng: 104.0333, transport: '地铁4号线' },
      { time: '16:00', title: '宽窄巷子', desc: '老成都生活缩影。', icon: '🏘️', lat: 30.6697, lng: 104.0550, transport: '步行20分钟' }
    ],
    food: [
      { time: '09:00', title: '龙抄手', desc: '正宗成都抄手早餐。', icon: '🥟', lat: 30.6567, lng: 104.0733, transport: '地铁2号线' },
      { time: '12:00', title: '陈麻婆豆腐', desc: '百年老店，麻辣鲜香。', icon: '🌶️', lat: 30.6617, lng: 104.0533, transport: '步行15分钟' },
      { time: '15:00', title: '人民公园鹤鸣茶社', desc: '盖碗茶配掏耳朵。', icon: '☕', lat: 30.6583, lng: 104.0617, transport: '步行10分钟' },
      { time: '18:00', title: '玉林路小酒馆', desc: '赵雷歌中的文艺地标。', icon: '🍺', lat: 30.6333, lng: 104.0667, transport: '地铁3号线' }
    ],
    nature: [
      { time: '08:00', title: '都江堰', desc: '两千年前的水利奇迹。', icon: '🌊', lat: 30.9983, lng: 103.6167, transport: '高铁30分钟' },
      { time: '13:00', title: '青城山', desc: '道教名山，幽静清雅。', icon: '⛰️', lat: 30.9000, lng: 103.5667, transport: '公交' },
      { time: '17:00', title: '熊猫基地', desc: '近距离看国宝卖萌。', icon: '🐼', lat: 30.7333, lng: 104.1500, transport: '景区直通车' }
    ],
    photo: [
      { time: '09:00', title: 'IFS爬墙熊猫', desc: '成都网红打卡点。', icon: '🐼', lat: 30.6567, lng: 104.0817, transport: '地铁2号线' },
      { time: '11:00', title: '太古里', desc: '时尚与古建融合。', icon: '🏙️', lat: 30.6550, lng: 104.0833, transport: '步行5分钟' },
      { time: '15:00', title: '东郊记忆', desc: '工业风文创园区。', icon: '🎨', lat: 30.6533, lng: 104.1233, transport: '地铁4号线' },
      { time: '18:00', title: '九眼桥酒吧街', desc: '夜景迷人。', icon: '🌃', lat: 30.6467, lng: 104.0883, transport: '步行15分钟' }
    ]
  },
  '贵阳': {
    culture: [
      { time: '09:00', title: '甲秀楼', desc: '贵阳地标，南明河上的古楼，夜景尤为壮观。', icon: '🏯', lat: 26.5681, lng: 106.7208, transport: '公交' },
      { time: '11:00', title: '青岩古镇', desc: '600年历史的明清古镇，石板路、古城墙，贵州四大古镇之一。', icon: '️', lat: 26.3367, lng: 106.6889, transport: '景区直通车' },
      { time: '14:00', title: '黔灵山公园', desc: '城市中的天然氧吧，猕猴成群，弘福寺香火旺盛。', icon: '🌿', lat: 26.6000, lng: 106.7000, transport: '地铁1号线' },
      { time: '16:00', title: '贵州省博物馆', desc: '了解贵州多元民族文化，民族文物馆藏丰富。', icon: '🏛️', lat: 26.6167, lng: 106.6500, transport: '地铁1号线' }
    ],
    food: [
      { time: '09:00', title: '肠旺面', desc: '贵阳特色早餐，肥肠+血旺+脆哨，麻辣鲜香。', icon: '', lat: 26.6500, lng: 106.6300, transport: '步行' },
      { time: '12:00', title: '丝娃娃', desc: '贵阳特色小吃，薄饼卷各种蔬菜丝，蘸酸辣汁。', icon: '🥗', lat: 26.6450, lng: 106.6350, transport: '步行10分钟' },
      { time: '15:00', title: '花溪牛肉粉', desc: '花溪区老字号，汤鲜粉滑，牛肉大片。', icon: '🍜', lat: 26.4333, lng: 106.6833, transport: '公交' },
      { time: '18:00', title: '合群路夜市', desc: '贵阳最热闹的夜市，烧烤、烙锅、恋爱豆腐果。', icon: '🍢', lat: 26.6400, lng: 106.6250, transport: '步行' }
    ],
    nature: [
      { time: '08:00', title: '黄果树瀑布', desc: '亚洲最大瀑布，水势磅礴，西游记取景地。', icon: '🌊', lat: 25.9889, lng: 105.6694, transport: '景区直通车2小时' },
      { time: '13:00', title: '天星桥景区', desc: '喀斯特地貌精华，水上石林、银链坠潭瀑布。', icon: '⛰️', lat: 25.9667, lng: 105.6500, transport: '步行' },
      { time: '16:00', title: '陡坡塘瀑布', desc: '黄果树上游，西游记片尾曲取景地。', icon: '🌊', lat: 25.9833, lng: 105.6833, transport: '步行15分钟' }
    ],
    photo: [
      { time: '06:30', title: '甲秀楼晨景', desc: '清晨薄雾中的甲秀楼，倒影在南明河中。', icon: '📸', lat: 26.5681, lng: 106.7208, transport: '步行' },
      { time: '10:00', title: '花溪十里河滩', desc: '湿地花海，四季不同景色，摄影天堂。', icon: '🌸', lat: 26.4167, lng: 106.6833, transport: '公交' },
      { time: '15:00', title: '天河潭', desc: '溶洞+瀑布+湖泊，贵州缩影，出片率极高。', icon: '📷', lat: 26.4500, lng: 106.5500, transport: '景区直通车' },
      { time: '19:00', title: '花果园白宫夜景', desc: '贵阳版"白宫"，夜晚灯光璀璨。', icon: '🌃', lat: 26.5833, lng: 106.6833, transport: '地铁' }
    ]
  }
};

function generateRoute() {
  const dest = document.getElementById('route-dest').value.trim();
  const days = document.getElementById('route-days').value;
  const type = document.getElementById('route-type').value;
  
  if (!dest) {
    alert('请输入目的地');
    return;
  }
  
  if (!routeData[dest]) {
    alert(`暂不支持"${dest}"的路线规划，目前支持：北京、上海、成都、贵阳`);
    return;
  }
  
  const cityData = routeData[dest];
  const routes = cityData[type] || cityData.culture;
  
  // 保存当前路线数据
  currentRouteData = { dest, days, type, routes };
  
  document.getElementById('route-result').style.display = 'block';
  
  // 更新地图标题
  document.getElementById('map-title').textContent = `🗺️ ${dest} · ${getDaysText(days)}${getRouteTypeText(type)}`;
  
  // 显示导航按钮
  document.getElementById('nav-start-btn').style.display = 'inline-block';
  document.getElementById('nav-stop-btn').style.display = 'none';
  
  // 渲染地图
  renderRouteMap(dest, routes);
  
  // 渲染路线摘要
  renderRouteSummary(dest, routes);
  
  // 时间线
  const timeline = document.getElementById('route-timeline');
  timeline.innerHTML = routes.map((route, idx) => `
    <div class="timeline-item" onclick="focusOnMarker(${idx})">
      <span class="time-badge">${route.time}</span>
      <h4>${route.icon} ${route.title}</h4>
      <p>${route.desc}</p>
      ${route.transport ? `<div style="margin-top:0.4rem;font-size:0.8rem;color:var(--primary);">🚗 ${route.transport}</div>` : ''}
      <button class="timeline-nav-btn" onclick="event.stopPropagation();navigateTo(${idx})">🧭 导航到这里</button>
    </div>
  `).join('');

  // 渲染出行贴士
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
function renderRouteMap(dest, routes) {
  // 清理旧地图
  if (routeMap) {
    routeMap.remove();
    routeMap = null;
  }
  routeMarkers = [];
  routePolyline = null;
  
  // 获取城市中心坐标
  const center = cityCoords[dest] || [39.9042, 116.4074];
  
  // 初始化地图
  routeMap = L.map('route-map').setView(center, 13);
  
  // 添加地图图层（使用高德地图，国内加载更快）
  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: '1234',
    attribution: '© 高德地图',
    maxZoom: 18
  }).addTo(routeMap);
  
  // 添加标记和路线
  const coordinates = [];
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
  
  routes.forEach((route, idx) => {
    if (route.lat && route.lng) {
      const latlng = [route.lat, route.lng];
      coordinates.push(latlng);
      
      // 创建自定义图标
      const icon = L.divIcon({
        html: `<div style="background:${colors[idx % colors.length]};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">${idx + 1}</div>`,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      
      // 添加标记
      const marker = L.marker(latlng, { icon }).addTo(routeMap);
      marker.bindPopup(`
        <div style="text-align:center;padding:8px;">
          <div style="font-size:24px;margin-bottom:4px;">${route.icon}</div>
          <h3 style="margin:0 0 4px 0;font-size:14px;">${route.title}</h3>
          <p style="margin:0;font-size:12px;color:#666;">${route.time}</p>
          ${route.transport ? `<p style="margin:4px 0 0 0;font-size:11px;color:#6366f1;">🚗 ${route.transport}</p>` : ''}
        </div>
      `);
      
      routeMarkers.push(marker);
    }
  });
  
  // 绘制路线
  if (coordinates.length > 1) {
    routePolyline = L.polyline(coordinates, {
      color: '#6366f1',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(routeMap);
  }
  
  // 调整地图视野以显示所有标记
  if (coordinates.length > 0) {
    const bounds = L.latLngBounds(coordinates);
    routeMap.fitBounds(bounds, { padding: [50, 50] });
  }
  
  // 渲染图例
  renderMapLegend(routes, colors);
}

function renderMapLegend(routes, colors) {
  const legend = document.getElementById('map-legend');
  legend.innerHTML = routes.map((route, idx) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${colors[idx % colors.length]}"></div>
      <span>${idx + 1}. ${route.title}</span>
    </div>
  `).join('');
}

function renderRouteSummary(dest, routes) {
  const summary = document.getElementById('route-summary');
  const totalStops = routes.length;
  const firstStop = routes[0]?.time || '09:00';
  const lastStop = routes[routes.length - 1]?.time || '18:00';
  
  summary.innerHTML = `
    <h3>📊 路线概览</h3>
    <div class="summary-grid">
      <div class="summary-item">
        <span class="summary-value">${totalStops}</span>
        <span class="summary-label">景点数量</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">${firstStop}-${lastStop}</span>
        <span class="summary-label">时间跨度</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">${dest}</span>
        <span class="summary-label">目的地</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">AI</span>
        <span class="summary-label">智能规划</span>
      </div>
    </div>
  `;
}

// ========== 出行贴士 ==========
function renderRouteTips(dest, routes) {
  const tipsEl = document.getElementById('route-tips');
  const tips = getRouteTips(dest, routes);
  
  tipsEl.innerHTML = `
    <h4>💡 出行贴士</h4>
    <div class="tips-grid">
      ${tips.map(tip => `
        <div class="tip-item">
          <span class="tip-icon">${tip.icon}</span>
          <span>${tip.text}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function getRouteTips(dest, routes) {
  const tips = [
    { icon: '🎫', text: '建议提前预约门票' },
    { icon: '🚇', text: '推荐地铁出行，避开拥堵' },
    { icon: '📱', text: '下载离线地图备用' },
    { icon: '💧', text: '随身携带饮用水' },
    { icon: '🔋', text: '带充电宝保持电量' },
    { icon: '🧴', text: '注意防晒/防雨' },
  ];
  
  // 根据目的地添加特色提示
  if (dest === '北京') {
    tips.push({ icon: '🏛️', text: '故宫周一闭馆' });
    tips.push({ icon: '🌬️', text: '春秋季风大注意保暖' });
  } else if (dest === '上海') {
    tips.push({ icon: '🌧️', text: '梅雨季备好雨具' });
    tips.push({ icon: '🏙️', text: '外滩夜景建议19点后' });
  } else if (dest === '成都') {
    tips.push({ icon: '🌶️', text: '吃辣量力而行' });
    tips.push({ icon: '🐼', text: '熊猫基地建议早去' });
  }
  
  return tips;
}

// ========== 地图交互 ==========
function focusOnMarker(idx) {
  if (routeMarkers[idx] && routeMap) {
    routeMap.setView(routeMarkers[idx].getLatLng(), 15);
    routeMarkers[idx].openPopup();
    
    // 高亮当前时间线项
    document.querySelectorAll('.timeline-item').forEach((item, i) => {
      item.classList.toggle('active', i === idx);
    });
  }
}

function navigateTo(idx) {
  if (currentRouteData && currentRouteData.routes[idx]) {
    const route = currentRouteData.routes[idx];
    if (route.lat && route.lng) {
      // 打开外部地图导航（高德地图）
      const url = `https://uri.amap.com/marker?position=${route.lng},${route.lat}&name=${encodeURIComponent(route.title)}`;
      window.open(url, '_blank');
    }
  }
}

function startNavigation() {
  if (!currentRouteData || !routeMarkers.length) return;
  
  currentNavIndex = 0;
  document.getElementById('nav-start-btn').style.display = 'none';
  document.getElementById('nav-stop-btn').style.display = 'inline-block';
  
  // 开始自动导航
  navigationInterval = setInterval(() => {
    if (currentNavIndex < routeMarkers.length) {
      focusOnMarker(currentNavIndex);
      currentNavIndex++;
    } else {
      stopNavigation();
    }
  }, 3000);
  
  // 立即显示第一个
  focusOnMarker(0);
}

function stopNavigation() {
  if (navigationInterval) {
    clearInterval(navigationInterval);
    navigationInterval = null;
  }
  document.getElementById('nav-start-btn').style.display = 'inline-block';
  document.getElementById('nav-stop-btn').style.display = 'none';
  
  // 移除高亮
  document.querySelectorAll('.timeline-item').forEach(item => {
    item.classList.remove('active');
  });
}

// ========== 行李清单 ==========
const packingData = {
  essentials: {
    name: '📋 必备物品',
    items: ['身份证/护照', '手机+充电器', '钱包/银行卡', '钥匙', '纸巾/湿巾', '口罩']
  },
  clothes: {
    name: '👕 衣物',
    hot: ['短袖T恤', '短裤/裙子', '凉鞋', '太阳帽', '墨镜', '防晒霜'],
    warm: ['长袖衬衫', '薄外套', '长裤', '运动鞋', '薄围巾'],
    cool: ['毛衣', '风衣', '长裤', '运动鞋', '围巾'],
    cold: ['羽绒服', '保暖内衣', '毛衣', '厚裤子', '雪地靴', '手套', '帽子', '围巾']
  },
  toiletries: {
    name: '🧴 洗漱用品',
    items: ['牙刷牙膏', '毛巾', '洗发水', '沐浴露', '护肤品', '梳子', '剃须刀']
  },
  electronics: {
    name: '🔌 电子设备',
    items: ['充电宝', '数据线', '耳机', '相机', '自拍杆', '转换插头']
  },
  beach: {
    name: '🏖️ 海边专用',
    items: ['泳衣', '沙滩巾', '防水袋', '浮潜装备', '沙滩鞋']
  },
  mountain: {
    name: '⛰️ 登山专用',
    items: ['登山鞋', '登山杖', '冲锋衣', '头灯', '急救包', '能量棒']
  },
  business: {
    name: '💼 商务专用',
    items: ['正装', '皮鞋', '名片', '笔记本电脑', '文件夹']
  },
  photo: {
    name: '📷 摄影专用',
    items: ['三脚架', '备用电池', '存储卡', '镜头清洁套装', '防雨罩']
  }
};

function generatePackingList() {
  const dest = document.getElementById('packing-dest').value.trim();
  const weather = document.getElementById('packing-weather').value;
  const days = document.getElementById('packing-days').value;
  
  if (!dest) {
    alert('请输入目的地');
    return;
  }
  
  const categories = [];
  
  // 必备物品
  categories.push({ ...packingData.essentials });
  
  // 衣物根据天气
  const clothesItems = packingData.clothes[weather] || packingData.clothes.warm;
  categories.push({ name: '👕 衣物', items: [...clothesItems] });
  
  // 洗漱用品
  categories.push({ ...packingData.toiletries });
  
  // 电子设备
  categories.push({ ...packingData.electronics });
  
  // 特殊场景
  if (document.getElementById('opt-beach').checked) categories.push({ ...packingData.beach });
  if (document.getElementById('opt-mountain').checked) categories.push({ ...packingData.mountain });
  if (document.getElementById('opt-business').checked) categories.push({ ...packingData.business });
  if (document.getElementById('opt-photo').checked) categories.push({ ...packingData.photo });
  
  // 根据天数调整
  if (parseInt(days) >= 7) {
    categories[1].items.push('备用衣物套装');
  }
  
  renderPackingList(categories, dest);
}

function renderPackingList(categories, dest) {
  document.getElementById('packing-result').style.display = 'block';
  
  let totalItems = 0;
  categories.forEach(cat => totalItems += cat.items.length);
  
  const listEl = document.getElementById('packing-list');
  listEl.innerHTML = categories.map((cat, catIdx) => `
    <div class="packing-category">
      <h4>${cat.name}</h4>
      ${cat.items.map((item, itemIdx) => `
        <div class="packing-item" data-cat="${catIdx}" data-item="${itemIdx}">
          <input type="checkbox" id="item-${catIdx}-${itemIdx}" onchange="updateProgress()">
          <label for="item-${catIdx}-${itemIdx}">${item}</label>
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
}

// ========== 地标打卡 ==========
const landmarkData = {
  '北京': [
    { name: '故宫', desc: '紫禁城', icon: '🏯' },
    { name: '长城', desc: '八达岭/慕田峪', icon: '🧱' },
    { name: '天坛', desc: '祈年殿', icon: '🏛️' },
    { name: '颐和园', desc: '皇家园林', icon: '🏞️' },
    { name: '鸟巢', desc: '国家体育场', icon: '🏟️' },
    { name: '水立方', desc: '国家游泳中心', icon: '💧' }
  ],
  '上海': [
    { name: '东方明珠', desc: '地标电视塔', icon: '🗼' },
    { name: '外滩', desc: '万国建筑群', icon: '🏛️' },
    { name: '豫园', desc: '古典园林', icon: '🏯' },
    { name: '迪士尼', desc: '主题乐园', icon: '🏰' },
    { name: '陆家嘴', desc: '金融中心', icon: '🏙️' },
    { name: '南京路', desc: '商业街', icon: '🛍️' }
  ],
  '成都': [
    { name: '熊猫基地', desc: '大熊猫繁育', icon: '🐼' },
    { name: '武侯祠', desc: '三国文化', icon: '🏯' },
    { name: '锦里', desc: '古街民俗', icon: '🏮' },
    { name: '宽窄巷子', desc: '老成都', icon: '🏘️' },
    { name: 'IFS', desc: '爬墙熊猫', icon: '🐼' },
    { name: '都江堰', desc: '水利奇迹', icon: '🌊' }
  ],
  '广州': [
    { name: '广州塔', desc: '小蛮腰', icon: '🗼' },
    { name: '陈家祠', desc: '岭南建筑', icon: '🏛️' },
    { name: '沙面', desc: '欧式建筑', icon: '🏘️' },
    { name: '长隆', desc: '主题乐园', icon: '🎢' },
    { name: '白云山', desc: '城市绿肺', icon: '⛰️' },
    { name: '北京路', desc: '千年古道', icon: '🛍️' }
  ],
  '杭州': [
    { name: '西湖', desc: '人间天堂', icon: '🏞️' },
    { name: '灵隐寺', desc: '千年古刹', icon: '🏯' },
    { name: '宋城', desc: '主题公园', icon: '🏰' },
    { name: '千岛湖', desc: '天下第一秀水', icon: '🏞️' },
    { name: '西溪湿地', desc: '城市湿地', icon: '🌿' },
    { name: '雷峰塔', desc: '白蛇传说', icon: '🗼' }
  ],
  '厦门': [
    { name: '鼓浪屿', desc: '海上花园', icon: '🏝️' },
    { name: '南普陀寺', desc: '佛教圣地', icon: '🏯' },
    { name: '厦门大学', desc: '最美校园', icon: '🎓' },
    { name: '曾厝垵', desc: '文艺渔村', icon: '🏘️' },
    { name: '环岛路', desc: '海滨大道', icon: '🛣️' },
    { name: '集美学村', desc: '嘉庚建筑', icon: '🏛️' }
  ]
};

let currentCity = '北京';
let checkedLandmarks = JSON.parse(localStorage.getItem('checkedLandmarks') || '{}');

function initLandmarks() {
  const citySelector = document.getElementById('city-selector');
  citySelector.innerHTML = Object.keys(landmarkData).map(city => `
    <button class="city-btn ${city === currentCity ? 'active' : ''}" onclick="selectCity('${city}')">${city}</button>
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
  const landmarks = landmarkData[currentCity] || [];
  
  grid.innerHTML = landmarks.map((lm, idx) => {
    const key = `${currentCity}-${idx}`;
    const isChecked = checkedLandmarks[key];
    return `
      <div class="landmark-card ${isChecked ? 'checked' : ''}" onclick="toggleLandmark('${currentCity}', ${idx})">
        <div class="landmark-image">${lm.icon}</div>
        <div class="landmark-info">
          <h4>${lm.name}</h4>
          <p>${lm.desc}</p>
        </div>
        <div class="landmark-check">✓</div>
      </div>
    `;
  }).join('');
}

function toggleLandmark(city, idx) {
  const key = `${city}-${idx}`;
  checkedLandmarks[key] = !checkedLandmarks[key];
  localStorage.setItem('checkedLandmarks', JSON.stringify(checkedLandmarks));
  
  renderLandmarks();
  updateLandmarkStats();
  
  if (checkedLandmarks[key]) {
    showCheckinModal(city, idx);
  }
}

function showCheckinModal(city, idx) {
  const lm = landmarkData[city][idx];
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
  let citiesUnlocked = new Set();
  
  Object.keys(landmarkData).forEach(city => {
    total += landmarkData[city].length;
    landmarkData[city].forEach((_, idx) => {
      const key = `${city}-${idx}`;
      if (checkedLandmarks[key]) {
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
const blindboxData = {
  beijing: [
    { category: '咖啡馆', name: 'Metal Hands铁手咖啡', rating: '⭐⭐⭐⭐⭐', desc: '藏在胡同里的精品咖啡馆，手冲咖啡一绝，复古工业风装修。', tags: ['手冲', '胡同', '文艺'], tip: '推荐dirty和澳白，周末人多建议工作日去' },
    { category: '小酒馆', name: '大跃啤酒', rating: '⭐⭐⭐⭐', desc: '北京本土精酿品牌，胡同里的酿酒厂，必喝淡色艾尔。', tags: ['精酿', '胡同', '夜生活'], tip: '推荐南瓜艾尔和淡色艾尔，配汉堡更佳' },
    { category: '书店', name: '模范书局', rating: '⭐⭐⭐⭐⭐', desc: '百年教堂改造的书店，穹顶下阅读，氛围感满分。', tags: ['教堂', '书店', '拍照'], tip: '位于西什库，免费参观，拍照请保持安静' },
    { category: '甜品店', name: 'Awfully Chocolate', rating: '⭐⭐⭐⭐', desc: '新加坡连锁，巧克力蛋糕浓郁醇厚，可可控天堂。', tags: ['巧克力', '甜品', '下午茶'], tip: '推荐Awfully Chocolate蛋糕和热可可' }
  ],
  shanghai: [
    { category: '咖啡馆', name: 'Manner Coffee', rating: '⭐⭐⭐⭐⭐', desc: '上海本土精品咖啡，小窗口大情怀，性价比超高。', tags: ['精品咖啡', '平价', '日常'], tip: '自带杯减5元，推荐澳白和拿铁' },
    { category: '买手店', name: '栋梁', rating: '⭐⭐⭐⭐⭐', desc: '中国设计师集合店，安福路上的时尚地标。', tags: ['设计师', '时尚', '安福路'], tip: '有很多本土设计师品牌，适合淘货' },
    { category: '茶馆', name: '煮叶', rating: '⭐⭐⭐⭐', desc: '新中式茶饮，现代空间里喝传统茶，静安寺旁。', tags: ['新中式', '茶饮', '安静'], tip: '推荐冷萃茶系列，环境适合办公' },
    { category: '面包店', name: 'Farine', rating: '⭐⭐⭐⭐⭐', desc: '法租界面包房，面包界的艺术品，天然酵母发酵。', tags: ['面包', '法式', '法租界'], tip: '推荐面包拼盘和可颂，早上去品种全' }
  ],
  chengdu: [
    { category: '茶馆', name: '鹤鸣茶社', rating: '⭐⭐⭐⭐⭐', desc: '人民公园百年茶馆，竹椅盖碗茶，成都慢生活代表。', tags: ['百年', '盖碗茶', '人民公园'], tip: '下午去最惬意，可以体验掏耳朵' },
    { category: '小酒馆', name: '小酒馆', rating: '⭐⭐⭐⭐⭐', desc: '赵雷《成都》歌中的地标，玉林路上的音乐圣地。', tags: ['音乐', '文艺', '玉林路'], tip: '晚上有演出，提前占位' },
    { category: '火锅店', name: '电台巷火锅', rating: '⭐⭐⭐⭐', desc: '本地人爱去的社区火锅，味道地道，排队常态。', tags: ['火锅', '社区', '地道'], tip: '建议下午4点前去排号，毛肚和鹅肠必点' },
    { category: '甜品店', name: '方所书店', desc: '地下书店综合体，设计感强，咖啡也不错。', rating: '⭐⭐⭐⭐⭐', tags: ['书店', '设计', '咖啡'], tip: '位于太古里负一层，适合下雨天' }
  ],
  guangzhou: [
    { category: '茶楼', name: '点都德', rating: '⭐⭐⭐⭐', desc: '老字号早茶，虾饺凤爪叉烧包，正宗广式点心。', tags: ['早茶', '老字号', '广式'], tip: '推荐金沙流沙包和虾饺，早上10点前去' },
    { category: '咖啡馆', name: ' .jpg', rating: '⭐⭐⭐⭐⭐', desc: '东山口网红咖啡，老洋房改造，出片率极高。', tags: ['网红', '洋房', '东山口'], tip: '推荐dirty，拍照很出片' },
    { category: '糖水铺', name: '南信牛奶甜品', rating: '⭐⭐⭐⭐', desc: '上下九百年老店，双皮奶姜撞奶，广式甜品经典。', tags: ['老字号', '双皮奶', '上下九'], tip: '双皮奶和姜撞奶必点，热的更好喝' }
  ],
  hangzhou: [
    { category: '茶馆', name: '青藤茶馆', rating: '⭐⭐⭐⭐⭐', desc: '西湖边老茶馆，龙井茶配西湖景色，杭州味道。', tags: ['龙井', '西湖', '传统'], tip: '推荐明前龙井，靠窗位置看西湖' },
    { category: '咖啡馆', name: 'Seesaw Coffee', rating: '⭐⭐⭐⭐', desc: '西湖边精品咖啡，落地窗看湖景，杭州最美咖啡馆之一。', tags: ['湖景', '精品咖啡', '西湖'], tip: '推荐长相思手冲，下午阳光最美' },
    { category: '书店', name: '晓风书屋', rating: '⭐⭐⭐⭐⭐', desc: '西湖边独立书店，文艺青年聚集地，选书有品味。', tags: ['独立书店', '文艺', '西湖'], tip: '经常有文化活动，可以关注公众号' }
  ],
  xiamen: [
    { category: '咖啡馆', name: '32号咖啡馆', rating: '⭐⭐⭐⭐⭐', desc: '鼓浪屿老别墅咖啡，百年建筑里喝咖啡看海。', tags: ['鼓浪屿', '老别墅', '海景'], tip: '推荐拿铁和提拉米苏，二楼视野更好' },
    { category: '小吃店', name: '八婆婆烧仙草', rating: '⭐⭐⭐⭐', desc: '中山路老字号，烧仙草清凉解暑，厦门必吃。', tags: ['老字号', '烧仙草', '中山路'], tip: '夏天必点，料很足' },
    { category: '海鲜排档', name: '阿杰海鲜', rating: '⭐⭐⭐⭐', desc: '八市本地人爱去的海鲜排档，新鲜实惠。', tags: ['海鲜', '八市', '本地'], tip: '建议早上去八市买海鲜，拿到店里加工' }
  ]
};

function openBlindBox() {
  const city = document.getElementById('blindbox-city').value;
  const shops = blindboxData[city] || blindboxData.beijing;
  const shop = shops[Math.floor(Math.random() * shops.length)];
  
  document.getElementById('blindbox-front').style.display = 'none';
  const reveal = document.getElementById('blindbox-reveal');
  reveal.style.display = 'block';
  
  document.getElementById('reveal-category').textContent = shop.category;
  document.getElementById('reveal-name').textContent = shop.name;
  document.getElementById('reveal-rating').textContent = shop.rating;
  document.getElementById('reveal-desc').textContent = shop.desc;
  document.getElementById('reveal-tags').innerHTML = shop.tags.map(t => `<span class="reveal-tag">${t}</span>`).join('');
  document.getElementById('reveal-tip').innerHTML = `<strong>💡 小贴士：</strong>${shop.tip}`;
  
  // 重置按钮
  setTimeout(() => {
    document.getElementById('blindbox-btn').textContent = '🎲 再抽一次';
  }, 500);
}

// 初始化盲盒
document.getElementById('blindbox-btn').addEventListener('click', function() {
  document.getElementById('blindbox-front').style.display = 'block';
  document.getElementById('blindbox-reveal').style.display = 'none';
  setTimeout(() => openBlindBox(), 300);
});

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
    alert('请输入旅途文字');
    return;
  }
  
  document.getElementById('journal-output').style.display = 'block';
  
  const page = document.getElementById('journal-page');
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  
  document.getElementById('journal-date').textContent = `📅 ${dateStr}`;
  document.getElementById('journal-weather').textContent = getWeatherEmoji();
  
  // 根据风格设置样式
  const styles = {
    cute: { bg: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', color: '#be185d', stickers: ['🌸', '🎀', '💖', '✨'], doodles: ['🌈', '⭐', '🦋'] },
    retro: { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', stickers: ['📷', '🎞️', '📻', '🎨'], doodles: ['🎭', '🎪', '🎬'] },
    fresh: { bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#065f46', stickers: ['🌿', '🍃', '🌱', '💚'], doodles: ['🌻', '🌼', '🍀'] },
    ink: { bg: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', color: '#1f2937', stickers: ['🎨', '🖌️', '📜', '🏮'], doodles: ['🎋', '🎍', '🎎'] }
  };
  
  const style = styles[currentStyle];
  page.style.background = style.bg;
  page.style.color = style.color;
  
  // 处理文字，添加一些装饰
  const processedText = text
    .replace(/。/g, '。<br>')
    .replace(/！/g, '！✨')
    .replace(/？/g, '？🤔')
    .replace(/美/g, '美💕')
    .replace(/好吃/g, '好吃😋')
    .replace(/开心/g, '开心🥰');
  
  document.getElementById('journal-content').innerHTML = processedText;
  document.getElementById('journal-stickers').innerHTML = style.stickers.map(s => `<div>${s}</div>`).join('');
  document.getElementById('journal-doodles').innerHTML = style.doodles.map(d => `<div>${d}</div>`).join('');
}

function getWeatherEmoji() {
  const weathers = ['☀️ 晴', '⛅ 多云', '🌤️ 晴间多云', '🌈 雨后彩虹'];
  return weathers[Math.floor(Math.random() * weathers.length)];
}

function downloadJournal() {
  alert('📥 手账图片已保存！（演示功能）');
}

function shareJournal() {
  alert('📤 分享链接已复制！（演示功能）');
}

// ========== 初始化 ==========
initLandmarks();
