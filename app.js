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

// ========== 城市坐标 ==========
const cityCoords = {
  '北京': [39.9042, 116.4074],
  '上海': [31.2304, 121.4737],
  '成都': [30.5728, 104.0668],
  '贵阳': [26.6470, 106.6302],
  '广州': [23.1291, 113.2644],
  '杭州': [30.2741, 120.1551],
  '厦门': [24.4798, 118.0894],
  '重庆': [29.4316, 106.9123],
  '西安': [34.3416, 108.9398],
  '南京': [32.0603, 118.7969],
  '武汉': [30.5928, 114.3055],
  '长沙': [28.2282, 112.9388],
  '深圳': [22.5431, 114.0579],
  '青岛': [36.0671, 120.3826],
  '三亚': [18.2528, 109.5119],
  '昆明': [25.0389, 102.7183]
};

// ========== 路线数据 ==========
const routeData = {
  '北京': {
    culture: [
      { time: '09:00', title: '故宫博物院', desc: '游览紫禁城，感受600年皇家气派。建议从午门进入，沿中轴线参观三大殿。', icon: '🏯', lat: 39.9163, lng: 116.3972, transport: '步行' },
      { time: '12:00', title: '四季民福烤鸭店', desc: '品尝正宗北京烤鸭，推荐故宫店，景观位可边吃边看故宫角楼。', icon: '', lat: 39.9242, lng: 116.3983, transport: '步行10分钟' },
      { time: '14:00', title: '景山公园', desc: '登万春亭俯瞰故宫全景，视野开阔，是拍照的绝佳位置。', icon: '⛰️', lat: 39.9250, lng: 116.3889, transport: '步行15分钟' },
      { time: '16:00', title: '南锣鼓巷', desc: '漫步老北京胡同，体验文艺小店和特色小吃。', icon: '🏘️', lat: 39.9370, lng: 116.4030, transport: '地铁8号线' }
    ],
    food: [
      { time: '09:00', title: '护国寺小吃', desc: '品尝豆汁、焦圈、艾窝窝等传统北京早餐。', icon: '🥟', lat: 39.9389, lng: 116.3733, transport: '地铁4号线' },
      { time: '11:00', title: '牛街', desc: '探访清真美食街，品尝白记年糕、洪记小吃。', icon: '', lat: 39.8914, lng: 116.3658, transport: '地铁7号线' },
      { time: '14:00', title: '大董烤鸭', desc: '高端烤鸭体验，酥不腻烤鸭是招牌。', icon: '', lat: 39.9089, lng: 116.4356, transport: '地铁1号线' },
      { time: '17:00', title: '簋街', desc: '夜幕降临后的美食街，麻辣小龙虾是必点。', icon: '🦞', lat: 39.9407, lng: 116.4178, transport: '地铁5号线' }
    ],
    nature: [
      { time: '08:00', title: '颐和园', desc: '游览皇家园林，昆明湖泛舟，长廊赏画。', icon: '️', lat: 39.9996, lng: 116.2751, transport: '地铁4号线' },
      { time: '12:00', title: '圆明园', desc: '参观遗址公园，感受历史沧桑。', icon: '🏛️', lat: 40.0085, lng: 116.3100, transport: '步行20分钟' },
      { time: '15:00', title: '奥林匹克森林公园', desc: '城市绿肺，骑行或散步放松身心。', icon: '🌳', lat: 40.0236, lng: 116.3889, transport: '地铁8号线' }
    ],
    photo: [
      { time: '06:00', title: '角楼日出', desc: '拍摄故宫角楼倒影，最佳摄影点。', icon: '📸', lat: 39.9242, lng: 116.3889, transport: '步行' },
      { time: '10:00', title: '红墙黄瓦', desc: '故宫内拍摄经典皇家建筑元素。', icon: '', lat: 39.9163, lng: 116.3972, transport: '步行10分钟' },
      { time: '15:00', title: '798艺术区', desc: '工业风与艺术的碰撞，拍照圣地。', icon: '', lat: 39.9842, lng: 116.4953, transport: '地铁14号线' },
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
      { time: '09:00', title: '辰山植物园', desc: '华东最大植物园，四季花开。', icon: '', lat: 31.0833, lng: 121.2167, transport: '地铁9号线' },
      { time: '13:00', title: '佘山国家森林公园', desc: '上海陆上最高峰，登高望远。', icon: '⛰️', lat: 31.0833, lng: 121.1833, transport: '公交' },
      { time: '16:00', title: '滴水湖', desc: '人工湖景，海风吹拂。', icon: '🌊', lat: 30.9167, lng: 121.8833, transport: '地铁16号线' }
    ],
    photo: [
      { time: '06:00', title: '外滩晨光', desc: '浦东天际线日出。', icon: '🌅', lat: 31.2400, lng: 121.4900, transport: '地铁2号线' },
      { time: '10:00', title: '武康路', desc: '法式梧桐下的老洋房。', icon: '🏘️', lat: 31.2133, lng: 121.4367, transport: '地铁10号线' },
      { time: '15:00', title: '陆家嘴', desc: '摩天大楼群现代都市感。', icon: '️', lat: 31.2397, lng: 121.4997, transport: '地铁2号线' },
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
      { time: '11:00', title: '青岩古镇', desc: '600年历史的明清古镇，石板路、古城墙，贵州四大古镇之一。', icon: '🏘️', lat: 26.3367, lng: 106.6889, transport: '景区直通车' },
      { time: '14:00', title: '黔灵山公园', desc: '城市中的天然氧吧，猕猴成群，弘福寺香火旺盛。', icon: '🌿', lat: 26.6000, lng: 106.7000, transport: '地铁1号线' },
      { time: '16:00', title: '贵州省博物馆', desc: '了解贵州多元民族文化，民族文物馆藏丰富。', icon: '️', lat: 26.6167, lng: 106.6500, transport: '地铁1号线' }
    ],
    food: [
      { time: '09:00', title: '肠旺面', desc: '贵阳特色早餐，肥肠+血旺+脆哨，麻辣鲜香。', icon: '🍜', lat: 26.6500, lng: 106.6300, transport: '步行' },
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
      { time: '06:30', title: '甲秀楼晨景', desc: '清晨薄雾中的甲秀楼，倒影在南明河中。', icon: '', lat: 26.5681, lng: 106.7208, transport: '步行' },
      { time: '10:00', title: '花溪十里河滩', desc: '湿地花海，四季不同景色，摄影天堂。', icon: '🌸', lat: 26.4167, lng: 106.6833, transport: '公交' },
      { time: '15:00', title: '天河潭', desc: '溶洞+瀑布+湖泊，贵州缩影，出片率极高。', icon: '📷', lat: 26.4500, lng: 106.5500, transport: '景区直通车' },
      { time: '19:00', title: '花果园白宫夜景', desc: '贵阳版"白宫"，夜晚灯光璀璨。', icon: '🌃', lat: 26.5833, lng: 106.6833, transport: '地铁' }
    ]
  },
  '广州': {
    culture: [
      { time: '09:00', title: '陈家祠', desc: '岭南建筑艺术明珠，木雕砖雕石雕精美绝伦。', icon: '🏛️', lat: 23.1291, lng: 113.2439, transport: '地铁1号线' },
      { time: '11:00', title: '沙面岛', desc: '欧陆风情建筑群，150多棵古树，适合漫步拍照。', icon: '🏘️', lat: 23.1067, lng: 113.2433, transport: '步行15分钟' },
      { time: '14:00', title: '广州博物馆', desc: '镇海楼内，了解广州2200年历史。', icon: '🏛️', lat: 23.1389, lng: 113.2644, transport: '地铁2号线' },
      { time: '16:00', title: '北京路千年古道', desc: '玻璃地面下可见唐宋明清历代路面。', icon: '️', lat: 23.1233, lng: 113.2683, transport: '地铁6号线' }
    ],
    food: [
      { time: '08:00', title: '点都德', desc: '老字号早茶，虾饺凤爪叉烧包，正宗广式点心。', icon: '🥟', lat: 23.1291, lng: 113.2644, transport: '步行' },
      { time: '12:00', title: '银记肠粉', desc: '布拉肠粉，薄如蝉翼，鲜虾肠是招牌。', icon: '🍜', lat: 23.1267, lng: 113.2617, transport: '步行10分钟' },
      { time: '15:00', title: '南信牛奶甜品', desc: '双皮奶、姜撞奶，广式甜品经典。', icon: '🍮', lat: 23.1200, lng: 113.2550, transport: '地铁1号线' },
      { time: '18:00', title: '惠食佳', desc: '啫啫煲专门店，啫啫黄鳝煲必点。', icon: '🍳', lat: 23.1333, lng: 113.2700, transport: '地铁3号线' }
    ],
    nature: [
      { time: '08:00', title: '白云山', desc: '广州城市绿肺，登高望远，摩星岭是最高点。', icon: '⛰️', lat: 23.1783, lng: 113.3033, transport: '地铁2号线' },
      { time: '13:00', title: '华南植物园', desc: '中国最大植物园之一，热带雨林温室壮观。', icon: '🌿', lat: 23.1833, lng: 113.3500, transport: '地铁6号线' },
      { time: '16:00', title: '海珠湿地', desc: '城市中心的湿地公园，观鸟好去处。', icon: '', lat: 23.0833, lng: 113.3167, transport: '地铁3号线' }
    ],
    photo: [
      { time: '06:30', title: '广州塔日出', desc: '小蛮腰晨光，珠江新城天际线。', icon: '', lat: 23.1067, lng: 113.3200, transport: '地铁3号线' },
      { time: '10:00', title: '永庆坊', desc: '西关老街区改造，李小龙祖居在此。', icon: '🏘️', lat: 23.1167, lng: 113.2400, transport: '地铁1号线' },
      { time: '15:00', title: '珠江夜游码头', desc: '傍晚时分拍摄珠江两岸灯光。', icon: '📸', lat: 23.1100, lng: 113.2600, transport: '地铁6号线' },
      { time: '19:00', title: '花城广场夜景', desc: '广州CBD灯光秀，现代都市之美。', icon: '🌃', lat: 23.1167, lng: 113.3233, transport: '地铁3号线' }
    ]
  },
  '杭州': {
    culture: [
      { time: '09:00', title: '灵隐寺', desc: '千年古刹，飞来峰石刻造像精美。', icon: '🏯', lat: 30.2400, lng: 120.1033, transport: '公交7路' },
      { time: '11:00', title: '西湖十景', desc: '断桥残雪、苏堤春晓、三潭印月。', icon: '🏞️', lat: 30.2425, lng: 120.1486, transport: '步行' },
      { time: '14:00', title: '浙江省博物馆', desc: '河姆渡文化、良渚玉器、越窑青瓷。', icon: '️', lat: 30.2483, lng: 120.1433, transport: '步行15分钟' },
      { time: '16:00', title: '河坊街', desc: '南宋御街，品尝杭州传统小吃。', icon: '🏮', lat: 30.2383, lng: 120.1683, transport: '地铁1号线' }
    ],
    food: [
      { time: '08:00', title: '知味观', desc: '杭州老字号，小笼包、猫耳朵、片儿川。', icon: '🥟', lat: 30.2450, lng: 120.1650, transport: '地铁1号线' },
      { time: '12:00', title: '楼外楼', desc: '西湖醋鱼、龙井虾仁、东坡肉，杭帮菜经典。', icon: '🐟', lat: 30.2483, lng: 120.1400, transport: '步行' },
      { time: '15:00', title: '绿茶餐厅', desc: '创意杭帮菜，面包诱惑是招牌甜品。', icon: '🍵', lat: 30.2500, lng: 120.1500, transport: '公交' },
      { time: '18:00', title: '胜利河美食街', desc: '杭州夜宵圣地，海鲜烧烤应有尽有。', icon: '🍢', lat: 30.2600, lng: 120.1700, transport: '地铁1号线' }
    ],
    nature: [
      { time: '08:00', title: '西溪湿地', desc: '城市中的天然湿地，摇橹船穿行芦苇荡。', icon: '🌿', lat: 30.2667, lng: 120.0667, transport: '地铁5号线' },
      { time: '13:00', title: '九溪烟树', desc: '溪流潺潺，茶园连绵，杭州最美徒步路线。', icon: '🌊', lat: 30.2000, lng: 120.1000, transport: '公交' },
      { time: '16:00', title: '龙井村', desc: '中国十大名茶之首，品茗赏茶园。', icon: '🍵', lat: 30.2167, lng: 120.1000, transport: '步行' }
    ],
    photo: [
      { time: '06:00', title: '西湖晨雾', desc: '断桥残雪意境，晨雾中的西湖如诗如画。', icon: '📸', lat: 30.2550, lng: 120.1500, transport: '步行' },
      { time: '10:00', title: '梅家坞茶园', desc: '层层叠叠的茶园梯田，绿色海洋。', icon: '🌿', lat: 30.2000, lng: 120.0833, transport: '公交' },
      { time: '15:00', title: '良渚古城遗址', desc: '5000年文明实证，建筑与自然的完美融合。', icon: '🏛️', lat: 30.4000, lng: 120.0000, transport: '地铁2号线' },
      { time: '19:00', title: '钱江新城灯光秀', desc: '钱塘江两岸现代建筑灯光秀。', icon: '', lat: 30.2433, lng: 120.2100, transport: '地铁4号线' }
    ]
  },
  '厦门': {
    culture: [
      { time: '09:00', title: '南普陀寺', desc: '闽南佛教圣地，素菜馆闻名遐迩。', icon: '🏯', lat: 24.4400, lng: 118.0933, transport: '公交' },
      { time: '11:00', title: '厦门大学', desc: '中国最美校园之一，芙蓉隧道涂鸦墙。', icon: '🎓', lat: 24.4367, lng: 118.0950, transport: '步行10分钟' },
      { time: '14:00', title: '鼓浪屿', desc: '海上花园，万国建筑博览，钢琴之岛。', icon: '️', lat: 24.4467, lng: 118.0650, transport: '轮渡' },
      { time: '17:00', title: '曾厝垵', desc: '文艺渔村，特色小店和美食聚集地。', icon: '🏘️', lat: 24.4333, lng: 118.1167, transport: '公交' }
    ],
    food: [
      { time: '08:00', title: '沙茶面', desc: '厦门灵魂美食，浓郁沙茶汤底配各种配料。', icon: '🍜', lat: 24.4500, lng: 118.0833, transport: '步行' },
      { time: '12:00', title: '海煎', desc: '闽南特色，鲜嫩海蛎配鸡蛋和地瓜粉。', icon: '🦪', lat: 24.4450, lng: 118.0800, transport: '步行5分钟' },
      { time: '15:00', title: '花生汤', desc: '黄则和花生汤，百年老字号，甜而不腻。', icon: '🥜', lat: 24.4533, lng: 118.0800, transport: '公交' },
      { time: '18:00', title: '中山路海鲜大排档', desc: '新鲜海鲜现点现做，厦门夜生活。', icon: '🦐', lat: 24.4533, lng: 118.0833, transport: '步行' }
    ],
    nature: [
      { time: '08:00', title: '环岛路骑行', desc: '中国最美海岸线之一，海风拂面。', icon: '🚴', lat: 24.4333, lng: 118.1333, transport: '租自行车' },
      { time: '13:00', title: '植物园', desc: '万石山植物园，热带雨林和多肉植物区。', icon: '', lat: 24.4433, lng: 118.0967, transport: '公交' },
      { time: '16:00', title: '集美学村', desc: '陈嘉庚先生创办，嘉庚建筑风格独特。', icon: '🏛️', lat: 24.5667, lng: 118.1000, transport: '地铁1号线' }
    ],
    photo: [
      { time: '06:00', title: '鼓浪屿日出', desc: '从厦门本岛拍摄鼓浪屿晨光。', icon: '🌅', lat: 24.4467, lng: 118.0650, transport: '轮渡' },
      { time: '10:00', title: '沙坡尾', desc: '老厦门渔港改造的文艺街区。', icon: '📸', lat: 24.4400, lng: 118.0833, transport: '步行' },
      { time: '15:00', title: '白城沙滩', desc: '厦大白城，海天一色的绝美海岸。', icon: '🏖️', lat: 24.4333, lng: 118.1000, transport: '公交' },
      { time: '19:00', title: '鹭江道夜景', desc: '厦门本岛与鼓浪屿隔海相望的夜景。', icon: '🌃', lat: 24.4500, lng: 118.0800, transport: '步行' }
    ]
  },
  '重庆': {
    culture: [
      { time: '09:00', title: '洪崖洞', desc: '千与千寻现实版，吊脚楼建筑群，白天夜晚各有风情。', icon: '🏘️', lat: 29.5628, lng: 106.5789, transport: '地铁1号线' },
      { time: '11:00', title: '解放碑', desc: '重庆地标，抗战胜利纪功碑，周边商圈繁华。', icon: '🏛️', lat: 29.5589, lng: 106.5767, transport: '步行10分钟' },
      { time: '14:00', title: '长江索道', desc: '万里长江第一条空中走廊，体验飞渡长江。', icon: '🚡', lat: 29.5500, lng: 106.5833, transport: '步行15分钟' },
      { time: '16:00', title: '磁器口古镇', desc: '千年古镇，石板路、老茶馆，感受老重庆。', icon: '🏮', lat: 29.5833, lng: 106.4500, transport: '地铁1号线' }
    ],
    food: [
      { time: '09:00', title: '重庆小面', desc: '麻辣鲜香，重庆人的早餐标配。', icon: '🍜', lat: 29.5600, lng: 106.5700, transport: '步行' },
      { time: '12:00', title: '珮姐老火锅', desc: '正宗九宫格火锅，毛肚鸭肠必点。', icon: '🍲', lat: 29.5550, lng: 106.5800, transport: '地铁2号线' },
      { time: '15:00', title: '好又来酸辣粉', desc: '酸辣过瘾，重庆特色小吃。', icon: '🌶️', lat: 29.5620, lng: 106.5750, transport: '步行10分钟' },
      { time: '18:00', title: '南山一棵树观景台', desc: '俯瞰重庆夜景，配火锅更佳。', icon: '🌃', lat: 29.5333, lng: 106.5833, transport: '公交' }
    ],
    nature: [
      { time: '08:00', title: '武隆天生三桥', desc: '世界自然遗产，变形金刚4取景地。', icon: '🌉', lat: 29.3167, lng: 107.7500, transport: '景区直通车3小时' },
      { time: '13:00', title: '龙水峡地缝', desc: '峡谷溪流，清凉避暑。', icon: '🌊', lat: 29.3333, lng: 107.7667, transport: '步行' },
      { time: '16:00', title: '仙女山', desc: '东方瑞士，高山草原。', icon: '⛰️', lat: 29.3833, lng: 107.7167, transport: '公交' }
    ],
    photo: [
      { time: '06:30', title: '洪崖洞晨景', desc: '清晨的吊脚楼，宁静美好。', icon: '📸', lat: 29.5628, lng: 106.5789, transport: '地铁1号线' },
      { time: '10:00', title: '李子坝轻轨穿楼', desc: '网红打卡点，轻轨从楼中穿过。', icon: '🚇', lat: 29.5500, lng: 106.5167, transport: '地铁2号线' },
      { time: '15:00', title: '鹅岭二厂', desc: '文创园区，工业风拍照圣地。', icon: '🎨', lat: 29.5500, lng: 106.5333, transport: '公交' },
      { time: '19:00', title: '千厮门大桥夜景', desc: '洪崖洞最佳拍摄点。', icon: '🌃', lat: 29.5650, lng: 106.5800, transport: '步行' }
    ]
  },
  '西安': {
    culture: [
      { time: '09:00', title: '兵马俑', desc: '世界第八大奇迹，秦始皇陵兵马俑。', icon: '🏛️', lat: 34.3842, lng: 109.2789, transport: '游5路' },
      { time: '12:00', title: '华清宫', desc: '唐玄宗与杨贵妃爱情故事发生地。', icon: '🏯', lat: 34.3667, lng: 109.2167, transport: '步行15分钟' },
      { time: '14:00', title: '大雁塔', desc: '唐代佛教建筑，玄奘译经处。', icon: '🗼', lat: 34.2167, lng: 108.9500, transport: '公交' },
      { time: '16:00', title: '西安城墙', desc: '中国现存最完整的古城墙。', icon: '🧱', lat: 34.2667, lng: 108.9500, transport: '地铁2号线' }
    ],
    food: [
      { time: '09:00', title: '回民街', desc: '羊肉泡馍、肉夹馍、凉皮，西安美食聚集地。', icon: '🏮', lat: 34.2667, lng: 108.9333, transport: '地铁2号线' },
      { time: '12:00', title: '老孙家泡馍', desc: '正宗羊肉泡馍，自己掰馍体验。', icon: '🍜', lat: 34.2700, lng: 108.9400, transport: '步行' },
      { time: '15:00', title: 'biangbiang面', desc: '裤带面，又宽又长，陕西特色。', icon: '🍝', lat: 34.2650, lng: 108.9350, transport: '步行10分钟' },
      { time: '18:00', title: '永兴坊', desc: '非遗美食街，摔碗酒发源地。', icon: '🍺', lat: 34.2600, lng: 108.9600, transport: '地铁1号线' }
    ],
    nature: [
      { time: '08:00', title: '华山', desc: '五岳之一，奇险天下第一。', icon: '⛰️', lat: 34.4667, lng: 110.0833, transport: '高铁30分钟' },
      { time: '13:00', title: '骊山', desc: '华清宫后山，烽火戏诸侯发生地。', icon: '🏔️', lat: 34.3500, lng: 109.2333, transport: '步行' },
      { time: '16:00', title: '曲江池遗址公园', desc: '唐代皇家园林，现代休闲好去处。', icon: '🌿', lat: 34.2000, lng: 108.9667, transport: '公交' }
    ],
    photo: [
      { time: '06:30', title: '城墙日出', desc: '在古城墙上拍摄日出，历史感满满。', icon: '🌅', lat: 34.2667, lng: 108.9500, transport: '地铁2号线' },
      { time: '10:00', title: '钟楼鼓楼', desc: '西安地标，古色古香。', icon: '🏛️', lat: 34.2667, lng: 108.9333, transport: '地铁2号线' },
      { time: '15:00', title: '大唐不夜城', desc: '唐风建筑，拍照打卡圣地。', icon: '🏮', lat: 34.2167, lng: 108.9500, transport: '公交' },
      { time: '19:00', title: '大雁塔音乐喷泉', desc: '亚洲最大音乐喷泉。', icon: '🌃', lat: 34.2167, lng: 108.9500, transport: '公交' }
    ]
  },
  '南京': {
    culture: [
      { time: '09:00', title: '中山陵', desc: '孙中山先生陵墓，气势恢宏。', icon: '🏛️', lat: 32.0603, lng: 118.8600, transport: '地铁2号线' },
      { time: '11:00', title: '明孝陵', desc: '明太祖朱元璋陵墓，世界文化遗产。', icon: '🏯', lat: 32.0500, lng: 118.8500, transport: '步行15分钟' },
      { time: '14:00', title: '夫子庙', desc: '秦淮风光带，江南贡院，孔庙。', icon: '🏮', lat: 32.0167, lng: 118.7833, transport: '地铁3号线' },
      { time: '16:00', title: '南京城墙', desc: '世界最长古城墙，登城俯瞰。', icon: '🧱', lat: 32.0500, lng: 118.7833, transport: '步行' }
    ],
    food: [
      { time: '09:00', title: '鸭血粉丝汤', desc: '南京特色早餐，鲜美可口。', icon: '🍜', lat: 32.0200, lng: 118.7800, transport: '地铁3号线' },
      { time: '12:00', title: '南京盐水鸭', desc: '韩复兴老店，皮白肉嫩。', icon: '🦆', lat: 32.0300, lng: 118.7900, transport: '步行' },
      { time: '15:00', title: '牛肉锅贴', desc: '七家湾老店，外酥里嫩。', icon: '🥟', lat: 32.0250, lng: 118.7750, transport: '步行10分钟' },
      { time: '18:00', title: '老门东', desc: '历史街区，品尝南京传统小吃。', icon: '🏮', lat: 32.0100, lng: 118.7900, transport: '公交' }
    ],
    nature: [
      { time: '08:00', title: '紫金山', desc: '南京城市绿肺，登山观景。', icon: '⛰️', lat: 32.0667, lng: 118.8667, transport: '地铁2号线' },
      { time: '13:00', title: '玄武湖', desc: '皇家园林湖泊，泛舟赏景。', icon: '🏞️', lat: 32.0833, lng: 118.8000, transport: '地铁1号线' },
      { time: '16:00', title: '栖霞山', desc: '赏枫胜地，秋季必去。', icon: '🍁', lat: 32.1333, lng: 118.9167, transport: '公交' }
    ],
    photo: [
      { time: '06:30', title: '中山陵晨光', desc: '清晨的中山陵，庄严肃穆。', icon: '🌅', lat: 32.0603, lng: 118.8600, transport: '地铁2号线' },
      { time: '10:00', title: '颐和路公馆区', desc: '民国建筑，拍照圣地。', icon: '🏛️', lat: 32.0500, lng: 118.7667, transport: '公交' },
      { time: '15:00', title: '牛首山', desc: '佛顶宫，现代佛教建筑奇观。', icon: '🏯', lat: 31.9333, lng: 118.7500, transport: '公交' },
      { time: '19:00', title: '秦淮河夜景', desc: '桨声灯影，诗意盎然。', icon: '🌃', lat: 32.0167, lng: 118.7833, transport: '地铁3号线' }
    ]
  },
  '武汉': {
    culture: [
      { time: '09:00', title: '黄鹤楼', desc: '天下江山第一楼，崔颢诗名扬天下。', icon: '🏯', lat: 30.5417, lng: 114.3000, transport: '地铁4号线' },
      { time: '11:00', title: '湖北省博物馆', desc: '曾侯乙编钟，越王勾践剑，国宝众多。', icon: '🏛️', lat: 30.5667, lng: 114.3667, transport: '公交' },
      { time: '14:00', title: '武汉大学', desc: '中国最美校园之一，樱花季绝美。', icon: '🎓', lat: 30.5333, lng: 114.3667, transport: '公交' },
      { time: '16:00', title: '长江大桥', desc: '万里长江第一桥，登桥俯瞰。', icon: '🌉', lat: 30.5500, lng: 114.3000, transport: '步行' }
    ],
    food: [
      { time: '09:00', title: '热干面', desc: '武汉特色早餐，蔡林记老字号。', icon: '🍜', lat: 30.5800, lng: 114.3000, transport: '步行' },
      { time: '12:00', title: '户部巷', desc: '小吃街，豆皮、面窝、糊汤粉。', icon: '🏮', lat: 30.5417, lng: 114.3000, transport: '步行' },
      { time: '15:00', title: '武昌鱼', desc: '清蒸武昌鱼，湖北名菜。', icon: '🐟', lat: 30.5500, lng: 114.3500, transport: '公交' },
      { time: '18:00', title: '吉庆街', desc: '夜市大排档，小龙虾必点。', icon: '🦞', lat: 30.5900, lng: 114.2900, transport: '地铁6号线' }
    ],
    nature: [
      { time: '08:00', title: '东湖', desc: '中国最大城中湖，绿道骑行。', icon: '🏞️', lat: 30.5500, lng: 114.4000, transport: '公交' },
      { time: '13:00', title: '磨山', desc: '东湖风景区，楚文化游览区。', icon: '⛰️', lat: 30.5333, lng: 114.4167, transport: '公交' },
      { time: '16:00', title: '马鞍山森林公园', desc: '城市绿肺，休闲好去处。', icon: '🌳', lat: 30.5167, lng: 114.4333, transport: '公交' }
    ],
    photo: [
      { time: '06:30', title: '黄鹤楼日出', desc: '晨光中的黄鹤楼，古韵悠长。', icon: '🌅', lat: 30.5417, lng: 114.3000, transport: '地铁4号线' },
      { time: '10:00', title: '昙华林', desc: '文艺街区，老建筑改造。', icon: '🏘️', lat: 30.5417, lng: 114.3167, transport: '步行' },
      { time: '15:00', title: '江汉路步行街', desc: '近代建筑群，拍照打卡。', icon: '🏛️', lat: 30.5833, lng: 114.2833, transport: '地铁2号线' },
      { time: '19:00', title: '长江夜游', desc: '两江游览船，夜景璀璨。', icon: '🌃', lat: 30.5500, lng: 114.3000, transport: '步行' }
    ]
  },
  '长沙': {
    culture: [
      { time: '09:00', title: '橘子洲', desc: '湘江中心，+++雕像，烟花盛景。', icon: '🏝️', lat: 28.2000, lng: 112.9500, transport: '地铁2号线' },
      { time: '11:00', title: '岳麓山', desc: '千年学府岳麓书院，爱晚亭。', icon: '⛰️', lat: 28.2167, lng: 112.9333, transport: '公交' },
      { time: '14:00', title: '湖南省博物馆', desc: '马王堆汉墓文物，辛追夫人。', icon: '🏛️', lat: 28.2000, lng: 112.9833, transport: '公交' },
      { time: '16:00', title: '太平老街', desc: '长沙最古老的街道，文艺小店。', icon: '🏮', lat: 28.2000, lng: 112.9667, transport: '地铁1号线' }
    ],
    food: [
      { time: '09:00', title: '米粉', desc: '长沙早餐标配，汤粉或炒粉。', icon: '🍜', lat: 28.2000, lng: 112.9700, transport: '步行' },
      { time: '12:00', title: '火宫殿', desc: '臭豆腐、糖油粑粑，长沙小吃。', icon: '🏮', lat: 28.2000, lng: 112.9667, transport: '步行' },
      { time: '15:00', title: '茶颜悦色', desc: '长沙本土奶茶品牌，必喝。', icon: '🧋', lat: 28.2000, lng: 112.9700, transport: '步行' },
      { time: '18:00', title: '文和友', desc: '超级文和友，80年代怀旧风。', icon: '🍢', lat: 28.2000, lng: 112.9800, transport: '地铁1号线' }
    ],
    nature: [
      { time: '08:00', title: '岳麓山', desc: '登山观景，爱晚亭赏枫。', icon: '⛰️', lat: 28.2167, lng: 112.9333, transport: '公交' },
      { time: '13:00', title: '石燕湖', desc: '人工湖，休闲度假。', icon: '🏞️', lat: 28.1000, lng: 113.0500, transport: '公交' },
      { time: '16:00', title: '大围山', desc: '森林公园，避暑胜地。', icon: '🌳', lat: 28.3833, lng: 113.7833, transport: '景区直通车' }
    ],
    photo: [
      { time: '06:30', title: '橘子洲日出', desc: '湘江中心的日出，壮观。', icon: '🌅', lat: 28.2000, lng: 112.9500, transport: '地铁2号线' },
      { time: '10:00', title: 'IFS国金中心', desc: '长沙地标，城市天际线。', icon: '🏙️', lat: 28.2000, lng: 112.9833, transport: '地铁1号线' },
      { time: '15:00', title: '谢子龙影像馆', desc: '网红拍照圣地，建筑独特。', icon: '📸', lat: 28.2000, lng: 112.9500, transport: '公交' },
      { time: '19:00', title: '杜甫江阁夜景', desc: '湘江边的古楼，灯光璀璨。', icon: '🌃', lat: 28.2000, lng: 112.9667, transport: '步行' }
    ]
  },
  '深圳': {
    culture: [
      { time: '09:00', title: '世界之窗', desc: '微缩世界景观，130多个世界名胜。', icon: '🌍', lat: 22.5333, lng: 113.9667, transport: '地铁1号线' },
      { time: '11:00', title: '锦绣中华', desc: '中国微缩景观，民族文化村。', icon: '🏯', lat: 22.5333, lng: 113.9500, transport: '步行15分钟' },
      { time: '14:00', title: '深圳博物馆', desc: '了解深圳从小渔村到都市的历程。', icon: '🏛️', lat: 22.5500, lng: 114.0500, transport: '地铁4号线' },
      { time: '16:00', title: '东门老街', desc: '深圳最古老的商业街，购物天堂。', icon: '🛍️', lat: 22.5500, lng: 114.1167, transport: '地铁1号线' }
    ],
    food: [
      { time: '09:00', title: '肠粉', desc: '广式肠粉，深圳早餐标配。', icon: '🍜', lat: 22.5500, lng: 114.0833, transport: '步行' },
      { time: '12:00', title: '椰子鸡', desc: '深圳特色火锅，清甜可口。', icon: '🍲', lat: 22.5333, lng: 114.0500, transport: '地铁1号线' },
      { time: '15:00', title: '喜茶', desc: '深圳本土奶茶品牌，网红打卡。', icon: '🧋', lat: 22.5500, lng: 114.1000, transport: '地铁1号线' },
      { time: '18:00', title: '海鲜街', desc: '南山海鲜街，新鲜海鲜。', icon: '🦐', lat: 22.5000, lng: 113.9167, transport: '地铁11号线' }
    ],
    nature: [
      { time: '08:00', title: '梧桐山', desc: '深圳最高峰，登高望远。', icon: '⛰️', lat: 22.5667, lng: 114.1833, transport: '公交' },
      { time: '13:00', title: '大梅沙', desc: '最美海滩，海滨浴场。', icon: '🏖️', lat: 22.5833, lng: 114.3167, transport: '地铁8号线' },
      { time: '16:00', title: '仙湖植物园', desc: '弘法寺，植物种类繁多。', icon: '🌿', lat: 22.5667, lng: 114.1667, transport: '公交' }
    ],
    photo: [
      { time: '06:30', title: '深圳湾日出', desc: '深圳湾公园，日出美景。', icon: '🌅', lat: 22.5000, lng: 113.9667, transport: '地铁9号线' },
      { time: '10:00', title: '平安金融中心', desc: '深圳第一高楼，城市天际线。', icon: '🏙️', lat: 22.5333, lng: 114.0500, transport: '地铁3号线' },
      { time: '15:00', title: '华侨城创意园', desc: '文艺园区，拍照打卡。', icon: '🎨', lat: 22.5333, lng: 113.9667, transport: '地铁1号线' },
      { time: '19:00', title: '人才公园夜景', desc: '深圳湾夜景，灯光璀璨。', icon: '🌃', lat: 22.5000, lng: 113.9500, transport: '地铁9号线' }
    ]
  },
  '青岛': {
    culture: [
      { time: '09:00', title: '栈桥', desc: '青岛地标，百年老桥，回澜阁。', icon: '🌉', lat: 36.0667, lng: 120.3167, transport: '地铁3号线' },
      { time: '11:00', title: '八大关', desc: '万国建筑博览，别墅区。', icon: '🏛️', lat: 36.0500, lng: 120.3500, transport: '公交' },
      { time: '14:00', title: '啤酒博物馆', desc: '百年青岛啤酒，品尝原浆。', icon: '🍺', lat: 36.0833, lng: 120.3333, transport: '公交' },
      { time: '16:00', title: '五四广场', desc: '青岛地标，五月的风雕塑。', icon: '🏛️', lat: 36.0667, lng: 120.3833, transport: '地铁3号线' }
    ],
    food: [
      { time: '09:00', title: '海鲜大包', desc: '青岛早餐，海鲜馅大。', icon: '🥟', lat: 36.0667, lng: 120.3167, transport: '步行' },
      { time: '12:00', title: '劈柴院', desc: '小吃街，锅贴、海鲜。', icon: '🏮', lat: 36.0667, lng: 120.3167, transport: '步行' },
      { time: '15:00', title: '青岛啤酒', desc: '登州路啤酒街，品尝原浆。', icon: '🍺', lat: 36.0833, lng: 120.3333, transport: '公交' },
      { time: '18:00', title: '海鲜大排档', desc: '云霄路美食街，海鲜盛宴。', icon: '🦐', lat: 36.0667, lng: 120.3833, transport: '公交' }
    ],
    nature: [
      { time: '08:00', title: '崂山', desc: '海上名山第一，道教圣地。', icon: '⛰️', lat: 36.1333, lng: 120.6167, transport: '公交' },
      { time: '13:00', title: '石老人', desc: '海蚀奇观，日出美景。', icon: '🪨', lat: 36.0833, lng: 120.4667, transport: '公交' },
      { time: '16:00', title: '金沙滩', desc: '黄岛金沙滩，沙质细腻。', icon: '🏖️', lat: 35.9500, lng: 120.2000, transport: '隧道公交' }
    ],
    photo: [
      { time: '06:30', title: '栈桥日出', desc: '百年栈桥，日出美景。', icon: '🌅', lat: 36.0667, lng: 120.3167, transport: '地铁3号线' },
      { time: '10:00', title: '信号山公园', desc: '俯瞰青岛老城区，红瓦绿树。', icon: '📸', lat: 36.0667, lng: 120.3333, transport: '步行' },
      { time: '15:00', title: '小麦岛', desc: '网红打卡地，海岛风光。', icon: '🏝️', lat: 36.0500, lng: 120.4333, transport: '公交' },
      { time: '19:00', title: '浮山湾夜景', desc: '青岛CBD夜景，灯光秀。', icon: '🌃', lat: 36.0667, lng: 120.3833, transport: '地铁3号线' }
    ]
  },
  '三亚': {
    culture: [
      { time: '09:00', title: '天涯海角', desc: '中国最南端，爱情象征。', icon: '🏝️', lat: 18.2833, lng: 109.4167, transport: '公交' },
      { time: '11:00', title: '南山寺', desc: '108米海上观音，佛教圣地。', icon: '🏯', lat: 18.2833, lng: 109.2833, transport: '公交' },
      { time: '14:00', title: '鹿回头', desc: '黎族爱情传说，俯瞰三亚。', icon: '🦌', lat: 18.2333, lng: 109.5167, transport: '公交' },
      { time: '16:00', title: '三亚千古情', desc: '大型演出，了解三亚历史。', icon: '🎭', lat: 18.2500, lng: 109.5000, transport: '公交' }
    ],
    food: [
      { time: '09:00', title: '海南粉', desc: '海南特色早餐，腌粉。', icon: '🍜', lat: 18.2500, lng: 109.5000, transport: '步行' },
      { time: '12:00', title: '海鲜第一市场', desc: '新鲜海鲜，现买现做。', icon: '🦐', lat: 18.2500, lng: 109.5000, transport: '公交' },
      { time: '15:00', title: '清补凉', desc: '海南特色甜品，清凉解暑。', icon: '🍧', lat: 18.2500, lng: 109.5000, transport: '步行' },
      { time: '18:00', title: '椰子鸡', desc: '海南特色火锅，文昌鸡。', icon: '🍲', lat: 18.2500, lng: 109.5000, transport: '公交' }
    ],
    nature: [
      { time: '08:00', title: '亚龙湾', desc: '天下第一湾，水质清澈。', icon: '🏖️', lat: 18.1833, lng: 109.6167, transport: '公交' },
      { time: '13:00', title: '蜈支洲岛', desc: '中国马尔代夫，潜水圣地。', icon: '🏝️', lat: 18.3167, lng: 109.7833, transport: '快艇' },
      { time: '16:00', title: '呀诺达雨林', desc: '热带雨林，天然氧吧。', icon: '🌴', lat: 18.4167, lng: 109.6167, transport: '景区直通车' }
    ],
    photo: [
      { time: '06:30', title: '亚龙湾日出', desc: '中国最美海湾日出。', icon: '🌅', lat: 18.1833, lng: 109.6167, transport: '公交' },
      { time: '10:00', title: '后海村', desc: '冲浪圣地，文艺渔村。', icon: '🏄', lat: 18.2333, lng: 109.7167, transport: '公交' },
      { time: '15:00', title: '太阳湾公路', desc: '最美沿海公路，拍照打卡。', icon: '📸', lat: 18.2167, lng: 109.6500, transport: '自驾' },
      { time: '19:00', title: '椰梦长廊夜景', desc: '三亚湾夜景，椰林摇曳。', icon: '🌃', lat: 18.2500, lng: 109.4833, transport: '公交' }
    ]
  },
  '昆明': {
    culture: [
      { time: '09:00', title: '石林', desc: '世界自然遗产，喀斯特地貌。', icon: '🪨', lat: 24.7833, lng: 103.2667, transport: '景区直通车' },
      { time: '12:00', title: '滇池', desc: '云南最大淡水湖，西山龙门。', icon: '🌊', lat: 24.9833, lng: 102.6667, transport: '公交' },
      { time: '14:00', title: '翠湖', desc: '昆明城市客厅，冬季喂海鸥。', icon: '🦢', lat: 25.0500, lng: 102.7000, transport: '公交' },
      { time: '16:00', title: '金马碧鸡坊', desc: '昆明地标，明代建筑。', icon: '🏛️', lat: 25.0333, lng: 102.7167, transport: '公交' }
    ],
    food: [
      { time: '09:00', title: '过桥米线', desc: '云南特色，建水紫陶锅。', icon: '🍜', lat: 25.0333, lng: 102.7167, transport: '步行' },
      { time: '12:00', title: '汽锅鸡', desc: '云南名菜，福照楼老字号。', icon: '🍲', lat: 25.0333, lng: 102.7167, transport: '步行' },
      { time: '15:00', title: '鲜花饼', desc: '嘉华饼屋，玫瑰馅。', icon: '🌸', lat: 25.0333, lng: 102.7167, transport: '步行' },
      { time: '18:00', title: '南屏街', desc: '昆明夜市，小吃聚集。', icon: '🏮', lat: 25.0333, lng: 102.7167, transport: '公交' }
    ],
    nature: [
      { time: '08:00', title: '西山龙门', desc: '滇池全景，登山观景。', icon: '⛰️', lat: 24.9667, lng: 102.6333, transport: '公交' },
      { time: '13:00', title: '九乡溶洞', desc: '地下溶洞，奇观异景。', icon: '🕳️', lat: 25.0833, lng: 103.2167, transport: '景区直通车' },
      { time: '16:00', title: '东川红土地', desc: '上帝打翻的调色板。', icon: '🌈', lat: 26.0833, lng: 103.1833, transport: '景区直通车' }
    ],
    photo: [
      { time: '06:30', title: '滇池日出', desc: '高原湖泊日出，壮观。', icon: '🌅', lat: 24.9833, lng: 102.6667, transport: '公交' },
      { time: '10:00', title: '斗南花市', desc: '亚洲最大鲜花市场。', icon: '🌸', lat: 25.0167, lng: 102.7833, transport: '公交' },
      { time: '15:00', title: '官渡古镇', desc: '千年古镇，拍照打卡。', icon: '🏛️', lat: 24.9833, lng: 102.7500, transport: '公交' },
      { time: '19:00', title: '昆明老街夜景', desc: '南屏街夜景，灯火辉煌。', icon: '🌃', lat: 25.0333, lng: 102.7167, transport: '公交' }
    ]
  }
};

// ========== 路线生成逻辑 ==========
      { time: '09:00', title: '解放碑', desc: '重庆地标，抗战胜利纪念碑，繁华商圈。', icon: '️', lat: 29.5567, lng: 106.5783, transport: '地铁1号线' },
      { time: '11:00', title: '洪崖洞', desc: '吊脚楼建筑群，千与千寻现实版。', icon: '🏘️', lat: 29.5617, lng: 106.5783, transport: '步行10分钟' },
      { time: '14:00', title: '磁器口古镇', desc: '千年古镇，麻花、毛血旺、茶馆。', icon: '🏮', lat: 29.5783, lng: 106.4433, transport: '地铁1号线' },
      { time: '16:00', title: '三峡博物馆', desc: '了解巴渝文化和三峡工程。', icon: '🏛️', lat: 29.5600, lng: 106.5533, transport: '地铁2号线' }
    ],
    food: [
      { time: '09:00', title: '重庆小面', desc: '麻辣鲜香，重庆人的早餐灵魂。', icon: '🍜', lat: 29.5600, lng: 106.5800, transport: '步行' },
      { time: '12:00', title: '珮姐老火锅', desc: '正宗重庆老火锅，牛油锅底醇厚。', icon: '🌶️', lat: 29.5550, lng: 106.5750, transport: '步行10分钟' },
      { time: '15:00', title: '好又来酸辣粉', desc: '解放碑排队王，酸辣过瘾。', icon: '🍜', lat: 29.5567, lng: 106.5783, transport: '步行5分钟' },
      { time: '18:00', title: '南山一棵树', desc: '边吃火锅边看重庆夜景，绝美。', icon: '', lat: 29.5333, lng: 106.6000, transport: '打车' }
    ],
    nature: [
      { time: '08:00', title: '武隆天生三桥', desc: '变形金刚4取景地，世界自然遗产。', icon: '🌉', lat: 29.4167, lng: 107.7833, transport: '景区直通车3小时' },
      { time: '13:00', title: '仙女山', desc: '东方瑞士，高山草原风光。', icon: '⛰️', lat: 29.4833, lng: 107.7500, transport: '步行' },
      { time: '16:00', title: '芙蓉洞', desc: '世界三大洞穴之一，钟乳石奇观。', icon: '🕳️', lat: 29.3667, lng: 107.9000, transport: '景区直通车' }
    ],
    photo: [
      { time: '06:30', title: '长江索道晨景', desc: '飞渡长江，拍摄两岸晨光。', icon: '📸', lat: 29.5550, lng: 106.5833, transport: '地铁6号线' },
      { time: '10:00', title: '李子坝轻轨穿楼', desc: '重庆魔幻交通，轻轨从居民楼中穿过。', icon: '🚇', lat: 29.5517, lng: 106.5433, transport: '地铁2号线' },
      { time: '15:00', title: '鹅岭二厂', desc: '从你的全世界路过取景地，文创园区。', icon: '🎨', lat: 29.5533, lng: 106.5500, transport: '公交' },
      { time: '20:00', title: '洪崖洞夜景', desc: '灯火辉煌的吊脚楼，重庆最美夜景。', icon: '', lat: 29.5617, lng: 106.5783, transport: '步行' }
    ]
  },
  '西安': {
    culture: [
      { time: '09:00', title: '兵马俑', desc: '世界第八大奇迹，秦始皇地下军团。', icon: '🏛️', lat: 34.3842, lng: 109.2783, transport: '景区直通车' },
      { time: '13:00', title: '华清宫', desc: '唐玄宗与杨贵妃的爱情故事发生地。', icon: '🏯', lat: 34.3633, lng: 109.2167, transport: '步行' },
      { time: '15:00', title: '大雁塔', desc: '玄奘法师译经之地，唐代建筑典范。', icon: '🗼', lat: 34.2167, lng: 108.9600, transport: '地铁3号线' },
      { time: '17:00', title: '回民街', desc: '西安美食一条街，羊肉泡馍、肉夹馍。', icon: '🏮', lat: 34.2617, lng: 108.9433, transport: '地铁2号线' }
    ],
    food: [
      { time: '08:00', title: '肉夹馍', desc: '腊汁肉夹馍，外酥里嫩，西安早餐之王。', icon: '🥙', lat: 34.2600, lng: 108.9400, transport: '步行' },
      { time: '12:00', title: '羊肉泡馍', desc: '老孙家或同盛祥，掰馍是仪式感。', icon: '🍲', lat: 34.2617, lng: 108.9433, transport: '步行5分钟' },
      { time: '15:00', title: 'biangbiang面', desc: '陕西特色宽面，一根面一碗。', icon: '🍜', lat: 34.2583, lng: 108.9450, transport: '步行' },
      { time: '18:00', title: '永兴坊', desc: '摔碗酒、子长煎饼，非遗美食集合地。', icon: '🍶', lat: 34.2700, lng: 108.9500, transport: '地铁1号线' }
    ],
    nature: [
      { time: '08:00', title: '华山', desc: '五岳之一，奇险天下第一山。', icon: '⛰️', lat: 34.4833, lng: 110.0833, transport: '高铁30分钟' },
      { time: '14:00', title: '翠华山', desc: '山崩地质遗迹，天池清澈。', icon: '🏞️', lat: 34.0167, lng: 109.0167, transport: '公交' },
      { time: '17:00', title: '曲江池遗址公园', desc: '唐代皇家园林遗址，现代休闲公园。', icon: '🌿', lat: 34.2000, lng: 108.9833, transport: '地铁4号线' }
    ],
    photo: [
      { time: '06:00', title: '城墙日出', desc: '西安古城墙上拍摄日出，历史感满满。', icon: '🌅', lat: 34.2583, lng: 108.9450, transport: '地铁2号线' },
      { time: '10:00', title: '钟鼓楼', desc: '西安城市中心地标，晨钟暮鼓。', icon: '🔔', lat: 34.2600, lng: 108.9433, transport: '步行' },
      { time: '15:00', title: '大唐不夜城', desc: '盛唐文化主题步行街，夜景震撼。', icon: '🏮', lat: 34.2133, lng: 108.9600, transport: '地铁3号线' },
      { time: '20:00', title: '大雁塔音乐喷泉', desc: '亚洲最大音乐喷泉，灯光水舞。', icon: '🎵', lat: 34.2167, lng: 108.9600, transport: '步行' }
    ]
  },
  '南京': {
    culture: [
      { time: '09:00', title: '中山陵', desc: '孙中山先生陵墓，庄严肃穆。', icon: '🏛️', lat: 32.0633, lng: 118.8533, transport: '地铁2号线' },
      { time: '11:00', title: '明孝陵', desc: '明太祖朱元璋陵墓，石象路秋色绝美。', icon: '', lat: 32.0533, lng: 118.8433, transport: '步行15分钟' },
      { time: '14:00', title: '南京博物院', desc: '中国三大博物馆之一，馆藏丰富。', icon: '🏛️', lat: 32.0383, lng: 118.8233, transport: '地铁2号线' },
      { time: '16:00', title: '夫子庙秦淮河', desc: '六朝金粉地，桨声灯影里的秦淮河。', icon: '🏮', lat: 32.0200, lng: 118.7900, transport: '地铁3号线' }
    ],
    food: [
      { time: '08:00', title: '鸭血粉丝汤', desc: '南京灵魂美食，老鸭熬汤鲜美无比。', icon: '🍜', lat: 32.0200, lng: 118.7900, transport: '步行' },
      { time: '12:00', title: '盐水鸭', desc: '金陵名菜，皮白肉嫩，肥而不腻。', icon: '🦆', lat: 32.0250, lng: 118.7850, transport: '步行5分钟' },
      { time: '15:00', title: '小馄饨', desc: '南京特色馄饨，皮薄馅鲜。', icon: '🥟', lat: 32.0217, lng: 118.7883, transport: '步行' },
      { time: '18:00', title: '狮子桥美食街', desc: '南京夜宵聚集地，各种小吃应有尽有。', icon: '🍢', lat: 32.0600, lng: 118.7800, transport: '地铁1号线' }
    ],
    nature: [
      { time: '08:00', title: '玄武湖', desc: '中国最大的皇家园林湖泊，环湖骑行。', icon: '🏞️', lat: 32.0733, lng: 118.8000, transport: '地铁1号线' },
      { time: '13:00', title: '紫金山', desc: '南京绿肺，天文台和头陀岭。', icon: '⛰️', lat: 32.0667, lng: 118.8667, transport: '公交' },
      { time: '16:00', title: '栖霞山', desc: '中国四大赏枫胜地之一。', icon: '🍁', lat: 32.1500, lng: 118.9500, transport: '公交' }
    ],
    photo: [
      { time: '06:00', title: '明城墙日出', desc: '世界最长古城墙，台城段最美。', icon: '🌅', lat: 32.0650, lng: 118.8000, transport: '步行' },
      { time: '10:00', title: '颐和路公馆区', desc: '民国建筑群，梧桐大道。', icon: '🏘️', lat: 32.0600, lng: 118.7700, transport: '公交' },
      { time: '15:00', title: '老门东', desc: '南京老城南历史街区，文艺小店。', icon: '📸', lat: 32.0133, lng: 118.7900, transport: '地铁3号线' },
      { time: '19:00', title: '秦淮河夜景', desc: '画舫游船，灯火阑珊的秦淮河。', icon: '🌃', lat: 32.0200, lng: 118.7900, transport: '步行' }
    ]
  },
  '武汉': {
    culture: [
      { time: '09:00', title: '黄鹤楼', desc: '天下江山第一楼，武汉地标。', icon: '🏯', lat: 30.5467, lng: 114.3033, transport: '地铁5号线' },
      { time: '11:00', title: '湖北省博物馆', desc: '曾侯乙编钟、越王勾践剑，国宝级文物。', icon: '️', lat: 30.5567, lng: 114.3633, transport: '地铁8号线' },
      { time: '14:00', title: '武汉大学', desc: '中国最美大学之一，珞珈山风景如画。', icon: '🎓', lat: 30.5433, lng: 114.3600, transport: '公交' },
      { time: '16:00', title: '户部巷', desc: '武汉小吃一条街，热干面、豆皮。', icon: '🏮', lat: 30.5483, lng: 114.3000, transport: '步行' }
    ],
    food: [
      { time: '08:00', title: '热干面', desc: '武汉早餐之王，芝麻酱拌面，蔡林记最正宗。', icon: '', lat: 30.5483, lng: 114.3000, transport: '步行' },
      { time: '12:00', title: '三鲜豆皮', desc: '糯米+蛋皮+鲜肉，武汉特色早餐。', icon: '🥞', lat: 30.5500, lng: 114.3017, transport: '步行5分钟' },
      { time: '15:00', title: '周黑鸭', desc: '武汉卤味代表，甜辣入味。', icon: '🦆', lat: 30.5467, lng: 114.3033, transport: '步行' },
      { time: '18:00', title: '吉庆街', desc: '武汉夜宵圣地，小龙虾、烧烤。', icon: '🦞', lat: 30.5800, lng: 114.2900, transport: '地铁1号线' }
    ],
    nature: [
      { time: '08:00', title: '东湖绿道', desc: '中国最大城中湖，骑行环湖。', icon: '', lat: 30.5500, lng: 114.3833, transport: '地铁8号线' },
      { time: '13:00', title: '木兰山', desc: '武汉后花园，道教名山。', icon: '⛰️', lat: 31.1167, lng: 114.3833, transport: '景区直通车' },
      { time: '16:00', title: '武汉植物园', desc: '华中最大植物园，荷花品种丰富。', icon: '🌸', lat: 30.5500, lng: 114.4000, transport: '公交' }
    ],
    photo: [
      { time: '06:30', title: '长江大桥日出', desc: '万里长江第一桥，晨光中的长江。', icon: '🌅', lat: 30.5467, lng: 114.2900, transport: '步行' },
      { time: '10:00', title: '昙华林', desc: '武汉文艺老街，百年建筑。', icon: '🏘️', lat: 30.5533, lng: 114.3100, transport: '公交' },
      { time: '15:00', title: '江汉路', desc: '百年商业老街，欧式建筑群。', icon: '📸', lat: 30.5800, lng: 114.2833, transport: '地铁2号线' },
      { time: '20:00', title: '光谷广场夜景', desc: '武汉科技新城，现代都市灯光。', icon: '🌃', lat: 30.5000, lng: 114.4167, transport: '地铁2号线' }
    ]
  },
  '长沙': {
    culture: [
      { time: '09:00', title: '岳麓书院', desc: '千年学府，中国古代四大书院之一。', icon: '️', lat: 28.1800, lng: 112.9400, transport: '地铁4号线' },
      { time: '11:00', title: '橘子洲头', desc: '毛泽东青年艺术雕塑，湘江中心。', icon: '🗿', lat: 28.1833, lng: 112.9600, transport: '步行' },
      { time: '14:00', title: '湖南省博物馆', desc: '马王堆汉墓出土文物，辛追夫人。', icon: '🏛️', lat: 28.2100, lng: 112.9900, transport: '地铁6号线' },
      { time: '16:00', title: '太平老街', desc: '长沙最古老街道，贾谊故居在此。', icon: '🏮', lat: 28.1933, lng: 112.9733, transport: '地铁1号线' }
    ],
    food: [
      { time: '08:00', title: '长沙米粉', desc: '扁粉配肉丝码子，长沙人的早餐。', icon: '🍜', lat: 28.1933, lng: 112.9733, transport: '步行' },
      { time: '12:00', title: '文和友', desc: '超级文和友，还原80年代长沙老街。', icon: '🦞', lat: 28.1900, lng: 112.9700, transport: '步行5分钟' },
      { time: '15:00', title: '茶颜悦色', desc: '长沙本土奶茶品牌，幽兰拿铁必喝。', icon: '🧋', lat: 28.1950, lng: 112.9750, transport: '步行' },
      { time: '18:00', title: '坡子街', desc: '火宫殿臭豆腐、糖油粑粑。', icon: '🍢', lat: 28.1917, lng: 112.9717, transport: '步行' }
    ],
    nature: [
      { time: '08:00', title: '岳麓山', desc: '长沙城市绿肺，爱晚亭赏枫。', icon: '⛰️', lat: 28.1800, lng: 112.9400, transport: '地铁4号线' },
      { time: '13:00', title: '大围山', desc: '浏阳最高峰，杜鹃花海。', icon: '🌸', lat: 28.2167, lng: 113.6333, transport: '景区直通车' },
      { time: '16:00', title: '松雅湖', desc: '长沙最大人工湖，湿地生态。', icon: '🏞️', lat: 28.2500, lng: 113.1000, transport: '地铁3号线' }
    ],
    photo: [
      { time: '06:30', title: '湘江日出', desc: '橘子洲头看湘江日出。', icon: '🌅', lat: 28.1833, lng: 112.9600, transport: '步行' },
      { time: '10:00', title: '谢子龙影像艺术馆', desc: '长沙网红打卡地，建筑极简美学。', icon: '📸', lat: 28.1700, lng: 112.9300, transport: '公交' },
      { time: '15:00', title: '李自健美术馆', desc: '中国最大艺术家个人美术馆。', icon: '🎨', lat: 28.1683, lng: 112.9283, transport: '步行' },
      { time: '20:00', title: '杜甫江阁夜景', desc: '湘江边唐代风格阁楼，灯光璀璨。', icon: '', lat: 28.1900, lng: 112.9700, transport: '步行' }
    ]
  },
  '深圳': {
    culture: [
      { time: '09:00', title: '世界之窗', desc: '微缩世界著名景观，一日环游世界。', icon: '🌍', lat: 22.5333, lng: 113.9733, transport: '地铁1号线' },
      { time: '11:00', title: '锦绣中华民俗村', desc: '56个民族风情，微缩中国景观。', icon: '🏮', lat: 22.5317, lng: 113.9700, transport: '步行' },
      { time: '14:00', title: '深圳博物馆', desc: '了解深圳从小渔村到大都市的蜕变。', icon: '🏛️', lat: 22.5433, lng: 114.0600, transport: '地铁2号线' },
      { time: '16:00', title: '南头古城', desc: '深圳1700年历史见证，新旧交融。', icon: '️', lat: 22.5400, lng: 113.9200, transport: '地铁12号线' }
    ],
    food: [
      { time: '08:00', title: '肠粉', desc: '广式肠粉，深圳早餐标配。', icon: '🥟', lat: 22.5433, lng: 114.0600, transport: '步行' },
      { time: '12:00', title: '椰子鸡', desc: '深圳特色火锅，清甜养生。', icon: '', lat: 22.5400, lng: 114.0550, transport: '步行10分钟' },
      { time: '15:00', title: '奈雪的茶', desc: '深圳本土新茶饮品牌，软欧包配茶。', icon: '🧋', lat: 22.5450, lng: 114.0600, transport: '步行' },
      { time: '18:00', title: '东门老街', desc: '深圳最老商业街区，各种小吃。', icon: '', lat: 22.5483, lng: 114.1200, transport: '地铁1号线' }
    ],
    nature: [
      { time: '08:00', title: '梧桐山', desc: '深圳最高峰，登高看城市全景。', icon: '️', lat: 22.5833, lng: 114.2000, transport: '地铁8号线' },
      { time: '13:00', title: '大梅沙', desc: '深圳最美海滩，沙细水清。', icon: '🏖️', lat: 22.5933, lng: 114.3067, transport: '地铁8号线' },
      { time: '16:00', title: '红树林湿地', desc: '城市中心的候鸟保护区。', icon: '🦜', lat: 22.5167, lng: 113.9500, transport: '地铁9号线' }
    ],
    photo: [
      { time: '06:00', title: '深圳湾日出', desc: '深圳湾公园拍摄海上日出。', icon: '🌅', lat: 22.5000, lng: 113.9500, transport: '地铁9号线' },
      { time: '10:00', title: '华侨城创意园', desc: '旧工厂改造的文创园区。', icon: '🎨', lat: 22.5367, lng: 113.9733, transport: '地铁1号线' },
      { time: '15:00', title: '海上世界', desc: '明华轮旁的滨海休闲区。', icon: '📸', lat: 22.4833, lng: 113.9167, transport: '地铁2号线' },
      { time: '20:00', title: '平安金融中心夜景', desc: '深圳第一高楼，CBD灯光秀。', icon: '🌃', lat: 22.5333, lng: 114.0567, transport: '地铁3号线' }
    ]
  },
  '青岛': {
    culture: [
      { time: '09:00', title: '栈桥', desc: '青岛地标，回澜阁伸入海中。', icon: '', lat: 36.0583, lng: 120.3167, transport: '地铁3号线' },
      { time: '11:00', title: '八大关', desc: '万国建筑博览，花石楼最著名。', icon: '🏘️', lat: 36.0533, lng: 120.3500, transport: '公交' },
      { time: '14:00', title: '青岛啤酒博物馆', desc: '了解百年啤酒历史，品尝原浆啤酒。', icon: '🍺', lat: 36.0733, lng: 120.3533, transport: '地铁2号线' },
      { time: '16:00', title: '天主教堂', desc: '哥特式建筑，浙江路圣弥厄尔教堂。', icon: '⛪', lat: 36.0667, lng: 120.3267, transport: '步行' }
    ],
    food: [
      { time: '08:00', title: '青岛锅贴', desc: '底部金黄酥脆，海鲜馅最鲜。', icon: '🥟', lat: 36.0667, lng: 120.3267, transport: '步行' },
      { time: '12:00', title: '海鲜大排档', desc: '营口路市场买海鲜，附近加工。', icon: '🦐', lat: 36.0800, lng: 120.3400, transport: '公交' },
      { time: '15:00', title: '原浆啤酒', desc: '青岛啤酒厂直供，新鲜醇厚。', icon: '🍺', lat: 36.0733, lng: 120.3533, transport: '地铁2号线' },
      { time: '18:00', title: '台东步行街', desc: '青岛最热闹夜市，各种小吃。', icon: '🍢', lat: 36.0833, lng: 120.3533, transport: '地铁2号线' }
    ],
    nature: [
      { time: '08:00', title: '崂山', desc: '海上第一名山，道教圣地。', icon: '⛰️', lat: 36.1667, lng: 120.6333, transport: '景区直通车' },
      { time: '13:00', title: '石老人海水浴场', desc: '青岛最美海滩，石老人海蚀柱。', icon: '🏖️', lat: 36.0833, lng: 120.4667, transport: '地铁2号线' },
      { time: '16:00', title: '小麦岛公园', desc: '小众海景公园，草坪看海。', icon: '', lat: 36.0500, lng: 120.4167, transport: '公交' }
    ],
    photo: [
      { time: '06:00', title: '栈桥日出', desc: '回澜阁晨光，海鸥飞舞。', icon: '🌅', lat: 36.0583, lng: 120.3167, transport: '步行' },
      { time: '10:00', title: '大学路红墙', desc: '青岛网红打卡墙，红墙金瓦。', icon: '📸', lat: 36.0667, lng: 120.3333, transport: '公交' },
      { time: '15:00', title: '信号山公园', desc: '俯瞰青岛老城，红瓦绿树碧海蓝天。', icon: '🏞️', lat: 36.0633, lng: 120.3300, transport: '步行' },
      { time: '19:00', title: '五四广场夜景', desc: '五月的风雕塑，灯光秀。', icon: '🌃', lat: 36.0667, lng: 120.3833, transport: '地铁3号线' }
    ]
  },
  '三亚': {
    culture: [
      { time: '09:00', title: '南山文化旅游区', desc: '108米海上观音，佛教文化圣地。', icon: '🙏', lat: 18.2933, lng: 109.2067, transport: '景区直通车' },
      { time: '13:00', title: '天涯海角', desc: '中国最南端地标，天涯石、海角石。', icon: '️', lat: 18.2933, lng: 109.3500, transport: '公交' },
      { time: '15:00', title: '三亚千古情', desc: '大型歌舞表演，了解海南历史文化。', icon: '🎭', lat: 18.2833, lng: 109.5067, transport: '公交' },
      { time: '17:00', title: '第一市场', desc: '三亚最大海鲜市场，现买现做。', icon: '🦐', lat: 18.2533, lng: 109.5067, transport: '公交' }
    ],
    food: [
      { time: '08:00', title: '海南粉', desc: '海南特色米粉，卤汁浓郁。', icon: '🍜', lat: 18.2533, lng: 109.5067, transport: '步行' },
      { time: '12:00', title: '椰子鸡', desc: '新鲜椰子水煮鸡，清甜鲜美。', icon: '🥥', lat: 18.2500, lng: 109.5100, transport: '步行10分钟' },
      { time: '15:00', title: '清补凉', desc: '海南特色甜品，椰奶+各种配料。', icon: '🍧', lat: 18.2533, lng: 109.5067, transport: '步行' },
      { time: '18:00', title: '海鲜烧烤', desc: '三亚湾海边烧烤，边吃边看日落。', icon: '', lat: 18.2500, lng: 109.4833, transport: '公交' }
    ],
    nature: [
      { time: '08:00', title: '亚龙湾', desc: '天下第一湾，沙质细腻海水清澈。', icon: '️', lat: 18.2333, lng: 109.6333, transport: '公交' },
      { time: '13:00', title: '蜈支洲岛', desc: '中国马尔代夫，潜水胜地。', icon: '🤿', lat: 18.3167, lng: 109.7333, transport: '轮渡' },
      { time: '16:00', title: '呀诺达雨林', desc: '热带雨林探险，空中索道。', icon: '🌴', lat: 18.4167, lng: 109.4167, transport: '景区直通车' }
    ],
    photo: [
      { time: '06:00', title: '三亚湾日出', desc: '椰梦长廊看海上日出。', icon: '🌅', lat: 18.2833, lng: 109.4500, transport: '公交' },
      { time: '10:00', title: '鹿回头', desc: '三亚全景最佳拍摄点。', icon: '📸', lat: 18.2333, lng: 109.5167, transport: '公交' },
      { time: '15:00', title: '后海村', desc: '冲浪胜地，文艺渔村。', icon: '', lat: 18.3500, lng: 109.7833, transport: '公交' },
      { time: '19:00', title: '凤凰岛夜景', desc: '三亚地标建筑群，灯光璀璨。', icon: '🌃', lat: 18.2400, lng: 109.5000, transport: '步行' }
    ]
  },
  '昆明': {
    culture: [
      { time: '09:00', title: '翠湖公园', desc: '昆明城市客厅，冬季红嘴鸥聚集。', icon: '🦢', lat: 25.0433, lng: 102.7033, transport: '公交' },
      { time: '11:00', title: '云南大学', desc: '中国最美大学之一，会泽院古建筑。', icon: '🎓', lat: 25.0500, lng: 102.7033, transport: '步行' },
      { time: '14:00', title: '云南省博物馆', desc: '古滇国青铜器、南诏大理国文物。', icon: '️', lat: 24.9833, lng: 102.7333, transport: '地铁1号线' },
      { time: '16:00', title: '官渡古镇', desc: '千年古镇，官渡粑粑、饵丝。', icon: '🏮', lat: 24.9500, lng: 102.7667, transport: '公交' }
    ],
    food: [
      { time: '08:00', title: '过桥米线', desc: '云南名吃，滚烫鸡汤烫熟各种配料。', icon: '🍜', lat: 25.0433, lng: 102.7033, transport: '步行' },
      { time: '12:00', title: '汽锅鸡', desc: '云南特色，不加一滴水蒸出来的鸡汤。', icon: '🍲', lat: 25.0400, lng: 102.7000, transport: '步行5分钟' },
      { time: '15:00', title: '鲜花饼', desc: '嘉华或潘祥记，玫瑰花瓣入饼。', icon: '', lat: 25.0433, lng: 102.7033, transport: '步行' },
      { time: '18:00', title: '南屏步行街', desc: '昆明最繁华商业街，各种小吃。', icon: '🍢', lat: 25.0367, lng: 102.7167, transport: '地铁3号线' }
    ],
    nature: [
      { time: '08:00', title: '石林', desc: '世界自然遗产，喀斯特地貌奇观。', icon: '🪨', lat: 24.8167, lng: 103.3333, transport: '景区直通车' },
      { time: '13:00', title: '滇池', desc: '云南最大淡水湖，海埂大坝喂海鸥。', icon: '', lat: 24.9667, lng: 102.6500, transport: '公交' },
      { time: '16:00', title: '西山龙门', desc: '滇池西岸，登高俯瞰昆明全景。', icon: '⛰️', lat: 24.9500, lng: 102.6333, transport: '公交' }
    ],
    photo: [
      { time: '06:30', title: '滇池日出', desc: '海埂大坝拍摄滇池晨光。', icon: '🌅', lat: 24.9667, lng: 102.6500, transport: '公交' },
      { time: '10:00', title: '斗南花市', desc: '亚洲最大鲜花交易市场，花海。', icon: '🌸', lat: 24.9000, lng: 102.7833, transport: '地铁1号线' },
      { time: '15:00', title: '东川红土地', desc: '中国最美土地，色彩斑斓。', icon: '', lat: 25.9167, lng: 103.1333, transport: '景区直通车' },
      { time: '19:00', title: '金马碧鸡坊夜景', desc: '昆明地标牌坊，灯光璀璨。', icon: '🌃', lat: 25.0367, lng: 102.7133, transport: '步行' }
    ]
  }
};

// ========== 路线规划 ==========
function generateRoute() {
  const dest = document.getElementById('route-dest').value.trim();
  const days = document.getElementById('route-days').value;
  const type = document.getElementById('route-type').value;

  if (!dest) {
    alert('请输入目的地');
    return;
  }

  if (!routeData[dest]) {
    const supported = Object.keys(routeData).join('、');
    alert(`暂不支持"${dest}"的路线规划。\n\n目前支持：${supported}`);
    return;
  }

  const cityData = routeData[dest];
  const routes = cityData[type] || cityData.culture;
  currentRouteData = { dest, days, type, routes };

  document.getElementById('route-result').style.display = 'block';
  document.getElementById('map-title').textContent = `🗺️ ${dest} · ${getDaysText(days)}${getRouteTypeText(type)}`;
  document.getElementById('nav-start-btn').style.display = 'inline-block';
  document.getElementById('nav-stop-btn').style.display = 'none';

  renderRouteMap(dest, routes);
  renderRouteSummary(dest, routes);

  const timeline = document.getElementById('route-timeline');
  timeline.innerHTML = routes.map((route, idx) => `
    <div class="timeline-item" onclick="focusOnMarker(${idx})">
      <span class="time-badge">${route.time}</span>
      <h4>${route.icon} ${route.title}</h4>
      <p>${route.desc}</p>
      ${route.transport ? `<div style="margin-top:0.4rem;font-size:0.8rem;color:var(--primary);"> ${route.transport}</div>` : ''}
      <button class="timeline-nav-btn" onclick="event.stopPropagation();navigateTo(${idx})">🧭 导航到这里</button>
    </div>
  `).join('');

  renderRouteTips(dest, routes);
}

function getDaysText(days) {
  const map = { '1': '一日游', '2': '两日游', '3': '三日游', '5': '五日游', '7': '七日游' };
  return map[days] || '三日游';
}

function getRouteTypeText(type) {
  const map = { culture: '文化之旅', food: '美食之旅', nature: '自然探索', photo: '摄影打卡' };
  return map[type] || '文化之旅';
}

// ========== 地图渲染 ==========
function renderRouteMap(dest, routes) {
  if (routeMap) { routeMap.remove(); routeMap = null; }
  routeMarkers = [];
  routePolyline = null;

  const mapContainer = document.getElementById('route-map');
  mapContainer.innerHTML = '<div class="map-loading"><div class="map-spinner"></div><p>地图加载中...</p></div>';

  const center = cityCoords[dest] || [39.9042, 116.4074];
  routeMap = L.map('route-map', { center, zoom: 13, zoomControl: true });

  const tileLayer = L.tileLayer('https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© GeoQ', maxZoom: 18
  }).addTo(routeMap);

  let loaded = false;
  tileLayer.on('load', () => {
    if (!loaded) { loaded = true; const loader = mapContainer.querySelector('.map-loading'); if (loader) loader.remove(); }
  });
  setTimeout(() => { const loader = mapContainer.querySelector('.map-loading'); if (loader) loader.remove(); }, 5000);

  const coordinates = [];
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

  routes.forEach((route, idx) => {
    if (route.lat && route.lng) {
      const latlng = [route.lat, route.lng];
      coordinates.push(latlng);
      const icon = L.divIcon({
        html: `<div style="background:${colors[idx % colors.length]};color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">${idx + 1}</div>`,
        className: 'custom-marker', iconSize: [32, 32], iconAnchor: [16, 16]
      });
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

  if (coordinates.length > 1) {
    routePolyline = L.polyline(coordinates, { color: '#6366f1', weight: 4, opacity: 0.7, dashArray: '10, 10' }).addTo(routeMap);
  }
  if (coordinates.length > 0) {
    routeMap.fitBounds(L.latLngBounds(coordinates), { padding: [50, 50] });
  }
  renderMapLegend(routes, colors);
}

function renderMapLegend(routes, colors) {
  document.getElementById('map-legend').innerHTML = routes.map((route, idx) => `
    <div class="legend-item"><div class="legend-dot" style="background:${colors[idx % colors.length]}"></div><span>${idx + 1}. ${route.title}</span></div>
  `).join('');
}

function renderRouteSummary(dest, routes) {
  const totalStops = routes.length;
  const firstStop = routes[0]?.time || '09:00';
  const lastStop = routes[routes.length - 1]?.time || '18:00';
  document.getElementById('route-summary').innerHTML = `
    <h3>📊 路线概览</h3>
    <div class="summary-grid">
      <div class="summary-item"><span class="summary-value">${totalStops}</span><span class="summary-label">景点数量</span></div>
      <div class="summary-item"><span class="summary-value">${firstStop}-${lastStop}</span><span class="summary-label">时间跨度</span></div>
      <div class="summary-item"><span class="summary-value">${dest}</span><span class="summary-label">目的地</span></div>
      <div class="summary-item"><span class="summary-value">AI</span><span class="summary-label">智能规划</span></div>
    </div>
  `;
}

// ========== 出行贴士 ==========
function renderRouteTips(dest, routes) {
  const tips = [
    { icon: '🎫', text: '建议提前预约门票' },
    { icon: '🚇', text: '推荐地铁出行，避开拥堵' },
    { icon: '📱', text: '下载离线地图备用' },
    { icon: '💧', text: '随身携带饮用水' },
    { icon: '🔋', text: '带充电宝保持电量' },
    { icon: '🧴', text: '注意防晒/防雨' },
  ];
  const cityTips = {
    '北京': [{ icon: '🏛️', text: '故宫周一闭馆' }, { icon: '🌬️', text: '春秋季风大注意保暖' }],
    '上海': [{ icon: '🌧️', text: '梅雨季备好雨具' }, { icon: '🏙️', text: '外滩夜景建议19点后' }],
    '成都': [{ icon: '🌶️', text: '吃辣量力而行' }, { icon: '', text: '熊猫基地建议早去' }],
    '贵阳': [{ icon: '️', text: '天无三日晴，带伞' }, { icon: '️', text: '饮食偏酸辣' }],
    '广州': [{ icon: '️', text: '回南天注意防潮' }, { icon: '', text: '早茶建议10点前' }],
    '杭州': [{ icon: '🌧️', text: '西湖边多雨带伞' }, { icon: '🍵', text: '龙井茶春季最佳' }],
    '厦门': [{ icon: '☀️', text: '海边注意防晒' }, { icon: '', text: '鼓浪屿需提前买船票' }],
    '重庆': [{ icon: '🌶️', text: '火锅微辣也很辣' }, { icon: '🏔️', text: '山城多爬坡穿舒适鞋' }],
    '西安': [{ icon: '🏛️', text: '兵马俑需提前预约' }, { icon: '🌬️', text: '春秋季多风沙' }],
    '南京': [{ icon: '🍁', text: '秋季栖霞山赏枫' }, { icon: '🦆', text: '盐水鸭真空包装可带走' }],
    '武汉': [{ icon: '🌡️', text: '夏季炎热注意防暑' }, { icon: '🍜', text: '热干面早餐必吃' }],
    '长沙': [{ icon: '🌶️', text: '湘菜偏辣备好肠胃药' }, { icon: '🧋', text: '茶颜悦色排队久' }],
    '深圳': [{ icon: '☀️', text: '全年温暖注意防晒' }, { icon: '🌧️', text: '4-9月为雨季' }],
    '青岛': [{ icon: '🍺', text: '啤酒节8月举办' }, { icon: '🌊', text: '海边早晚温差大' }],
    '三亚': [{ icon: '☀️', text: '全年可游泳带泳衣' }, { icon: '🌴', text: '11-3月最佳旅游季' }],
    '昆明': [{ icon: '🌸', text: '四季如春带薄外套' }, { icon: '🦢', text: '冬季可喂红嘴鸥' }],
  };
  if (cityTips[dest]) tips.push(...cityTips[dest]);

  document.getElementById('route-tips').innerHTML = `
    <h4>💡 出行贴士</h4>
    <div class="tips-grid">${tips.map(tip => `<div class="tip-item"><span class="tip-icon">${tip.icon}</span><span>${tip.text}</span></div>`).join('')}</div>
  `;
}

// ========== 地图交互 ==========
function focusOnMarker(idx) {
  if (routeMarkers[idx] && routeMap) {
    routeMap.setView(routeMarkers[idx].getLatLng(), 15);
    routeMarkers[idx].openPopup();
    document.querySelectorAll('.timeline-item').forEach((item, i) => item.classList.toggle('active', i === idx));
  }
}

function navigateTo(idx) {
  if (currentRouteData && currentRouteData.routes[idx]) {
    const route = currentRouteData.routes[idx];
    if (route.lat && route.lng) {
      window.open(`https://uri.amap.com/marker?position=${route.lng},${route.lat}&name=${encodeURIComponent(route.title)}`, '_blank', 'noopener,noreferrer');
    }
  }
}

function startNavigation() {
  if (!currentRouteData || !routeMarkers.length) return;
  currentNavIndex = 0;
  document.getElementById('nav-start-btn').style.display = 'none';
  document.getElementById('nav-stop-btn').style.display = 'inline-block';
  navigationInterval = setInterval(() => {
    if (currentNavIndex < routeMarkers.length) { focusOnMarker(currentNavIndex); currentNavIndex++; }
    else stopNavigation();
  }, 3000);
  focusOnMarker(0);
}

function stopNavigation() {
  if (navigationInterval) { clearInterval(navigationInterval); navigationInterval = null; }
  document.getElementById('nav-start-btn').style.display = 'inline-block';
  document.getElementById('nav-stop-btn').style.display = 'none';
  document.querySelectorAll('.timeline-item').forEach(item => item.classList.remove('active'));
}

// ========== 行李清单 ==========
const packingData = {
  essentials: { name: '📋 必备物品', items: ['身份证/护照', '手机+充电器', '钱包/银行卡', '钥匙', '纸巾/湿巾', '口罩'] },
  clothes: {
    name: '👕 衣物',
    hot: ['短袖T恤', '短裤/裙子', '凉鞋', '太阳帽', '墨镜', '防晒霜'],
    warm: ['长袖衬衫', '薄外套', '长裤', '运动鞋', '薄围巾'],
    cool: ['毛衣', '风衣', '长裤', '运动鞋', '围巾'],
    cold: ['羽绒服', '保暖内衣', '毛衣', '厚裤子', '雪地靴', '手套', '帽子', '围巾']
  },
  toiletries: { name: '🧴 洗漱用品', items: ['牙刷牙膏', '毛巾', '洗发水', '沐浴露', '护肤品', '梳子', '剃须刀'] },
  electronics: { name: '🔌 电子设备', items: ['充电宝', '数据线', '耳机', '相机', '自拍杆', '转换插头'] },
  beach: { name: '🏖️ 海边专用', items: ['泳衣', '沙滩巾', '防水袋', '浮潜装备', '沙滩鞋'] },
  mountain: { name: '⛰️ 登山专用', items: ['登山鞋', '登山杖', '冲锋衣', '头灯', '急救包', '能量棒'] },
  business: { name: '💼 商务专用', items: ['正装', '皮鞋', '名片', '笔记本电脑', '文件夹'] },
  photo: { name: ' 摄影专用', items: ['三脚架', '备用电池', '存储卡', '镜头清洁套装', '防雨罩'] }
};

function generatePackingList() {
  const dest = document.getElementById('packing-dest').value.trim();
  const weather = document.getElementById('packing-weather').value;
  const days = document.getElementById('packing-days').value;
  if (!dest) { alert('请输入目的地'); return; }

  const categories = [
    { ...packingData.essentials },
    { name: '👕 衣物', items: [...(packingData.clothes[weather] || packingData.clothes.warm)] },
    { ...packingData.toiletries },
    { ...packingData.electronics }
  ];
  if (document.getElementById('opt-beach').checked) categories.push({ ...packingData.beach });
  if (document.getElementById('opt-mountain').checked) categories.push({ ...packingData.mountain });
  if (document.getElementById('opt-business').checked) categories.push({ ...packingData.business });
  if (document.getElementById('opt-photo').checked) categories.push({ ...packingData.photo });
  if (parseInt(days) >= 7) categories[1].items.push('备用衣物套装');

  document.getElementById('packing-result').style.display = 'block';
  let totalItems = 0;
  categories.forEach(cat => totalItems += cat.items.length);

  document.getElementById('packing-list').innerHTML = categories.map((cat, catIdx) => `
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
  items.forEach(item => { const input = item.querySelector('input'); item.classList.toggle('checked', input.checked); });
  const total = items.length, done = checked.length, percent = total > 0 ? (done / total * 100) : 0;
  document.getElementById('packing-progress-fill').style.width = percent + '%';
  document.getElementById('packing-progress-text').textContent = `${done}/${total} 已准备`;
}

// ========== 地标打卡 ==========
const landmarkData = {
  '北京': [
    { name: '故宫', desc: '紫禁城', icon: '🏯' }, { name: '长城', desc: '八达岭/慕田峪', icon: '🧱' },
    { name: '天坛', desc: '祈年殿', icon: '🏛️' }, { name: '颐和园', desc: '皇家园林', icon: '🏞️' },
    { name: '鸟巢', desc: '国家体育场', icon: '🏟️' }, { name: '水立方', desc: '国家游泳中心', icon: '' }
  ],
  '上海': [
    { name: '东方明珠', desc: '地标电视塔', icon: '🗼' }, { name: '外滩', desc: '万国建筑群', icon: '🏛️' },
    { name: '豫园', desc: '古典园林', icon: '🏯' }, { name: '迪士尼', desc: '主题乐园', icon: '' },
    { name: '陆家嘴', desc: '金融中心', icon: '🏙️' }, { name: '南京路', desc: '商业街', icon: '🛍️' }
  ],
  '成都': [
    { name: '熊猫基地', desc: '大熊猫繁育', icon: '🐼' }, { name: '武侯祠', desc: '三国文化', icon: '🏯' },
    { name: '锦里', desc: '古街民俗', icon: '🏮' }, { name: '宽窄巷子', desc: '老成都', icon: '️' },
    { name: 'IFS', desc: '爬墙熊猫', icon: '' }, { name: '都江堰', desc: '水利奇迹', icon: '🌊' }
  ],
  '贵阳': [
    { name: '甲秀楼', desc: '贵阳地标', icon: '🏯' }, { name: '黄果树瀑布', desc: '亚洲最大瀑布', icon: '🌊' },
    { name: '青岩古镇', desc: '明清古镇', icon: '🏘️' }, { name: '黔灵山', desc: '猕猴乐园', icon: '🐒' },
    { name: '花果园白宫', desc: '夜景地标', icon: '' }, { name: '天河潭', desc: '贵州缩影', icon: '📷' }
  ],
  '广州': [
    { name: '广州塔', desc: '小蛮腰', icon: '🗼' }, { name: '陈家祠', desc: '岭南建筑', icon: '🏛️' },
    { name: '沙面', desc: '欧式建筑', icon: '🏘️' }, { name: '长隆', desc: '主题乐园', icon: '🎢' },
    { name: '白云山', desc: '城市绿肺', icon: '⛰️' }, { name: '北京路', desc: '千年古道', icon: '️' }
  ],
  '杭州': [
    { name: '西湖', desc: '人间天堂', icon: '🏞️' }, { name: '灵隐寺', desc: '千年古刹', icon: '🏯' },
    { name: '宋城', desc: '主题公园', icon: '🏰' }, { name: '千岛湖', desc: '天下第一秀水', icon: '🏞️' },
    { name: '西溪湿地', desc: '城市湿地', icon: '🌿' }, { name: '雷峰塔', desc: '白蛇传说', icon: '🗼' }
  ],
  '厦门': [
    { name: '鼓浪屿', desc: '海上花园', icon: '️' }, { name: '南普陀寺', desc: '佛教圣地', icon: '' },
    { name: '厦门大学', desc: '最美校园', icon: '🎓' }, { name: '曾厝垵', desc: '文艺渔村', icon: '🏘️' },
    { name: '环岛路', desc: '海滨大道', icon: '🛣️' }, { name: '集美学村', desc: '嘉庚建筑', icon: '️' }
  ],
  '重庆': [
    { name: '洪崖洞', desc: '千与千寻', icon: '🏘️' }, { name: '解放碑', desc: '城市地标', icon: '️' },
    { name: '长江索道', desc: '飞渡长江', icon: '🚡' }, { name: '磁器口', desc: '千年古镇', icon: '' },
    { name: '武隆天坑', desc: '世界遗产', icon: '🌉' }, { name: '李子坝轻轨', desc: '穿楼轻轨', icon: '🚇' }
  ],
  '西安': [
    { name: '兵马俑', desc: '世界奇迹', icon: '🏛️' }, { name: '大雁塔', desc: '唐代建筑', icon: '🗼' },
    { name: '城墙', desc: '古城墙', icon: '🧱' }, { name: '华清宫', desc: '爱情圣地', icon: '🏯' },
    { name: '回民街', desc: '美食街', icon: '🏮' }, { name: '华山', desc: '五岳之一', icon: '⛰️' }
  ],
  '南京': [
    { name: '中山陵', desc: '国父陵墓', icon: '🏛️' }, { name: '夫子庙', desc: '秦淮风光', icon: '🏮' },
    { name: '明孝陵', desc: '明代皇陵', icon: '🏯' }, { name: '玄武湖', desc: '皇家湖泊', icon: '🏞️' },
    { name: '南京城墙', desc: '世界最长', icon: '🧱' }, { name: '栖霞山', desc: '赏枫胜地', icon: '🍁' }
  ],
  '武汉': [
    { name: '黄鹤楼', desc: '天下名楼', icon: '🏯' }, { name: '长江大桥', desc: '万里长江第一桥', icon: '🌉' },
    { name: '东湖', desc: '最大城中湖', icon: '🏞️' }, { name: '户部巷', desc: '小吃街', icon: '🏮' },
    { name: '武汉大学', desc: '最美校园', icon: '🎓' }, { name: '湖北省博', desc: '编钟文物', icon: '🏛️' }
  ],
  '长沙': [
    { name: '橘子洲', desc: '湘江中心', icon: '️' }, { name: '岳麓山', desc: '千年学府', icon: '⛰️' },
    { name: '太平老街', desc: '最古街道', icon: '🏮' }, { name: '湖南省博', desc: '马王堆', icon: '🏛️' },
    { name: 'IFS国金中心', desc: '城市地标', icon: '🏙️' }, { name: '杜甫江阁', desc: '湘江名楼', icon: '🏯' }
  ],
  '深圳': [
    { name: '世界之窗', desc: '微缩世界', icon: '🌍' }, { name: '欢乐谷', desc: '主题乐园', icon: '🎢' },
    { name: '大梅沙', desc: '最美海滩', icon: '🏖️' }, { name: '梧桐山', desc: '深圳最高峰', icon: '⛰️' },
    { name: '东门老街', desc: '最老商圈', icon: '🛍️' }, { name: '平安金融中心', desc: '第一高楼', icon: '🏙️' }
  ],
  '青岛': [
    { name: '栈桥', desc: '青岛地标', icon: '' }, { name: '八大关', desc: '万国建筑', icon: '️' },
    { name: '崂山', desc: '海上名山', icon: '️' }, { name: '啤酒博物馆', desc: '百年啤酒', icon: '🍺' },
    { name: '五四广场', desc: '城市地标', icon: '️' }, { name: '石老人', desc: '海蚀奇观', icon: '🪨' }
  ],
  '三亚': [
    { name: '天涯海角', desc: '最南端', icon: '️' }, { name: '南山寺', desc: '海上观音', icon: '' },
    { name: '亚龙湾', desc: '天下第一湾', icon: '🏖️' }, { name: '蜈支洲岛', desc: '中国马尔代夫', icon: '' },
    { name: '鹿回头', desc: '爱情传说', icon: '🦌' }, { name: '呀诺达', desc: '热带雨林', icon: '🌴' }
  ],
  '昆明': [
    { name: '石林', desc: '世界遗产', icon: '🪨' }, { name: '滇池', desc: '最大淡水湖', icon: '🌊' },
    { name: '翠湖', desc: '城市客厅', icon: '🦢' }, { name: '西山龙门', desc: '滇池全景', icon: '⛰️' },
    { name: '斗南花市', desc: '亚洲最大', icon: '🌸' }, { name: '金马碧鸡坊', desc: '城市地标', icon: '🏛️' }
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
  document.querySelectorAll('.city-btn').forEach(btn => btn.classList.toggle('active', btn.textContent === city));
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
        <div class="landmark-info"><h4>${lm.name}</h4><p>${lm.desc}</p></div>
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
    const lm = landmarkData[city][idx];
    document.getElementById('modal-title').textContent = '打卡成功！';
    document.getElementById('modal-desc').textContent = `恭喜你打卡了${city}的${lm.name}！`;
    document.getElementById('checkin-modal').style.display = 'flex';
  }
}

function closeModal() { document.getElementById('checkin-modal').style.display = 'none'; }

function updateLandmarkStats() {
  let checked = 0, total = 0;
  const citiesUnlocked = new Set();
  Object.keys(landmarkData).forEach(city => {
    total += landmarkData[city].length;
    landmarkData[city].forEach((_, idx) => {
      const key = `${city}-${idx}`;
      if (checkedLandmarks[key]) { checked++; citiesUnlocked.add(city); }
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
    { category: '书店', name: '方所', rating: '⭐⭐⭐⭐⭐', desc: '地下书店综合体，设计感强，咖啡也不错。', tags: ['书店', '设计', '咖啡'], tip: '位于太古里负一层，适合下雨天' }
  ],
  guangzhou: [
    { category: '茶楼', name: '点都德', rating: '⭐⭐⭐⭐', desc: '老字号早茶，虾饺凤爪叉烧包，正宗广式点心。', tags: ['早茶', '老字号', '广式'], tip: '推荐金沙流沙包和虾饺，早上10点前去' },
    { category: '咖啡馆', name: '.jpg', rating: '⭐⭐⭐⭐⭐', desc: '东山口网红咖啡，老洋房改造，出片率极高。', tags: ['网红', '洋房', '东山口'], tip: '推荐dirty，拍照很出片' },
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
  ],
  chongqing: [
    { category: '火锅店', name: '珮姐老火锅', rating: '⭐⭐⭐⭐⭐', desc: '正宗重庆老火锅，牛油锅底醇厚，排队两小时起。', tags: ['火锅', '牛油', '排队王'], tip: '建议下午4点前去排号，毛肚和鸭肠必点' },
    { category: '小面馆', name: '花市豌杂面', rating: '⭐⭐⭐⭐⭐', desc: '重庆小面代表，豌杂面是招牌，麻辣鲜香。', tags: ['小面', '豌杂', '地道'], tip: '加个煎蛋更满足，微辣就很辣了' },
    { category: '茶馆', name: '交通茶馆', rating: '⭐⭐⭐⭐', desc: '黄桷坪老街茶馆，老重庆人的社交场所。', tags: ['老茶馆', '市井', '黄桷坪'], tip: '点杯盖碗茶，感受最地道的重庆慢生活' },
    { category: '烧烤店', name: '南山路烧烤', rating: '⭐⭐⭐⭐', desc: '南山上的烧烤，边吃边看重庆夜景。', tags: ['烧烤', '夜景', '南山'], tip: '推荐烤脑花和烤皮，19点后去能看到夜景' }
  ],
  xian: [
    { category: '面馆', name: 'biangbiang面', rating: '⭐⭐⭐⭐⭐', desc: '陕西特色宽面，一根面一碗，油泼辣子香。', tags: ['面食', '油泼', '陕西'], tip: '加个腊汁肉夹馍，完美组合' },
    { category: '肉夹馍', name: '子午路张记', rating: '⭐⭐⭐⭐⭐', desc: '西安肉夹馍天花板，腊汁肉肥而不腻。', tags: ['肉夹馍', '腊汁肉', '老字号'], tip: '优质肉夹馍肉更多，配冰峰汽水' },
    { category: '泡馍馆', name: '老孙家', rating: '⭐⭐⭐⭐', desc: '百年老字号，羊肉泡馍正宗，掰馍是仪式感。', tags: ['泡馍', '羊肉', '百年老店'], tip: '馍要掰得越小越好，耐心点' },
    { category: '茶馆', name: '德福巷茶馆', rating: '⭐⭐⭐⭐', desc: '古城墙下的文艺茶馆，安静惬意。', tags: ['茶馆', '文艺', '城墙'], tip: '推荐茯茶，搭配陕式糕点' }
  ],
  nanjing: [
    { category: '鸭血粉丝', name: '回味鸭血粉丝汤', rating: '⭐⭐⭐⭐⭐', desc: '南京灵魂美食，老鸭熬汤鲜美无比。', tags: ['鸭血粉丝', '南京', '老字号'], tip: '加个锅贴，南京早餐标配' },
    { category: '盐水鸭', name: '韩复兴', rating: '⭐⭐⭐⭐⭐', desc: '金陵名菜，皮白肉嫩，肥而不腻。', tags: ['盐水鸭', '金陵', '名菜'], tip: '可以真空包装带走当伴手礼' },
    { category: '小馄饨', name: '汪家馄饨', rating: '⭐⭐⭐⭐', desc: '南京特色馄饨，皮薄馅鲜，汤底清亮。', tags: ['馄饨', '皮薄', '鲜汤'], tip: '加个茶叶蛋，完美早餐' },
    { category: '书店', name: '先锋书店', rating: '⭐⭐⭐⭐⭐', desc: '中国最美书店之一，地下车库改造。', tags: ['书店', '文艺', '地下'], tip: '五台山总店最大，适合拍照打卡' }
  ],
  changsha: [
    { category: '奶茶店', name: '茶颜悦色', rating: '⭐⭐⭐⭐⭐', desc: '长沙本土奶茶品牌，幽兰拿铁必喝。', tags: ['奶茶', '本土', '排队'], tip: '幽兰拿铁和声声乌龙是招牌，排队久但值得' },
    { category: '臭豆腐', name: '黑色经典', rating: '⭐⭐⭐⭐⭐', desc: '长沙臭豆腐代表，外酥里嫩，汤汁鲜美。', tags: ['臭豆腐', '长沙', '小吃'], tip: '加辣加醋更地道，趁热吃' },
    { category: '小龙虾', name: '文和友', rating: '⭐⭐⭐⭐⭐', desc: '超级文和友，还原80年代长沙老街。', tags: ['小龙虾', '复古', '网红'], tip: '口味虾和蒜蓉虾都好吃，环境很出片' },
    { category: '米粉店', name: '肆姐面粉馆', rating: '⭐⭐⭐⭐', desc: '长沙米粉老字号，扁粉配肉丝码子。', tags: ['米粉', '老字号', '早餐'], tip: '肉丝粉是经典，加个煎蛋' }
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
  setTimeout(() => { document.getElementById('blindbox-btn').textContent = '🎲 再抽一次'; }, 500);
}

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
  if (!text) { alert('请输入旅途文字'); return; }
  document.getElementById('journal-output').style.display = 'block';
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  document.getElementById('journal-date').textContent = `📅 ${dateStr}`;
  document.getElementById('journal-weather').textContent = getWeatherEmoji();

  const styles = {
    cute: { bg: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', color: '#be185d', stickers: ['', '🎀', '💖', '✨'], doodles: ['🌈', '⭐', '🦋'] },
    retro: { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e', stickers: ['📷', '🎞️', '📻', '🎨'], doodles: ['🎭', '🎪', '🎬'] },
    fresh: { bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#065f46', stickers: ['🌿', '🍃', '🌱', '💚'], doodles: ['🌻', '🌼', ''] },
    ink: { bg: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', color: '#1f2937', stickers: ['', '🖌️', '', '🏮'], doodles: ['', '🎍', ''] }
  };
  const style = styles[currentStyle];
  const page = document.getElementById('journal-page');
  page.style.background = style.bg;
  page.style.color = style.color;

  const processedText = text.replace(/。/g, '。<br>').replace(/！/g, '！✨').replace(/？/g, '？🤔').replace(/美/g, '美💕').replace(/好吃/g, '好吃😋').replace(/开心/g, '开心🥰');
  document.getElementById('journal-content').innerHTML = processedText;
  document.getElementById('journal-stickers').innerHTML = style.stickers.map(s => `<div>${s}</div>`).join('');
  document.getElementById('journal-doodles').innerHTML = style.doodles.map(d => `<div>${d}</div>`).join('');
}

function getWeatherEmoji() {
  const weathers = ['☀️ 晴', '⛅ 多云', '🌤️ 晴间多云', '🌈 雨后彩虹'];
  return weathers[Math.floor(Math.random() * weathers.length)];
}
function downloadJournal() { alert(' 手账图片已保存！（演示功能）'); }
function shareJournal() { alert(' 分享链接已复制！（演示功能）'); }

// ========== 旅行预算计算器 ==========
const cityCostLevel = {
  '北京': { hotel: { budget: 150, comfort: 300, luxury: 600 }, food: { budget: 60, comfort: 120, luxury: 250 }, ticket: 80, transport_local: 30 },
  '上海': { hotel: { budget: 180, comfort: 350, luxury: 700 }, food: { budget: 70, comfort: 130, luxury: 280 }, ticket: 70, transport_local: 30 },
  '成都': { hotel: { budget: 100, comfort: 220, luxury: 500 }, food: { budget: 40, comfort: 90, luxury: 200 }, ticket: 50, transport_local: 20 },
  '贵阳': { hotel: { budget: 80, comfort: 180, luxury: 400 }, food: { budget: 35, comfort: 80, luxury: 180 }, ticket: 60, transport_local: 20 },
  '广州': { hotel: { budget: 150, comfort: 300, luxury: 600 }, food: { budget: 50, comfort: 110, luxury: 230 }, ticket: 60, transport_local: 25 },
  '杭州': { hotel: { budget: 150, comfort: 300, luxury: 600 }, food: { budget: 55, comfort: 110, luxury: 230 }, ticket: 70, transport_local: 25 },
  '厦门': { hotel: { budget: 120, comfort: 250, luxury: 550 }, food: { budget: 45, comfort: 100, luxury: 220 }, ticket: 50, transport_local: 20 },
  '重庆': { hotel: { budget: 100, comfort: 220, luxury: 500 }, food: { budget: 40, comfort: 90, luxury: 200 }, ticket: 50, transport_local: 20 },
  '西安': { hotel: { budget: 100, comfort: 220, luxury: 480 }, food: { budget: 40, comfort: 85, luxury: 190 }, ticket: 80, transport_local: 20 },
  '南京': { hotel: { budget: 130, comfort: 260, luxury: 550 }, food: { budget: 45, comfort: 100, luxury: 210 }, ticket: 60, transport_local: 20 },
  '武汉': { hotel: { budget: 100, comfort: 220, luxury: 480 }, food: { budget: 40, comfort: 90, luxury: 200 }, ticket: 50, transport_local: 20 },
  '长沙': { hotel: { budget: 100, comfort: 220, luxury: 480 }, food: { budget: 40, comfort: 90, luxury: 200 }, ticket: 50, transport_local: 20 },
  '深圳': { hotel: { budget: 180, comfort: 350, luxury: 700 }, food: { budget: 60, comfort: 120, luxury: 260 }, ticket: 60, transport_local: 30 },
  '青岛': { hotel: { budget: 120, comfort: 260, luxury: 550 }, food: { budget: 50, comfort: 110, luxury: 240 }, ticket: 50, transport_local: 25 },
  '三亚': { hotel: { budget: 150, comfort: 350, luxury: 800 }, food: { budget: 50, comfort: 120, luxury: 280 }, ticket: 100, transport_local: 30 },
  '昆明': { hotel: { budget: 80, comfort: 200, luxury: 450 }, food: { budget: 35, comfort: 80, luxury: 180 }, ticket: 60, transport_local: 20 }
};

const transportCost = { train: 300, plane: 800, self: 500 };

function calculateBudget() {
  const dest = document.getElementById('budget-dest').value.trim();
  const people = parseInt(document.getElementById('budget-people').value);
  const days = parseInt(document.getElementById('budget-days').value);
  const hotel = document.getElementById('budget-hotel').value;
  const food = document.getElementById('budget-food').value;
  const transport = document.getElementById('budget-transport').value;

  if (!dest) { alert('请输入目的地'); return; }

  const cost = cityCostLevel[dest] || cityCostLevel['北京'];
  const hotelPerNight = cost.hotel[hotel];
  const foodPerDay = cost.food[food];
  const ticketPerDay = cost.ticket;
  const localTransportPerDay = cost.transport_local;
  const bigTransport = transportCost[transport];

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
    { name: '🚄 大交通（往返）', amount: bigTransportTotal, color: '#6366f1', percent: 0 },
    { name: ' 住宿', amount: hotelTotal, color: '#ec4899', percent: 0 },
    { name: '🍜 餐饮', amount: foodTotal, color: '#f59e0b', percent: 0 },
    { name: '🎫 门票', amount: ticketTotal, color: '#10b981', percent: 0 },
    { name: '🚇 市内交通', amount: localTransportTotal, color: '#8b5cf6', percent: 0 },
    { name: '🛍️ 购物/其他', amount: shoppingBudget, color: '#ef4444', percent: 0 }
  ];
  items.forEach(item => item.percent = Math.round(item.amount / total * 100));

  document.getElementById('budget-breakdown').innerHTML = items.map(item => `
    <div class="budget-item">
      <div class="budget-item-header">
        <span>${item.name}</span>
        <span class="budget-item-amount">¥${item.amount.toLocaleString()}</span>
      </div>
      <div class="budget-item-bar">
        <div class="budget-item-fill" style="width:${item.percent}%;background:${item.color}"></div>
      </div>
      <span class="budget-item-percent">${item.percent}%</span>
    </div>
  `).join('');

  const tips = getBudgetTips(dest, hotel, food, transport, days);
  document.getElementById('budget-tips').innerHTML = `
    <h4>💡 省钱小贴士</h4>
    <div class="tips-grid">${tips.map(tip => `<div class="tip-item"><span class="tip-icon">${tip.icon}</span><span>${tip.text}</span></div>`).join('')}</div>
  `;
}

function getBudgetTips(dest, hotel, food, transport, days) {
  const tips = [
    { icon: '', text: '提前网上购票通常比现场便宜10-20%' },
    { icon: '🏨', text: '工作日住宿比周末便宜30%以上' },
    { icon: '🍜', text: '避开景区周边餐厅，本地人去的更实惠' },
    { icon: '🚇', text: '办一张当地交通卡，地铁公交都有折扣' },
  ];
  if (transport === 'plane') tips.push({ icon: '✈️', text: '提前2周订票通常最便宜' });
  if (hotel === 'luxury') tips.push({ icon: '🏨', text: '豪华型可以考虑民宿，性价比更高' });
  if (days >= 5) tips.push({ icon: '📅', text: '5天以上行程建议购买景点联票' });
  const cityTips = {
    '北京': [{ icon: '🏛️', text: '很多博物馆免费，提前预约即可' }],
    '成都': [{ icon: '🐼', text: '熊猫基地早上去，门票更值' }],
    '三亚': [{ icon: '🏖️', text: '11-3月是旺季，避开春节价格减半' }],
    '西安': [{ icon: '🏛️', text: '兵马俑学生票半价' }],
  };
  if (cityTips[dest]) tips.push(...cityTips[dest]);
  return tips;
}

// ========== 方言课堂 ==========
const dialectData = {
  beijing: [
    { phrase: '您好', dialect: '您好嘞', pinyin: 'nín hǎo lei', meaning: '打招呼，比"你好"更客气', example: '您好嘞，吃了吗您？' },
    { phrase: '很好', dialect: '倍儿棒', pinyin: 'bèir bàng', meaning: '非常好，特别棒', example: '这烤鸭倍儿棒！' },
    { phrase: '聊天', dialect: '侃大山', pinyin: 'kǎn dà shān', meaning: '闲聊、聊天', example: '咱俩找个地方侃大山去' },
    { phrase: '厉害', dialect: '牛', pinyin: 'niú', meaning: '很厉害、很出色', example: '这哥们儿真牛！' },
    { phrase: '舒服', dialect: '舒坦', pinyin: 'shū tan', meaning: '舒服、惬意', example: '这澡洗得真舒坦' },
    { phrase: '别说了', dialect: '得嘞', pinyin: 'děi lei', meaning: '好的、知道了（表示同意）', example: '得嘞，我明白了' }
  ],
  shanghai: [
    { phrase: '你好', dialect: '侬好', pinyin: 'nóng hǎo', meaning: '你好（上海话打招呼）', example: '侬好，饭吃过伐？' },
    { phrase: '谢谢', dialect: '谢谢侬', pinyin: 'xià xià nóng', meaning: '谢谢你', example: '谢谢侬帮我拿东西' },
    { phrase: '很好', dialect: '老灵额', pinyin: 'lǎo líng e', meaning: '很好、很棒', example: '这家餐厅老灵额！' },
    { phrase: '不要', dialect: '勿要', pinyin: 'vè yào', meaning: '不要', example: '勿要客气，随便坐' },
    { phrase: '什么', dialect: '啥', pinyin: 'shà', meaning: '什么', example: '侬吃啥？' },
    { phrase: '好玩', dialect: '好白相', pinyin: 'ho bā xiàng', meaning: '好玩、有趣', example: '迪士尼好白相！' }
  ],
  chengdu: [
    { phrase: '你好', dialect: '你好哇', pinyin: 'nǐ hǎo wa', meaning: '你好（四川话打招呼）', example: '你好哇，吃火锅不？' },
    { phrase: '很好', dialect: '巴适', pinyin: 'bā shì', meaning: '很好、舒服、满意', example: '这个火锅巴适得很！' },
    { phrase: '聊天', dialect: '摆龙门阵', pinyin: 'bǎi lóng mén zhèn', meaning: '聊天、闲谈', example: '来摆龙门阵嘛' },
    { phrase: '厉害', dialect: '凶', pinyin: 'xiōng', meaning: '很厉害', example: '这个人凶得很' },
    { phrase: '不要', dialect: '莫要', pinyin: 'mò yào', meaning: '不要', example: '莫要客气' },
    { phrase: '什么', dialect: '啥子', pinyin: 'shá zi', meaning: '什么', example: '你吃啥子？' }
  ],
  guangzhou: [
    { phrase: '你好', dialect: '雷猴', pinyin: 'léi hóu', meaning: '你好（粤语）', example: '雷猴，食左饭未？' },
    { phrase: '谢谢', dialect: '多谢', pinyin: 'do ze', meaning: '谢谢', example: '多谢你帮我' },
    { phrase: '很好', dialect: '好犀利', pinyin: 'hou sai lei', meaning: '很厉害', example: '你好犀利啊' },
    { phrase: '不要', dialect: '唔使', pinyin: 'm sai', meaning: '不用', example: '唔使客气' },
    { phrase: '什么', dialect: '咩', pinyin: 'mie', meaning: '什么', example: '你食咩？' },
    { phrase: '好吃', dialect: '好味', pinyin: 'hou mei', meaning: '好吃', example: '呢间野好味' }
  ],
  chongqing: [
    { phrase: '你好', dialect: '你好撒', pinyin: 'nǐ hǎo sa', meaning: '你好', example: '你好撒，吃火锅没？' },
    { phrase: '很好', dialect: '巴适得板', pinyin: 'bā shì dé bǎn', meaning: '非常好', example: '这个火锅巴适得板' },
    { phrase: '聊天', dialect: '摆龙门阵', pinyin: 'bǎi lóng mén zhèn', meaning: '聊天', example: '来摆龙门阵嘛' },
    { phrase: '厉害', dialect: '凶', pinyin: 'xiōng', meaning: '很厉害', example: '这个人凶得很' },
    { phrase: '不要', dialect: '莫得', pinyin: 'mò dé', meaning: '没有', example: '莫得问题' },
    { phrase: '什么', dialect: '啥子', pinyin: 'shá zi', meaning: '什么', example: '你吃啥子？' }
  ],
  xian: [
    { phrase: '你好', dialect: '你好嘛', pinyin: 'nǐ hǎo ma', meaning: '你好', example: '你好嘛，吃泡馍没？' },
    { phrase: '很好', dialect: '美得很', pinyin: 'měi dé hěn', meaning: '很好', example: '这个泡馍美得很' },
    { phrase: '聊天', dialect: '谝闲传', pinyin: 'pián xián chuán', meaning: '聊天', example: '来谝闲传嘛' },
    { phrase: '厉害', dialect: '扎势', pinyin: 'zhā shì', meaning: '很厉害', example: '这个人扎势得很' },
    { phrase: '不要', dialect: '包', pinyin: 'bāo', meaning: '不要', example: '包客气' },
    { phrase: '什么', dialect: '啥', pinyin: 'shá', meaning: '什么', example: '你吃啥？' }
  ],
  hangzhou: [
    { phrase: '你好', dialect: '侬好', pinyin: 'nóng hǎo', meaning: '你好', example: '侬好，吃饭没？' },
    { phrase: '很好', dialect: '蛮好', pinyin: 'mán hǎo', meaning: '很好', example: '这个菜蛮好' },
    { phrase: '聊天', dialect: '谈天', pinyin: 'tán tiān', meaning: '聊天', example: '来谈天嘛' },
    { phrase: '厉害', dialect: '结棍', pinyin: 'jié gùn', meaning: '很厉害', example: '这个人结棍得很' },
    { phrase: '不要', dialect: '覅', pinyin: 'fiào', meaning: '不要', example: '覅客气' },
    { phrase: '什么', dialect: '啥', pinyin: 'shá', meaning: '什么', example: '你吃啥？' }
  ],
  changsha: [
    { phrase: '你好', dialect: '你好噻', pinyin: 'nǐ hǎo sāi', meaning: '你好', example: '你好噻，吃米粉没？' },
    { phrase: '很好', dialect: '韵味', pinyin: 'yùn wèi', meaning: '很好', example: '这个菜韵味' },
    { phrase: '聊天', dialect: '谈天', pinyin: 'tán tiān', meaning: '聊天', example: '来谈天嘛' },
    { phrase: '厉害', dialect: '灵泛', pinyin: 'líng fàn', meaning: '很聪明', example: '这个人灵泛得很' },
    { phrase: '不要', dialect: '莫', pinyin: 'mò', meaning: '不要', example: '莫客气' },
    { phrase: '什么', dialect: '么子', pinyin: 'mó zi', meaning: '什么', example: '你吃么子？' }
  ],
  xiamen: [
    { phrase: '你好', dialect: '你好', pinyin: 'lí hó', meaning: '你好（闽南语）', example: '你好，吃饭未？' },
    { phrase: '谢谢', dialect: '多谢', pinyin: 'to siā', meaning: '谢谢', example: '多谢你' },
    { phrase: '很好', dialect: '真好', pinyin: 'chin hó', meaning: '很好', example: '这个菜真好' },
    { phrase: '不要', dialect: '免', pinyin: 'bián', meaning: '不用', example: '免客气' },
    { phrase: '什么', dialect: '啥', pinyin: 'siáⁿ', meaning: '什么', example: '你吃啥？' },
    { phrase: '好吃', dialect: '好食', pinyin: 'hó chia̍h', meaning: '好吃', example: '这个好食' }
  ],
  wuhan: [
    { phrase: '你好', dialect: '你好啊', pinyin: 'nǐ hǎo a', meaning: '你好', example: '你好啊，吃热干面没？' },
    { phrase: '很好', dialect: '蛮好', pinyin: 'mán hǎo', meaning: '很好', example: '这个菜蛮好' },
    { phrase: '聊天', dialect: '咵天', pinyin: 'kuǎ tiān', meaning: '聊天', example: '来咵天嘛' },
    { phrase: '厉害', dialect: '灵光', pinyin: 'líng guāng', meaning: '很厉害', example: '这个人灵光得很' },
    { phrase: '不要', dialect: '莫', pinyin: 'mò', meaning: '不要', example: '莫客气' },
    { phrase: '什么', dialect: '么事', pinyin: 'mó shì', meaning: '什么', example: '你吃么事？' }
  ]
};

function renderDialects() {
  const city = document.getElementById('dialect-city').value;
  const dialects = dialectData[city] || [];
  const grid = document.getElementById('dialect-grid');
  
  grid.innerHTML = dialects.map(d => `
    <div class="dialect-card">
      <div class="dialect-phrase">${d.phrase}</div>
      <div class="dialect-dialect">${d.dialect}</div>
      <div class="dialect-pinyin">${d.pinyin}</div>
      <div class="dialect-meaning">${d.meaning}</div>
      <div class="dialect-example">例句：${d.example}</div>
    </div>
  `).join('');
}

function startDialectQuiz() {
  const city = document.getElementById('dialect-city').value;
  const dialects = dialectData[city] || [];
  if (dialects.length === 0) return;
  
  const quiz = dialects[Math.floor(Math.random() * dialects.length)];
  const options = [quiz.dialect];
  
  while (options.length < 4) {
    const random = dialects[Math.floor(Math.random() * dialects.length)];
    if (!options.includes(random.dialect)) {
      options.push(random.dialect);
    }
  }
  
  options.sort(() => Math.random() - 0.5);
  
  document.getElementById('quiz-question').textContent = `"${quiz.phrase}"用${city}话怎么说？`;
  document.getElementById('quiz-options').innerHTML = options.map(opt => `
    <button class="quiz-option" onclick="checkQuizAnswer('${opt}', '${quiz.dialect}')">${opt}</button>
  `).join('');
  document.getElementById('quiz-result').style.display = 'none';
}

function checkQuizAnswer(selected, correct) {
  const result = document.getElementById('quiz-result');
  result.style.display = 'block';
  if (selected === correct) {
    result.innerHTML = `<span class="quiz-correct">✓ 答对了！</span>`;
  } else {
    result.innerHTML = `<span class="quiz-wrong">✗ 答错了，正确答案是：${correct}</span>`;
  }
}

// 初始化方言课堂
renderDialects();
startDialectQuiz();

// ========== 旅行记忆墙 ==========
let travelMemories = JSON.parse(localStorage.getItem('travelMemories') || '[]');

function addMemory() {
  const title = document.getElementById('memory-title').value.trim();
  const location = document.getElementById('memory-location').value.trim();
  const mood = document.getElementById('memory-mood').value;
  const text = document.getElementById('memory-text').value.trim();
  
  if (!title || !text) {
    alert('请填写标题和感受');
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
  localStorage.setItem('travelMemories', JSON.stringify(travelMemories));
  
  document.getElementById('memory-title').value = '';
  document.getElementById('memory-location').value = '';
  document.getElementById('memory-text').value = '';
  
  renderMemories();
}

function deleteMemory(id) {
  if (confirm('确定要删除这条记忆吗？')) {
    travelMemories = travelMemories.filter(m => m.id !== id);
    localStorage.setItem('travelMemories', JSON.stringify(travelMemories));
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
  
  const moodEmojis = {
    happy: '',
    excited: '🤩',
    peaceful: '😌',
    touched: '🥹',
    surprised: ''
  };
  
  timeline.innerHTML = travelMemories.map(m => `
    <div class="memory-item">
      <div class="memory-date">${m.date}</div>
      <div class="memory-content">
        <div class="memory-header">
          <h3>${m.title}</h3>
          <span class="memory-mood">${moodEmojis[m.mood]}</span>
        </div>
        ${m.location ? `<div class="memory-location">📍 ${m.location}</div>` : ''}
        <p class="memory-text">${m.text}</p>
        <button class="memory-delete" onclick="deleteMemory(${m.id})">删除</button>
      </div>
    </div>
  `).join('');
}

// 初始化记忆墙
renderMemories();

// ========== 旅行天气助手 ==========
const cityWeatherData = {
  '北京': { temp: '15-25°C', weather: '晴转多云', tip: '早晚温差大，注意添衣', best: '9-10月' },
  '上海': { temp: '18-26°C', weather: '多云', tip: '梅雨季备好雨具', best: '3-5月' },
  '成都': { temp: '16-24°C', weather: '阴', tip: '潮湿多雨，带伞', best: '3-6月' },
  '贵阳': { temp: '14-22°C', weather: '多云转小雨', tip: '天无三日晴，带伞', best: '5-9月' },
  '广州': { temp: '22-30°C', weather: '多云', tip: '回南天注意防潮', best: '10-12月' },
  '杭州': { temp: '16-25°C', weather: '晴', tip: '西湖边多雨带伞', best: '3-5月' },
  '厦门': { temp: '20-28°C', weather: '晴', tip: '海边注意防晒', best: '3-5月' },
  '重庆': { temp: '18-28°C', weather: '多云', tip: '夏季炎热注意防暑', best: '3-6月' },
  '西安': { temp: '12-24°C', weather: '晴', tip: '春秋季多风沙', best: '3-5月' },
  '南京': { temp: '14-24°C', weather: '多云', tip: '秋季栖霞山赏枫', best: '3-5月' },
  '武汉': { temp: '16-28°C', weather: '晴', tip: '夏季炎热注意防暑', best: '3-5月' },
  '长沙': { temp: '16-26°C', weather: '多云', tip: '湘菜偏辣备好肠胃药', best: '3-5月' },
  '深圳': { temp: '22-30°C', weather: '晴转多云', tip: '全年温暖注意防晒', best: '10-12月' },
  '青岛': { temp: '14-22°C', weather: '多云', tip: '海边早晚温差大', best: '5-9月' },
  '三亚': { temp: '25-32°C', weather: '晴', tip: '全年可游泳带泳衣', best: '11-3月' },
  '昆明': { temp: '15-24°C', weather: '晴', tip: '四季如春带薄外套', best: '3-5月' }
};

function checkWeather() {
  const city = document.getElementById('weather-city').value;
  const data = cityWeatherData[city] || cityWeatherData['北京'];
  
  document.getElementById('weather-result').style.display = 'block';
  document.getElementById('weather-city-name').textContent = city;
  document.getElementById('weather-temp').textContent = data.temp;
  document.getElementById('weather-condition').textContent = data.weather;
  document.getElementById('weather-tip').textContent = data.tip;
  document.getElementById('weather-best').textContent = data.best;
}

// ========== 城市冷知识问答 ==========
const cityTriviaData = {
  '北京': [
    { q: '故宫有多少间房间？', a: '9999间半', options: ['9999间半', '10000间', '8888间', '9999间'] },
    { q: '北京地铁最老的线路是？', a: '1号线', options: ['1号线', '2号线', '10号线', '13号线'] },
    { q: '烤鸭起源于哪个朝代？', a: '明朝', options: ['唐朝', '宋朝', '明朝', '清朝'] }
  ],
  '上海': [
    { q: '外滩有多少栋建筑？', a: '52栋', options: ['52栋', '48栋', '56栋', '60栋'] },
    { q: '上海地铁日客流量最高达？', a: '1000万', options: ['800万', '1000万', '1200万', '1500万'] },
    { q: '城隍庙始建于哪一年？', a: '1403年', options: ['1403年', '1503年', '1603年', '1703年'] }
  ],
  '成都': [
    { q: '成都得名于什么？', a: '一年成邑，二年成都', options: ['一年成邑，二年成都', '成都是平原', '成都人成事', '成都水好'] },
    { q: '武侯祠纪念的是谁？', a: '诸葛亮', options: ['刘备', '诸葛亮', '关羽', '张飞'] },
    { q: '都江堰建于哪一年？', a: '公元前256年', options: ['公元前256年', '公元前156年', '公元前356年', '公元前456年'] }
  ],
  '贵阳': [
    { q: '贵阳为什么叫贵阳？', a: '位于贵山之南', options: ['位于贵山之南', '位于贵山之北', '贵阳光照好', '贵阳人多'] },
    { q: '黄果树瀑布高多少米？', a: '77.8米', options: ['77.8米', '67.8米', '87.8米', '97.8米'] },
    { q: '甲秀楼建于哪一年？', a: '1598年', options: ['1598年', '1698年', '1798年', '1898年'] }
  ],
  '广州': [
    { q: '广州有多少年历史？', a: '2200年', options: ['2200年', '2000年', '1800年', '2500年'] },
    { q: '五羊传说中有几只羊？', a: '5只', options: ['3只', '4只', '5只', '6只'] },
    { q: '广州塔别名是什么？', a: '小蛮腰', options: ['小蛮腰', '大蛮腰', '细蛮腰', '粗蛮腰'] }
  ],
  '杭州': [
    { q: '西湖十景不包括哪个？', a: '三潭印月', options: ['断桥残雪', '苏堤春晓', '三潭印月', '雷峰夕照'] },
    { q: '龙井茶产于哪里？', a: '杭州', options: ['苏州', '杭州', '南京', '上海'] },
    { q: '灵隐寺建于哪一年？', a: '326年', options: ['326年', '426年', '526年', '626年'] }
  ],
  '厦门': [
    { q: '鼓浪屿面积多大？', a: '1.88平方公里', options: ['1.88平方公里', '2.88平方公里', '0.88平方公里', '3.88平方公里'] },
    { q: '厦门大学建于哪一年？', a: '1921年', options: ['1921年', '1911年', '1931年', '1941年'] },
    { q: '南普陀寺始建于哪一年？', a: '唐代', options: ['唐代', '宋代', '明代', '清代'] }
  ],
  '重庆': [
    { q: '重庆为什么叫山城？', a: '多山', options: ['多山', '多水', '多桥', '多洞'] },
    { q: '洪崖洞有多少层？', a: '11层', options: ['9层', '10层', '11层', '12层'] },
    { q: '长江索道全长多少米？', a: '1166米', options: ['1066米', '1166米', '1266米', '1366米'] }
  ],
  '西安': [
    { q: '兵马俑有多少个坑？', a: '3个', options: ['2个', '3个', '4个', '5个'] },
    { q: '大雁塔建于哪一年？', a: '652年', options: ['652年', '752年', '852年', '952年'] },
    { q: '西安城墙周长多少公里？', a: '13.7公里', options: ['11.7公里', '12.7公里', '13.7公里', '14.7公里'] }
  ],
  '南京': [
    { q: '南京有多少朝古都？', a: '六朝', options: ['四朝', '五朝', '六朝', '七朝'] },
    { q: '中山陵有多少级台阶？', a: '392级', options: ['292级', '392级', '492级', '592级'] },
    { q: '夫子庙始建于哪一年？', a: '1034年', options: ['1034年', '1134年', '1234年', '1334年'] }
  ],
  '武汉': [
    { q: '黄鹤楼始建于哪一年？', a: '223年', options: ['223年', '323年', '423年', '523年'] },
    { q: '武汉有多少个区？', a: '13个', options: ['11个', '12个', '13个', '14个'] },
    { q: '长江大桥全长多少米？', a: '1670米', options: ['1570米', '1670米', '1770米', '1870米'] }
  ],
  '长沙': [
    { q: '橘子洲全长多少公里？', a: '5公里', options: ['3公里', '4公里', '5公里', '6公里'] },
    { q: '岳麓书院建于哪一年？', a: '976年', options: ['976年', '1076年', '1176年', '1276年'] },
    { q: '湖南省博有多少件文物？', a: '18万件', options: ['16万件', '17万件', '18万件', '19万件'] }
  ],
  '深圳': [
    { q: '深圳经济特区成立于哪一年？', a: '1980年', options: ['1978年', '1979年', '1980年', '1981年'] },
    { q: '深圳最高楼是多少米？', a: '599米', options: ['599米', '699米', '799米', '899米'] },
    { q: '深圳有多少个区？', a: '9个', options: ['7个', '8个', '9个', '10个'] }
  ],
  '青岛': [
    { q: '栈桥建于哪一年？', a: '1892年', options: ['1892年', '1902年', '1912年', '1922年'] },
    { q: '青岛啤酒节在几月？', a: '8月', options: ['6月', '7月', '8月', '9月'] },
    { q: '崂山最高峰多少米？', a: '1133米', options: ['1033米', '1133米', '1233米', '1333米'] }
  ],
  '三亚': [
    { q: '天涯海角有多远？', a: '2.5公里', options: ['1.5公里', '2.5公里', '3.5公里', '4.5公里'] },
    { q: '南山海上观音高多少米？', a: '108米', options: ['98米', '108米', '118米', '128米'] },
    { q: '亚龙湾沙滩长多少公里？', a: '7公里', options: ['5公里', '6公里', '7公里', '8公里'] }
  ],
  '昆明': [
    { q: '滇池面积多大？', a: '330平方公里', options: ['230平方公里', '330平方公里', '430平方公里', '530平方公里'] },
    { q: '石林形成于多少年前？', a: '2.7亿年', options: ['1.7亿年', '2.7亿年', '3.7亿年', '4.7亿年'] },
    { q: '昆明为什么叫春城？', a: '四季如春', options: ['四季如春', '春天多', '春花多', '春风多'] }
  ]
};

function startCityTrivia() {
  const city = document.getElementById('trivia-city').value;
  const questions = cityTriviaData[city] || [];
  if (questions.length === 0) return;
  
  const q = questions[Math.floor(Math.random() * questions.length)];
  const options = [...q.options].sort(() => Math.random() - 0.5);
  
  document.getElementById('trivia-question').textContent = q.q;
  document.getElementById('trivia-options').innerHTML = options.map(opt => `
    <button class="trivia-option" onclick="checkTriviaAnswer('${opt}', '${q.a}')">${opt}</button>
  `).join('');
  document.getElementById('trivia-result').style.display = 'none';
}

function checkTriviaAnswer(selected, correct) {
  const result = document.getElementById('trivia-result');
  result.style.display = 'block';
  if (selected === correct) {
    result.innerHTML = `<span class="trivia-correct">✓ 答对了！</span>`;
  } else {
    result.innerHTML = `<span class="trivia-wrong">✗ 答错了，正确答案是：${correct}</span>`;
  }
}

// 初始化城市冷知识
startCityTrivia();