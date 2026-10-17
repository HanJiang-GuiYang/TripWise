/* TripWise 浏览器 CORS 代理（Cloudflare Worker）
 *
 * 用途：智谱 API 网关的 OPTIONS 预检不返回 CORS 头，浏览器直连必然
 * "Failed to fetch"。把本文件部署为 Cloudflare Worker（免费额度即可），
 * 然后在 config.js 里填 proxyPrefix，例如：
 *   proxyPrefix: 'https://<你的worker域名>/'
 * 请求将以 <proxyPrefix><完整API地址> 的形式转发。
 *
 * 部署：dash.cloudflare.com → Workers & Pages → Create → 粘贴本代码 → Deploy
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
  'Access-Control-Max-Age': '43200'
};

export default {
  async fetch(request) {
    // 预检直接放行
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // 完整目标地址被拼在路径里：https://worker/https://api.example.com/v1/...
    const target = new URL(request.url).pathname.slice(1);
    if (!/^https?:\/\//.test(target)) {
      return new Response('usage: <worker-url>/<full-api-url>', { status: 400, headers: CORS });
    }

    // 只转发白名单内的 API 域，防止沦为通用开放代理
    const allowed = ['open.bigmodel.cn', 'api.siliconflow.cn'];
    if (!allowed.includes(new URL(target).hostname)) {
      return new Response('forbidden host', { status: 403, headers: CORS });
    }

    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: request.method === 'GET' ? null : request.body,
      duplex: 'half'
    });

    // 透传上游响应并补上 CORS 头
    const out = new Response(upstream.body, {
      status: upstream.status,
      headers: Object.assign({}, CORS, Object.fromEntries(upstream.headers))
    });
    out.headers.set('Access-Control-Allow-Origin', '*');
    return out;
  }
};
