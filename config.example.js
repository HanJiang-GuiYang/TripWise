// ============================================================
//  TripWise AI 配置模板
// ============================================================
//
//  使用方法：把本文件复制一份并重命名为 config.js，
//  然后按 config.js 内的注释填入你的 API Key。
//
//  注意：浏览器直连要求服务商网关支持跨域预检。实测 DeepSeek 与硅基流动
//  均正常；智谱网关预检缺 CORS 头，浏览器直连会报 "Failed to fetch"，
//  需自备中转（见仓库根目录 cloudflare-worker.js）才能在前端使用。
// ============================================================

window.TRIPWISE_CONFIG = {

  // 模型提供商：'deepseek'（按量付费，注册仅需手机号）| 'siliconflow'（送免费额度）| 'zhipu'（永久免费但需中转）
  provider: 'deepseek',

  // ★ 把你的 API Key 粘贴到这里（DeepSeek 在 platform.deepseek.com 创建）
  apiKey: 'YOUR_API_KEY_HERE',

  // 可选：CORS 代理前缀（如 'https://<你的worker域名>/'），留空则直连
  proxyPrefix: '',

  // 各提供商使用的模型名
  models: {
    deepseek: 'deepseek-chat',
    zhipu: 'glm-4-flash',
    siliconflow: 'Qwen/Qwen2.5-7B-Instruct'
  },

  // 请求参数
  temperature: 0.8,
  maxTokens: 1500
};
