// ============================================================
//  TripWise AI 配置模板
// ============================================================
//
//  使用方法：把本文件复制一份并重命名为 config.js，
//  然后按 config.js 内的注释填入你的 API Key。
//
//  注意：真实的 config.js 已被 .gitignore 忽略，不会被提交，
//  以此保护你的 API Key 不泄露到公开仓库。
// ============================================================

window.TRIPWISE_CONFIG = {

  // 模型提供商：'zhipu'（智谱，GLM-4-Flash 永久免费）| 'siliconflow'（硅基流动，注册送2000万token）
  provider: 'zhipu',

  // ★ 把你的 API Key 粘贴到这里
  apiKey: 'YOUR_API_KEY_HERE',

  // 各提供商使用的模型名
  models: {
    zhipu: 'glm-4-flash',
    siliconflow: 'Qwen/Qwen2.5-7B-Instruct'
  },

  // 请求参数
  temperature: 0.8,
  maxTokens: 1500
};
