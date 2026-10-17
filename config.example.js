// ============================================================
//  TripWise AI 配置模板
// ============================================================
//
//  使用方法：把本文件复制一份并重命名为 config.js，
//  然后按 config.js 内的注释填入你的 API Key。
//
//  注意：智谱网关不支持浏览器跨域直连（预检缺 CORS 头），浏览器里
//  调用会报 "Failed to fetch"。两种解法任选其一：
//  ① provider 改为 'siliconflow' 并使用硅基流动的 key（原生支持浏览器直连）；
//  ② 部署仓库根目录的 cloudflare-worker.js，把 Worker 地址填入 proxyPrefix。
// ============================================================

window.TRIPWISE_CONFIG = {

  // 模型提供商：'zhipu'（智谱，GLM-4-Flash 永久免费）| 'siliconflow'（硅基流动，注册送2000万token）
  provider: 'zhipu',

  // ★ 把你的 API Key 粘贴到这里
  apiKey: 'YOUR_API_KEY_HERE',

  // 可选：CORS 代理前缀（如 'https://<你的worker域名>/'），留空则直连
  proxyPrefix: '',

  // 各提供商使用的模型名
  models: {
    zhipu: 'glm-4-flash',
    siliconflow: 'Qwen/Qwen2.5-7B-Instruct'
  },

  // 请求参数
  temperature: 0.8,
  maxTokens: 1500
};
