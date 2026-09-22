// ========== TripWise 数据层（纯数据，无副作用） ==========
// 使用方式：const D = window.TripWiseData;  D.routeData[...] D.cityCoords[...]
window.TripWiseData = (function () {
  'use strict';

  // 全国热门旅游城市按区域分组（用于目的地下拉预选框）
  const cityRegions = {
    '华北 · 东北': ['北京', '天津', '哈尔滨', '长春', '沈阳', '大连', '秦皇岛', '呼和浩特'],
    '华东': ['上海', '杭州', '南京', '苏州', '无锡', '扬州', '厦门', '黄山', '合肥', '青岛', '济南', '泰安', '舟山', '福州', '南昌'],
    '华中': ['武汉', '长沙', '张家界', '恩施', '郑州', '洛阳', '开封'],
    '华南': ['广州', '深圳', '珠海', '三亚', '海口', '桂林', '南宁', '北海'],
    '西南': ['成都', '重庆', '昆明', '大理', '丽江', '贵阳', '拉萨'],
    '西北': ['西安', '兰州', '敦煌', '张掖', '西宁', '银川', '乌鲁木齐']
  };

  // 城市中心坐标
  const cityCoords = {
    '北京': [39.9042, 116.4074],
    '天津': [39.3434, 117.3616],
    '哈尔滨': [45.8038, 126.5340],
    '长春': [43.8171, 125.3235],
    '沈阳': [41.8057, 123.4315],
    '大连': [38.9140, 121.6147],
    '秦皇岛': [39.9354, 119.6005],
    '呼和浩特': [40.8414, 111.7519],
    '上海': [31.2304, 121.4737],
    '杭州': [30.2741, 120.1551],
    '南京': [32.0603, 118.7969],
    '苏州': [31.2989, 120.5853],
    '无锡': [31.4912, 120.3119],
    '扬州': [32.3947, 119.4129],
    '厦门': [24.4798, 118.0894],
    '黄山': [29.7147, 118.3375],
    '合肥': [31.8206, 117.2272],
    '青岛': [36.0671, 120.3826],
    '济南': [36.6512, 117.1201],
    '泰安': [36.2000, 117.0880],
    '舟山': [29.9853, 122.2072],
    '福州': [26.0745, 119.2965],
    '南昌': [28.6832, 115.8581],
    '武汉': [30.5928, 114.3055],
    '长沙': [28.2280, 112.9388],
    '张家界': [29.1170, 110.4791],
    '恩施': [30.2722, 109.4884],
    '郑州': [34.7466, 113.6253],
    '洛阳': [34.6189, 112.4540],
    '开封': [34.7971, 114.3414],
    '广州': [23.1291, 113.2644],
    '深圳': [22.5431, 114.0579],
    '珠海': [22.2710, 113.5762],
    '三亚': [18.2528, 109.5119],
    '海口': [20.0440, 110.1999],
    '桂林': [25.2740, 110.2990],
    '南宁': [22.8170, 108.3665],
    '北海': [21.4819, 109.1199],
    '成都': [30.5728, 104.0668],
    '重庆': [29.5630, 106.5516],
    '昆明': [24.8801, 102.8329],
    '大理': [25.6065, 100.2676],
    '丽江': [26.8550, 100.2270],
    '贵阳': [26.6470, 106.6302],
    '拉萨': [29.6500, 91.1409],
    '西安': [34.3416, 108.9398],
    '兰州': [36.0611, 103.8343],
    '敦煌': [40.1421, 94.6620],
    '张掖': [38.9258, 100.4497],
    '西宁': [36.6171, 101.7782],
    '银川': [38.4872, 106.2309],
    '乌鲁木齐': [43.8256, 87.6168]
  };

  // 精选路线数据（北京/上海/成都/贵阳 4 城离线可用）
  const routeData = {
    '北京': {
      culture: [
        { time: '09:00', title: '故宫博物院', desc: '游览紫禁城，感受600年皇家气派。建议从午门进入，沿中轴线参观三大殿。', icon: '🏯', lat: 39.9163, lng: 116.3972, transport: '步行' },
        { time: '12:00', title: '四季民福烤鸭店', desc: '品尝正宗北京烤鸭，推荐故宫店，景观位可边吃边看故宫角楼。', icon: '🦆', lat: 39.9103, lng: 116.4081, transport: '步行10分钟' },
        { time: '14:00', title: '景山公园', desc: '登万春亭俯瞰故宫全景，视野开阔，是拍照的绝佳位置。', icon: '⛰️', lat: 39.9259, lng: 116.3966, transport: '步行15分钟' },
        { time: '16:00', title: '南锣鼓巷', desc: '漫步老北京胡同，体验文艺小店和特色小吃。', icon: '🏘️', lat: 39.9370, lng: 116.4030, transport: '地铁8号线' }
      ],
      food: [
        { time: '09:00', title: '护国寺小吃', desc: '品尝豆汁、焦圈、艾窝窝等传统北京早餐。', icon: '🥟', lat: 39.9351, lng: 116.3749, transport: '地铁4号线' },
        { time: '11:00', title: '牛街', desc: '探访清真美食街，品尝白记年糕、洪记小吃。', icon: '🍜', lat: 39.8857, lng: 116.3646, transport: '地铁7号线' },
        { time: '14:00', title: '大董烤鸭', desc: '高端烤鸭体验，酥不腻烤鸭是招牌。', icon: '🦆', lat: 39.9153, lng: 116.4214, transport: '地铁1号线' },
        { time: '17:00', title: '簋街', desc: '夜幕降临后的美食街，麻辣小龙虾是必点。', icon: '🦞', lat: 39.9414, lng: 116.4250, transport: '地铁5号线' }
      ],
      nature: [
        { time: '08:00', title: '颐和园', desc: '游览皇家园林，昆明湖泛舟，长廊赏画。', icon: '🏞️', lat: 39.9996, lng: 116.2751, transport: '地铁4号线' },
        { time: '12:00', title: '圆明园', desc: '参观遗址公园，感受历史沧桑。', icon: '🏛️', lat: 40.0063, lng: 116.3009, transport: '步行20分钟' },
        { time: '15:00', title: '奥林匹克森林公园', desc: '城市绿肺，骑行或散步放松身心。', icon: '🌳', lat: 40.0236, lng: 116.3889, transport: '地铁8号线' }
      ],
      photo: [
        { time: '06:00', title: '角楼日出', desc: '拍摄故宫角楼倒影，最佳摄影点。', icon: '📸', lat: 39.9242, lng: 116.3889, transport: '步行' },
        { time: '10:00', title: '红墙黄瓦', desc: '故宫内拍摄经典皇家建筑元素。', icon: '🏯', lat: 39.9163, lng: 116.3972, transport: '步行10分钟' },
        { time: '15:00', title: '798艺术区', desc: '工业风与艺术的碰撞，拍照圣地。', icon: '🎨', lat: 39.9842, lng: 116.4953, transport: '地铁14号线' },
        { time: '18:00', title: '什刹海黄昏', desc: '银锭桥上看日落，老北京风情。', icon: '🌅', lat: 39.9390, lng: 116.3934, transport: '地铁6号线' }
      ],
      sevenDay: [
        [
          { time: '09:00', title: '故宫博物院', desc: '游览紫禁城，感受600年皇家气派。', icon: '🏯', lat: 39.9163, lng: 116.3972, transport: '步行' },
          { time: '12:00', title: '四季民福烤鸭店', desc: '品尝正宗北京烤鸭，故宫店景观位可观角楼。', icon: '🦆', lat: 39.9103, lng: 116.4081, transport: '步行10分钟' },
          { time: '14:00', title: '景山公园', desc: '登万春亭俯瞰故宫全景，视野开阔。', icon: '⛰️', lat: 39.9259, lng: 116.3966, transport: '步行15分钟' },
          { time: '16:00', title: '南锣鼓巷', desc: '漫步老北京胡同，体验文艺小店和特色小吃。', icon: '🏘️', lat: 39.9370, lng: 116.4030, transport: '地铁8号线' }
        ],
        [
          { time: '09:00', title: '护国寺小吃', desc: '品尝豆汁、焦圈、艾窝窝等传统北京早餐。', icon: '🥟', lat: 39.9351, lng: 116.3749, transport: '地铁4号线' },
          { time: '11:00', title: '牛街', desc: '探访清真美食街，品尝白记年糕、洪记小吃。', icon: '🍜', lat: 39.8857, lng: 116.3646, transport: '地铁7号线' },
          { time: '14:00', title: '大董烤鸭', desc: '高端烤鸭体验，酥不腻烤鸭是招牌。', icon: '🦆', lat: 39.9153, lng: 116.4214, transport: '地铁1号线' },
          { time: '17:00', title: '簋街', desc: '夜幕降临后的美食街，麻辣小龙虾是必点。', icon: '🦞', lat: 39.9414, lng: 116.4250, transport: '地铁5号线' }
        ],
        [
          { time: '08:00', title: '颐和园', desc: '游览皇家园林，昆明湖泛舟，长廊赏画。', icon: '🏞️', lat: 39.9996, lng: 116.2751, transport: '地铁4号线' },
          { time: '12:00', title: '圆明园', desc: '参观遗址公园，感受历史沧桑。', icon: '🏛️', lat: 40.0063, lng: 116.3009, transport: '步行20分钟' },
          { time: '15:00', title: '奥林匹克森林公园', desc: '城市绿肺，骑行或散步放松身心。', icon: '🌳', lat: 40.0236, lng: 116.3889, transport: '地铁8号线' }
        ],
        [
          { time: '06:00', title: '角楼日出', desc: '拍摄故宫角楼倒影，最佳摄影点。', icon: '📸', lat: 39.9242, lng: 116.3889, transport: '步行' },
          { time: '10:00', title: '红墙黄瓦', desc: '故宫内拍摄经典皇家建筑元素。', icon: '🏯', lat: 39.9163, lng: 116.3972, transport: '步行10分钟' },
          { time: '15:00', title: '798艺术区', desc: '工业风与艺术的碰撞，拍照圣地。', icon: '🎨', lat: 39.9842, lng: 116.4953, transport: '地铁14号线' },
          { time: '18:00', title: '什刹海黄昏', desc: '银锭桥上看日落，老北京风情。', icon: '🌅', lat: 39.9390, lng: 116.3934, transport: '地铁6号线' }
        ],
        [
          { time: '08:30', title: '天坛公园', desc: '明清皇帝祭天之所，祈年殿恢弘壮丽。', icon: '🏯', lat: 39.8813, lng: 116.4091, transport: '地铁5号线' },
          { time: '12:00', title: '前门大街', desc: '百年商业街，老字号云集，感受老北京商业文化。', icon: '🏘️', lat: 39.8951, lng: 116.3982, transport: '步行' },
          { time: '15:00', title: '中国国家博物馆', desc: '中华文明瑰宝荟萃，青铜器与古代中国展厅必看。', icon: '🏛️', lat: 39.9051, lng: 116.4016, transport: '步行' }
        ],
        [
          { time: '10:00', title: '三里屯太古里', desc: '时尚潮流地标，购物餐饮一体。', icon: '🏙️', lat: 39.9349, lng: 116.4544, transport: '地铁10号线' },
          { time: '14:00', title: '鸟巢', desc: '国家体育场，2008年奥运主会场，建筑奇观。', icon: '🏟️', lat: 39.9928, lng: 116.3965, transport: '地铁8号线' },
          { time: '15:30', title: '水立方', desc: '国家游泳中心，膜结构建筑典范。', icon: '🏛️', lat: 39.993, lng: 116.3904, transport: '步行' },
          { time: '18:00', title: '国贸CBD', desc: '北京摩天大楼群，俯瞰京城夜景。', icon: '🌃', lat: 39.9263, lng: 116.459, transport: '地铁1号线' }
        ],
        [
          { time: '07:00', title: '八达岭长城', desc: '不到长城非好汉，体验万里长城雄伟。', icon: '🏔️', lat: 40.3616, lng: 116.0113, transport: '高铁/公交2小时' },
          { time: '14:00', title: '明十三陵', desc: '明代帝王陵寝群，参观定陵地宫。', icon: '🏛️', lat: 40.2602, lng: 116.2263, transport: '公交1小时' }
        ]
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
        { time: '09:00', title: '辰山植物园', desc: '华东最大植物园，四季花开。', icon: '🌸', lat: 31.0760, lng: 121.1830, transport: '地铁9号线' },
        { time: '13:00', title: '佘山国家森林公园', desc: '上海陆上最高峰，登高望远。', icon: '⛰️', lat: 31.0940, lng: 121.1909, transport: '公交' },
        { time: '16:00', title: '滴水湖', desc: '人工湖景，海风吹拂。', icon: '🌊', lat: 30.9069, lng: 121.9299, transport: '地铁16号线' }
      ],
      photo: [
        { time: '06:00', title: '外滩晨光', desc: '浦东天际线日出。', icon: '🌅', lat: 31.2400, lng: 121.4900, transport: '地铁2号线' },
        { time: '10:00', title: '武康路', desc: '法式梧桐下的老洋房。', icon: '🏘️', lat: 31.2133, lng: 121.4367, transport: '地铁10号线' },
        { time: '15:00', title: '陆家嘴', desc: '摩天大楼群现代都市感。', icon: '🏙️', lat: 31.2397, lng: 121.4997, transport: '地铁2号线' },
        { time: '19:00', title: '南京路夜景', desc: '霓虹灯下的繁华都市。', icon: '🌃', lat: 31.2347, lng: 121.4767, transport: '步行' }
      ],
      sevenDay: [
        [
          { time: '09:00', title: '外滩万国建筑群', desc: '欣赏52栋风格迥异的古典复兴大楼。', icon: '🏛️', lat: 31.2400, lng: 121.4900, transport: '地铁2号线' },
          { time: '11:00', title: '豫园', desc: '明代古典园林，江南园林艺术精华。', icon: '🏯', lat: 31.2272, lng: 121.4925, transport: '步行15分钟' },
          { time: '14:00', title: '上海博物馆', desc: '青铜器、陶瓷、书画馆藏丰富。', icon: '🏛️', lat: 31.2300, lng: 121.4737, transport: '地铁1号线' },
          { time: '17:00', title: '田子坊', desc: '文艺小店聚集，石库门建筑风情。', icon: '🎨', lat: 31.2100, lng: 121.4680, transport: '地铁9号线' }
        ],
        [
          { time: '08:00', title: '南翔馒头店', desc: '百年老店，小笼包必尝。', icon: '🥟', lat: 31.2272, lng: 121.4925, transport: '地铁10号线' },
          { time: '11:00', title: '老城隍庙', desc: '品尝上海传统小吃。', icon: '🍜', lat: 31.2267, lng: 121.4894, transport: '步行5分钟' },
          { time: '14:00', title: '和平饭店', desc: '英式下午茶体验。', icon: '☕', lat: 31.2408, lng: 121.4897, transport: '地铁2号线' },
          { time: '18:00', title: '新天地', desc: '石库门里的时尚餐厅。', icon: '🍷', lat: 31.2200, lng: 121.4737, transport: '地铁10号线' }
        ],
        [
          { time: '09:00', title: '辰山植物园', desc: '华东最大植物园，四季花开。', icon: '🌸', lat: 31.0760, lng: 121.1830, transport: '地铁9号线' },
          { time: '13:00', title: '佘山国家森林公园', desc: '上海陆上最高峰，登高望远。', icon: '⛰️', lat: 31.0940, lng: 121.1909, transport: '公交' },
          { time: '16:00', title: '滴水湖', desc: '人工湖景，海风吹拂。', icon: '🌊', lat: 30.9069, lng: 121.9299, transport: '地铁16号线' }
        ],
        [
          { time: '06:00', title: '外滩晨光', desc: '浦东天际线日出。', icon: '🌅', lat: 31.2400, lng: 121.4900, transport: '地铁2号线' },
          { time: '10:00', title: '武康路', desc: '法式梧桐下的老洋房。', icon: '🏘️', lat: 31.2133, lng: 121.4367, transport: '地铁10号线' },
          { time: '15:00', title: '陆家嘴', desc: '摩天大楼群现代都市感。', icon: '🏙️', lat: 31.2397, lng: 121.4997, transport: '地铁2号线' },
          { time: '19:00', title: '南京路夜景', desc: '霓虹灯下的繁华都市。', icon: '🌃', lat: 31.2347, lng: 121.4767, transport: '步行' }
        ],
        [
          { time: '09:00', title: '中华艺术宫', desc: '原世博中国馆，现当代艺术殿堂。', icon: '🏛️', lat: 31.1845, lng: 121.4944, transport: '地铁8号线' },
          { time: '12:00', title: '思南路', desc: '梧桐掩映的法式街区，洋房咖啡馆云集。', icon: '🏘️', lat: 31.2138, lng: 121.4684, transport: '地铁13号线' },
          { time: '15:00', title: '静安寺', desc: '闹市中的千年古刹，金碧辉煌。', icon: '🏯', lat: 31.2233, lng: 121.4454, transport: '地铁2号线' },
          { time: '18:00', title: '新天地', desc: '石库门里的时尚餐厅。', icon: '🍷', lat: 31.2200, lng: 121.4737, transport: '地铁10号线' }
        ],
        [
          { time: '09:00', title: '上海迪士尼乐园', desc: '奇幻童话王国，一整天的欢乐时光。', icon: '🎢', lat: 31.1441, lng: 121.6605, transport: '地铁11号线' }
        ],
        [
          { time: '09:00', title: '朱家角古镇', desc: '江南水乡古镇，放生桥与北大街。', icon: '🏘️', lat: 31.1142, lng: 121.0505, transport: '地铁17号线' },
          { time: '14:00', title: '七宝古镇', desc: '上海近郊古镇，老街与小吃。', icon: '🏘️', lat: 31.1543, lng: 121.3579, transport: '地铁9号线' }
        ]
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
        { time: '09:00', title: '龙抄手', desc: '正宗成都抄手早餐。', icon: '🥟', lat: 30.6544, lng: 104.0780, transport: '地铁2号线' },
        { time: '12:00', title: '陈麻婆豆腐', desc: '百年老店，麻辣鲜香。', icon: '🌶️', lat: 30.6603, lng: 104.0447, transport: '步行15分钟' },
        { time: '15:00', title: '人民公园鹤鸣茶社', desc: '盖碗茶配掏耳朵。', icon: '☕', lat: 30.6600, lng: 104.0617, transport: '步行10分钟' },
        { time: '18:00', title: '玉林路小酒馆', desc: '赵雷歌中的文艺地标。', icon: '🍺', lat: 30.6333, lng: 104.0667, transport: '地铁3号线' }
      ],
      nature: [
        { time: '08:00', title: '都江堰', desc: '两千年前的水利奇迹。', icon: '🌊', lat: 30.9983, lng: 103.6167, transport: '高铁30分钟' },
        { time: '13:00', title: '青城山', desc: '道教名山，幽静清雅。', icon: '⛰️', lat: 30.9000, lng: 103.5667, transport: '公交' },
        { time: '17:00', title: '熊猫基地', desc: '近距离看国宝卖萌。', icon: '🐼', lat: 30.7400, lng: 104.1433, transport: '景区直通车' }
      ],
      photo: [
        { time: '09:00', title: 'IFS爬墙熊猫', desc: '成都网红打卡点。', icon: '🐼', lat: 30.6567, lng: 104.0817, transport: '地铁2号线' },
        { time: '11:00', title: '太古里', desc: '时尚与古建融合。', icon: '🏙️', lat: 30.6550, lng: 104.0833, transport: '步行5分钟' },
        { time: '15:00', title: '东郊记忆', desc: '工业风文创园区。', icon: '🎨', lat: 30.6687, lng: 104.1232, transport: '地铁4号线' },
        { time: '18:00', title: '九眼桥酒吧街', desc: '夜景迷人。', icon: '🌃', lat: 30.6396, lng: 104.0882, transport: '步行15分钟' }
      ],
      sevenDay: [
        [
          { time: '09:00', title: '武侯祠', desc: '三国文化圣地，红墙竹影。', icon: '🏯', lat: 30.6417, lng: 104.0456, transport: '地铁3号线' },
          { time: '11:00', title: '锦里古街', desc: '民俗风情一条街。', icon: '🏮', lat: 30.6400, lng: 104.0483, transport: '步行5分钟' },
          { time: '14:00', title: '杜甫草堂', desc: '诗圣故居，园林清幽。', icon: '🌿', lat: 30.6617, lng: 104.0333, transport: '地铁4号线' },
          { time: '16:00', title: '宽窄巷子', desc: '老成都生活缩影。', icon: '🏘️', lat: 30.6697, lng: 104.0550, transport: '步行20分钟' }
        ],
        [
          { time: '09:00', title: '龙抄手', desc: '正宗成都抄手早餐。', icon: '🥟', lat: 30.6544, lng: 104.0780, transport: '地铁2号线' },
          { time: '12:00', title: '陈麻婆豆腐', desc: '百年老店，麻辣鲜香。', icon: '🌶️', lat: 30.6603, lng: 104.0447, transport: '步行15分钟' },
          { time: '15:00', title: '人民公园鹤鸣茶社', desc: '盖碗茶配掏耳朵。', icon: '☕', lat: 30.6600, lng: 104.0617, transport: '步行10分钟' },
          { time: '18:00', title: '玉林路小酒馆', desc: '赵雷歌中的文艺地标。', icon: '🍺', lat: 30.6333, lng: 104.0667, transport: '地铁3号线' }
        ],
        [
          { time: '08:00', title: '都江堰', desc: '两千年前的水利奇迹。', icon: '🌊', lat: 30.9983, lng: 103.6167, transport: '高铁30分钟' },
          { time: '13:00', title: '青城山', desc: '道教名山，幽静清雅。', icon: '⛰️', lat: 30.9000, lng: 103.5667, transport: '公交' },
          { time: '17:00', title: '熊猫基地', desc: '近距离看国宝卖萌。', icon: '🐼', lat: 30.7400, lng: 104.1433, transport: '景区直通车' }
        ],
        [
          { time: '09:00', title: 'IFS爬墙熊猫', desc: '成都网红打卡点。', icon: '🐼', lat: 30.6567, lng: 104.0817, transport: '地铁2号线' },
          { time: '11:00', title: '太古里', desc: '时尚与古建融合。', icon: '🏙️', lat: 30.6550, lng: 104.0833, transport: '步行5分钟' },
          { time: '15:00', title: '东郊记忆', desc: '工业风文创园区。', icon: '🎨', lat: 30.6687, lng: 104.1232, transport: '地铁4号线' },
          { time: '18:00', title: '九眼桥酒吧街', desc: '夜景迷人。', icon: '🌃', lat: 30.6396, lng: 104.0882, transport: '步行15分钟' }
        ],
        [
          { time: '09:00', title: '金沙遗址博物馆', desc: '古蜀文明遗址，太阳神鸟金饰。', icon: '🏛️', lat: 30.6816, lng: 104.0127, transport: '地铁7号线' },
          { time: '12:00', title: '文殊院', desc: '川西佛教名刹，禅意清幽。', icon: '🏯', lat: 30.6755, lng: 104.0727, transport: '地铁1号线' },
          { time: '15:00', title: '昭觉寺', desc: '川西第一禅林，唐代古刹。', icon: '🏯', lat: 30.708, lng: 104.1061, transport: '地铁3号线' }
        ],
        [
          { time: '09:00', title: '黄龙溪古镇', desc: '天府第一名镇，古龙寺与青石板街。', icon: '🏘️', lat: 30.3176, lng: 103.971, transport: '景区直通车' },
          { time: '14:00', title: '洛带古镇', desc: '客家文化古镇，会馆建筑群。', icon: '🏘️', lat: 30.6366, lng: 104.3285, transport: '公交' }
        ],
        [
          { time: '09:00', title: '浣花溪公园', desc: '杜甫草堂旁的湿地园林，诗意栖居。', icon: '🌿', lat: 30.6578, lng: 104.03, transport: '步行' },
          { time: '14:00', title: '白鹭湾湿地', desc: '城市绿肺，观鸟骑行好去处。', icon: '🌳', lat: 30.566, lng: 104.125, transport: '公交' }
        ]
      ]
    },
    '贵阳': {
      culture: [
        { time: '09:00', title: '甲秀楼', desc: '贵阳地标，南明河上的古楼，夜景尤为壮观。', icon: '🏯', lat: 26.5714, lng: 106.7197, transport: '公交' },
        { time: '11:00', title: '青岩古镇', desc: '600年历史的明清古镇，石板路、古城墙，贵州四大古镇之一。', icon: '🏘️', lat: 26.3367, lng: 106.6889, transport: '景区直通车' },
        { time: '14:00', title: '黔灵山公园', desc: '城市中的天然氧吧，猕猴成群，弘福寺香火旺盛。', icon: '🌿', lat: 26.5980, lng: 106.6941, transport: '地铁1号线' },
        { time: '16:00', title: '贵州省博物馆', desc: '了解贵州多元民族文化，民族文物馆藏丰富。', icon: '🏛️', lat: 26.6470, lng: 106.6203, transport: '地铁1号线' }
      ],
      food: [
        { time: '09:00', title: '肠旺面', desc: '贵阳特色早餐，肥肠+血旺+脆哨，麻辣鲜香。', icon: '🍜', lat: 26.6500, lng: 106.6300, transport: '步行' },
        { time: '12:00', title: '丝娃娃', desc: '贵阳特色小吃，薄饼卷各种蔬菜丝，蘸酸辣汁。', icon: '🥗', lat: 26.6450, lng: 106.6350, transport: '步行10分钟' },
        { time: '15:00', title: '花溪牛肉粉', desc: '花溪区老字号，汤鲜粉滑，牛肉大片。', icon: '🍜', lat: 26.4333, lng: 106.6833, transport: '公交' },
        { time: '18:00', title: '合群路夜市', desc: '贵阳最热闹的夜市，烧烤、烙锅、恋爱豆腐果。', icon: '🍢', lat: 26.6400, lng: 106.6250, transport: '步行' }
      ],
      nature: [
        { time: '08:00', title: '黄果树瀑布', desc: '亚洲最大瀑布，水势磅礴，西游记取景地。', icon: '🌊', lat: 25.9889, lng: 105.6694, transport: '景区直通车2小时' },
        { time: '13:00', title: '天星桥景区', desc: '喀斯特地貌精华，水上石林、银链坠潭瀑布。', icon: '⛰️', lat: 25.9600, lng: 105.6533, transport: '步行' },
        { time: '16:00', title: '陡坡塘瀑布', desc: '黄果树上游，西游记片尾曲取景地。', icon: '🌊', lat: 25.9833, lng: 105.6833, transport: '步行15分钟' }
      ],
      photo: [
        { time: '06:30', title: '甲秀楼晨景', desc: '清晨薄雾中的甲秀楼，倒影在南明河中。', icon: '📸', lat: 26.5714, lng: 106.7197, transport: '步行' },
        { time: '10:00', title: '花溪十里河滩', desc: '湿地花海，四季不同景色，摄影天堂。', icon: '🌸', lat: 26.4167, lng: 106.6833, transport: '公交' },
        { time: '15:00', title: '天河潭', desc: '溶洞+瀑布+湖泊，贵州缩影，出片率极高。', icon: '📷', lat: 26.4371, lng: 106.5773, transport: '景区直通车' },
        { time: '19:00', title: '花果园白宫夜景', desc: '贵阳版"白宫"，夜晚灯光璀璨。', icon: '🌃', lat: 26.5643, lng: 106.6887, transport: '地铁' }
      ],
      sevenDay: [
        [
          { time: '09:00', title: '甲秀楼', desc: '贵阳地标，南明河上的古楼，夜景尤为壮观。', icon: '🏯', lat: 26.5714, lng: 106.7197, transport: '公交' },
          { time: '11:00', title: '青岩古镇', desc: '600年历史的明清古镇，石板路、古城墙，贵州四大古镇之一。', icon: '🏘️', lat: 26.3367, lng: 106.6889, transport: '景区直通车' },
          { time: '14:00', title: '黔灵山公园', desc: '城市中的天然氧吧，猕猴成群，弘福寺香火旺盛。', icon: '🌿', lat: 26.5980, lng: 106.6941, transport: '地铁1号线' },
          { time: '16:00', title: '贵州省博物馆', desc: '了解贵州多元民族文化，民族文物馆藏丰富。', icon: '🏛️', lat: 26.6470, lng: 106.6203, transport: '地铁1号线' }
        ],
        [
          { time: '09:00', title: '肠旺面', desc: '贵阳特色早餐，肥肠+血旺+脆哨，麻辣鲜香。', icon: '🍜', lat: 26.6500, lng: 106.6300, transport: '步行' },
          { time: '12:00', title: '丝娃娃', desc: '贵阳特色小吃，薄饼卷各种蔬菜丝，蘸酸辣汁。', icon: '🥗', lat: 26.6450, lng: 106.6350, transport: '步行10分钟' },
          { time: '15:00', title: '花溪牛肉粉', desc: '花溪区老字号，汤鲜粉滑，牛肉大片。', icon: '🍜', lat: 26.4333, lng: 106.6833, transport: '公交' },
          { time: '18:00', title: '合群路夜市', desc: '贵阳最热闹的夜市，烧烤、烙锅、恋爱豆腐果。', icon: '🍢', lat: 26.6400, lng: 106.6250, transport: '步行' }
        ],
        [
          { time: '08:00', title: '黄果树瀑布', desc: '亚洲最大瀑布，水势磅礴，西游记取景地。', icon: '🌊', lat: 25.9889, lng: 105.6694, transport: '景区直通车2小时' },
          { time: '13:00', title: '天星桥景区', desc: '喀斯特地貌精华，水上石林、银链坠潭瀑布。', icon: '⛰️', lat: 25.9600, lng: 105.6533, transport: '步行' },
          { time: '16:00', title: '陡坡塘瀑布', desc: '黄果树上游，西游记片尾曲取景地。', icon: '🌊', lat: 25.9833, lng: 105.6833, transport: '步行15分钟' }
        ],
        [
          { time: '06:30', title: '甲秀楼晨景', desc: '清晨薄雾中的甲秀楼，倒影在南明河中。', icon: '📸', lat: 26.5714, lng: 106.7197, transport: '步行' },
          { time: '10:00', title: '花溪十里河滩', desc: '湿地花海，四季不同景色，摄影天堂。', icon: '🌸', lat: 26.4167, lng: 106.6833, transport: '公交' },
          { time: '15:00', title: '天河潭', desc: '溶洞+瀑布+湖泊，贵州缩影，出片率极高。', icon: '📷', lat: 26.4371, lng: 106.5773, transport: '景区直通车' },
          { time: '19:00', title: '花果园白宫夜景', desc: '贵阳版"白宫"，夜晚灯光璀璨。', icon: '🌃', lat: 26.5643, lng: 106.6887, transport: '地铁' }
        ],
        [
          { time: '09:00', title: '青岩古镇深度游', desc: '漫步青岩老街，品尝卤猪脚、玫瑰糖，登城墙俯瞰古镇。', icon: '🏘️', lat: 26.3367, lng: 106.6889, transport: '景区直通车' },
          { time: '14:00', title: '镇山村', desc: '布依族石头寨，石板房依山而建，花溪水库旁。', icon: '🏘️', lat: 26.4352, lng: 106.6612, transport: '公交' }
        ],
        [
          { time: '09:00', title: '黔灵山公园深度游', desc: '登弘福寺、瞰贵阳全景、与猕猴互动。', icon: '🌿', lat: 26.5980, lng: 106.6941, transport: '地铁1号线' },
          { time: '14:00', title: '阿哈湖国家湿地公园', desc: '城市湿地公园，观鸟栈道与喀斯特溶洞。', icon: '🌳', lat: 26.549, lng: 106.6704, transport: '公交' }
        ],
        [
          { time: '09:00', title: '红枫湖', desc: '贵阳西郊人工湖，岛屿星罗棋布，湖光山色。', icon: '🏞️', lat: 26.4832, lng: 106.4172, transport: '公交1小时' },
          { time: '14:00', title: '百花湖', desc: '贵阳北郊湖泊，百岛林立，泛舟湖上。', icon: '🏞️', lat: 26.6188, lng: 106.4974, transport: '公交1小时' }
        ]
      ]
    }
  };

  // AI 提供方配置（OpenAI 兼容格式）
  const AI_PROVIDERS = {
    siliconflow: { name: '硅基流动', url: 'https://api.siliconflow.cn/v1/chat/completions' },
    zhipu: { name: '智谱AI', url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions' }
  };

  // 行李清单模板（按场景分类）
  const packingData = {
    essentials: { name: '必备物品', icon: 'list', items: ['身份证/护照', '手机+充电器', '钱包/银行卡', '钥匙', '纸巾/湿巾', '口罩'] },
    clothes: {
      name: '衣物', icon: 'shirt',
      hot: ['短袖T恤', '短裤/裙子', '凉鞋', '太阳帽', '墨镜', '防晒霜'],
      warm: ['长袖衬衫', '薄外套', '长裤', '运动鞋', '薄围巾'],
      cool: ['毛衣', '风衣', '长裤', '运动鞋', '围巾'],
      cold: ['羽绒服', '保暖内衣', '毛衣', '厚裤子', '雪地靴', '手套', '帽子', '围巾']
    },
    toiletries: { name: '洗漱用品', icon: 'toiletries', items: ['牙刷牙膏', '毛巾', '洗发水', '沐浴露', '护肤品', '梳子', '剃须刀'] },
    electronics: { name: '电子设备', icon: 'plug', items: ['充电宝', '数据线', '耳机', '相机', '自拍杆', '转换插头'] },
    beach: { name: '海边专用', icon: 'umbrella', items: ['泳衣', '沙滩巾', '防水袋', '浮潜装备', '沙滩鞋'] },
    mountain: { name: '登山专用', icon: 'mountain', items: ['登山鞋', '登山杖', '冲锋衣', '头灯', '急救包', '能量棒'] },
    business: { name: '商务专用', icon: 'briefcase', items: ['正装', '皮鞋', '名片', '笔记本电脑', '文件夹'] },
    photo: { name: '摄影专用', icon: 'camera', items: ['三脚架', '备用电池', '存储卡', '镜头清洁套装', '防雨罩'] }
  };

  // 地标打卡数据（按城市分组）
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

  // 探店盲盒数据（按城市分组，key 为拼音）
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
      { category: '书店', name: '方所书店', desc: '地下书店综合体，设计感强，咖啡也不错。', rating: '⭐⭐⭐⭐⭐', tags: ['书店', '设计', '咖啡'], tip: '位于太古里负一层，适合下雨天' }
    ],
    guangzhou: [
      { category: '茶楼', name: '点都德', rating: '⭐⭐⭐⭐', desc: '老字号早茶，虾饺凤爪叉烧包，正宗广式点心。', tags: ['早茶', '老字号', '广式'], tip: '推荐金沙流沙包和虾饺，早上10点前去' },
      { category: '咖啡馆', name: '.jpg咖啡', rating: '⭐⭐⭐⭐⭐', desc: '东山口网红咖啡，老洋房改造，出片率极高。', tags: ['网红', '洋房', '东山口'], tip: '推荐dirty，拍照很出片' },
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

  // 城市消费等级与交通成本（用于预算计算）
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

  // 方言课堂数据（按城市分组，key 为拼音）
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

  const dialectCityNames = { beijing: '北京', shanghai: '上海', chengdu: '成都', guangzhou: '广州', chongqing: '重庆', xian: '西安', hangzhou: '杭州', changsha: '长沙', xiamen: '厦门', wuhan: '武汉' };

  // 城市天气数据（用于旅行天气助手）
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

  // 城市冷知识问答数据
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

  // 首页"本周灵感"：每个城市配一个著名景点的诗意短语 + 配图生成提示词
  // phrase 用于 featured-route-name 文案，prompt 用于 text_to_image 实时生成实景图
  const PHOTO_STYLE = '，专业旅行风景摄影，自然光，高清写实，无人物，无文字水印';
  const cityInspiration = {
    '北京': { phrase: '红墙映雪', prompt: '北京故宫红墙黄瓦与宫灯，冬季薄雪覆盖金色琉璃瓦，庄严大气的皇家建筑' + PHOTO_STYLE },
    '天津': { phrase: '海河暮色', prompt: '天津海河傍晚风光，天津之眼摩天轮与欧式铁桥，城市暮色蓝调时刻' + PHOTO_STYLE },
    '哈尔滨': { phrase: '冰城穹顶', prompt: '哈尔滨圣索菲亚教堂俄式绿色洋葱头穹顶，冬季雪景与蓝天，欧式广场建筑' + PHOTO_STYLE },
    '长春': { phrase: '春城旧事', prompt: '长春伪满皇宫博物院近代历史建筑，秋日金黄林荫道，宁静肃穆的城市风光' + PHOTO_STYLE },
    '沈阳': { phrase: '盛京红墙', prompt: '沈阳故宫清代皇家宫殿群，红墙琉璃瓦与飞檐，东北古城秋日风光' + PHOTO_STYLE },
    '大连': { phrase: '滨海之城', prompt: '大连星海广场海岸线，蔚蓝大海与现代城市天际线，海滨礁石浪花' + PHOTO_STYLE },
    '秦皇岛': { phrase: '长城入海', prompt: '秦皇岛山海关老龙头，万里长城蜿蜒伸入渤海，壮观城墙与海浪' + PHOTO_STYLE },
    '呼和浩特': { phrase: '青城草原', prompt: '呼和浩特大召寺藏传佛教金色殿顶，远处是内蒙古辽阔草原与白云' + PHOTO_STYLE },
    '上海': { phrase: '外滩晨光', prompt: '上海外滩万国建筑群与浦东陆家嘴天际线，黄浦江日出晨光，金色阳光洒在摩天楼' + PHOTO_STYLE },
    '杭州': { phrase: '雨后西湖', prompt: '杭州西湖雨后风景，薄雾中的雷峰塔与断桥，湖面倒映垂柳青山，江南水墨意境' + PHOTO_STYLE },
    '南京': { phrase: '灯影秦淮', prompt: '南京秦淮河夫子庙夜景，红灯笼画舫游船，古色古香的江南水乡夜色' + PHOTO_STYLE },
    '苏州': { phrase: '园林听雨', prompt: '苏州拙政园古典园林，亭台楼阁假山池塘，细雨中的芭蕉与黛瓦白墙' + PHOTO_STYLE },
    '无锡': { phrase: '太湖樱花', prompt: '无锡鼋头渚太湖边樱花盛开，长春桥粉白花海映湖水，春日烂漫风光' + PHOTO_STYLE },
    '扬州': { phrase: '二分明月', prompt: '扬州瘦西湖五亭桥夜景，明月高悬湖面倒影灯光，江南古典园林月夜' + PHOTO_STYLE },
    '厦门': { phrase: '琴岛海风', prompt: '厦门鼓浪屿红砖洋楼别墅群，海风椰树与远处灯塔，文艺海滨小岛风光' + PHOTO_STYLE },
    '黄山': { phrase: '云海奇松', prompt: '安徽黄山云海翻腾，迎客松立于悬崖怪石之间，日出金光洒满群峰' + PHOTO_STYLE },
    '合肥': { phrase: '湖光新城', prompt: '合肥巢湖岸边湿地公园芦苇水鸟，远处现代城市天际线，清晨宁静湖光' + PHOTO_STYLE },
    '青岛': { phrase: '红瓦碧海', prompt: '青岛栈桥回澜阁与海湾，红瓦绿树德式建筑依山傍海，蓝色大海与白帆' + PHOTO_STYLE },
    '济南': { phrase: '泉城柳色', prompt: '济南趵突泉公园，三股清泉喷涌，垂柳拂水与古亭，北方泉城春日园林' + PHOTO_STYLE },
    '泰安': { phrase: '泰山日出', prompt: '山东泰山玉皇顶云海日出，金色霞光洒在连绵山峦与十八盘石阶，壮丽五岳风光' + PHOTO_STYLE },
    '舟山': { phrase: '海天佛国', prompt: '舟山普陀山海边寺庙黄墙黛瓦，金色沙滩礁石与南海观音铜像，海天佛国意境' + PHOTO_STYLE },
    '福州': { phrase: '闽都古巷', prompt: '福州三坊七巷明清古街巷，白墙黛瓦马鞍墙与红灯笼，闽派古建筑石板路' + PHOTO_STYLE },
    '南昌': { phrase: '赣江名楼', prompt: '南昌滕王阁临江而立，飞檐斗拱江南名楼，赣江水面宽阔晚霞满天' + PHOTO_STYLE },
    '武汉': { phrase: '江城烟波', prompt: '武汉黄鹤楼金顶高楼与长江大桥，长江江面烟波浩渺，江城壮阔风光' + PHOTO_STYLE },
    '长沙': { phrase: '湘江秋色', prompt: '长沙橘子洲头湘江两岸秋色，金黄银杏与远处岳麓山，秋日江景壮阔' + PHOTO_STYLE },
    '张家界': { phrase: '奇峰三千', prompt: '张家界武陵源石英砂岩峰林，云雾缭绕在三千奇峰之间，阿凡达悬浮山奇观' + PHOTO_STYLE },
    '恩施': { phrase: '峡谷秘境', prompt: '恩施大峡谷绝壁丛丛，一炷香石柱屹立云雾中，喀斯特峡谷青翠秘境' + PHOTO_STYLE },
    '郑州': { phrase: '嵩山胜境', prompt: '郑州嵩山少林寺山门古刹，中岳雄伟山峦与金黄银杏，中原山水秋意' + PHOTO_STYLE },
    '洛阳': { phrase: '石窟佛光', prompt: '洛阳龙门石窟卢舍那大佛，伊水河畔千年石窟群，夕阳余晖照在佛像上' + PHOTO_STYLE },
    '开封': { phrase: '汴京梦华', prompt: '开封清明上河园宋代古建筑群，虹桥水榭红灯笼，重现北宋汴京繁华' + PHOTO_STYLE },
    '广州': { phrase: '塔耀珠江', prompt: '广州塔小蛮腰与珠江新城夜景，霓虹灯光秀倒映在珠江江面，现代都市璀璨夜色' + PHOTO_STYLE },
    '深圳': { phrase: '湾区天际', prompt: '深圳平安金融中心摩天楼群与深圳湾，现代都市玻璃幕墙天际线，蓝天白云' + PHOTO_STYLE },
    '珠海': { phrase: '滨海漫步', prompt: '珠海情侣路海滨栈道，珠海渔女雕像与港珠澳大桥远景，椰风海韵的滨海风光' + PHOTO_STYLE },
    '三亚': { phrase: '椰梦碧海', prompt: '三亚亚龙湾洁白沙滩与成排椰林，碧蓝透明海水，热带度假海岛风光' + PHOTO_STYLE },
    '海口': { phrase: '南洋骑楼', prompt: '海口骑楼老街南洋风格柱廊建筑群，斑驳墙面与热带绿植，复古街区风情' + PHOTO_STYLE },
    '桂林': { phrase: '漓江山水', prompt: '桂林漓江阳朔喀斯特峰林，渔舟竹筏泛于碧水，群峰倒影山水甲天下' + PHOTO_STYLE },
    '南宁': { phrase: '绿城青翠', prompt: '南宁青秀山龙象塔与茂密亚热带绿植，邕江蜿蜒穿过绿意盎然的城市' + PHOTO_STYLE },
    '北海': { phrase: '银滩逐浪', prompt: '北海银滩洁白细腻沙滩与轻柔海浪，椰林在夕阳中投下长影，北部湾海滨风光' + PHOTO_STYLE },
    '成都': { phrase: '巷弄茶香', prompt: '成都宽窄巷子青砖灰瓦老茶馆，竹椅盖碗茶与红灯笼，悠闲安逸的市井生活场景' + PHOTO_STYLE },
    '重庆': { phrase: '山城夜景', prompt: '重庆洪崖洞吊脚楼夜景，层层叠叠暖黄灯光倒映嘉陵江，8D魔幻山城夜色' + PHOTO_STYLE },
    '昆明': { phrase: '春城花海', prompt: '昆明滇池海埂大坝碧蓝湖水与远处西山，湖畔花海成片，红嘴鸥飞翔春城风光' + PHOTO_STYLE },
    '大理': { phrase: '风花雪月', prompt: '大理洱海苍山脚下，湖边白族民居与大片花海，高原湖泊宁静湛蓝' + PHOTO_STYLE },
    '丽江': { phrase: '古城暖阳', prompt: '丽江古城四方街纳西族木楼，青石板路与潺潺流水，暖阳下的古镇风情' + PHOTO_STYLE },
    '贵阳': { phrase: '南明楼影', prompt: '贵阳甲秀楼矗立南明河上，飞檐古楼倒影水中，夜晚灯火璀璨黔中名楼' + PHOTO_STYLE },
    '拉萨': { phrase: '高原圣殿', prompt: '拉萨布达拉宫红白宫殿立于红山之上，蓝天白云高原阳光，壮丽神圣的藏地建筑' + PHOTO_STYLE },
    '西安': { phrase: '长安古韵', prompt: '西安大雁塔与古城墙，夕阳金辉洒在唐代古塔飞檐上，千年古都长安韵味' + PHOTO_STYLE },
    '兰州': { phrase: '黄河之城', prompt: '兰州中山铁桥百年钢桥横跨黄河，白塔山古建筑与穿城而过的黄色河水' + PHOTO_STYLE },
    '敦煌': { phrase: '大漠月牙', prompt: '敦煌鸣沙山月牙泉，沙漠中一弯碧绿泉水，驼队剪影走过沙丘夕阳' + PHOTO_STYLE },
    '张掖': { phrase: '丹霞流彩', prompt: '张掖七彩丹霞地貌，红黄橙彩色山峦层理分明，日落时分地质奇观流光溢彩' + PHOTO_STYLE },
    '西宁': { phrase: '湖畔花海', prompt: '青海湖边大片金黄油菜花田与湛蓝湖水，远处祁连雪山白云，高原夏日风光' + PHOTO_STYLE },
    '银川': { phrase: '塞上江南', prompt: '银川沙湖芦苇荡湿地与远处贺兰山，沙漠中绿洲水域相映，塞上江南风光' + PHOTO_STYLE },
    '乌鲁木齐': { phrase: '天山瑶池', prompt: '新疆天山天池，博格达峰雪山倒映碧绿湖水，云杉林环绕的高原瑶池仙境' + PHOTO_STYLE }
  };

  return {
    cityRegions,
    cityCoords,
    routeData,
    AI_PROVIDERS,
    packingData,
    landmarkData,
    blindboxData,
    cityCostLevel,
    transportCost,
    dialectData,
    dialectCityNames,
    cityWeatherData,
    cityTriviaData,
    cityInspiration
  };
})();
