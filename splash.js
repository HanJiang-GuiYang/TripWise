/* ============================================================
   TripWise 启动动画引擎
   参考 Apple 激活页的"笔写 hello"效果：
   - 每条笔迹按书写顺序逐条描出（stroke-dashoffset）
   - 发光笔尖跟随墨迹走点，沿途迸溅火花粒子
   - 写完后花饰收尾、logo 落定回弹、标语浮现，随后淡出进入应用
   调试：URL 加 ?splashfreeze=3.2 可定格在时间轴 3.2s 处截图检查
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var splash = document.getElementById('tripwise-splash');
  if (!splash) return;

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var VB = { x: 20, y: 60, w: 960, h: 260 }; // viewBox，与 index.html 中保持一致

  /* ---- 笔迹定义：按真实书写顺序排列 ----
     kind: main=主笔迹 flourish=花饰 dot=圆点 */
  var STROKES = [
    { d: 'M 70 104 C 110 86 168 86 208 104', kind: 'main' },            // T 横
    { d: 'M 140 92 C 136 144 136 196 140 240', kind: 'main' },           // T 竖
    { d: 'M 240 240 C 240 212 240 192 244 182 C 250 170 266 166 280 172 C 292 178 298 188 300 198', kind: 'main' }, // r
    { d: 'M 324 180 C 323 200 323 220 325 240', kind: 'main' },          // i 竖
    { d: 'M 324 146 q 2 4 0 8', kind: 'dot' },                            // i 点
    { d: 'M 360 176 C 358 208 356 256 352 296', kind: 'main' },           // p 竖（下伸）
    { d: 'M 360 192 C 374 176 400 174 414 188 C 428 202 424 228 408 238 C 394 247 372 246 360 238', kind: 'main' }, // p 肚
    { d: 'M 452 100 C 462 148 474 198 488 236 C 500 200 512 156 524 118 C 536 156 548 200 562 236 C 576 198 590 148 602 100', kind: 'main' }, // W
    { d: 'M 632 180 C 631 200 631 220 633 240', kind: 'main' },           // i 竖
    { d: 'M 632 146 q 2 4 0 8', kind: 'dot' },                             // i 点
    { d: 'M 700 190 C 690 176 664 174 654 186 C 644 198 656 210 672 216 C 688 222 700 232 694 242 C 686 252 660 252 648 240', kind: 'main' }, // s
    { d: 'M 722 216 C 736 216 754 212 766 202 C 776 192 772 178 758 176 C 740 174 724 190 722 212 C 720 234 736 248 758 246 C 770 245 778 240 784 232', kind: 'main' }, // e
    { d: 'M 96 288 C 330 324 690 324 918 278', kind: 'flourish' }          // 收尾花饰
  ];

  var SPEED = 640;      // 书写速度（像素/秒）
  var GAP = 0.07;       // 笔画之间的提笔间隔（秒）
  var MIN_DUR = 0.14;   // 单条最短时长（圆点）
  var MAX_DUR = 0.85;   // 单条最长时长
  var HOLD_AFTER = 1.9; // 标语出现后停留时长
  var OUT_MS = 700;     // 淡出时长

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var freezeAt = null;
  try {
    var fz = new URLSearchParams(location.search).get('splashfreeze');
    if (fz !== null) freezeAt = Math.max(0, parseFloat(fz) || 0);
  } catch (_) { /* ignore */ }

  /* ---- 构建 SVG ---- */
  var svg = document.getElementById('tw-splash-svg');
  svg.setAttribute('viewBox', VB.x + ' ' + VB.y + ' ' + VB.w + ' ' + VB.h);

  var defs = document.createElementNS(SVG_NS, 'defs');
  defs.innerHTML =
    '<linearGradient id="tw-ink-grad" gradientUnits="userSpaceOnUse" x1="' + VB.x + '" y1="0" x2="' + (VB.x + VB.w) + '" y2="0">' +
    '<stop offset="0" stop-color="#70c6cb"/><stop offset="0.55" stop-color="#9edadd"/>' +
    '<stop offset="0.8" stop-color="#edbd64"/><stop offset="1" stop-color="#d59b32"/></linearGradient>';
  svg.appendChild(defs);

  var inkGroup = document.createElementNS(SVG_NS, 'g');
  svg.appendChild(inkGroup);

  var pen = document.createElementNS(SVG_NS, 'g');
  pen.style.opacity = '0';
  pen.innerHTML =
    '<circle class="tw-pen-halo" r="14"/><circle class="tw-pen-core" r="4.5"/>';
  svg.appendChild(pen);

  var paths = STROKES.map(function (s) {
    var p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', s.d);
    p.setAttribute('class', 'tw-ink' + (s.kind === 'flourish' ? ' tw-ink--flourish' : ''));
    var len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    inkGroup.appendChild(p);
    return { el: p, len: len };
  });

  /* 时间轴：每条笔画的起点与时长 */
  var acc = 0;
  var timeline = paths.map(function (s) {
    var dur = Math.min(MAX_DUR, Math.max(MIN_DUR, s.len / SPEED));
    var start = acc;
    acc += dur + GAP;
    return { start: start, dur: dur };
  });
  var TOTAL_WRITE = acc;

  function easeInOut(t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); }

  /* ---- 坐标换算：SVG 用户坐标 -> 视口坐标（供火花粒子使用） ---- */
  var rect = { left: 0, top: 0, width: 0, height: 0 };
  function measure() {
    var r = svg.getBoundingClientRect();
    rect.left = r.left; rect.top = r.top; rect.width = r.width; rect.height = r.height;
  }
  measure();
  window.addEventListener('resize', measure);
  function toScreen(x, y) {
    return {
      x: rect.left + (x - VB.x) / VB.w * rect.width,
      y: rect.top + (y - VB.y) / VB.h * rect.height
    };
  }

  /* ---- 粒子层：背景墨尘 + 笔尖火花 ---- */
  var canvas = document.getElementById('tw-splash-particles');
  var ctx = canvas.getContext('2d');
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var W = 0, H = 0;
  function sizeCanvas() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  var dust = [];
  var DUST_N = W < 640 ? 22 : 36;
  for (var i = 0; i < DUST_N; i++) {
    dust.push({
      x: Math.random() * W, y: Math.random() * H,
      r: 0.6 + Math.random() * 1.8,
      vy: -(4 + Math.random() * 10) / 60,
      wob: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.75 ? '112,198,203' : '213,155,50',
      a: 0.12 + Math.random() * 0.3
    });
  }
  var sparks = [];
  function emitSparks(sx, sy, n) {
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = 0.4 + Math.random() * 1.8;
      sparks.push({
        x: sx, y: sy,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.4,
        life: 1, decay: 0.02 + Math.random() * 0.03,
        r: 0.8 + Math.random() * 1.6,
        hue: Math.random() < 0.5 ? '158,218,221' : '237,189,100'
      });
    }
  }

  function drawParticles(dt) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      d.y += d.vy * dt * 60;
      d.wob += 0.02 * dt * 60;
      var x = d.x + Math.sin(d.wob) * 8;
      if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
      ctx.beginPath();
      ctx.arc(x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + d.hue + ',' + d.a + ')';
      ctx.fill();
    }
    for (var j = sparks.length - 1; j >= 0; j--) {
      var s = sparks[j];
      s.x += s.vx * dt * 60; s.y += s.vy * dt * 60;
      s.vy += 0.02 * dt * 60;
      s.life -= s.decay * dt * 60;
      if (s.life <= 0) { sparks.splice(j, 1); continue; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + s.hue + ',' + (0.85 * s.life) + ')';
      ctx.fill();
    }
  }

  /* ---- 渲染某一时刻的画面 ---- */
  var lastStrokeDone = false;
  function renderAt(t) {
    for (var i = 0; i < timeline.length; i++) {
      var tl = timeline[i], s = paths[i];
      var local = (t - tl.start) / tl.dur;
      // 笔画按时间顺序排列：遇到未开始的笔画说明处于提笔间隙，
      // 必须直接返回——绝不能让循环走到底而误判"全部写完"
      if (local <= 0) { pen.style.opacity = '0'; return; }
      if (local >= 1) { s.el.style.strokeDashoffset = 0; continue; }
      var e = easeInOut(local);
      s.el.style.strokeDashoffset = s.len * (1 - e);
      // 笔尖跟随当前笔画
      var pt = s.el.getPointAtLength(s.len * e);
      pen.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')');
      pen.style.opacity = '1';
      if (!reduceMotion && Math.random() < 0.55) {
        var sp = toScreen(pt.x, pt.y);
        emitSparks(sp.x, sp.y, 2);
      }
      return; // 同一时刻只有一条笔画在写
    }
    // 只有全部笔画都满足 local>=1 才会走到这里
    pen.style.opacity = '0';
    if (!lastStrokeDone) {
      lastStrokeDone = true;
      onWriteDone();
    }
  }

  /* ---- 完成与退出流程 ---- */
  var doneShown = false;
  function onWriteDone() {
    if (doneShown) return;
    doneShown = true;
    splash.classList.add('tw-splash--done');
    splash.classList.add('tw-splash--settled');
    if (freezeAt === null) {
      setTimeout(dismiss, HOLD_AFTER * 1000);
    }
  }

  var dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    splash.classList.add('tw-splash--out');
    setTimeout(function () {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
      window.removeEventListener('resize', measure);
      window.removeEventListener('resize', sizeCanvas);
    }, OUT_MS + 50);
  }

  function finishInstantly() {
    // 跳过：所有笔画一次到位
    for (var i = 0; i < paths.length; i++) paths[i].el.style.strokeDashoffset = 0;
    pen.style.opacity = '0';
    running = false;
    onWriteDone();
    setTimeout(dismiss, 450);
  }

  /* ---- 主循环 ---- */
  var running = true;
  var t0 = performance.now();
  var prev = t0;
  var paused = false;

  document.addEventListener('visibilitychange', function () {
    paused = document.hidden;
    if (!paused) prev = performance.now();
  });

  function frame(now) {
    if (!running || dismissed) return;
    if (!paused) {
      var dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      var t = freezeAt !== null ? freezeAt : (now - t0) / 1000;
      renderAt(t);
      drawParticles(dt);
      if (freezeAt !== null) { running = false; return; } // 定格模式只渲染一帧
    }
    requestAnimationFrame(frame);
  }

  /* ---- 启动 ---- */
  if (reduceMotion) {
    // 降低动态偏好：静态展示后直接进入应用
    finishInstantly();
  } else {
    requestAnimationFrame(frame);
  }

  // 任意点击/按键跳过
  splash.addEventListener('pointerdown', finishInstantly);
  window.addEventListener('keydown', function onKey(e) {
    window.removeEventListener('keydown', onKey);
    finishInstantly();
  });
})();
