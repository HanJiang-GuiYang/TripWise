// ========== TripWise 工具层（公共函数，无业务逻辑） ==========
// 使用方式：const U = window.TripWiseUtils;  U.escapeHtml(...) U.shuffle(...)
window.TripWiseUtils = (function () {
  'use strict';

  // 包装 icons.js 中的 SVG 图标系统
  function iconSvg(name, className = 'ui-icon') {
    return window.TripWiseIcons?.svg(name, className) || '';
  }

  // 按值取图标，找不到时回退到 place 图标
  function iconFrom(value, className = 'ui-icon') {
    return window.TripWiseIcons?.fromEmoji(value, className) || iconSvg('place', className);
  }

  // 读取本地 JSON，带校验和容错：解析失败或校验不过时回退到 fallback
  function readStoredJson(key, fallback, isValid) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return isValid(value) ? value : fallback;
    } catch (_) {
      try { localStorage.removeItem(key); } catch (e) { /* 存储不可用时忽略 */ }
      return fallback;
    }
  }

  // 带容错的本地持久化：隐私模式或配额满时提示用户而不是抛异常
  function storeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      window.showToast?.('浏览器本地存储不可用，本次改动可能无法保留', 'alert');
      return false;
    }
  }

  // Fisher-Yates 洗牌，保证随机排列分布均匀
  function shuffle(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // HTML 转义：用于把用户输入或 AI 返回内容安全插入 innerHTML
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 把字符串转成可安全嵌入 HTML 属性里 JS 字符串字面量的片段（含外侧单引号）。
  // 用于 onclick="fn('...')" 这类内联事件：先做 JS 转义，再做 HTML 属性转义，
  // 避免值里出现引号时闭合属性并注入脚本。
  function jsStringArg(value) {
    const escaped = String(value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');
    // 外侧单引号本身无需转义，因为内部单引号已全部转义为 \'
    return `'${escaped}'`;
  }

  // 坐标约定：data.js 离线数据与 AI 返回坐标统一为 GCJ-02（高德/火星坐标），
  // 与高德瓦片底图同一坐标系，直接上图即可，无需转换。

  return { iconSvg, iconFrom, readStoredJson, storeJson, shuffle, escapeHtml, jsStringArg };
})();
