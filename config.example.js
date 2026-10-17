// ============================================================
//  TripWise AI 配置模板
// ============================================================
//
//  使用方法：把本文件复制一份并重命名为 config.js，
//  然后按 config.js 内的注释填入你的 API Key。
//
//  注意：浏览器直连要求服务商网关支持跨域预检。实测魔搭 ModelScope、
//  DeepSeek 与硅基流动均正常；智谱网关预检缺 CORS 头，浏览器直连会报
//  "Failed to fetch"，需自备中转才能在前端使用。
//  警告：静态网页的 key 对访客完全可见，切勿使用按量付费的 key，
//  否则任何人可从网页源码提取你的 key 消耗余额。推荐魔搭（永久免费额度）。
// ============================================================

window.TRIPWISE_CONFIG = {

  // 模型提供商：'modelscope'（魔搭，每日 2000 次永久免费，推荐）| 'deepseek'（按量付费）| 'siliconflow' | 'zhipu'
  provider: 'modelscope',

  // ★ 把你的 API Key 粘贴到这里（ModelScope 在 modelscope.cn 个人中心→访问令牌 创建，手机号注册即可）
  apiKey: 'YOUR_API_KEY_HERE',

  // 可选：CORS 代理前缀（如 'https://<你的worker域名>/'），留空则直连
  proxyPrefix: '',

  // 各提供商使用的模型名
  models: {
    modelscope: 'deepseek-ai/DeepSeek-V4-Flash',
    deepseek: 'deepseek-chat',
    zhipu: 'glm-4-flash',
    siliconflow: 'Qwen/Qwen2.5-7B-Instruct'
  },

  // 请求参数
  temperature: 0.8,
  maxTokens: 1500
};
