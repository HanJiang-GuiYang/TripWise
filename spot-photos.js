// 本地预置景点照片清单（assets/spots/ 下的图片）
// 键为城市名 → 景点名/别名 → 图片相对路径；app.js 的 matchSpotPhoto 支持子串匹配，
// 因此只登记与主名不构成包含关系的别名（如「紫禁城」之于「故宫」）
window.TRIPWISE_SPOT_PHOTOS = {
  '北京': {
    '故宫': 'assets/spots/beijing/gugong.jpg',
    '紫禁城': 'assets/spots/beijing/gugong.jpg',
    '长城': 'assets/spots/beijing/changcheng.jpg',
    '八达岭': 'assets/spots/beijing/changcheng.jpg',
    '慕田峪': 'assets/spots/beijing/changcheng.jpg',
    '天坛': 'assets/spots/beijing/tiantan.jpg',
    '颐和园': 'assets/spots/beijing/yiheyuan.jpg',
    '鸟巢': 'assets/spots/beijing/niaochao.jpg',
    '国家体育场': 'assets/spots/beijing/niaochao.jpg'
  },
  '上海': {
    '外滩': 'assets/spots/shanghai/waitan.jpg',
    '东方明珠': 'assets/spots/shanghai/dongfangmingzhu.jpg',
    '豫园': 'assets/spots/shanghai/yuyuan.jpg',
    '城隍庙': 'assets/spots/shanghai/yuyuan.jpg',
    '陆家嘴': 'assets/spots/shanghai/lujiazui.jpg',
    '田子坊': 'assets/spots/shanghai/tianzifang.jpg'
  },
  '成都': {
    '熊猫基地': 'assets/spots/chengdu/xiongmaojidi.jpg',
    '大熊猫繁育研究基地': 'assets/spots/chengdu/xiongmaojidi.jpg',
    '锦里': 'assets/spots/chengdu/jinli.jpg',
    '宽窄巷子': 'assets/spots/chengdu/kuanzhaixiangzi.jpg',
    '武侯祠': 'assets/spots/chengdu/wuhouci.jpg',
    '都江堰': 'assets/spots/chengdu/dujiangyan.jpg'
  },
  '广州': {
    '广州塔': 'assets/spots/guangzhou/guangzhouta.jpg',
    '小蛮腰': 'assets/spots/guangzhou/guangzhouta.jpg',
    '沙面': 'assets/spots/guangzhou/shamian.jpg',
    '陈家祠': 'assets/spots/guangzhou/chenjiaci.jpg',
    '陈氏书院': 'assets/spots/guangzhou/chenjiaci.jpg',
    '白云山': 'assets/spots/guangzhou/baiyunshan.jpg',
    '北京路': 'assets/spots/guangzhou/beijinglu.jpg'
  },
  '杭州': {
    '西湖': 'assets/spots/hangzhou/xihu.jpg',
    '灵隐寺': 'assets/spots/hangzhou/lingyinsi.jpg',
    '雷峰塔': 'assets/spots/hangzhou/leifengta.jpg',
    '宋城': 'assets/spots/hangzhou/songcheng.jpg',
    '西溪湿地': 'assets/spots/hangzhou/xixishidi.jpg'
  },
  '厦门': {
    '鼓浪屿': 'assets/spots/xiamen/gulangyu.jpg',
    '南普陀寺': 'assets/spots/xiamen/nanputuosi.jpg',
    '厦门大学': 'assets/spots/xiamen/xiamendaxue.jpg',
    '厦大': 'assets/spots/xiamen/xiamendaxue.jpg',
    '曾厝垵': 'assets/spots/xiamen/zengcuoan.jpg',
    '环岛路': 'assets/spots/xiamen/huandaolu.jpg'
  },
  '长沙': {
    '橘子洲': 'assets/spots/changsha/juzizhou.jpg',
    '岳麓山': 'assets/spots/changsha/yuelushan.jpg',
    '岳麓书院': 'assets/spots/changsha/yuelushan.jpg',
    '太平街': 'assets/spots/changsha/taipingjie.jpg',
    '太平老街': 'assets/spots/changsha/taipingjie.jpg',
    '文和友': 'assets/spots/changsha/wenheyou.jpg',
    '湖南省博物馆': 'assets/spots/changsha/hunanbowuguan.jpg',
    '湖南博物院': 'assets/spots/changsha/hunanbowuguan.jpg'
  },
  '武汉': {
    '黄鹤楼': 'assets/spots/wuhan/huanghelou.jpg',
    '东湖': 'assets/spots/wuhan/donghu.jpg',
    '长江大桥': 'assets/spots/wuhan/changjiangdaqiao.jpg',
    '户部巷': 'assets/spots/wuhan/hubuxiang.jpg',
    '武汉大学': 'assets/spots/wuhan/wuhandaxue.jpg'
  },
  '西安': {
    '兵马俑': 'assets/spots/xian/bingmayong.jpg',
    '大雁塔': 'assets/spots/xian/dayanta.jpg',
    '城墙': 'assets/spots/xian/chengqiang.jpg',
    '西安城墙': 'assets/spots/xian/chengqiang.jpg',
    '回民街': 'assets/spots/xian/huiminjie.jpg',
    '华清宫': 'assets/spots/xian/huaqinggong.jpg',
    '华清池': 'assets/spots/xian/huaqinggong.jpg'
  },
  '重庆': {
    '洪崖洞': 'assets/spots/chongqing/hongyadong.jpg',
    '解放碑': 'assets/spots/chongqing/jiefangbei.jpg',
    '磁器口': 'assets/spots/chongqing/ciqikou.jpg',
    '长江索道': 'assets/spots/chongqing/changjiangsuodao.jpg',
    '来福士': 'assets/spots/chongqing/raifushi.jpg',
    '朝天门': 'assets/spots/chongqing/raifushi.jpg'
  },
  '南京': {
    '夫子庙': 'assets/spots/nanjing/fuzimiao.jpg',
    '中山陵': 'assets/spots/nanjing/zhongshanling.jpg',
    '玄武湖': 'assets/spots/nanjing/xuanwuhu.jpg',
    '老门东': 'assets/spots/nanjing/laomendong.jpg',
    '总统府': 'assets/spots/nanjing/zongtongfu.jpg'
  },
  '桂林': {
    '象鼻山': 'assets/spots/guilin/xiangbishan.jpg',
    '漓江': 'assets/spots/guilin/lijiang.jpg',
    '东西巷': 'assets/spots/guilin/dongxixiang.jpg',
    '七星公园': 'assets/spots/guilin/qixingongyuan.jpg',
    '七星岩': 'assets/spots/guilin/qixingongyuan.jpg',
    '西街': 'assets/spots/guilin/xijie.jpg',
    '阳朔': 'assets/spots/guilin/xijie.jpg'
  }
};
